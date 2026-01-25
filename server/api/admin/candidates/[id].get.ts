/**
 * @file Admin candidate detail endpoint
 * @route GET /api/admin/candidates/:id
 * @description Get detailed candidate information (Drizzle-backed)
 */

import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Candidate ID is required'
    })
  }

  const db = getDb()

  try {
    // Get the subscription
    const [subscription] = await db
      .select()
      .from(schema.jobAlertSubscription)
      .where(eq(schema.jobAlertSubscription.id, id))
      .limit(1)

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidate not found'
      })
    }

    // Fetch activity history
    const activity = await db
      .select()
      .from(schema.candidateActivity)
      .where(eq(schema.candidateActivity.email, subscription.email))
      .orderBy(desc(schema.candidateActivity.createdAt))
      .limit(50)

    // Fetch placement history
    const placements = await db
      .select()
      .from(schema.placement)
      .where(eq(schema.placement.candidateEmail, subscription.email))
      .orderBy(desc(schema.placement.createdAt))
      .limit(50)

    // Transform data
    const transformedActivity = activity.map((a) => ({
      id: a.id,
      activity_type: a.activityType,
      entity_type: a.entityType,
      entity_id: a.entityId,
      metadata: a.metadata,
      created_at: a.createdAt?.toISOString() ?? null,
    }))

    const transformedPlacements = placements.map((p) => ({
      id: p.id,
      job_id: p.jobId,
      status: p.status,
      notes: p.notes,
      created_at: p.createdAt?.toISOString() ?? null,
      updated_at: p.updatedAt?.toISOString() ?? null,
    }))

    return {
      candidate: {
        id: subscription.id,
        email: subscription.email,
        mos_codes: subscription.mosCodes,
        frequency: subscription.frequency,
        keywords: subscription.keywords,
        locations: subscription.locations,
        clearance_levels: subscription.clearanceLevels,
        is_active: subscription.isActive,
        created_at: subscription.createdAt?.toISOString() ?? null,
        updated_at: subscription.updatedAt?.toISOString() ?? null,
        activity: transformedActivity,
        placements: transformedPlacements,
      }
    }
  } catch (error) {
    const err = error as { statusCode?: number }
    if (err.statusCode) throw error
    
    console.error('Failed to fetch candidate:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch candidate'
    })
  }
})
