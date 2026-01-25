/**
 * @file Ad tracking API endpoint
 * @description Records impressions and clicks for sponsored ads/jobs
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'
import { eq, sql } from 'drizzle-orm'

const trackSchema = z.object({
  type: z.enum(['ad', 'job']),
  id: z.string(),
  event: z.enum(['impression', 'click']),
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

  const { type, id, event: eventType } = parsed.data

  try {
    if (type === 'ad') {
      if (eventType === 'impression') {
        await db
          .update(schema.sponsoredAd)
          .set({ impressions: sql`${schema.sponsoredAd.impressions} + 1` })
          .where(eq(schema.sponsoredAd.id, id))
      } else {
        await db
          .update(schema.sponsoredAd)
          .set({ clicks: sql`${schema.sponsoredAd.clicks} + 1` })
          .where(eq(schema.sponsoredAd.id, id))
      }
    } else {
      if (eventType === 'impression') {
        await db
          .update(schema.sponsoredJob)
          .set({ impressions: sql`${schema.sponsoredJob.impressions} + 1` })
          .where(eq(schema.sponsoredJob.id, id))
      } else {
        await db
          .update(schema.sponsoredJob)
          .set({ clicks: sql`${schema.sponsoredJob.clicks} + 1` })
          .where(eq(schema.sponsoredJob.id, id))
      }
    }

    return { success: true }
  } catch (error) {
    // Non-blocking - don't fail the request if tracking fails
    console.error('Failed to track ad event:', error)
    return { success: false }
  }
})
