/**
 * @file Base detail API endpoint
 * @route GET /api/bases/[slug]
 * @description Returns base details with jobs (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, sql, desc, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.toLowerCase()
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Base slug is required',
    })
  }

  const db = getDb()

  try {
    // Get base by slug
    const [baseResult] = await db
      .select()
      .from(schema.base)
      .where(eq(schema.base.slug, slug))
      .limit(1)

    if (!baseResult) {
      throw createError({
        statusCode: 404,
        statusMessage: `Base "${slug}" not found`,
      })
    }

    // Get theater info if available
    let theaterInfo = null
    if (baseResult.theaterCode) {
      const [theater] = await db
        .select()
        .from(schema.theater)
        .where(eq(schema.theater.code, baseResult.theaterCode))
        .limit(1)
      theaterInfo = theater
    }

    // Get jobs at this base (jobs have location field that might contain base name)
    // For now, search by location containing the base name or city
    const searchTerms = [baseResult.name]
    if (baseResult.city) searchTerms.push(baseResult.city)
    
    const jobsQuery = db
      .select()
      .from(schema.job)
      .where(
        and(
          eq(schema.job.isActive, true),
          // Match location containing base name or city
          sql`(${schema.job.location} LIKE ${'%' + baseResult.name + '%'} 
               OR ${schema.job.location} LIKE ${'%' + (baseResult.city || '') + '%'})`
        )
      )
      .orderBy(desc(schema.job.postedAt))
      .limit(limit)
      .offset(offset)

    const jobs = await jobsQuery

    // Count total jobs
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.job)
      .where(
        and(
          eq(schema.job.isActive, true),
          sql`(${schema.job.location} LIKE ${'%' + baseResult.name + '%'} 
               OR ${schema.job.location} LIKE ${'%' + (baseResult.city || '') + '%'})`
        )
      )

    // Get top employers at this base
    const topEmployers = await db
      .select({
        company: schema.job.company,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(schema.job)
      .where(
        and(
          eq(schema.job.isActive, true),
          sql`(${schema.job.location} LIKE ${'%' + baseResult.name + '%'} 
               OR ${schema.job.location} LIKE ${'%' + (baseResult.city || '') + '%'})`
        )
      )
      .groupBy(schema.job.company)
      .orderBy(desc(sql`count`))
      .limit(5)

    // Transform base to snake_case
    const base = {
      id: baseResult.id,
      slug: baseResult.slug,
      name: baseResult.name,
      country: baseResult.country,
      city: baseResult.city ?? null,
      description: baseResult.description ?? null,
      job_count: baseResult.jobCount ?? null,
      theater_code: baseResult.theaterCode ?? null,
      is_active: baseResult.isActive ?? null,
      coordinates: baseResult.coordinatesLat && baseResult.coordinatesLng
        ? { lat: baseResult.coordinatesLat, lng: baseResult.coordinatesLng }
        : null,
      created_at: baseResult.createdAt?.toISOString() ?? null,
      updated_at: baseResult.updatedAt?.toISOString() ?? null,
      theaters: theaterInfo ? {
        code: theaterInfo.code,
        name: theaterInfo.name,
        region: theaterInfo.region,
      } : null,
    }

    // Transform jobs to snake_case
    const transformedJobs = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      clearance_required: j.clearanceRequired ?? null,
      salary_min: j.salaryMin ?? null,
      salary_max: j.salaryMax ?? null,
      snippet: j.snippet ?? null,
      slug: j.slug ?? null,
      posted_at: j.postedAt?.toISOString() ?? null,
    }))

    return {
      base,
      jobs: transformedJobs,
      totalJobs: totalResult?.count ?? 0,
      topEmployers: topEmployers.map(e => ({
        company: e.company,
        count: e.count,
      })),
    }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch base: ${message}`,
    })
  }
})
