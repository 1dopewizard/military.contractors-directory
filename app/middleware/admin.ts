/**
 * @file Admin middleware
 * @description Ensures only admin users can access admin routes
 * @usage Use with auth middleware: middleware: ['auth', 'admin']
 */

import { isAdminEmail } from "@/app/config/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - auth check deferred to client
  if (import.meta.server) {
    return;
  }

  const { isAuthenticated, isAuthReady, userEmail } = useAuth();
  const logger = useLogger("AdminMiddleware");

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
      "Unauthorized admin access attempt - not authenticated",
    );
    return navigateTo("/");
  }

  // Check if user is admin
  if (!isAdminEmail(userEmail.value)) {
    logger.warn(
      { email: userEmail.value, path: to.path },
      "Unauthorized admin access attempt",
    );
    return navigateTo("/");
  }

  logger.info(
    { email: userEmail.value, path: to.path },
    "Admin access granted",
  );
});
