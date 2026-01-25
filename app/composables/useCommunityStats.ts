/**
 * @file Community Stats composable for Community Intel Platform
 * @description Handles aggregate community statistics and recent activity feeds
 *              for homepage display and community hub
 * @usage import { useCommunityStats } from '@/composables/useCommunityStats'
 * @dependencies API-backed (libSQL/Drizzle)
 */

import type {
  CommunityStats,
  RecentActivity,
  UseCommunityStatsReturn,
} from '@/app/types/community.types'

export function useCommunityStats(): UseCommunityStatsReturn {
  const logger = useLogger('useCommunityStats')

  /**
   * Default stats returned when no data is available
   */
  const defaultStats: CommunityStats = {
    totalSalaryReports: 0,
    totalInterviewExperiences: 0,
    totalContributors: 0,
    totalHelpfulVotes: 0,
    verifiedSalaryReports: 0,
    verifiedInterviewExperiences: 0,
  }

  /**
   * Fetch aggregate community statistics
   * Returns counts of salary reports, interviews, contributors, and votes
   * @returns Community statistics object
   */
  const fetchStats = async (): Promise<CommunityStats> => {
    logger.debug('Fetching community stats')

    try {
      const stats = await $fetch<CommunityStats>('/api/community/stats')

      logger.info(
        {
          salaryReports: stats.totalSalaryReports,
          interviews: stats.totalInterviewExperiences,
          contributors: stats.totalContributors,
        },
        'Community stats fetched'
      )

      return stats
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to fetch community stats')
      return defaultStats
    }
  }

  /**
   * Fetch recent activity for homepage/community feed
   * Returns mixed salary reports and interview experiences, sorted by recency
   * @param limit - Maximum number of items to return (default: 10, max: 20)
   * @returns Array of recent activity items
   */
  const fetchRecentActivity = async (limit = 10): Promise<RecentActivity[]> => {
    logger.debug({ limit }, 'Fetching recent activity')

    try {
      const activity = await $fetch<RecentActivity[]>('/api/community/recent-activity', {
        query: { limit: Math.min(limit, 20) }
      })

      logger.info({ count: activity.length }, 'Recent activity fetched')

      return activity
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to fetch recent activity')
      return []
    }
  }

  return {
    fetchStats,
    fetchRecentActivity,
  }
}
