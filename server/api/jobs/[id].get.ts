/**
 * @file GET /api/jobs/[id]
 * @description Returns job detail with MOS mappings
 */

import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

interface MosMappingWithCode {
  mos_code: string
  mos_title: string
  branch: string
  match_strength: 'STRONG' | 'MEDIUM' | 'WEAK'
  confidence_score: number
  mapping_reason: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Job ID is required',
    })
  }

  const db = getDb()

  try {
    // Get job by ID
    const [job] = await db
      .select()
      .from(schema.job)
      .where(eq(schema.job.id, id))
      .limit(1)

    if (!job) {
      throw createError({
        statusCode: 404,
        message: `Job ${id} not found`,
      })
    }

    // Get company slug if companyId exists
    let companySlug: string | null = null
    if (job.companyId) {
      const [company] = await db
        .select({ slug: schema.company.slug })
        .from(schema.company)
        .where(eq(schema.company.id, job.companyId))
        .limit(1)
      companySlug = company?.slug ?? null
    }

    // Get MOS mappings for this job
    const mosMappings = await db
      .select({
        mosCode: schema.mosCode.code,
        mosTitle: schema.mosCode.name,
        branch: schema.mosCode.branch,
        matchScore: schema.jobMosMapping.matchScore,
        explanation: schema.jobMosMapping.explanation,
      })
      .from(schema.jobMosMapping)
      .innerJoin(schema.mosCode, eq(schema.jobMosMapping.mosId, schema.mosCode.id))
      .where(eq(schema.jobMosMapping.jobId, id))

    // Transform mappings to expected format
    const mappingsFormatted: MosMappingWithCode[] = mosMappings.map(m => ({
      mos_code: m.mosCode,
      mos_title: m.mosTitle,
      branch: m.branch,
      match_strength: (m.matchScore ?? 0) >= 0.8 ? 'STRONG' : (m.matchScore ?? 0) >= 0.5 ? 'MEDIUM' : 'WEAK',
      confidence_score: m.matchScore ?? 0,
      mapping_reason: m.explanation ?? '',
    }))

    // Transform to snake_case for API response
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      company_id: job.companyId ?? null,
      company_slug: companySlug,
      location: job.location,
      location_type: job.locationType ?? null,
      is_oconus: job.isOconus ?? null,
      salary_min: job.salaryMin ?? null,
      salary_max: job.salaryMax ?? null,
      currency: job.currency ?? null,
      description: job.description,
      snippet: job.snippet ?? null,
      requirements: job.requirements ?? null,
      clearance_required: job.clearanceRequired ?? null,
      featured: job.featured ?? false,
      posted_at: job.postedAt?.toISOString() ?? null,
      expires_at: job.expiresAt?.toISOString() ?? null,
      status: job.status ?? 'ACTIVE',
      sponsor_category: job.sponsorCategory ?? null,
      theater: job.theater ?? null,
      slug: job.slug ?? null,
      source_site: job.sourceSite ?? null,
      external_id: job.externalId ?? null,
      seniority: job.seniority ?? null,
      employment_type: job.employmentType ?? null,
      source_type: job.sourceType ?? null,
      is_active: job.isActive ?? true,
      created_at: job.createdAt?.toISOString() ?? null,
      updated_at: job.updatedAt?.toISOString() ?? null,
      mos_mappings: mappingsFormatted,
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
