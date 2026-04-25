/**
 * @file GET /api/intelligence/recipients/resolve
 * @description Resolve recipient names and UEIs from USAspending autocomplete
 */

import { resolveRecipients } from "@/server/utils/intelligence";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  return resolveRecipients(query.q);
});
