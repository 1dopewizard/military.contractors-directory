/**
 * @file Analytics composable
 * @usage import { useAnalytics } from '@/composables/useAnalytics'
 * @description Track user interactions for future B2B analytics.
 *              Uses Better Auth for user identity and API endpoints for storage.
 */

export const useAnalytics = () => {
  const logger = useLogger("useAnalytics");
  const { userId } = useAuth();

  // Session ID for anonymous tracking
  const sessionId = ref<string>("");

  // Initialize session ID
  onMounted(() => {
    if (import.meta.client) {
      sessionId.value =
        sessionStorage.getItem("analytics_session_id") || generateSessionId();
      sessionStorage.setItem("analytics_session_id", sessionId.value);
    }
  });

  /**
   * Generate a unique session ID
   */
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track an event (placeholder for future implementation)
   */
  const trackEvent = async (
    eventType: string,
    metadata: Record<string, any> = {},
  ) => {
    // For now, just log the event
    // In production, this would write to an analytics API endpoint
    logger.info(
      {
        eventType,
        metadata,
        userId: userId.value || null,
        sessionId: sessionId.value,
      },
      "Analytics event tracked",
    );

    // TODO: Implement analytics API endpoint when persistence is needed
    // await $fetch('/api/analytics/track', { method: 'POST', body: { eventType, metadata } })
  };

  const trackExplorerQuery = (query: string, cacheId?: string) => {
    trackEvent("explorer_query", {
      query,
      cacheId,
      timestamp: new Date().toISOString(),
    });
  };

  const trackIntelligencePageView = (path: string) => {
    trackEvent("intelligence_page_view", {
      path,
      timestamp: new Date().toISOString(),
    });
  };

  const trackFilterChange = (filters: Record<string, any>) => {
    trackEvent("intelligence_filter_change", {
      filters,
      timestamp: new Date().toISOString(),
    });
  };

  const trackSourceClick = (url: string, label?: string) => {
    trackEvent("source_click", {
      url,
      label,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Track account created
   */
  const trackAccountCreated = () => {
    trackEvent("account_created", {
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Track profile updated
   */
  const trackProfileUpdated = (fields: string[]) => {
    trackEvent("profile_updated", {
      fields,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    trackEvent,
    trackExplorerQuery,
    trackIntelligencePageView,
    trackFilterChange,
    trackSourceClick,
    trackAccountCreated,
    trackProfileUpdated,
  };
};
