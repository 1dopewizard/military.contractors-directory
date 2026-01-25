/**
 * @file Jobs composable for fetching and managing job listings (API-backed)
 * @usage import { useJobs } from '@/composables/useJobs'
 * @description Handles job-related operations including fetching latest jobs,
 *              single job details, and filtering
 */

import type { JobFilters, PaginationOptions, JobWithMeta } from '@/app/types/app.types'

export const useJobs = () => {
  const logger = useLogger('useJobs')

  /**
   * Format salary range for display
   */
  const formatSalary = (min: number | null, max: number | null, currency = 'USD'): string => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K ${currency}`
    if (min) return `$${(min / 1000).toFixed(0)}K+ ${currency}`
    if (max) return `Up to $${(max / 1000).toFixed(0)}K ${currency}`
    return 'Not specified'
  }

  /**
   * Format date for display
   * Accepts both ISO strings and Unix timestamps
   */
  const formatDate = (dateInput: string | number | null | undefined): string => {
    if (!dateInput) return 'Unknown'
    const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  /**
   * Transform API response to JobWithMeta
   */
  const toJobWithMeta = (job: Record<string, unknown>): JobWithMeta => {
    return {
      id: job.id as string,
      title: job.title as string,
      company: job.company as string,
      company_id: (job.company_id as string) || null,
      location: job.location as string,
      location_type: (job.location_type as string) || null,
      salary_min: (job.salary_min as number) || null,
      salary_max: (job.salary_max as number) || null,
      currency: (job.currency as string) || 'USD',
      description: job.description as string,
      snippet: (job.snippet as string) || null,
      requirements: (job.requirements as string[]) || [],
      clearance_required: (job.clearance_required as string) || null,
      featured: (job.featured as boolean) || false,
      posted_at: (job.posted_at as string) || null,
      expires_at: (job.expires_at as string) || null,
      created_at: (job.created_at as string) || null,
      updated_at: (job.updated_at as string) || null,
      status: (job.status as string) || 'ACTIVE',
      sponsor_category: (job.sponsor_category as string) || null,
      is_oconus: (job.is_oconus as boolean) || false,
      is_active: job.is_active !== false,
      theater: (job.theater as string) || null,
      source_site: (job.source_site as string) || null,
      external_id: (job.external_id as string) || null,
      slug: (job.slug as string) || null,
      // Add meta fields
      formatted_salary: formatSalary(
        (job.salary_min as number) || null,
        (job.salary_max as number) || null,
        (job.currency as string) || 'USD'
      ),
      formatted_date: formatDate(job.posted_at as string || job.created_at as string),
    } as JobWithMeta
  }

  /**
   * Fetch latest jobs
   * @param limit - Number of jobs to fetch (default: 10)
   * @param filters - Optional filters
   */
  const fetchLatestJobs = async (
    limit = 10,
    filters?: JobFilters
  ): Promise<{ data: JobWithMeta[] | null; error: string | null }> => {
    try {
      logger.info({ limit, filters }, 'Fetching latest jobs')

      const response = await $fetch<{ results: Record<string, unknown>[]; total: number }>('/api/jobs/search', {
        query: {
          limit,
          location: filters?.location_type,
          clearance: filters?.clearance_required,
          q: filters?.search,
        }
      })

      const jobsWithMeta = (response.results || []).map(toJobWithMeta)

      logger.info({ count: jobsWithMeta.length }, 'Jobs fetched successfully')
      return { data: jobsWithMeta, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Unexpected error fetching jobs')
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Fetch single job by ID
   */
  const fetchJobById = async (
    id: string
  ): Promise<{ data: JobWithMeta | null; error: string | null }> => {
    try {
      logger.info({ id }, 'Fetching job by ID')

      const job = await $fetch<Record<string, unknown>>(`/api/jobs/${id}`)

      if (!job) {
        return { data: null, error: 'Job not found' }
      }

      const jobWithMeta = toJobWithMeta(job)

      logger.info({ id }, 'Job fetched successfully')
      return { data: jobWithMeta, error: null }
    } catch (err) {
      const error = err as { statusCode?: number }
      if (error?.statusCode === 404) {
        return { data: null, error: 'Job not found' }
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage, id }, 'Unexpected error fetching job')
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Fetch featured listings
   * @param limit - Number of featured listings to fetch (default: 12)
   */
  const fetchFeaturedListings = async (
    limit = 12
  ): Promise<{ data: JobWithMeta[] | null; error: string | null }> => {
    try {
      logger.info({ limit }, 'Fetching featured listings')

      // Use the search API with featured filter
      const response = await $fetch<{ results: Record<string, unknown>[]; total: number }>('/api/jobs/search', {
        query: {
          limit,
          sort: 'relevance', // Featured jobs are prioritized
        }
      })

      if (!response.results || response.results.length === 0) {
        logger.info('No featured listings found')
        return { data: [], error: null }
      }

      // Filter to only featured jobs and convert to legacy format
      const jobsWithMeta = response.results
        .filter((job: Record<string, unknown>) => job.featured)
        .map((job: Record<string, unknown>) => ({
          ...toJobWithMeta(job),
          is_pinned: false,
          listing_id: job.id as string,
        }))

      logger.info({ count: jobsWithMeta.length }, 'Featured listings fetched successfully')
      return { data: jobsWithMeta, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Unexpected error fetching featured listings')
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Fetch jobs with pagination
   */
  const fetchJobs = async (
    pagination: PaginationOptions = {},
    filters?: JobFilters
  ): Promise<{ data: JobWithMeta[] | null; error: string | null; count: number }> => {
    try {
      const { page = 1, limit = 20 } = pagination
      const offset = (page - 1) * limit

      logger.info({ page, limit, filters }, 'Fetching jobs with pagination')

      const response = await $fetch<{ results: Record<string, unknown>[]; total: number }>('/api/jobs/search', {
        query: {
          limit,
          offset,
          location: filters?.location_type,
          clearance: filters?.clearance_required,
          q: filters?.search,
        }
      })

      const jobsWithMeta = (response.results || []).map(toJobWithMeta)

      logger.info({ count: jobsWithMeta.length, total: response.total }, 'Jobs fetched successfully')
      return { data: jobsWithMeta, error: null, count: response.total || 0 }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Unexpected error fetching jobs')
      return { data: null, error: errorMessage, count: 0 }
    }
  }

  /**
   * Get MOSes mapped to a job (reverse lookup)
   * @deprecated Use useMosJobs().getMosesForJob() instead
   */
  const getMosesForJob = (jobId: string) => {
    logger.debug({ jobId }, 'getMosesForJob called - use useMosJobs instead')
    return []
  }

  /**
   * Record an impression for a featured listing (non-blocking)
   * @param listingId - The job ID
   */
  const incrementListingImpression = async (listingId: string): Promise<void> => {
    // TODO: Implement impression tracking
    logger.debug({ listingId }, 'Featured listing impression recorded (no-op for now)')
  }

  /**
   * Record a click for a featured listing (non-blocking)
   * @param listingId - The job ID
   */
  const incrementListingClick = async (listingId: string): Promise<void> => {
    // TODO: Implement click tracking
    logger.debug({ listingId }, 'Featured listing click recorded (no-op for now)')
  }

  return {
    fetchLatestJobs,
    fetchJobById,
    fetchJobs,
    fetchFeaturedListings,
    formatSalary,
    formatDate,
    getMosesForJob,
    incrementListingImpression,
    incrementListingClick
  }
}
