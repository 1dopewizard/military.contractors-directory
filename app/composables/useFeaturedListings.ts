/**
 * @file Featured listings admin composable (API-backed)
 * @usage import { useFeaturedListings } from '@/composables/useFeaturedListings'
 * @description Admin operations for managing featured listings via API
 * @dependencies API-backed (libSQL/Drizzle)
 */

import type { Job } from '@/app/types/legacy-types'

/** Request data stored when employer requests featured status */
export interface FeaturedRequestData {
  contact_name: string
  contact_email: string
  contact_phone?: string
  requested_at: string
}

export interface FeaturedListingWithJob {
  id: string
  job_id: string
  display_order: number
  starts_at: string
  ends_at: string
  is_pinned: boolean
  impressions: number
  clicks: number
  created_at: string
  updated_at: string
  status?: 'pending' | 'approved' | 'rejected' | 'expired'
  request_data?: FeaturedRequestData | null
  job: Job | null
}

/** Date-based status for display (active/scheduled/expired) */
export type ListingStatus = 'active' | 'scheduled' | 'expired'

/** Request status for admin workflow */
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export const useFeaturedListings = () => {
  const logger = useLogger('useFeaturedListings')

  /**
   * Get status based on date range
   */
  const getStatus = (starts_at: string, ends_at: string): ListingStatus => {
    const now = new Date()
    const start = new Date(starts_at)
    const end = new Date(ends_at)

    if (now < start) return 'scheduled'
    if (now > end) return 'expired'
    return 'active'
  }

  /**
   * Fetch all featured listings for admin (including expired/scheduled)
   */
  const fetchAllFeaturedListings = async (): Promise<{
    data: FeaturedListingWithJob[] | null
    error: string | null
  }> => {
    try {
      logger.info('Fetching all featured listings (admin)')

      // TODO: Implement via API
      logger.warn('Featured listings fetch not yet implemented')
      return { data: [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to fetch featured listings')
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Add a new featured listing
   */
  const addFeaturedListing = async (input: {
    job_id: string
    display_order?: number
    starts_at: string
    ends_at: string
    is_pinned?: boolean
  }): Promise<{ success: boolean; error: string | null }> => {
    try {
      logger.info({ job_id: input.job_id }, 'Adding featured listing')

      // TODO: Implement via API
      logger.warn('Featured listing creation not yet implemented')
      return { success: false, error: 'Not yet implemented' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to add featured listing')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Update a featured listing
   */
  const updateFeaturedListing = async (
    id: string,
    input: {
      display_order?: number
      starts_at?: string
      ends_at?: string
      is_pinned?: boolean
    }
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      logger.info({ id }, 'Updating featured listing')

      // TODO: Implement via API
      logger.warn('Featured listing update not yet implemented')
      return { success: false, error: 'Not yet implemented' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to update featured listing')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Remove a featured listing
   */
  const removeFeaturedListing = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      logger.info({ id }, 'Removing featured listing')

      // TODO: Implement via API
      logger.warn('Featured listing removal not yet implemented')
      return { success: false, error: 'Not yet implemented' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to remove featured listing')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Fetch available jobs for adding to featured (not already featured)
   */
  const fetchAvailableJobs = async (
    search?: string,
    limit = 20
  ): Promise<{
    data: Job[] | null
    error: string | null
  }> => {
    try {
      logger.info({ search, limit }, 'Fetching available jobs for featuring')

      const response = await $fetch<{ results: Record<string, unknown>[] }>('/api/jobs/search', {
        query: { q: search, limit }
      })

      const jobs = (response.results || []).map((job) => ({
        id: job.id as string,
        title: job.title as string,
        company: job.company as string,
        location: job.location as string,
        clearance_required: (job.clearance_required as string) || null,
        description: job.description as string,
        snippet: (job.snippet as string) || null,
        salary_min: (job.salary_min as number) || null,
        salary_max: (job.salary_max as number) || null,
        slug: (job.slug as string) || null,
        is_active: job.is_active !== false,
        posted_at: (job.posted_at as string) || null,
        created_at: (job.created_at as string) || null,
        updated_at: (job.updated_at as string) || null,
      })) as unknown as Job[]

      return { data: jobs, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to fetch available jobs')
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Approve a pending featured listing request
   * Sets status to 'approved' and starts the 30-day period from now
   */
  const approveFeaturedListing = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      logger.info({ id }, 'Approving featured listing request')

      // TODO: Implement via API
      logger.warn('Featured listing approval not yet implemented')
      return { success: false, error: 'Not yet implemented' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to approve featured listing')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Reject a pending featured listing request
   */
  const rejectFeaturedListing = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      logger.info({ id }, 'Rejecting featured listing request')

      // TODO: Implement via API
      logger.warn('Featured listing rejection not yet implemented')
      return { success: false, error: 'Not yet implemented' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to reject featured listing')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Fetch pending featured listing requests
   */
  const fetchPendingRequests = async (): Promise<{
    data: FeaturedListingWithJob[] | null
    error: string | null
  }> => {
    try {
      logger.info('Fetching pending featured requests')

      // TODO: Implement via API
      return { data: [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to fetch pending requests')
      return { data: null, error: errorMessage }
    }
  }

  return {
    getStatus,
    fetchAllFeaturedListings,
    addFeaturedListing,
    updateFeaturedListing,
    removeFeaturedListing,
    fetchAvailableJobs,
    approveFeaturedListing,
    rejectFeaturedListing,
    fetchPendingRequests,
  }
}
