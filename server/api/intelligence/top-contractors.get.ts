/**
 * @file GET /api/intelligence/top-contractors
 * @description Ranked contractor intelligence by public USAspending obligations
 */

import { getFiscalYears } from "@/server/utils/usaspending";
import { getTopContractors } from "@/server/utils/intelligence";
import { z } from "zod";

const querySchema = z.object({
  agency: z.string().trim().optional(),
  naics: z.string().trim().optional(),
  psc: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(1);
  const result = await getTopContractors({
    agency: query.agency,
    naicsCodes: query.naics ? [query.naics] : undefined,
    pscCodes: query.psc ? [query.psc] : undefined,
    keywords: query.keyword ? [query.keyword] : undefined,
    fiscalYears,
    limit: query.limit,
  });

  return {
    filters: {
      agency: query.agency ?? null,
      naics: query.naics ?? null,
      psc: query.psc ?? null,
      keyword: query.keyword ?? null,
      fiscalYears,
    },
    contractors: result.contractors,
    sourceMetadata: result.sourceMetadata,
  };
});
