/**
 * @file GET /api/explorer/cache/[cacheId]
 * @description Returns a cached explorer result by stable cache ID
 */

import { getExplorerMemoryCache } from "@/server/utils/intelligence";

export default defineEventHandler(async (event) => {
  const cacheId = getRouterParam(event, "cacheId");

  if (!cacheId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cache ID is required",
    });
  }

  const result = getExplorerMemoryCache(cacheId);

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: `Explorer cache "${cacheId}" not found`,
    });
  }

  return {
    ...result,
    cached: true,
  };
});
