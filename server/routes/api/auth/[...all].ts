/**
 * @file Better Auth API Route Handler
 * @description Official Better Auth handler for Nuxt - handles all /api/auth/* routes
 *
 * Auth routes run on the same origin as the Nuxt app, eliminating CORS/cookie problems.
 * Auth routes now run on the same origin as the Nuxt app, eliminating CORS/cookie problems.
 *
 * Routes handled:
 * - POST /api/auth/sign-in/magic-link - Request magic link email
 * - GET /api/auth/sign-in/magic-link/verify - Verify magic link token
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/sign-out - Sign out and clear session
 *
 * @see https://www.better-auth.com/docs/integrations/nuxt
 */

import { auth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  return auth.handler(toWebRequest(event))
})
