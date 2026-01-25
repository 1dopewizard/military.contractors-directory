/**
 * @file Featured job tracking endpoint
 * @route POST /api/jobs/featured/track
 * @description Record impressions and clicks for featured job listings
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'
import { eq, sql } from 'drizzle-orm'

const trackSchema = z.object({
  listingId: z.string().min(1),
  eventType: z.enum(['impression', 'click']),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = trackSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const { listingId, eventType } = parsed.data

  try {
    if (eventType === 'impression') {
      await db.update(schema.featuredListing)
        .set({ impressions: sql`${schema.featuredListing.impressions} + 1` })
        .where(eq(schema.featuredListing.id, listingId))
    } else { // click
      await db.update(schema.featuredListing)
        .set({ clicks: sql`${schema.featuredListing.clicks} + 1` })
        .where(eq(schema.featuredListing.id, listingId))
    }

    return { success: true }
  } catch (error) {
    console.error(`Failed to track featured listing ${eventType}:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to track ${eventType}`,
    })
  }
})
