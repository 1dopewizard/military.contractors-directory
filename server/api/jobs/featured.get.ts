/**
 * @file Featured jobs endpoint
 * @route GET /api/jobs/featured
 * @description Fetch featured jobs for display
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 5, 20)

  const db = getDb()

  try {
    // Get featured jobs that are active (using standard query builder)
    const featuredJobs = await db
      .select({
        id: schema.job.id,
        title: schema.job.title,
        company: schema.job.company,
        companyId: schema.job.companyId,
        location: schema.job.location,
        locationType: schema.job.locationType,
        salaryMin: schema.job.salaryMin,
        salaryMax: schema.job.salaryMax,
        clearanceRequired: schema.job.clearanceRequired,
        snippet: schema.job.snippet,
        description: schema.job.description,
        slug: schema.job.slug,
        priority: schema.job.priority,
        companyName: schema.company.name,
      })
      .from(schema.job)
      .leftJoin(schema.company, eq(schema.job.companyId, schema.company.id))
      .where(and(
        eq(schema.job.featured, true),
        eq(schema.job.status, 'ACTIVE'),
        eq(schema.job.isActive, true)
      ))
      .orderBy(desc(schema.job.priority), sql`RANDOM()`)
      .limit(limit)

    // Also check featured listings table for additional featured jobs
    const now = Date.now()
    const featuredListings = await db
      .select({
        listingId: schema.featuredListing.id,
        jobId: schema.job.id,
        title: schema.job.title,
        company: schema.job.company,
        companyId: schema.job.companyId,
        location: schema.job.location,
        locationType: schema.job.locationType,
        salaryMin: schema.job.salaryMin,
        salaryMax: schema.job.salaryMax,
        clearanceRequired: schema.job.clearanceRequired,
        snippet: schema.job.snippet,
        description: schema.job.description,
        slug: schema.job.slug,
        companyName: schema.company.name,
      })
      .from(schema.featuredListing)
      .innerJoin(schema.job, eq(schema.featuredListing.jobId, schema.job.id))
      .leftJoin(schema.company, eq(schema.job.companyId, schema.company.id))
      .where(and(
        eq(schema.featuredListing.status, 'active'),
        lte(schema.featuredListing.startsAt, new Date(now)),
        gte(schema.featuredListing.endsAt, new Date(now))
      ))
      .orderBy(sql`RANDOM()`)
      .limit(limit)

    // Combine and dedupe
    const seenIds = new Set<string>()
    const allJobs: any[] = []

    // Add featured listings first (they have paid placement)
    for (const listing of featuredListings) {
      if (listing.jobId && !seenIds.has(listing.jobId)) {
        seenIds.add(listing.jobId)
        allJobs.push({
          ...listing,
          listing_id: listing.listingId,
        })
      }
    }

    // Add featured jobs
    for (const job of featuredJobs) {
      if (!seenIds.has(job.id)) {
        seenIds.add(job.id)
        allJobs.push(job)
      }
    }

    // Transform to API response format
    const transformedJobs = allJobs.slice(0, limit).map(job => ({
      id: job.id || job.jobId,
      title: job.title,
      company: job.companyName || job.company,
      company_id: job.companyId,
      location: job.location,
      location_type: job.locationType,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      clearance_required: job.clearanceRequired,
      snippet: job.snippet,
      description: job.description,
      slug: job.slug,
      listing_id: job.listing_id || null,
    }))

    return {
      jobs: transformedJobs,
    }
  } catch (error) {
    console.error('Failed to fetch featured jobs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch featured jobs',
    })
  }
})
