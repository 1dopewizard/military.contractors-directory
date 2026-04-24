/**
 * @file GET /api/intelligence/contractors/[slug]
 * @description Public award intelligence summary for a contractor profile
 */

import { getContractorIntelligence } from "@/server/utils/intelligence";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  const intelligence = getContractorIntelligence(slug);

  if (!intelligence) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor intelligence not found for "${slug}"`,
    });
  }

  return intelligence;
});
