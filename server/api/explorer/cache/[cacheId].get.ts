/**
 * @file GET /api/explorer/cache/[cacheId]
 * @description Returns a persisted explorer result by cache ID or query hash
 */

import { getExplorerResultFromCache } from "@/server/utils/intelligence";

export default defineEventHandler(async (event) => {
  const cacheId = getRouterParam(event, "cacheId");

  if (!cacheId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cache ID is required",
    });
  }

  const result = await getExplorerResultFromCache(cacheId);

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: `Explorer cache "${cacheId}" not found`,
    });
  }

  return result;
});
