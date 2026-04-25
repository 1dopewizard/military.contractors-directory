/**
 * @file GET /api/intelligence/contractors/[slug]
 * @description Live USAspending-backed contractor intelligence profile
 */

import { getContractorIntelligenceLive } from "@/server/utils/intelligence";
import { z } from "zod";

const querySchema = z.object({
  refresh: z.coerce.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  return getContractorIntelligenceLive(slug, {
    forceRefresh: query.refresh,
  });
});
