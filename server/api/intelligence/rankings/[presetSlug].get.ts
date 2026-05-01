/**
 * @file GET /api/intelligence/rankings/[presetSlug]
 * @description Ranking preset intelligence data
 */

import {
  getAwardSearch,
  getRankingPreset,
  getTopContractors,
} from "@/server/utils/intelligence";
import { getFiscalYears } from "@/server/utils/usaspending";
import { z } from "zod";

const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export default defineEventHandler(async (event) => {
  const presetSlug = getRouterParam(event, "presetSlug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!presetSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ranking preset slug is required",
    });
  }

  const preset = getRankingPreset(presetSlug);
  if (!preset) {
    throw createError({
      statusCode: 404,
      statusMessage: `Ranking preset "${presetSlug}" not found`,
    });
  }

  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(1);
  const filters = {
    agency: "agency" in preset.filters ? preset.filters.agency : undefined,
    naicsCodes:
      "naics" in preset.filters && preset.filters.naics
        ? [preset.filters.naics]
        : undefined,
    pscCodes:
      "psc" in preset.filters && preset.filters.psc
        ? [preset.filters.psc]
        : undefined,
    keywords:
      "keywords" in preset.filters && preset.filters.keywords
        ? [...preset.filters.keywords]
        : undefined,
    fiscalYears,
  };
  const [ranking, awards] = await Promise.all([
    getTopContractors({ ...filters, limit: query.limit }),
    getAwardSearch({ ...filters, limit: 20 }),
  ]);

  return {
    preset,
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
