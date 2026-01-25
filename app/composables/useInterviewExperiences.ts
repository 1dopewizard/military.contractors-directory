/**
 * @file Interview Experiences composable for Community Intel Platform
 * @description Handles interview experience operations including fetching,
 *              submitting, and helpful voting
 * @usage import { useInterviewExperiences } from '@/composables/useInterviewExperiences'
 * @dependencies API-backed (libSQL/Drizzle)
 */

import type {
  InterviewExperienceFilters,
  InterviewExperienceInput,
  EnrichedInterviewExperience,
  InterviewExperiencesWithAccessResult,
  UseInterviewExperiencesReturn,
} from '@/app/types/community.types'

export function useInterviewExperiences(): UseInterviewExperiencesReturn & {
  fetchInterviewsWithAccess: (
    filters?: InterviewExperienceFilters
  ) => Promise<InterviewExperiencesWithAccessResult>
} {
  const logger = useLogger('useInterviewExperiences')
  const { userId } = useAuth()

  /**
   * Fetch interview experiences with access control
   * Returns masked data for anonymous/limited users without remaining views
   * @param filters - Optional filters for company, MOS, difficulty, outcome, etc.
   * @returns Paginated list with access level info
   */
  const fetchInterviewsWithAccess = async (
    filters: InterviewExperienceFilters = {}
  ): Promise<InterviewExperiencesWithAccessResult> => {
    logger.debug({ filters, hasUser: !!userId.value }, 'Fetching interviews with access control')

    try {
      const response = await $fetch<{
        experiences: EnrichedInterviewExperience[]
        total: number
      }>('/api/community/interviews', {
        query: {
          companyId: filters.companyId,
          mosCode: filters.mosCode,
          difficulty: filters.difficulty,
          outcome: filters.outcome,
          limit: filters.limit,
          offset: filters.offset,
          sort: filters.sort,
        }
      })

      logger.info(
        {
          count: response.experiences.length,
          total: response.total,
        },
        'Interview experiences fetched with access control'
      )

      // Determine access level based on authentication
      const accessLevel = userId.value ? 'full' : 'anonymous'

      return {
        experiences: response.experiences,
        total: response.total,
        aggregates: null,
        accessLevel,
        requiresAuth: !userId.value,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, filters }, 'Failed to fetch interviews with access')
      return {
        experiences: [],
        total: 0,
        aggregates: null,
        accessLevel: 'anonymous',
        requiresAuth: true,
      }
    }
  }

  /**
   * Fetch interview experiences with filters and pagination
   * @param filters - Optional filters for company, MOS, difficulty, outcome, etc.
   * @returns Paginated list of interview experiences with total count
   */
  const fetchInterviews = async (
    filters: InterviewExperienceFilters = {}
  ): Promise<{ experiences: EnrichedInterviewExperience[]; total: number }> => {
    logger.debug({ filters }, 'Fetching interview experiences')

    try {
      const response = await $fetch<{
        experiences: EnrichedInterviewExperience[]
        total: number
      }>('/api/community/interviews', {
        query: {
          companyId: filters.companyId,
          mosCode: filters.mosCode,
          difficulty: filters.difficulty,
          outcome: filters.outcome,
          verificationStatus: filters.verificationStatus,
          limit: filters.limit,
          offset: filters.offset,
          sort: filters.sort,
        }
      })

      logger.info(
        { count: response.experiences.length, total: response.total },
        'Interview experiences fetched'
      )
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        { error: message, filters },
        'Failed to fetch interview experiences'
      )
      return { experiences: [], total: 0 }
    }
  }

  /**
   * Get a single interview experience by ID
   * @param id - Interview experience ID
   * @returns Enriched interview experience or null if not found
   */
  const getInterviewById = async (
    id: string
  ): Promise<EnrichedInterviewExperience | null> => {
    logger.debug({ id }, 'Fetching interview experience by ID')

    try {
      const result = await $fetch<EnrichedInterviewExperience>(`/api/community/interviews/${id}`)

      if (!result) {
        logger.warn({ id }, 'Interview experience not found')
        return null
      }

      logger.debug({ id }, 'Interview experience fetched')
      return result
    } catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 404) {
        logger.warn({ id }, 'Interview experience not found')
        return null
      }
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, id }, 'Failed to fetch interview experience')
      return null
    }
  }

  /**
   * Submit a new interview experience
   * @param input - Interview experience data
   * @returns Success status with created ID or error message
   */
  const submitInterview = async (
    input: InterviewExperienceInput
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    logger.info(
      { companyId: input.companyId, roleTitle: input.roleTitle },
      'Submitting interview experience'
    )

    try {
      const response = await $fetch<{ success: boolean; id: string }>('/api/community/interviews', {
        method: 'POST',
        body: input,
      })

      logger.info({ id: response.id }, 'Interview experience submitted successfully')
      return { success: true, id: response.id }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        { error: message, input },
        'Failed to submit interview experience'
      )
      return { success: false, error: message }
    }
  }

  /**
   * Vote an interview experience as helpful
   * Requires authenticated user
   * @param experienceId - Interview experience ID to vote on
   * @returns Success status or error message
   */
  const voteHelpful = async (
    experienceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId.value) {
      logger.warn({ experienceId }, 'Cannot vote: user not authenticated')
      return { success: false, error: 'Authentication required' }
    }

    logger.debug(
      { experienceId, userId: userId.value },
      'Voting interview experience helpful'
    )

    try {
      const response = await $fetch<{ success: boolean; error?: string }>('/api/community/vote', {
        method: 'POST',
        body: {
          userId: userId.value,
          targetType: 'interview',
          targetId: experienceId,
          action: 'add',
        },
      })

      if (response.success) {
        logger.info({ experienceId }, 'Interview experience voted helpful')
        return { success: true }
      }

      return { success: false, error: response.error || 'Failed to vote' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        { error: message, experienceId },
        'Failed to vote on interview experience'
      )
      return { success: false, error: message }
    }
  }

  /**
   * Remove a helpful vote from an interview experience
   * Requires authenticated user
   * @param experienceId - Interview experience ID to remove vote from
   * @returns Success status or error message
   */
  const removeVote = async (
    experienceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId.value) {
      logger.warn({ experienceId }, 'Cannot remove vote: user not authenticated')
      return { success: false, error: 'Authentication required' }
    }

    logger.debug(
      { experienceId, userId: userId.value },
      'Removing interview experience vote'
    )

    try {
      const response = await $fetch<{ success: boolean; error?: string }>('/api/community/vote', {
        method: 'POST',
        body: {
          userId: userId.value,
          targetType: 'interview',
          targetId: experienceId,
          action: 'remove',
        },
      })

      if (response.success) {
        logger.info({ experienceId }, 'Interview experience vote removed')
        return { success: true }
      }

      return { success: false, error: response.error || 'Failed to remove vote' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, experienceId }, 'Failed to remove vote')
      return { success: false, error: message }
    }
  }

  /**
   * Check if current user has voted on an interview experience
   * @param experienceId - Interview experience ID to check
   * @returns True if user has voted, false otherwise
   */
  const hasVoted = async (experienceId: string): Promise<boolean> => {
    if (!userId.value) {
      return false
    }

    if (!experienceId) {
      logger.warn({ experienceId }, 'Cannot check vote status: missing experienceId')
      return false
    }

    try {
      const response = await $fetch<{ hasVoted: boolean }>('/api/community/has-voted', {
        query: {
          userId: userId.value,
          targetType: 'interview',
          targetId: experienceId,
        },
      })

      return response.hasVoted
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, experienceId }, 'Failed to check vote status')
      return false
    }
  }

  return {
    fetchInterviews,
    fetchInterviewsWithAccess,
    getInterviewById,
    submitInterview,
    voteHelpful,
    removeVote,
    hasVoted,
  }
}
