/**
 * @file User preferences composable
 * @usage import { useUserPreferences } from '@/composables/useUserPreferences'
 * @description Manages user preferences and favorite jobs using localStorage
 *              and API endpoints for job data fetching. No authentication required.
 * @dependencies API-backed (libSQL/Drizzle)
 */

import type { UserPreferences } from '@/app/types/app.types'

// localStorage keys
const STORAGE_KEY_FAVORITES = 'mc_saved_jobs'
const STORAGE_KEY_PREFERENCES = 'mc_user_preferences'

// Default preferences
const defaultPreferences: UserPreferences = {
  user_id: 'local',
  primary_mos_codes: [],
  branch: null,
  clearance_level: null,
  preferred_regions: [],
  preferred_theaters: [],
  oconus_preference: null
}

export const useUserPreferences = () => {
  const logger = useLogger('useUserPreferences')

  // Use VueUse's useLocalStorage for reactive localStorage
  const favoriteJobIds = useLocalStorage<string[]>(STORAGE_KEY_FAVORITES, [])
  const preferences = useLocalStorage<UserPreferences>(STORAGE_KEY_PREFERENCES, defaultPreferences)
  
  // Loading state (kept for API compatibility, but localStorage is synchronous)
  const loading = ref(false)

  /**
   * Load user preferences from localStorage
   * Called for API compatibility - data is already loaded via useLocalStorage
   */
  const loadPreferences = async () => {
    logger.debug('Preferences loaded from localStorage')
    return preferences.value
  }

  /**
   * Load user favorites from localStorage
   * Called for API compatibility - data is already loaded via useLocalStorage
   */
  const loadFavorites = async () => {
    logger.debug({ count: favoriteJobIds.value.length }, 'Favorites loaded from localStorage')
    return favoriteJobIds.value
  }

  /**
   * Save user preferences to localStorage
   */
  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    logger.info({ preferences: newPreferences }, 'Saving preferences to localStorage')

    try {
      preferences.value = {
        ...preferences.value,
        ...newPreferences,
        user_id: 'local'
      }
      
      logger.info('Preferences saved successfully')
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to save preferences')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Add job to favorites
   */
  const addFavorite = async (jobId: string) => {
    logger.info({ jobId }, 'Adding favorite')

    try {
      if (!favoriteJobIds.value.includes(jobId)) {
        favoriteJobIds.value = [...favoriteJobIds.value, jobId]
        logger.info({ jobId, count: favoriteJobIds.value.length }, 'Favorite added')
      }
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to add favorite')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Remove job from favorites
   */
  const removeFavorite = async (jobId: string) => {
    logger.info({ jobId }, 'Removing favorite')

    try {
      favoriteJobIds.value = favoriteJobIds.value.filter(id => id !== jobId)
      logger.info({ jobId, count: favoriteJobIds.value.length }, 'Favorite removed')
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Failed to remove favorite')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Toggle job favorite status
   */
  const toggleFavorite = async (jobId: string) => {
    if (isFavorite(jobId)) {
      return removeFavorite(jobId)
    } else {
      return addFavorite(jobId)
    }
  }

  /**
   * Check if job is favorited
   */
  const isFavorite = (jobId: string): boolean => {
    return favoriteJobIds.value.includes(jobId)
  }

  /**
   * Get favorite job IDs
   */
  const getFavoriteJobIds = (): string[] => {
    return favoriteJobIds.value
  }

  /**
   * Get favorite jobs with full job data
   * Fetches job details from API for the saved job IDs
   */
  const getFavoriteJobs = async () => {
    if (favoriteJobIds.value.length === 0) {
      return []
    }

    try {
      // Fetch each job by ID from the API
      const jobPromises = favoriteJobIds.value.map(async (id) => {
        try {
          const job = await $fetch(`/api/jobs/${id}`)
          return job
        } catch {
          // Job may have been deleted
          logger.warn({ jobId: id }, 'Favorite job not found')
          return null
        }
      })

      const jobs = await Promise.all(jobPromises)
      return jobs.filter(Boolean)
    } catch (error) {
      logger.warn({ error }, 'Unexpected error fetching favorite jobs')
      return []
    }
  }

  /**
   * Clear all favorites
   */
  const clearFavorites = () => {
    favoriteJobIds.value = []
    logger.info('All favorites cleared')
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  const clearPreferences = () => {
    preferences.value = { ...defaultPreferences }
    logger.info('Preferences reset to defaults')
  }

  /**
   * Get count of favorites
   */
  const favoritesCount = computed(() => favoriteJobIds.value.length)

  return {
    // State
    preferences,
    favoriteJobIds,
    loading,
    favoritesCount,
    // Load (for API compatibility)
    loadPreferences,
    loadFavorites,
    // Preferences
    savePreferences,
    clearPreferences,
    // Favorites
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteJobIds,
    getFavoriteJobs,
    clearFavorites
  }
}
