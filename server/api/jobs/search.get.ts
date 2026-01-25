/**
 * @file GET /api/jobs/search
 * @description Search/list jobs with filters (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm'

interface JobResult {
  id: string
  title: string
  company: string
  company_id: string | null
  location: string
  location_type: string | null
  is_oconus: boolean | null
  salary_min: number | null
  salary_max: number | null
  clearance_required: string | null
  sponsor_category: string | null
  featured: boolean
  posted_at: string
  snippet: string | null
  description: string | null
  slug: string | null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0
  const location = query.location as string || null
  const clearance = query.clearance as string || null
  const sort = query.sort as string || 'relevance'

  const db = getDb()

  try {
    // Build WHERE conditions
    const conditions = [eq(schema.job.isActive, true)]
    
    // Text search across title, company, description
    if (q) {
      const searchPattern = `%${q}%`
      conditions.push(
        or(
          like(schema.job.title, searchPattern),
          like(schema.job.company, searchPattern),
          like(schema.job.description, searchPattern),
          like(schema.job.location, searchPattern)
        )!
      )
    }

    // Location type filter
    if (location) {
      conditions.push(eq(schema.job.locationType, location.toUpperCase()))
    }

    // Clearance filter
    if (clearance) {
      conditions.push(eq(schema.job.clearanceRequired, clearance.toUpperCase()))
    }

    // Build ORDER BY based on sort parameter
    let orderBy
    switch (sort) {
      case 'date':
        orderBy = [desc(schema.job.postedAt)]
        break
      case 'salary':
        orderBy = [desc(schema.job.salaryMax)]
        break
      case 'relevance':
      default:
        // For relevance, prioritize featured jobs and recent posts
        orderBy = [desc(schema.job.featured), desc(schema.job.postedAt)]
        break
    }

    // Execute search query
    const jobs = await db
      .select()
      .from(schema.job)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Count total results
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.job)
      .where(and(...conditions))

    // Transform jobs to expected API format (snake_case)
    const transformedResults: JobResult[] = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      company_id: job.companyId ?? null,
      location: job.location,
      location_type: job.locationType ?? null,
      is_oconus: job.isOconus ?? null,
      salary_min: job.salaryMin ?? null,
      salary_max: job.salaryMax ?? null,
      clearance_required: job.clearanceRequired ?? null,
      sponsor_category: job.sponsorCategory ?? null,
      featured: job.featured ?? false,
      posted_at: job.postedAt
        ? job.postedAt.toISOString()
        : job.createdAt?.toISOString() ?? new Date().toISOString(),
      snippet: job.snippet ?? null,
      description: job.description ?? null,
      slug: job.slug ?? null,
    }))

    return {
      results: transformedResults,
      total: countResult?.count ?? 0,
      query: q || null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: message,
    })
  }
})
