/**
 * @file Random sponsored ad API endpoint
 * @description Returns a random active sponsored ad
 */

import { db, schema } from '@/server/utils/db'
import { eq, and, lte, gte, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const now = Date.now()

    // Get active sponsored ads
    const ads = await db
      .select()
      .from(schema.sponsoredAd)
      .where(
        and(
          eq(schema.sponsoredAd.status, 'active'),
          lte(schema.sponsoredAd.startsAt, now),
          gte(schema.sponsoredAd.endsAt, now)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1)

    if (ads.length === 0) {
      return null
    }

    const ad = ads[0]
    return {
      id: ad.id,
      advertiser: ad.advertiser,
      tagline: ad.tagline,
      headline: ad.headline,
      description: ad.description,
      industries: ad.industries || [],
      ctaText: ad.ctaText,
      ctaUrl: ad.ctaUrl,
      status: ad.status,
      startsAt: ad.startsAt ? new Date(ad.startsAt).toISOString() : null,
      endsAt: ad.endsAt ? new Date(ad.endsAt).toISOString() : null,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      matchedMosCodes: ad.matchedMosCodes || [],
      priority: ad.priority,
      createdAt: ad.createdAt ? new Date(ad.createdAt).toISOString() : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch random ad: ${message}`,
    })
  }
})
