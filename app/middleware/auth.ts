/**
 * @file Authentication middleware
 * @description Protects routes by requiring user authentication via Better Auth
 * @usage Add `middleware: 'auth'` to page definePageMeta
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - auth check deferred to client
  // SSR will render the page, client will verify auth on hydration
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, isAuthReady } = useAuth()

  // Wait for auth to be ready (Better Auth session loaded)
  if (!isAuthReady.value) {
    // Poll for auth ready state (max 2 seconds)
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      if (isAuthReady.value) {
        break
      }
    }
  }

  // If user is authenticated, allow access
  if (isAuthenticated.value) {
    return
  }

  // If auth still not ready after waiting, give it one more check
  if (!isAuthReady.value) {
    await new Promise(resolve => setTimeout(resolve, 200))
    if (isAuthenticated.value) {
      return
    }
  }

  // No session found, redirect to login
  const loginPath = `/auth/login?redirect=${encodeURIComponent(to.fullPath)}`
  return navigateTo(loginPath, { replace: true })
})
