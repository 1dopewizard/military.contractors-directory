/**
 * @file POST /api/explorer/query
 * @description Plans and runs a DB-cached USAspending contractor intelligence query
 */

import { runExplorerQueryWithCache } from "@/server/utils/intelligence";
import { z } from "zod";

const bodySchema = z.object({
  query: z.string().trim().min(3).max(500),
  refresh: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  try {
    return await runExplorerQueryWithCache(body.query, {
      forceRefresh: body.refresh,
      allowFreshRefresh: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Explorer query failed";
    throw createError({
      statusCode: 502,
      statusMessage: message,
      data: {
        source: "usaspending",
        query: body.query,
      },
    });
  }
});
