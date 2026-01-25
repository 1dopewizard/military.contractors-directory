/**
 * @file MOS Jobs composable (API-backed)
 * @usage import { useMosJobs } from '@/composables/useMosJobs'
 * @description Handles job queries filtered by MOS and job-to-MOS mappings
 */

import type { JobWithMosMatch, MatchStrength } from '@/app/types/mos.types'
import type { MosJobFilters } from '@/app/types/app.types'

export const useMosJobs = () => {
  const logger = useLogger('useMosJobs')
  const { formatSalary, formatDate } = useJobs()

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
   * Helper to convert API job to JobWithMosMatch format
   */
  const toJobWithMosMatch = (
    job: Record<string, unknown>,
    mapping?: {
      match_strength: MatchStrength
      confidence_score: number
      mapping_reason: string
    }
  ): JobWithMosMatch => {
    return {
      // Core fields (snake_case from API)
      _id: job.id as string,
      _creationTime: Date.now(),
      id: job.id as string,
      title: job.title as string,
      company: job.company as string,
      companyId: job.company_id as string,
      company_id: (job.company_id as string) || null,
      location: job.location as string,
      locationType: job.location_type as string,
      location_type: (job.location_type as string) || null,
      salaryMin: job.salary_min as number,
      salaryMax: job.salary_max as number,
      salary_min: (job.salary_min as number) ?? null,
      salary_max: (job.salary_max as number) ?? null,
      currency: (job.currency as string) || 'USD',
      description: job.description as string,
      snippet: (job.snippet as string) || null,
      requirements: (job.requirements as string[]) || [],
      clearanceRequired: job.clearance_required as string,
      clearance_required: (job.clearance_required as string) || null,
      featured: (job.featured as boolean) || false,
      postedAt: job.posted_at ? new Date(job.posted_at as string).getTime() : undefined,
      expiresAt: job.expires_at ? new Date(job.expires_at as string).getTime() : undefined,
      posted_at: (job.posted_at as string) || null,
      expires_at: (job.expires_at as string) || null,
      status: (job.status as string) || 'ACTIVE',
      sponsorCategory: job.sponsor_category as string,
      sponsor_category: (job.sponsor_category as string) || null,
      isOconus: job.is_oconus as boolean,
      is_oconus: (job.is_oconus as boolean) || false,
      isActive: job.is_active as boolean,
      is_active: job.is_active !== false,
      theater: (job.theater as string) || null,
      sourceSite: job.source_site as string,
      source_site: (job.source_site as string) || null,
      externalId: job.external_id as string,
      external_id: (job.external_id as string) || null,
      slug: (job.slug as string) || null,
      seniority: job.seniority as string,
      employmentType: job.employment_type as string,
      createdAt: job.created_at ? new Date(job.created_at as string).getTime() : undefined,
      updatedAt: job.updated_at ? new Date(job.updated_at as string).getTime() : undefined,
      created_at: (job.created_at as string) || null,
      updated_at: (job.updated_at as string) || null,
      // MOS match fields
      match_strength: mapping?.match_strength || (job.match_strength as MatchStrength),
      confidence_score: mapping?.confidence_score || (job.ranking_score as number),
      mapping_reason: mapping?.mapping_reason || (job.mapping_reason as string),
      // Formatted display fields
      formatted_salary: formatSalary(
        (job.salary_min as number) ?? null,
        (job.salary_max as number) ?? null,
        (job.currency as string) || 'USD'
      ),
      formatted_date: formatDate(job.posted_at as string || job.created_at as string),
    } as JobWithMosMatch
  }

  /**
   * Get jobs mapped to a specific MOS
   */
  const getJobsForMos = async (
    mosCode: string, 
    filters?: MosJobFilters
  ): Promise<JobWithMosMatch[]> => {
    logger.debug({ mosCode, filters }, 'Getting jobs for MOS')

    try {
      // Use the MOS jobs API endpoint
      const result = await $fetch<{
        mos_code: string
        jobs: Record<string, unknown>[]
        total: number
      }>(`/api/mos/${mosCode.toUpperCase()}/jobs`, {
        query: { limit: 100 }
      })

      if (!result || !result.jobs || result.jobs.length === 0) {
        logger.info({ mosCode }, 'No jobs found for MOS')
        return []
      }

      // Transform to JobWithMosMatch format
      let jobs: JobWithMosMatch[] = result.jobs.map((item) => {
        const mapping = item.mapping as Record<string, unknown> | undefined
        return toJobWithMosMatch(item, mapping ? {
          match_strength: (mapping.match_strength as MatchStrength) || 'WEAK',
          confidence_score: (mapping.confidence_score as number) ?? 0.7,
          mapping_reason: (mapping.mapping_reason as string) || '',
        } : undefined)
      })

      // Apply filters
      if (filters) {
        jobs = applyFilters(jobs, filters)
      }

      logger.info({ mosCode, count: jobs.length }, 'Jobs retrieved for MOS')
      return jobs
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage, mosCode }, 'Failed to fetch jobs for MOS')
      return []
    }
  }

  /**
   * Apply filters to job list
   */
  const applyFilters = (
    jobs: JobWithMosMatch[], 
    filters: MosJobFilters
  ): JobWithMosMatch[] => {
    let filtered = [...jobs]

    // Match strength filter
    if (filters.match_strength) {
      filtered = filtered.filter(job => 
        job.match_strength === filters.match_strength
      )
    }

    // Location type filter (CONUS/OCONUS)
    if (filters.location_type) {
      filtered = filtered.filter(job => {
        return job.location_type === filters.location_type || job.locationType === filters.location_type
      })
    }

    // Theater filter
    if (filters.theater) {
      filtered = filtered.filter(job => {
        const location = (job.location || '').toLowerCase()
        const theater = filters.theater!.toLowerCase()
        
        if (theater === 'centcom') {
          return location.includes('kuwait') || location.includes('iraq') || 
                 location.includes('afghanistan') || location.includes('qatar')
        } else if (theater === 'eucom') {
          return location.includes('germany') || location.includes('europe') || 
                 location.includes('poland') || location.includes('italy')
        } else if (theater === 'pacom' || theater === 'indopacom') {
          return location.includes('korea') || location.includes('japan') || 
                 location.includes('pacific') || location.includes('guam')
        } else if (theater === 'africom') {
          return location.includes('africa') || location.includes('djibouti') || 
                 location.includes('niger')
        }
        
        return true
      })
    }

    // Clearance filter
    if (filters.clearance_required) {
      filtered = filtered.filter(job => {
        return job.clearance_required === filters.clearance_required || 
               job.clearanceRequired === filters.clearance_required
      })
    }

    // Salary range filter
    if (filters.salary_min) {
      filtered = filtered.filter(job => {
        const salaryMin = job.salary_min ?? job.salaryMin ?? null
        return salaryMin !== null && salaryMin >= filters.salary_min!
      })
    }

    if (filters.salary_max) {
      filtered = filtered.filter(job => {
        const salaryMax = job.salary_max ?? job.salaryMax ?? null
        return salaryMax !== null && salaryMax <= filters.salary_max!
      })
    }

    // Search filter (title, company, description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(job => {
        return (job.title || '').toLowerCase().includes(searchLower) ||
               (job.company || '').toLowerCase().includes(searchLower) ||
               (job.description || '').toLowerCase().includes(searchLower)
      })
    }

    logger.debug({ 
      originalCount: jobs.length, 
      filteredCount: filtered.length,
      filters 
    }, 'Filters applied to jobs')

    return filtered
  }

  /**
   * Get MOS match information for a specific job
   */
  const getJobMosMatch = async (jobId: string, mosCode: string): Promise<{
    match_strength: MatchStrength
    mapping_reason: string
    confidence_score: number
  } | null> => {
    logger.debug({ jobId, mosCode }, 'Getting MOS match for job')

    try {
      // Fetch job detail which includes MOS mappings
      const job = await $fetch<{
        mos_mappings?: Array<{
          mos_code: string
          match_strength: MatchStrength
          confidence_score: number
          mapping_reason: string
        }>
      }>(`/api/jobs/${jobId}`)

      if (!job || !job.mos_mappings) {
        return null
      }

      // Find the mapping for this MOS
      const mapping = job.mos_mappings.find(m => 
        m.mos_code.toUpperCase() === mosCode.toUpperCase()
      )

      if (!mapping) {
        logger.warn({ jobId, mosCode }, 'No MOS mapping found for job')
        return null
      }

      const result = {
        match_strength: mapping.match_strength,
        mapping_reason: mapping.mapping_reason,
        confidence_score: mapping.confidence_score,
      }

      logger.info({ jobId, mosCode, strength: result.match_strength }, 'MOS match retrieved')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage, jobId, mosCode }, 'Failed to get MOS match for job')
      return null
    }
  }

  /**
   * Get all MOS codes mapped to a job (reverse lookup)
   */
  const getMosesForJob = async (jobId: string) => {
    logger.debug({ jobId }, 'Getting MOSes for job')

    try {
      // Fetch job detail which includes MOS mappings
      const job = await $fetch<{
        mos_mappings?: Array<{
          mos_code: string
          mos_title: string
          branch: string
          match_strength: MatchStrength
          confidence_score: number
          mapping_reason: string
        }>
      }>(`/api/jobs/${jobId}`)

      if (!job || !job.mos_mappings || job.mos_mappings.length === 0) {
        return []
      }

      const results = job.mos_mappings.map(mapping => ({
        mos: {
          id: mapping.mos_code,
          code: mapping.mos_code,
          title: mapping.mos_title,
          branch: formatBranchName(mapping.branch),
        },
        map: {
          match_strength: mapping.match_strength,
          confidence_score: mapping.confidence_score,
          mapping_reason: mapping.mapping_reason,
        },
      }))

      logger.info({ jobId, count: results.length }, 'MOSes retrieved for job')
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage, jobId }, 'Failed to fetch MOSes for job')
      return []
    }
  }

  /**
   * Sort jobs by various criteria
   */
  const sortJobs = (
    jobs: JobWithMosMatch[], 
    sortBy: 'relevance' | 'date' | 'salary' = 'relevance'
  ): JobWithMosMatch[] => {
    const sorted = [...jobs]

    switch (sortBy) {
      case 'relevance':
        // Sort by match strength and confidence score
        sorted.sort((a, b) => {
          const strengthOrder: Record<MatchStrength, number> = {
            'STRONG': 3,
            'MEDIUM': 2,
            'WEAK': 1
          }
          const aStrength = a.match_strength ? strengthOrder[a.match_strength] : 0
          const bStrength = b.match_strength ? strengthOrder[b.match_strength] : 0
          
          if (aStrength !== bStrength) {
            return bStrength - aStrength
          }
          
          return (b.confidence_score ?? 0) - (a.confidence_score ?? 0)
        })
        break

      case 'date':
        // Sort by posted date (newest first)
        sorted.sort((a, b) => {
          const aTime = a.postedAt || (a.posted_at ? new Date(a.posted_at).getTime() : 0)
          const bTime = b.postedAt || (b.posted_at ? new Date(b.posted_at).getTime() : 0)
          return (bTime as number) - (aTime as number)
        })
        break

      case 'salary':
        // Sort by salary (highest first)
        sorted.sort((a, b) => {
          const aMax = a.salaryMax || a.salary_max || a.salaryMin || a.salary_min || 0
          const bMax = b.salaryMax || b.salary_max || b.salaryMin || b.salary_min || 0
          return (bMax as number) - (aMax as number)
        })
        break
    }

    logger.debug({ sortBy, count: sorted.length }, 'Jobs sorted')
    return sorted
  }

  /**
   * Get featured/highlighted jobs for a MOS
   */
  const getFeaturedJobsForMos = async (mosCode: string): Promise<JobWithMosMatch[]> => {
    logger.debug({ mosCode }, 'Getting featured jobs for MOS')
    
    const jobs = await getJobsForMos(mosCode)
    const featured = jobs.filter(job => job.featured)
    
    logger.info({ mosCode, count: featured.length }, 'Featured jobs retrieved')
    return featured
  }

  /**
   * Get unique values for filter options
   */
  const getFilterOptions = async (mosCode: string) => {
    const jobs = await getJobsForMos(mosCode)

    // Unique clearance levels
    const clearances = [...new Set(jobs.map(j => 
      j.clearance_required || j.clearanceRequired
    ).filter(Boolean))] as string[]

    // Unique location types
    const locationTypes = [...new Set(jobs.map(j => 
      j.location_type || j.locationType
    ).filter(Boolean))] as string[]

    // Salary range
    const salaries = jobs
      .filter(j => (j.salary_min ?? j.salaryMin) !== null && (j.salary_max ?? j.salaryMax) !== null)
      .map(j => ({ 
        min: (j.salary_min ?? j.salaryMin)!, 
        max: (j.salary_max ?? j.salaryMax)! 
      }))
    
    const salaryRange = salaries.length > 0 ? {
      min: Math.min(...salaries.map(s => s.min)),
      max: Math.max(...salaries.map(s => s.max))
    } : null

    logger.debug({ mosCode, clearances, locationTypes, salaryRange }, 'Filter options generated')

    return {
      clearances,
      locationTypes,
      salaryRange
    }
  }

  return {
    getJobsForMos,
    applyFilters,
    getJobMosMatch,
    getMosesForJob,
    sortJobs,
    getFeaturedJobsForMos,
    getFilterOptions
  }
}
