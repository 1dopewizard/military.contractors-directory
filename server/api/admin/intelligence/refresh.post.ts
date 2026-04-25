/**
 * @file POST /api/admin/intelligence/refresh
 * @description Force refresh a contractor profile or explorer query cache entry
 */

import {
  getContractorIntelligenceLive,
  runExplorerQueryWithCache,
} from "@/server/utils/intelligence";
import { z } from "zod";

const bodySchema = z
  .object({
    query: z.string().trim().min(3).max(500).optional(),
    contractorSlug: z.string().trim().min(2).max(120).optional(),
  })
  .refine((body) => body.query || body.contractorSlug, {
    message: "Provide query or contractorSlug",
  });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  if (body.contractorSlug) {
    return {
      type: "contractor",
      result: await getContractorIntelligenceLive(body.contractorSlug, {
        forceRefresh: true,
      }),
    };
  }

  return {
    type: "explorer",
    result: await runExplorerQueryWithCache(body.query!, {
      forceRefresh: true,
      allowFreshRefresh: true,
    }),
  };
});
