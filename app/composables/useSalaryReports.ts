/**
 * @file Salary Reports composable for Community Intel Platform
 * @description Handles salary report operations including fetching, submitting,
 *              aggregates, and helpful voting
 * @usage import { useSalaryReports } from '@/composables/useSalaryReports'
 * @dependencies API-backed (libSQL/Drizzle)
 */

import type {
  SalaryReportFilters,
  SalaryReportInput,
  SalaryAggregates,
  EnrichedSalaryReport,
  SalaryReportsWithAccessResult,
  UseSalaryReportsReturn,
} from '@/app/types/community.types'

export function useSalaryReports(): UseSalaryReportsReturn & {
  fetchSalaryReportsWithAccess: (
    filters?: SalaryReportFilters
  ) => Promise<SalaryReportsWithAccessResult>
} {
  const logger = useLogger('useSalaryReports')
  const { userId } = useAuth()

  /**
   * Fetch salary reports with access control
   * Returns masked data for anonymous/limited users without remaining views
   * @param filters - Optional filters for company, MOS, location, etc.
   * @returns Paginated list with access level info
   */
  const fetchSalaryReportsWithAccess = async (
    filters: SalaryReportFilters = {}
  ): Promise<SalaryReportsWithAccessResult> => {
    logger.debug({ filters, hasUser: !!userId.value }, 'Fetching salary reports with access control')

    try {
      const response = await $fetch<{
        reports: EnrichedSalaryReport[]
        total: number
        aggregates: SalaryAggregates | null
      }>('/api/community/salary-reports', {
        query: {
          companyId: filters.companyId,
          mosCode: filters.mosCode,
          location: filters.location,
          clearanceLevel: filters.clearanceLevel,
          limit: filters.limit,
          offset: filters.offset,
          sort: filters.sort,
        }
      })

      logger.info(
        {
          count: response.reports.length,
          total: response.total,
        },
        'Salary reports fetched with access control'
      )

      // Determine access level based on authentication
      const accessLevel = userId.value ? 'full' : 'anonymous'

      return {
        reports: response.reports,
        total: response.total,
        aggregates: response.aggregates,
        accessLevel,
        requiresAuth: !userId.value,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, filters }, 'Failed to fetch salary reports with access')
      return {
        reports: [],
        total: 0,
        aggregates: null,
        accessLevel: 'anonymous',
        requiresAuth: true,
      }
    }
  }

  /**
   * Fetch salary reports with filters and pagination
   * @param filters - Optional filters for company, MOS, location, etc.
   * @returns Paginated list of salary reports with total count
   */
  const fetchSalaryReports = async (
    filters: SalaryReportFilters = {}
  ): Promise<{ reports: EnrichedSalaryReport[]; total: number }> => {
    logger.debug({ filters }, 'Fetching salary reports')

    try {
      const response = await $fetch<{
        reports: EnrichedSalaryReport[]
        total: number
      }>('/api/community/salary-reports', {
        query: {
          companyId: filters.companyId,
          mosCode: filters.mosCode,
          location: filters.location,
          clearanceLevel: filters.clearanceLevel,
          verificationStatus: filters.verificationStatus,
          limit: filters.limit,
          offset: filters.offset,
          sort: filters.sort,
        }
      })

      logger.info(
        { count: response.reports.length, total: response.total },
        'Salary reports fetched'
      )
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, filters }, 'Failed to fetch salary reports')
      return { reports: [], total: 0 }
    }
  }

  /**
   * Fetch anonymous salary aggregates for a MOS code and/or company
   * Used to show salary ranges without exposing individual reports
   * @param mosCode - Optional MOS code filter
   * @param companyId - Optional company ID filter
   * @returns Aggregate salary statistics or null if no data
   */
  const fetchSalaryAggregates = async (
    mosCode?: string,
    companyId?: string
  ): Promise<SalaryAggregates | null> => {
    logger.debug({ mosCode, companyId }, 'Fetching salary aggregates')

    try {
      const response = await $fetch<{
        reports: EnrichedSalaryReport[]
        total: number
        aggregates: SalaryAggregates | null
      }>('/api/community/salary-reports', {
        query: {
          mosCode,
          companyId,
          limit: 1, // We only need aggregates
        }
      })

      if (!response.aggregates) {
        logger.debug({ mosCode, companyId }, 'No salary aggregates found')
        return null
      }

      logger.info(
        { mosCode, companyId, reportCount: response.aggregates.reportCount },
        'Salary aggregates fetched'
      )
      return response.aggregates
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        { error: message, mosCode, companyId },
        'Failed to fetch salary aggregates'
      )
      return null
    }
  }

  /**
   * Get a single salary report by ID
   * @param id - Salary report ID
   * @returns Enriched salary report or null if not found
   */
  const getSalaryReportById = async (
    id: string
  ): Promise<EnrichedSalaryReport | null> => {
    logger.debug({ id }, 'Fetching salary report by ID')

    try {
      const result = await $fetch<EnrichedSalaryReport>(`/api/community/salary-reports/${id}`)

      if (!result) {
        logger.warn({ id }, 'Salary report not found')
        return null
      }

      logger.debug({ id }, 'Salary report fetched')
      return result
    } catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 404) {
        logger.warn({ id }, 'Salary report not found')
        return null
      }
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, id }, 'Failed to fetch salary report')
      return null
    }
  }

  /**
   * Submit a new salary report
   * @param input - Salary report data
   * @returns Success status with created ID or error message
   */
  const submitSalaryReport = async (
    input: SalaryReportInput
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    logger.info(
      { mosCode: input.mosCode, companyId: input.companyId },
      'Submitting salary report'
    )

    try {
      const response = await $fetch<{ success: boolean; id: string }>('/api/community/salary-reports', {
        method: 'POST',
        body: input,
      })

      logger.info({ id: response.id }, 'Salary report submitted successfully')
      return { success: true, id: response.id }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, input }, 'Failed to submit salary report')
      return { success: false, error: message }
    }
  }

  /**
   * Vote a salary report as helpful
   * Requires authenticated user
   * @param reportId - Salary report ID to vote on
   * @returns Success status or error message
   */
  const voteHelpful = async (
    reportId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId.value) {
      logger.warn({ reportId }, 'Cannot vote: user not authenticated')
      return { success: false, error: 'Authentication required' }
    }

    logger.debug({ reportId, userId: userId.value }, 'Voting salary report helpful')

    try {
      const response = await $fetch<{ success: boolean; error?: string }>('/api/community/vote', {
        method: 'POST',
        body: {
          userId: userId.value,
          targetType: 'salary',
          targetId: reportId,
          action: 'add',
        },
      })

      if (response.success) {
        logger.info({ reportId }, 'Salary report voted helpful')
        return { success: true }
      }

      return { success: false, error: response.error || 'Failed to vote' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, reportId }, 'Failed to vote on salary report')
      return { success: false, error: message }
    }
  }

  /**
   * Remove a helpful vote from a salary report
   * Requires authenticated user
   * @param reportId - Salary report ID to remove vote from
   * @returns Success status or error message
   */
  const removeVote = async (
    reportId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId.value) {
      logger.warn({ reportId }, 'Cannot remove vote: user not authenticated')
      return { success: false, error: 'Authentication required' }
    }

    logger.debug({ reportId, userId: userId.value }, 'Removing salary report vote')

    try {
      const response = await $fetch<{ success: boolean; error?: string }>('/api/community/vote', {
        method: 'POST',
        body: {
          userId: userId.value,
          targetType: 'salary',
          targetId: reportId,
          action: 'remove',
        },
      })

      if (response.success) {
        logger.info({ reportId }, 'Salary report vote removed')
        return { success: true }
      }

      return { success: false, error: response.error || 'Failed to remove vote' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, reportId }, 'Failed to remove vote')
      return { success: false, error: message }
    }
  }

  /**
   * Check if current user has voted on a salary report
   * @param reportId - Salary report ID to check
   * @returns True if user has voted, false otherwise
   */
  const hasVoted = async (reportId: string): Promise<boolean> => {
    if (!userId.value) {
      return false
    }

    if (!reportId) {
      logger.warn({ reportId }, 'Cannot check vote status: missing reportId')
      return false
    }

    try {
      const response = await $fetch<{ hasVoted: boolean }>('/api/community/has-voted', {
        query: {
          userId: userId.value,
          targetType: 'salary',
          targetId: reportId,
        },
      })

      return response.hasVoted
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, reportId }, 'Failed to check vote status')
      return false
    }
  }

  return {
    fetchSalaryReports,
    fetchSalaryReportsWithAccess,
    fetchSalaryAggregates,
    getSalaryReportById,
    submitSalaryReport,
    voteHelpful,
    removeVote,
    hasVoted,
  }
}
