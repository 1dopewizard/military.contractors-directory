/**
 * @file GET /api/jobs/[id]/similar
 * @description Find similar jobs based on attributes (company, location, clearance)
 * Note: This is a simplified version - original used Convex vector similarity
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, ne, or, desc, sql } from 'drizzle-orm'

interface SimilarJob {
  id: string
  title: string
  company: string
  location: string
  location_type: string | null
  clearance_required: string | null
  salary_min: number | null
  salary_max: number | null
  posted_at: string | null
  slug: string | null
}

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 5, 10)

  if (!jobId) {
    throw createError({
      statusCode: 400,
      message: 'Job ID is required',
    })
  }

  const db = getDb()

  try {
    // Get the source job
    const [sourceJob] = await db
      .select()
      .from(schema.job)
      .where(eq(schema.job.id, jobId))
      .limit(1)

    if (!sourceJob) {
      return { similar: [], total: 0 }
    }

    // Find similar jobs based on:
    // 1. Same company (high relevance)
    // 2. Same clearance level
    // 3. Same location type (CONUS/OCONUS)
    // Priority: same company jobs, then jobs with matching attributes
    
    const conditions = [
      eq(schema.job.isActive, true),
      ne(schema.job.id, jobId), // Exclude the source job
    ]

    // Try to find jobs from the same company first
    const sameCompanyJobs = await db
      .select()
      .from(schema.job)
      .where(
        and(
          ...conditions,
          eq(schema.job.company, sourceJob.company)
        )
      )
      .orderBy(desc(schema.job.postedAt))
      .limit(limit)

    // If we have enough from the same company, use those
    if (sameCompanyJobs.length >= limit) {
      const similar: SimilarJob[] = sameCompanyJobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        location_type: job.locationType ?? null,
        clearance_required: job.clearanceRequired ?? null,
        salary_min: job.salaryMin ?? null,
        salary_max: job.salaryMax ?? null,
        posted_at: job.postedAt?.toISOString() ?? null,
        slug: job.slug ?? null,
      }))
      return { similar, total: similar.length }
    }

    // Otherwise, find more similar jobs based on attributes
    const additionalConditions = []
    
    // Match clearance level
    if (sourceJob.clearanceRequired) {
      additionalConditions.push(eq(schema.job.clearanceRequired, sourceJob.clearanceRequired))
    }
    
    // Match OCONUS status
    if (sourceJob.isOconus !== null) {
      additionalConditions.push(eq(schema.job.isOconus, sourceJob.isOconus))
    }

    // Match location type
    if (sourceJob.locationType) {
      additionalConditions.push(eq(schema.job.locationType, sourceJob.locationType))
    }

    // Get more similar jobs (excluding already found)
    const existingIds = sameCompanyJobs.map(j => j.id)
    const remainingLimit = limit - sameCompanyJobs.length

    let additionalJobs: typeof sameCompanyJobs = []
    if (remainingLimit > 0 && additionalConditions.length > 0) {
      additionalJobs = await db
        .select()
        .from(schema.job)
        .where(
          and(
            ...conditions,
            ne(schema.job.company, sourceJob.company), // Different company
            or(...additionalConditions) // But similar attributes
          )
        )
        .orderBy(desc(schema.job.postedAt))
        .limit(remainingLimit)
    }

    // Combine results
    const allJobs = [...sameCompanyJobs, ...additionalJobs]

    const similar: SimilarJob[] = allJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      location_type: job.locationType ?? null,
      clearance_required: job.clearanceRequired ?? null,
      salary_min: job.salaryMin ?? null,
      salary_max: job.salaryMax ?? null,
      posted_at: job.postedAt?.toISOString() ?? null,
      slug: job.slug ?? null,
    }))

    return { similar, total: similar.length }
  } catch (error) {
    console.error('Similar jobs search failed:', error)
    return { similar: [], total: 0 }
  }
})
