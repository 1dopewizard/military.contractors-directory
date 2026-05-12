/**
 * @file GET /api/contractors
 * @description Canonical grouped directory query for DoD-awarded USAspending contractors
 */

import { queryContractorSnapshots } from "@/server/utils/contractor-snapshot";

export default defineEventHandler(async (event) => {
  try {
    return await queryContractorSnapshots(getQuery(event));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to fetch contractor snapshot: ${message}`,
    });
  }
});
