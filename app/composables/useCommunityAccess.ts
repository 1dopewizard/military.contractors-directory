/**
 * @file Community Access Control composable
 * @description Handles user access levels, contributor status, and view tracking
 *              for the Community Intel Platform
 * @usage import { useCommunityAccess } from '@/composables/useCommunityAccess'
 * @dependencies API-backed (libSQL/Drizzle)
 * 
 * Access Levels:
 * - anonymous: Not logged in, aggregates only
 * - limited: Logged in non-contributor, 10 full report views/month
 * - full: Contributor (1+ submissions) or admin, unlimited access
 */

import type {
  AccessCheckResult,
  CommunityAccessLevel,
  ContributorStatusDetails,
  RecordViewResult,
  TopContributor,
} from '@/app/types/community.types'

/** Monthly view limit for non-contributors */
export const MONTHLY_VIEW_LIMIT = 10

export interface UseCommunityAccessReturn {
  /** User's current access level */
  accessLevel: Ref<CommunityAccessLevel>
  /** Remaining views this month (null if unlimited) */
  viewsRemaining: Ref<number | null>
  /** Whether user can view full reports */
  canViewFullReports: Ref<boolean>
  /** Whether user is a contributor */
  isContributor: Ref<boolean>
  /** Refresh access status from server */
  refreshAccessStatus: () => Promise<AccessCheckResult>
  /** Record a report view (for non-contributors) */
  recordView: () => Promise<RecordViewResult>
  /** Get detailed contributor status */
  getContributorStatus: () => Promise<ContributorStatusDetails | null>
  /** Get top contributors for leaderboard */
  getTopContributors: (limit?: number) => Promise<TopContributor[]>
  /** Check if user should see upgrade prompt */
  shouldShowUpgradePrompt: Ref<boolean>
}

export function useCommunityAccess(): UseCommunityAccessReturn {
  const logger = useLogger('useCommunityAccess')
  const { isAuthenticated, isAuthReady, userId } = useAuth()

  // Reactive state
  const accessLevel = ref<CommunityAccessLevel>('anonymous')
  const viewsRemaining = ref<number | null>(null)
  const isContributor = ref(false)

  // Computed properties
  const canViewFullReports = computed(() => {
    if (accessLevel.value === 'full') return true
    if (accessLevel.value === 'limited' && viewsRemaining.value !== null && viewsRemaining.value > 0) return true
    return false
  })

  const shouldShowUpgradePrompt = computed(() => {
    // Show prompt for limited users with low remaining views
    if (accessLevel.value === 'limited' && viewsRemaining.value !== null) {
      return viewsRemaining.value <= 3
    }
    // Show prompt for anonymous users
    return accessLevel.value === 'anonymous'
  })

  /**
   * Refresh access status from server
   */
  const refreshAccessStatus = async (): Promise<AccessCheckResult> => {
    logger.debug('Refreshing access status')

    try {
      // Determine access level based on authentication
      if (!isAuthenticated.value || !userId.value) {
        accessLevel.value = 'anonymous'
        viewsRemaining.value = null
        isContributor.value = false
        
        return {
          level: 'anonymous',
          canViewFullReports: false,
        }
      }

      // For authenticated users, check if they're a contributor
      // TODO: Add API endpoint for contributor status check
      // For now, grant full access to all authenticated users
      accessLevel.value = 'full'
      viewsRemaining.value = null
      isContributor.value = true

      logger.info(
        {
          level: accessLevel.value,
          viewsRemaining: viewsRemaining.value,
          canViewFull: canViewFullReports.value,
        },
        'Access status refreshed'
      )

      return {
        level: accessLevel.value,
        canViewFullReports: canViewFullReports.value,
        viewsRemaining: viewsRemaining.value ?? undefined,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to refresh access status')
      
      // Default to anonymous on error
      accessLevel.value = 'anonymous'
      viewsRemaining.value = null
      isContributor.value = false
      
      return {
        level: 'anonymous',
        canViewFullReports: false,
      }
    }
  }

  /**
   * Record a report view (for non-contributors)
   * Call this when user views full report details
   */
  const recordView = async (): Promise<RecordViewResult> => {
    if (!userId.value) {
      logger.warn('Cannot record view: user not logged in')
      return { allowed: false, viewsRemaining: 0 }
    }

    // Contributors and admins don't need to record views
    if (accessLevel.value === 'full') {
      return { allowed: true, viewsRemaining: -1 }
    }

    // TODO: Implement view tracking via API
    // For now, just allow the view
    logger.debug('View recorded (no-op)')
    return { allowed: true, viewsRemaining: viewsRemaining.value ?? -1 }
  }

  /**
   * Get detailed contributor status for the current user
   */
  const getContributorStatus = async (): Promise<ContributorStatusDetails | null> => {
    if (!userId.value) {
      logger.debug('No user ID for contributor status check')
      return null
    }

    try {
      // TODO: Add API endpoint for contributor status
      // For now, return a default status
      const status: ContributorStatusDetails = {
        status: isContributor.value ? 'contributor' : 'non_contributor',
        contributionCount: 0,
        salaryReportCount: 0,
        interviewExperienceCount: 0,
        helpfulVotesReceived: 0,
        lastContributionAt: null,
      }

      logger.info(
        {
          status: status.status,
          contributions: status.contributionCount,
        },
        'Contributor status fetched'
      )

      return status
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to get contributor status')
      return null
    }
  }

  /**
   * Get top contributors for leaderboard display
   */
  const getTopContributors = async (limit = 10): Promise<TopContributor[]> => {
    logger.debug({ limit }, 'Fetching top contributors')

    try {
      // TODO: Add API endpoint for top contributors
      // For now, return empty array
      logger.info({ count: 0 }, 'Top contributors fetched')
      return []
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to fetch top contributors')
      return []
    }
  }

  // Auto-refresh access status when auth changes
  watch(
    [isAuthReady, () => userId.value],
    async ([ready, uid]) => {
      if (ready) {
        if (uid) {
          await refreshAccessStatus()
        } else {
          // User logged out
          accessLevel.value = 'anonymous'
          viewsRemaining.value = null
          isContributor.value = false
        }
      }
    },
    { immediate: true }
  )

  return {
    accessLevel,
    viewsRemaining,
    canViewFullReports,
    isContributor,
    refreshAccessStatus,
    recordView,
    getContributorStatus,
    getTopContributors,
    shouldShowUpgradePrompt,
  }
}
