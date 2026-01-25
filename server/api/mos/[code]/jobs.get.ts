/**
 * @file GET /api/mos/[code]/jobs
 * @description Returns Top-K jobs for a MOS code (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, desc, sql, and } from 'drizzle-orm'

interface JobMapping {
  match_strength: 'STRONG' | 'MEDIUM' | 'WEAK'
  confidence_score: number
  mapping_reason: string
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'MOS code is required',
    })
  }

  const mosCode = code.toUpperCase()
  const db = getDb()

  try {
    // First verify the MOS code exists
    const [mos] = await db
      .select({ id: schema.mosCode.id, code: schema.mosCode.code })
      .from(schema.mosCode)
      .where(eq(schema.mosCode.code, mosCode))
      .limit(1)

    if (!mos) {
      throw createError({
        statusCode: 404,
        message: `MOS code ${mosCode} not found`,
      })
    }

    // Get jobs mapped to this MOS code with their mappings
    const jobsWithMappings = await db
      .select({
        job: schema.job,
        mapping: schema.jobMosMapping,
      })
      .from(schema.jobMosMapping)
      .innerJoin(schema.job, eq(schema.job.id, schema.jobMosMapping.jobId))
      .where(
        and(
          eq(schema.jobMosMapping.mosId, mos.id),
          eq(schema.job.isActive, true)
        )
      )
      .orderBy(desc(schema.jobMosMapping.matchScore), desc(schema.job.postedAt))
      .limit(limit)
      .offset(offset)

    // Count total jobs for this MOS
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.jobMosMapping)
      .innerJoin(schema.job, eq(schema.job.id, schema.jobMosMapping.jobId))
      .where(
        and(
          eq(schema.jobMosMapping.mosId, mos.id),
          eq(schema.job.isActive, true)
        )
      )

    // Transform jobs to snake_case for API response
    const transformedJobs = jobsWithMappings.map(({ job, mapping }) => {
      const matchScore = mapping.matchScore || 0
      const matchStrength: 'STRONG' | 'MEDIUM' | 'WEAK' = 
        matchScore > 0.7 ? 'STRONG' : matchScore > 0.4 ? 'MEDIUM' : 'WEAK'

      const jobMapping: JobMapping = {
        match_strength: matchStrength,
        confidence_score: matchScore,
        mapping_reason: mapping.explanation || '',
      }

      return {
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
        featured: job.featured ?? false,
        posted_at: job.postedAt?.toISOString() ?? null,
        snippet: job.snippet ?? null,
        slug: job.slug ?? null,
        sponsor_category: job.sponsorCategory ?? null,
        match_strength: matchStrength,
        mapping_reason: mapping.explanation || '',
        mapping: jobMapping,
        ranking_score: matchScore,
      }
    })

    return {
      mos_code: mosCode,
      jobs: transformedJobs,
      total: totalResult?.count ?? 0,
      offset,
      limit,
      source: 'drizzle',
    }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Database error: ${message}`,
    })
  }
})
