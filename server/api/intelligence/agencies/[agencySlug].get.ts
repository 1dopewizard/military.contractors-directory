/**
 * @file GET /api/intelligence/agencies/[agencySlug]
 * @description Agency intelligence page data with top contractors and awards
 */

import {
  getAgencyBySlug,
  getAwardSearch,
  getTopContractors,
} from "@/server/utils/intelligence";
import { getFiscalYears } from "@/server/utils/usaspending";
import { z } from "zod";

const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export default defineEventHandler(async (event) => {
  const agencySlug = getRouterParam(event, "agencySlug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!agencySlug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Agency slug is required",
    });
  }

  const agency = getAgencyBySlug(agencySlug);
  if (!agency) {
    throw createError({
      statusCode: 404,
      statusMessage: `Agency "${agencySlug}" not found`,
    });
  }

  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(1);
  const [ranking, awards] = await Promise.all([
    getTopContractors({
      agency: agency.name,
      fiscalYears,
      limit: query.limit,
    }),
    getAwardSearch({
      agency: agency.name,
      fiscalYears,
      limit: 20,
    }),
  ]);

  return {
    agency,
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
