/**
 * @file Admin Activity Log Composable
 * @description Provides functions for logging and fetching admin activity
 */

interface ActivityLogEntry {
  id: string
  admin_id: string
  admin_email?: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

interface LogActivityInput {
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
}

export const useAdminActivity = () => {
  const logger = useLogger('useAdminActivity')

  /**
   * Log an admin action
   */
  const logActivity = async (input: LogActivityInput): Promise<{ success: boolean; error: string | null }> => {
    try {
      const response = await $fetch<{ success: boolean; error: string | null }>('/api/admin/activity', {
        method: 'POST',
        body: input
      })
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to log activity')
      // Don't fail the main operation if logging fails
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Fetch recent activity log
   */
  const fetchActivityLog = async (limit = 20): Promise<{ data: ActivityLogEntry[]; error: string | null }> => {
    try {
      const response = await $fetch<{ data: ActivityLogEntry[]; error: string | null }>('/api/admin/activity', {
        query: { limit }
      })
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to fetch activity log')
      return { data: [], error: errorMessage }
    }
  }

  /**
   * Helper to format action for display
   */
  const formatAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      'pin': 'Pinned',
      'unpin': 'Unpinned',
      'approve': 'Approved',
      'reject': 'Rejected',
      'create': 'Created',
      'delete': 'Deleted',
      'update': 'Updated',
      'extend': 'Extended'
    }
    return actionMap[action] || action
  }

  /**
   * Helper to format entity type for display
   */
  const formatEntityType = (entityType: string): string => {
    const typeMap: Record<string, string> = {
      'featured_listing': 'Featured Listing',
      'job': 'Job',
      'user': 'User',
      'campaign': 'Campaign'
    }
    return typeMap[entityType] || entityType
  }

  /**
   * Helper to get time ago string
   */
  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  return {
    logActivity,
    fetchActivityLog,
    formatAction,
    formatEntityType,
    getTimeAgo
  }
}

