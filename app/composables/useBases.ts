/**
 * @file Bases composable for military installation data (API-backed)
 * @usage import { useBases } from '@/composables/useBases'
 * @description Handles base data fetching and filtering via server API
 */

interface BaseWithTheater {
  id: string
  slug: string
  name: string
  country: string
  city: string | null
  description: string | null
  job_count: number | null
  theater_code: string | null
  is_active: boolean | null
  coordinates: { lat?: number; lng?: number } | null
  created_at: string | null
  updated_at: string | null
  theaters?: {
    code?: string
    name: string
    region?: string | null
  } | null
}

interface BaseDetailResponse {
  base: BaseWithTheater
  jobs: Array<{
    id: string
    title: string
    company: string
    location: string
    clearance_required?: string | null
    salary_min?: number | null
    salary_max?: number | null
    snippet?: string | null
    slug?: string | null
    posted_at?: string | null
  }>
  totalJobs: number
  topEmployers: Array<{ company: string; count: number }>
}

export const useBases = () => {
  const logger = useLogger('useBases')

  const bases = ref<BaseWithTheater[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all bases, optionally filtered by theater or country
   */
  const fetchBases = async (options?: {
    theater?: string
    country?: string
  }): Promise<BaseWithTheater[]> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ bases: BaseWithTheater[] }>('/api/bases', {
        query: {
          theater: options?.theater,
          country: options?.country,
        }
      })

      const transformedBases = response.bases || []
      bases.value = transformedBases
      logger.info({ count: transformedBases.length, ...options }, 'Bases fetched')
      return transformedBases
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bases'
      error.value = message
      logger.error({ error: message }, 'Failed to fetch bases')
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single base with jobs
   */
  const fetchBase = async (
    slug: string,
    options?: { limit?: number; offset?: number }
  ): Promise<BaseDetailResponse | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<BaseDetailResponse>(`/api/bases/${slug.toLowerCase()}`, {
        query: {
          limit: options?.limit,
          offset: options?.offset,
        }
      })

      if (!data) {
        logger.warn({ slug }, 'Base not found')
        return null
      }

      logger.info({ slug, jobCount: data.totalJobs }, 'Base detail fetched')
      return data
    } catch (err) {
      const fetchError = err as { statusCode?: number }
      if (fetchError?.statusCode === 404) {
        logger.warn({ slug }, 'Base not found')
        return null
      }
      
      const message = err instanceof Error ? err.message : 'Failed to fetch base'
      error.value = message
      logger.error({ error: message, slug }, 'Failed to fetch base')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Get bases grouped by country for a theater
   */
  const getBasesByCountry = (theaterCode?: string): Map<string, BaseWithTheater[]> => {
    const filtered = theaterCode
      ? bases.value.filter((b) => b.theater_code === theaterCode)
      : bases.value

    const grouped = new Map<string, BaseWithTheater[]>()
    for (const base of filtered) {
      const country = base.country
      if (!grouped.has(country)) {
        grouped.set(country, [])
      }
      grouped.get(country)!.push(base)
    }
    return grouped
  }

  /**
   * Get unique countries from bases
   */
  const getCountries = (theaterCode?: string): string[] => {
    const filtered = theaterCode
      ? bases.value.filter((b) => b.theater_code === theaterCode)
      : bases.value

    return [...new Set(filtered.map((b) => b.country))].sort()
  }

  return {
    bases,
    loading,
    error,
    fetchBases,
    fetchBase,
    getBasesByCountry,
    getCountries,
  }
}
