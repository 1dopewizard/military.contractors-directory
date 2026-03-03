/**
 * @file Locations list API endpoint
 * @route GET /api/locations
 * @description Returns list of US states with contractor counts
 */

import { getDb, schema } from "@/server/utils/db";
import { sql, isNotNull, desc } from "drizzle-orm";

export default defineEventHandler(async () => {
  const db = getDb();

  try {
    // Get distinct states with contractor counts
    const states = await db
      .select({
        state: schema.contractorLocation.state,
        contractorCount:
          sql<number>`COUNT(DISTINCT ${schema.contractorLocation.contractorId})`.as(
            "contractorCount",
          ),
      })
      .from(schema.contractorLocation)
      .where(isNotNull(schema.contractorLocation.state))
      .groupBy(schema.contractorLocation.state)
      .orderBy(desc(sql`contractorCount`));

    return {
      locations: states
        .filter((s) => s.state)
        .map((s) => ({
          state: s.state,
          slug: s.state!.toLowerCase().replace(/\s+/g, "-"),
          contractorCount: s.contractorCount,
        })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch locations: ${message}`,
    });
  }
});
