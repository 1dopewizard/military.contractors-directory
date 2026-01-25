/**
 * @file MOS data composable (API-backed)
 * @usage import { useMosData } from '@/composables/useMosData'
 * @description Provides access to MOS codes, search, and metadata from server API
 */

import type { 
  MosCode, 
  MosSearchResult, 
  MosStats, 
  JobFamily, 
  MosSkillProfile,
  Branch,
} from '@/app/types/mos.types'
import type { MilitarySpecialty } from '@/app/types/legacy-types'

export const useMosData = () => {
  const logger = useLogger('useMosData')

  /**
   * Helper to format branch name from snake_case to proper case
   */
  const formatBranchName = (branch: string): string => {
    if (!branch) return branch
    return branch
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Helper to map API MOS to MilitarySpecialty format
   */
  const mapToMilitarySpecialty = (mos: Record<string, unknown>): MilitarySpecialty => ({
    id: mos.id as string,
    code: mos.code as string,
    name: mos.name as string,
    title: mos.name as string,
    branch: formatBranchName(mos.branch as string),
    rank: mos.rank as string,
    description: (mos.description as string) || null,
    source_url: mos.source_url as string,
    mos_category: (mos.mos_category as string) || null,
    category: (mos.mos_category as string) || null,
    summarized_description: (mos.summarized_description as string) || null,
    source: (mos.source as string) || null,
    // Enrichment fields
    core_skills: mos.core_skills || null,
    tools_platforms: mos.tools_platforms || null,
    mission_domains: mos.mission_domains || null,
    environments: mos.environments || null,
    civilian_roles: mos.civilian_roles || null,
    role_families: mos.role_families || null,
    company_archetypes: mos.company_archetypes || null,
    clearance_profile: mos.clearance_profile || null,
    deployment_profile: mos.deployment_profile || null,
    seniority_distribution: mos.seniority_distribution || null,
    pay_band_hint: (mos.pay_band_hint as string) || null,
    common_certs: mos.common_certs || null,
    recommended_certs_contract: mos.recommended_certs_contract || null,
    training_paths: mos.training_paths || null,
    // Job counts
    job_count_total: (mos.job_count_total as number) || 0,
    job_count_oconus: (mos.job_count_oconus as number) || 0,
    job_count_conus: (mos.job_count_conus as number) || 0,
    // Metadata
    enrichment_version: (mos.enrichment_version as number) || 0,
    last_enriched_at: (mos.last_enriched_at as string) || null,
    created_at: mos.created_at as string,
    updated_at: mos.updated_at as string,
  })

  /**
   * Get MOS code by ID
   */
  const getMosById = async (id: string): Promise<MilitarySpecialty | null> => {
    logger.debug({ id }, 'Getting MOS by ID')
    
    try {
      // Use the code endpoint since we don't have a separate ID endpoint
      const mos = await $fetch<Record<string, unknown>>(`/api/mos/${id}`)
      
      if (!mos) {
        logger.warn({ id }, 'MOS not found by ID')
        return null
      }
      
      return mapToMilitarySpecialty(mos)
    } catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 404) {
        logger.warn({ id }, 'MOS not found by ID')
        return null
      }
      logger.error({ error, id }, 'Failed to fetch MOS by ID')
      return null
    }
  }

  /**
   * Get MOS code by code (e.g., "25U")
   */
  const getMosByCode = async (code: string): Promise<MilitarySpecialty | null> => {
    logger.info({ code }, 'Getting MOS by code')
    
    try {
      const mos = await $fetch<Record<string, unknown>>(`/api/mos/${code.toUpperCase()}`)
      
      logger.info({ code, hasData: !!mos }, 'API query result')
      
      if (!mos) {
        logger.warn({ code }, 'MOS not found by code - data is null')
        return null
      }
      
      const mapped = mapToMilitarySpecialty(mos)
      logger.info({ code, branch: mapped.branch, enrichment_version: mapped.enrichment_version }, 'MOS found and formatted')
      return mapped
    } catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 404) {
        logger.warn({ code }, 'MOS not found by code')
        return null
      }
      logger.error({ error, code }, 'Failed to fetch MOS by code')
      return null
    }
  }

  /**
   * Search MOS codes with autocomplete (prefix matching on code, name search)
   */
  const searchMos = async (query: string, limit = 10): Promise<MosSearchResult[]> => {
    if (!query || query.length < 1) {
      return []
    }

    const upperQuery = query.toUpperCase().trim()
    logger.debug({ query: upperQuery, limit }, 'Searching MOS codes')

    try {
      // Use dedicated MOS search endpoint for prefix matching
      const response = await $fetch<Array<{
        id: string
        code: string
        title: string
        branch: string
        category: string | null
        description: string | null
      }>>('/api/mos/search', {
        query: { q: upperQuery, limit }
      })

      const results: MosSearchResult[] = response.map((mos, index) => ({
        mos: {
          id: mos.id,
          code: mos.code,
          title: mos.title,
          branch: formatBranchName(mos.branch),
          category: mos.category,
          description: mos.description,
          status: 'ACTIVE' as const,
        },
        relevance_score: 1.0 - (index * 0.05),
        matched_on: mos.code.toUpperCase().startsWith(upperQuery) ? 'code' as const : 'title' as const,
      }))

      logger.info({ count: results.length, query }, 'MOS search completed')
      return results
    } catch (error) {
      logger.error({ error, query }, 'MOS search failed')
      return []
    }
  }

  /**
   * Get all MOS codes, optionally filtered by branch
   */
  const getAllMoses = async (branch?: Branch): Promise<MilitarySpecialty[]> => {
    logger.debug({ branch }, 'Getting all MOS codes')
    
    try {
      // Note: We don't have a dedicated list endpoint, so this is limited
      // For now, return empty array - this function is rarely used
      logger.warn('getAllMoses not fully implemented for API-backed version')
      return []
    } catch (error) {
      logger.error({ error }, 'Failed to fetch all MOSes')
      return []
    }
  }

  /**
   * Get MOS codes grouped by branch
   */
  const getMosGroupedByBranch = async (): Promise<Record<string, MilitarySpecialty[]>> => {
    logger.debug('Getting MOS codes grouped by branch')
    
    try {
      // Note: We don't have a dedicated list endpoint, so this is limited
      logger.warn('getMosGroupedByBranch not fully implemented for API-backed version')
      return {}
    } catch (error) {
      logger.error({ error }, 'Failed to fetch grouped MOSes')
      return {}
    }
  }

  /**
   * Get aggregate statistics for a MOS
   */
  const getMosStats = async (mosCode: string): Promise<MosStats | null> => {
    logger.debug({ mosCode }, 'Getting MOS stats')

    try {
      const stats = await $fetch<MosStats>('/api/market-snapshot', {
        query: { mos_code: mosCode }
      })
      
      if (!stats) {
        logger.warn({ mosCode }, 'No stats found for MOS')
        return null
      }
      
      logger.info({ mosCode, activeJobs: stats.stats?.jobCount }, 'MOS stats retrieved')
      return stats
    } catch (error) {
      logger.error({ error, mosCode }, 'Failed to fetch MOS stats')
      return null
    }
  }

  /**
   * Get job families for a MOS
   */
  const getJobFamilies = async (mosCode: string): Promise<JobFamily[]> => {
    logger.debug({ mosCode }, 'Getting job families for MOS')
    
    const mos = await getMosByCode(mosCode)
    if (!mos || !mos.role_families) return []

    // role_families is Json type, cast to string array
    const families = Array.isArray(mos.role_families) ? mos.role_families as string[] : []

    // Map to JobFamily interface
    return families.map((family: string, index: number) => ({
      id: String(index),
      name: family,
      description: '',
      typical_clearance: null,
      typical_pay_min: null,
      typical_pay_max: null,
      mos_codes: [mosCode]
    }))
  }

  /**
   * Get skill profile for a MOS
   */
  const getMosSkillProfile = async (mosCode: string): Promise<MosSkillProfile | null> => {
    logger.debug({ mosCode }, 'Getting skill profile for MOS')

    const mos = await getMosByCode(mosCode)
    if (!mos) {
      logger.warn({ mosCode }, 'MOS not found for skill profile')
      return null
    }

    // Helper to safely extract string array from Json field
    const toStringArray = (json: unknown): string[] => {
      if (Array.isArray(json)) return json as string[]
      return []
    }

    // Construct profile from enriched data
    const profile: MosSkillProfile = {
      id: mos.id,
      mos_id: mos.id,
      core_skills: toStringArray(mos.core_skills),
      recommended_certs: toStringArray(mos.common_certs),
      typical_job_families: toStringArray(mos.role_families),
      transition_guidance: null,
      created_at: mos.created_at,
      updated_at: mos.updated_at
    }

    logger.info({ mosCode }, 'Skill profile retrieved')
    return profile
  }

  return {
    getMosById,
    getMosByCode,
    searchMos,
    getAllMoses,
    getMosGroupedByBranch,
    getMosStats,
    getJobFamilies,
    getMosSkillProfile
  }
}
