/**
 * @file POST /api/admin/intelligence/refresh
 * @description Force refresh a contractor profile cache entry
 */

import { getContractorIntelligenceLive } from "@/server/utils/intelligence";
import { z } from "zod";

const bodySchema = z.object({
  contractorSlug: z.string().trim().min(2).max(120),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  return {
    type: "contractor",
    result: await getContractorIntelligenceLive(body.contractorSlug, {
      forceRefresh: true,
    }),
  };
});
