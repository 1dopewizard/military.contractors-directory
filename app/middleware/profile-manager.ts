/**
 * @file Employer middleware
 * @description Ensures only users with employer access can reach employer routes
 * @usage Use with auth middleware: middleware: ['auth', 'employer']
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - auth check deferred to client
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, isAuthReady, userId } = useAuth()
  const logger = useLogger('EmployerMiddleware')

  // Wait for auth to be ready
  if (!isAuthReady.value) {
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      if (isAuthReady.value) {
        break
      }
    }
  }

  // Auth middleware runs first, so user should be available on client
  if (!isAuthenticated.value) {
    logger.warn({ path: to.path }, 'Unauthorized employer access attempt - not authenticated')
    return navigateTo('/auth/login?redirect=' + encodeURIComponent(to.fullPath))
  }

  // Check if user has employer access (has a claimed profile)
  try {
    const { data } = await useFetch('/api/profile-manager/profile', {
      headers: useRequestHeaders(['cookie']),
    })

    if (!data.value) {
      // User doesn't have a claimed profile, redirect to claim flow
      if (to.path !== '/employer/claim') {
        logger.info({ userId: userId.value }, 'User has no claimed profile, redirecting to claim flow')
        return navigateTo('/employer/claim')
      }
    }
  } catch (error) {
    // If checking fails, allow access to claim page
    if (to.path !== '/employer/claim') {
      return navigateTo('/employer/claim')
    }
  }

  logger.info({ userId: userId.value, path: to.path }, 'Employer access granted')
})
