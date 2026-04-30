/**
 * @file POST /api/admin/contractor-snapshot/refresh
 * @description Manually refresh the USAspending contractor recipient snapshot
 */

import { refreshContractorSnapshot } from "@/server/utils/contractor-snapshot";
import { z } from "zod";

const bodySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    maxPages: z.coerce.number().int().min(1).max(2000).optional(),
    windowStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    windowEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .optional()
  .default({});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);
  return refreshContractorSnapshot({
    limit: body.limit,
    maxPages: body.maxPages,
    window:
      body.windowStart && body.windowEnd
        ? { startDate: body.windowStart, endDate: body.windowEnd }
        : undefined,
  });
});
