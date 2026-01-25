/**
 * @file Admin candidates list endpoint
 * @route GET /api/admin/candidates
 * @description List/search candidates from job alert subscriptions (admin or recruiter) (Drizzle-backed)
 */

import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq, like, or, sql, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const query = getQuery(event)

  const search = query.search as string | undefined
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit

  const db = getDb()

  try {
    // Build conditions
    const conditions = [eq(schema.jobAlertSubscription.isActive, true)]
    
    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(schema.jobAlertSubscription.email, searchPattern),
          sql`json_extract(${schema.jobAlertSubscription.mosCodes}, '$') LIKE ${searchPattern}`
        )!
      )
    }

    // Get candidates
    const candidates = await db
      .select()
      .from(schema.jobAlertSubscription)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.jobAlertSubscription)
      .where(and(...conditions))

    // Transform to expected format
    const items = candidates.map((c) => ({
      id: c.id,
      email: c.email,
      mos_codes: c.mosCodes,
      frequency: c.frequency,
      keywords: c.keywords,
      locations: c.locations,
      clearance_levels: c.clearanceLevels,
      is_active: c.isActive,
      created_at: c.createdAt?.toISOString() ?? null,
      updated_at: c.updatedAt?.toISOString() ?? null,
    }))

    return {
      candidates: items,
      total: countResult?.count ?? 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Failed to fetch candidates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch candidates'
    })
  }
})
