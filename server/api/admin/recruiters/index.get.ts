/**
 * @file Admin recruiters list endpoint
 * @route GET /api/admin/recruiters
 * @description List all recruiters with access (admin only) (Drizzle-backed)
 */

import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = getDb()

  try {
    const recruiters = await db
      .select()
      .from(schema.recruiterAccess)
      .orderBy(desc(schema.recruiterAccess.createdAt))

    // Transform to expected format
    const transformed = recruiters.map((r) => ({
      id: r.id,
      email: r.email,
      access_level: r.accessLevel,
      is_active: r.isActive,
      created_at: r.createdAt?.toISOString() ?? null,
      updated_at: r.updatedAt?.toISOString() ?? null,
    }))

    return {
      recruiters: transformed
    }
  } catch (error) {
    console.error('Failed to fetch recruiters:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recruiters'
    })
  }
})
