/**
 * @file GET /api/intelligence/awards/[awardKey]
 * @description Fetch USAspending award detail by generated award key
 */

import {
  USA_SPENDING_API_BASE_URL,
  USA_SPENDING_BASE_URL,
} from "@/server/utils/usaspending";

export default defineEventHandler(async (event) => {
  const awardKey = getRouterParam(event, "awardKey");

  if (!awardKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Award key is required",
    });
  }

  const response = await fetch(
    `${USA_SPENDING_API_BASE_URL}/awards/${encodeURIComponent(awardKey)}/`,
    { headers: { accept: "application/json" } },
  );

  if (!response.ok) {
    throw createError({
      statusCode: response.status === 404 ? 404 : 502,
      statusMessage: `USAspending award lookup failed with ${response.status}`,
    });
  }

  return {
    awardKey,
    detail: await response.json(),
    sourceMetadata: {
      sources: [
        {
          label: "USAspending award detail",
          url: `${USA_SPENDING_BASE_URL}/award/${encodeURIComponent(awardKey)}`,
        },
      ],
      generatedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      expiresAt: null,
      freshness: "Live USAspending award detail.",
      cacheStatus: "live",
      structuredRecords: 1,
      filters: [],
      warnings: [],
    },
  };
});
