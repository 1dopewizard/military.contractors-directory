/**
 * @file GET /api/intelligence/topics/[topicSlug]
 * @description Topic intelligence page data
 */

import {
  getAwardSearch,
  getTopContractors,
  getTopicPreset,
} from "@/server/utils/intelligence";
import { getFiscalYears } from "@/server/utils/usaspending";
import { z } from "zod";

const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export default defineEventHandler(async (event) => {
  const topicSlug = getRouterParam(event, "topicSlug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!topicSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Topic slug is required",
    });
  }

  const topic = getTopicPreset(topicSlug);
  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: `Topic "${topicSlug}" not found`,
    });
  }

  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(1);
  const filters = {
    keywords: [...topic.keywords],
    naicsCodes: "naics" in topic && topic.naics ? [topic.naics] : undefined,
    pscCodes: "psc" in topic && topic.psc ? [topic.psc] : undefined,
    fiscalYears,
  };
  const [ranking, awards] = await Promise.all([
    getTopContractors({ ...filters, limit: query.limit }),
    getAwardSearch({ ...filters, limit: 20 }),
  ]);

  return {
    topic,
    fiscalYears,
    contractors: ranking.contractors,
    awards: awards.awards,
    sourceMetadata: {
      ...ranking.sourceMetadata,
      structuredRecords:
        ranking.sourceMetadata.structuredRecords +
        awards.sourceMetadata.structuredRecords,
    },
  };
});
