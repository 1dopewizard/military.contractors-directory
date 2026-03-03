/**
 * @file List bases API endpoint
 * @route GET /api/bases
 * @query theater - Filter by theater code (e.g., CENTCOM)
 * @query country - Filter by country
 * @description Returns military bases, optionally filtered by theater or country
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const theater = (query.theater as string)?.toUpperCase();
  const country = query.country as string;

  const db = getDb();

  try {
    // Build dynamic where conditions
    const conditions = [eq(schema.base.isActive, true)];

    if (theater) {
      conditions.push(eq(schema.base.theaterCode, theater));
    }
    if (country) {
      conditions.push(eq(schema.base.country, country));
    }

    const bases = await db
      .select()
      .from(schema.base)
      .where(and(...conditions));

    // Get theater info for each base
    const theaters = await db.select().from(schema.theater);

    const theaterMap = new Map(theaters.map((t) => [t.code, t]));

    // Transform to match expected response format (snake_case)
    const transformedBases = bases.map((base) => {
      const theaterInfo = base.theaterCode
        ? theaterMap.get(base.theaterCode)
        : null;

      return {
        id: base.id,
        slug: base.slug,
        name: base.name,
        country: base.country,
        city: base.city ?? null,
        description: base.description ?? null,
        job_count: base.jobCount ?? null,
        theater_code: base.theaterCode ?? null,
        is_active: base.isActive ?? null,
        coordinates:
          base.coordinatesLat && base.coordinatesLng
            ? { lat: base.coordinatesLat, lng: base.coordinatesLng }
            : null,
        created_at: base.createdAt?.toISOString() ?? null,
        updated_at: base.updatedAt?.toISOString() ?? null,
        theaters: theaterInfo
          ? {
              code: theaterInfo.code,
              name: theaterInfo.name,
              region: theaterInfo.region,
            }
          : null,
      };
    });

    return { bases: transformedBases };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch bases: ${message}`,
    });
  }
});
