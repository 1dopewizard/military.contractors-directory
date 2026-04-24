/**
 * @file POST /api/explorer/query
 * @description Plans and runs a deterministic contractor intelligence explorer query
 */

import {
  createQueryHash,
  getExplorerMemoryCache,
  runExplorerQuery,
  setExplorerMemoryCache,
} from "@/server/utils/intelligence";
import { z } from "zod";

const bodySchema = z.object({
  query: z.string().trim().min(3).max(500),
  refresh: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);
  const id = createQueryHash(body.query).slice(0, 16);

  if (!body.refresh) {
    const cached = getExplorerMemoryCache(id);
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }
  }

  const result = runExplorerQuery(body.query);
  setExplorerMemoryCache(result);
  return result;
});
