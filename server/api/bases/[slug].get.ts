/**
 * @file Base detail API endpoint
 * @route GET /api/bases/[slug]
 * @description Returns base details (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.toLowerCase()

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Base slug is required',
    })
  }

  const db = getDb()

  try {
    // Get base by slug
    const [baseResult] = await db
      .select()
      .from(schema.base)
      .where(eq(schema.base.slug, slug))
      .limit(1)

    if (!baseResult) {
      throw createError({
        statusCode: 404,
        statusMessage: `Base "${slug}" not found`,
      })
    }

    // Get theater info if available
    let theaterInfo = null
    if (baseResult.theaterCode) {
      const [theater] = await db
        .select()
        .from(schema.theater)
        .where(eq(schema.theater.code, baseResult.theaterCode))
        .limit(1)
      theaterInfo = theater
    }

    // Transform base to snake_case
    const base = {
      id: baseResult.id,
      slug: baseResult.slug,
      name: baseResult.name,
      country: baseResult.country,
      city: baseResult.city ?? null,
      description: baseResult.description ?? null,
      theater_code: baseResult.theaterCode ?? null,
      is_active: baseResult.isActive ?? null,
      coordinates: baseResult.coordinatesLat && baseResult.coordinatesLng
        ? { lat: baseResult.coordinatesLat, lng: baseResult.coordinatesLng }
        : null,
      created_at: baseResult.createdAt?.toISOString() ?? null,
      updated_at: baseResult.updatedAt?.toISOString() ?? null,
      theater: theaterInfo ? {
        code: theaterInfo.code,
        name: theaterInfo.name,
        region: theaterInfo.region,
      } : null,
    }

    return { base }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch base: ${message}`,
    })
  }
})
