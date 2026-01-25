/**
 * Better Auth Client Configuration
 *
 * Client-side auth client for Nuxt with magic link support.
 * Auth routes are served by the Nuxt server on the same origin,
 * eliminating cross-domain cookie issues.
 *
 * @see https://www.better-auth.com/docs/introduction
 */
import { createAuthClient } from 'better-auth/vue'
import { magicLinkClient } from 'better-auth/client/plugins'

/**
 * Better Auth client instance.
 *
 * Features:
 * - Magic link authentication (passwordless)
 * - Same-origin auth routes (no cross-domain issues)
 * - Session management via secure cookies
 * 
 * Note: baseURL must be a full URL for SSR context.
 * Using localhost:3000 as base since this runs on the same origin.
 */
export const authClient = createAuthClient({
  // Full URL for SSR compatibility - relative URLs don't work in SSR
  baseURL: 'http://localhost:3000/api/auth',
  plugins: [
    // Magic link client plugin for passwordless auth
    magicLinkClient(),
  ],
})

// Export typed auth client methods
export const {
  signIn,
  signOut,
  useSession,
  getSession,
} = authClient

// Type exports for use elsewhere
export type AuthClient = typeof authClient
