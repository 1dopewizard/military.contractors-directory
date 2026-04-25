/**
 * @file GET /api/admin/intelligence/cache
 * @description Inspect recent intelligence cache entries
 */

import { getDb, schema } from "@/server/utils/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  const db = getDb();
  const rows = await db
    .select({
      id: schema.explorerQueryCache.id,
      query: schema.explorerQueryCache.query,
      queryHash: schema.explorerQueryCache.queryHash,
      cacheStatus: schema.explorerQueryCache.cacheStatus,
      refreshedAt: schema.explorerQueryCache.refreshedAt,
      expiresAt: schema.explorerQueryCache.expiresAt,
      updatedAt: schema.explorerQueryCache.updatedAt,
    })
    .from(schema.explorerQueryCache)
    .orderBy(desc(schema.explorerQueryCache.refreshedAt))
    .limit(query.limit);

  return {
    entries: rows.map((row) => ({
      ...row,
      refreshedAt: row.refreshedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
});
