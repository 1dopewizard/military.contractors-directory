/**
 * @file Composable for fetching scraped jobs from crawl4ai_test table
 * @usage import { useScrapedJobs } from '@/composables/useScrapedJobs'
 * @description STUBBED - Dev-only feature. Scraped jobs table not migrated to Convex.
 */

export const useScrapedJobs = () => {
  /**
   * Format salary range for display
   */
  const formatSalary = (min: number | null, max: number | null, currency = 'USD'): string => {
    if (!min && !max) return 'Not specified'
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    })
    if (min && max) return `${formatter.format(min)}–${formatter.format(max)}`
    if (min) return `${formatter.format(min)}+`
    if (max) return `Up to ${formatter.format(max)}`
    return 'Not specified'
  }

  /**
   * Format relative date
   */
  const formatRelativeDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  /**
   * Fetch scraped jobs from crawl4ai_test table
   * STUBBED: Scraped jobs table not migrated to Convex - dev feature only
   */
  const fetchScrapedJobs = async (
    _limit = 50
  ): Promise<{ data: never[]; error: string }> => {
    return { data: [], error: 'Not implemented - dev feature' }
  }

  return {
    fetchScrapedJobs,
    formatSalary,
    formatRelativeDate
  }
}
