/**
 * @file POST /api/explorer/follow-up
 * @description Runs structured follow-up refine, pivot, or answer workflows
 */

import { followUpModeSchema, runFollowUp } from "@/server/utils/intelligence";
import { z } from "zod";

const bodySchema = z.object({
  cacheId: z.string().trim().min(4),
  query: z.string().trim().min(2).max(500),
  mode: followUpModeSchema.optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);
  return runFollowUp(body.cacheId, body.query, body.mode);
});
