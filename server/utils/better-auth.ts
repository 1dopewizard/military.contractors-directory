/**
 * @file Better Auth server utilities for Nuxt API routes
 * @description Server-side authentication helpers using Better Auth with local SQLite
 * 
 * This module provides authentication utilities that use the local Better Auth instance
 * and libSQL/Drizzle for role checking. All session operations happen on the same origin.
 */

import type { H3Event } from 'h3'
import { auth } from './auth'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'
import { isAdminEmail } from '@/app/config/auth'

export type UserRole = 'admin' | 'recruiter' | 'user' | 'none'

export interface AuthUser {
  id: string
  email: string
  name?: string
  isAdmin?: boolean
  role?: string
}

export interface AuthSession {
  user: AuthUser
  session: {
    id: string
    userId: string
    expiresAt: Date
  }
}

export interface RoleCheckResult {
  role: UserRole
  userId: string | null
  email: string | null
  user: AuthUser | null
}

/**
 * Get the Better Auth session from request headers
 * Uses the local auth instance for same-origin session retrieval
 */
export async function getServerSession(event: H3Event): Promise<AuthSession | null> {
  try {
    // Use the local Better Auth instance to get session
    // This avoids cross-domain cookie issues by keeping auth on the same origin
    const session = await auth.api.getSession({
      headers: event.headers,
    })
    
    if (!session) {
      return null
    }

    // Map Better Auth session to our AuthSession interface
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        isAdmin: (session.user as { isAdmin?: boolean }).isAdmin,
        role: (session.user as { role?: string }).role,
      },
      session: {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
      },
    }
  } catch (error) {
    console.error('Failed to get Better Auth session:', error)
    return null
  }
}

/**
 * Get current user from Better Auth session
 * Returns null if not authenticated
 */
export async function getServerUser(event: H3Event): Promise<AuthUser | null> {
  const session = await getServerSession(event)
  return session?.user || null
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(event: H3Event): Promise<boolean> {
  const user = await getServerUser(event)
  if (!user) return false

  // Check admin whitelist by email
  if (isAdminEmail(user.email)) return true
  
  // Check isAdmin flag from Better Auth user data
  if (user.isAdmin === true) return true
  
  // Check role field
  if (user.role === 'admin') return true
  
  return false
}

/**
 * Check if the current user is a recruiter
 */
export async function isRecruiter(event: H3Event): Promise<boolean> {
  const user = await getServerUser(event)
  if (!user?.email) return false

  // Admins have all permissions including recruiter
  if (await isAdmin(event)) return true

  // Check recruiter access table in libSQL
  try {
    const access = await db.query.recruiterAccess.findFirst({
      where: eq(schema.recruiterAccess.email, user.email.toLowerCase())
    })
    return access !== null
  } catch (error) {
    console.error('Failed to check recruiter access:', error)
    return false
  }
}

/**
 * Get the user's role (admin takes precedence over recruiter)
 */
export async function getUserRole(event: H3Event): Promise<RoleCheckResult> {
  const user = await getServerUser(event)

  if (!user) {
    return { role: 'none', userId: null, email: null, user: null }
  }

  // Check admin first (admins have all permissions)
  if (isAdminEmail(user.email) || user.isAdmin === true || user.role === 'admin') {
    return { role: 'admin', userId: user.id, email: user.email, user }
  }

  // Check recruiter access in libSQL
  try {
    const access = await db.query.recruiterAccess.findFirst({
      where: eq(schema.recruiterAccess.email, user.email.toLowerCase())
    })
    
    if (access) {
      return { role: 'recruiter', userId: user.id, email: user.email, user }
    }
  } catch (error) {
    console.error('Failed to check recruiter access:', error)
  }

  return { role: 'user', userId: user.id, email: user.email, user }
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getServerUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  return user
}

/**
 * Require admin role - throws 403 if not admin
 */
export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  const user = await requireAuth(event)

  const isAdminUser = isAdminEmail(user.email) 
    || user.isAdmin === true 
    || user.role === 'admin'

  if (!isAdminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  return user
}

/**
 * Require admin or recruiter role - throws 403 if neither
 */
export async function requireAdminOrRecruiter(event: H3Event): Promise<{ user: AuthUser; role: UserRole }> {
  const { role, user } = await getUserRole(event)

  if (role === 'none') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (role === 'user') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin or recruiter access required'
    })
  }

  return { user: user!, role }
}
