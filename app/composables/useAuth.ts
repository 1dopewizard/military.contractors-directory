/**
 * @file Authentication composable for handling user login/logout
 * @usage import { useAuth } from '@/composables/useAuth'
 * @description Handles all authentication-related operations including
 *              magic link login, logout, and session management
 * @dependencies better-auth
 */

import { authClient } from '@/app/lib/auth-client'

export const useAuth = () => {
  const logger = useLogger('useAuth')

  /**
   * Session state from Better Auth
   */
  const sessionRef = authClient.useSession()

  // Unwrap session for reactive access
  const sessionData = computed(() => (sessionRef as any).value?.data ?? (sessionRef as any).data)
  const sessionPending = computed(() => (sessionRef as any).value?.isPending ?? (sessionRef as any).isPending ?? false)

  /**
   * Track if auth state has been resolved on client
   * AuthButton uses ClientOnly, so this is only relevant client-side
   */
  const isAuthReady = ref(false)

  // On client, mark auth as ready once session is loaded
  if (import.meta.client) {
    watch(
      () => sessionPending.value,
      (isPending) => {
        if (!isPending) {
          isAuthReady.value = true
        }
      },
      { immediate: true }
    )
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!sessionData.value?.user)

  /**
   * Get the current user
   */
  const user = computed(() => sessionData.value?.user || null)

  /**
   * Get user email
   */
  const userEmail = computed(() => sessionData.value?.user?.email || null)

  /**
   * Get user ID
   */
  const userId = computed(() => sessionData.value?.user?.id || null)

  /**
   * Sign in with magic link
   * @param email - User's email address
   * @param name - Optional user display name (for new users)
   * @returns Promise with success/error status
   */
  const signInWithMagicLink = async (email: string, name?: string) => {
    try {
      logger.info({ email }, 'Initiating magic link sign in')

      const { data, error } = await authClient.signIn.magicLink({
        email,
        name,
        callbackURL: '/auth/callback',
        newUserCallbackURL: '/auth/callback',
        errorCallbackURL: '/auth/login?error=auth_failed',
      })

      if (error) {
        logger.error({ error: error.message }, 'Magic link sign in failed')
        return { success: false, error: error.message }
      }

      logger.info({ email }, 'Magic link sent successfully')
      return { success: true, error: null, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Unexpected error during sign in')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      logger.info({ userId: userId.value }, 'Signing out user')

      await authClient.signOut()

      logger.info('User signed out successfully')
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ error: errorMessage }, 'Unexpected error during sign out')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get current session
   */
  const getSession = async () => {
    const { data, error } = await authClient.getSession()
    if (error) {
      logger.error({ error: error.message }, 'Failed to get session')
      return null
    }
    return data
  }

  /**
   * Refresh the session
   */
  const refreshSession = async () => {
    const refreshFn = (sessionRef as any).value?.refresh ?? (sessionRef as any).refresh
    if (refreshFn) await refreshFn()
  }

  return {
    // Session state
    session: sessionData,
    user,
    isAuthenticated,
    isAuthReady,
    userEmail,
    userId,
    // Auth methods
    signInWithMagicLink,
    signOut,
    getSession,
    refreshSession,
    // Better Auth client for advanced use
    authClient,
  }
}
