/**
 * @file GET /api/intelligence/agencies
 * @description List public agency references for intelligence pages
 */

import { getAgencies } from "@/server/utils/intelligence";

export default defineEventHandler(async () => {
  const agencies = await getAgencies();
  return {
    agencies,
    sourceMetadata: {
      sources: [{ label: "USAspending.gov", url: "https://www.usaspending.gov" }],
      generatedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      expiresAt: null,
      freshness: "USAspending agency references with defense sub-agency shortcuts.",
      cacheStatus: "live",
      structuredRecords: agencies.length,
      filters: [],
      warnings: [],
    },
  };
});
