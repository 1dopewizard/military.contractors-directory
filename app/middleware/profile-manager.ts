/**
 * @file Profile manager middleware
 * @description Ensures only users with company access can reach profile manager routes
 * @usage Use with auth middleware: middleware: ['auth', 'profile-manager']
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - auth check deferred to client
  if (import.meta.server) {
    return;
  }

  const { isAuthenticated, isAuthReady, userId } = useAuth();
  const logger = useLogger("ProfileManagerMiddleware");

  // Wait for auth to be ready
  if (!isAuthReady.value) {
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isAuthReady.value) {
        break;
      }
    }
  }

  // Auth middleware runs first, so user should be available on client
  if (!isAuthenticated.value) {
    logger.warn(
      { path: to.path },
      "Unauthorized profile manager access attempt - not authenticated",
    );
    return navigateTo(
      "/auth/login?redirect=" + encodeURIComponent(to.fullPath),
    );
  }

  // Check if user has contractor access (has a claimed profile)
  try {
    const data = await $fetch("/api/profile-manager/profile", {
      headers: useRequestHeaders(["cookie"]),
    });

    if (!data) {
      // User doesn't have a claimed profile, redirect to claim flow
      if (to.path !== "/profile-manager/claim") {
        logger.info(
          { userId: userId.value },
          "User has no claimed profile, redirecting to claim flow",
        );
        return navigateTo("/profile-manager/claim");
      }
    }
  } catch (error) {
    // If checking fails, allow access to claim page
    if (to.path !== "/profile-manager/claim") {
      return navigateTo("/profile-manager/claim");
    }
  }

  logger.info(
    { userId: userId.value, path: to.path },
    "Profile manager access granted",
  );
});
