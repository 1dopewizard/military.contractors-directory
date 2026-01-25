/**
 * @file GET /api/mos/[code]
 * @description Returns MOS detail with ontology enrichment
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, or, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'MOS code is required',
    })
  }

  const db = getDb()

  try {
    // Try exact match first, then uppercase
    const [mos] = await db
      .select()
      .from(schema.mosCode)
      .where(
        or(
          eq(schema.mosCode.code, code),
          eq(schema.mosCode.code, code.toUpperCase())
        )
      )
      .limit(1)

    if (!mos) {
      throw createError({
        statusCode: 404,
        message: `MOS code ${code} not found`,
      })
    }

    // Transform to snake_case for API response
    return {
      id: mos.id,
      branch: mos.branch,
      code: mos.code,
      name: mos.name,
      rank: mos.rank,
      description: mos.description ?? null,
      source_url: mos.sourceUrl,
      mos_category: mos.mosCategory ?? null,
      summarized_description: mos.summarizedDescription ?? null,
      source: mos.source ?? null,
      // Enrichment fields
      core_skills: mos.coreSkills ?? [],
      tools_platforms: mos.toolsPlatforms ?? [],
      mission_domains: mos.missionDomains ?? [],
      environments: mos.environments ?? [],
      civilian_roles: mos.civilianRoles ?? [],
      role_families: mos.roleFamilies ?? [],
      company_archetypes: mos.companyArchetypes ?? [],
      clearance_profile: mos.clearanceProfile ?? null,
      deployment_profile: mos.deploymentProfile ?? null,
      seniority_distribution: mos.seniorityDistribution ?? null,
      pay_band_hint: mos.payBandHint ?? null,
      common_certs: mos.commonCerts ?? [],
      recommended_certs_contract: mos.recommendedCertsContract ?? [],
      training_paths: mos.trainingPaths ?? null,
      // Job counts
      job_count_total: mos.jobCountTotal ?? 0,
      job_count_oconus: mos.jobCountOconus ?? 0,
      job_count_conus: mos.jobCountConus ?? 0,
      enrichment_version: mos.enrichmentVersion ?? 0,
      last_enriched_at: mos.lastEnrichedAt?.toISOString() ?? null,
      created_at: mos.createdAt?.toISOString() ?? null,
      updated_at: mos.updatedAt?.toISOString() ?? null,
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
