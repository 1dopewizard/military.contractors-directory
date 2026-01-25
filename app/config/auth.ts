/**
 * @file Auth configuration for military.contractors
 * @description Centralized authentication and authorization settings
 */

// ============================================================================
// Admin Configuration
// ============================================================================

/**
 * Admin email whitelist
 * Users with these emails have full admin access to the platform.
 * 
 * TODO: Consider moving to environment variables or database-driven
 * admin management for production deployments.
 */
export const ADMIN_EMAILS = ['1dopewizard@gmail.com'] as const

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number])
}

// ============================================================================
// Role Configuration
// ============================================================================

/**
 * Available user roles in the system
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  USER: 'user',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
