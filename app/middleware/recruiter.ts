/**
 * @file Recruiter middleware
 * @description Ensures only recruiter or admin users can access recruiter routes
 * @usage Use with auth middleware: middleware: ['auth', 'recruiter']
 *
 * Access is controlled via:
 * 1. Admin whitelist (hardcoded - admins have full access including recruiter)
 * 2. recruiterAccess table in database (managed via admin dashboard)
 */

import { isAdminEmail } from "@/app/config/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - auth check deferred to client
  if (import.meta.server) {
    return;
  }

  const { isAuthenticated, isAuthReady, userEmail } = useAuth();
  const logger = useLogger("RecruiterMiddleware");

  // Wait for auth to be ready
  if (!isAuthReady.value) {
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isAuthReady.value) {
        break;
      }
    }
  }

  if (!isAuthenticated.value || !userEmail.value) {
    logger.warn(
      { path: to.path },
      "Unauthorized recruiter access attempt - not authenticated",
    );
    return navigateTo("/");
  }

  const email = userEmail.value;

  // Check if user is admin (admins have full access)
  if (isAdminEmail(email)) {
    logger.info(
      { email, path: to.path, role: "admin" },
      "Recruiter access granted (admin)",
    );
    return;
  }

  // Check recruiterAccess table via API for non-admin users
  try {
    const result = await $fetch<{ hasAccess: boolean }>(
      "/api/admin/recruiters/check-access",
      {
        method: "GET",
        query: { email: email.toLowerCase() },
      },
    );

    if (result.hasAccess) {
      logger.info(
        { email, path: to.path, role: "recruiter" },
        "Recruiter access granted",
      );
      return;
    }
  } catch {
    // Query failed or no result - deny access
  }

  logger.warn(
    { email, path: to.path },
    "Unauthorized recruiter access attempt",
  );
  return navigateTo("/");
});
