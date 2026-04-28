/**
 * @file GET /api/search
 * @description Simple contractor search endpoint
 */

import { getDb, schema } from "@/server/utils/db";
import { and, or, like, desc, asc, sql } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = ((query.q as string) || "").trim();

  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Number(query.offset) || 0;
  const sort = (query.sort as string) || "rank";

  const db = getDb();

  try {
    // Build contractor search query
    const conditions = [];

    if (q) {
      const searchPattern = `%${q}%`;
      conditions.push(
        or(
          like(schema.contractor.name, searchPattern),
          like(schema.contractor.slug, searchPattern),
          like(schema.contractor.description, searchPattern),
          like(schema.contractor.headquarters, searchPattern),
        )!,
      );
    }

    const contractors = await db
      .select()
      .from(schema.contractor)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sort === "name"
          ? asc(schema.contractor.name)
          : asc(schema.contractor.defenseNewsRank),
      )
      .limit(limit)
      .offset(offset);

    // Count total results
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contractor)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult?.count ?? 0;

    return {
      query: q,
      contractors: contractors.map((c, index) => ({
        id: c.id,
        rank: offset + index + 1,
        slug: c.slug,
        name: c.name,
        description: c.description,
        defenseNewsRank: c.defenseNewsRank,
        headquarters: c.headquarters,
        employeeCount: c.employeeCount,
        website: c.website,
        logoUrl: c.logoUrl,
      })),
      pagination: {
        limit,
        offset,
        total: totalCount,
        has_more: offset + limit < totalCount,
      },
      message:
        contractors.length === 0 && q
          ? `No contractors found for "${q}". Try a different search term.`
          : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      message: `Search error: ${message}`,
    });
  }
});
