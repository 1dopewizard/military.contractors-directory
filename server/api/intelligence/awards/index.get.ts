/**
 * @file GET /api/intelligence/awards
 * @description Search USAspending award rows with validated public filters
 */

import { getAwardSearch } from "@/server/utils/intelligence";
import { getFiscalYears } from "@/server/utils/usaspending";
import { z } from "zod";

const querySchema = z.object({
  recipient: z.string().trim().optional(),
  agency: z.string().trim().optional(),
  naics: z.string().trim().optional(),
  psc: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(5);
  const result = await getAwardSearch({
    recipientSearchText: query.recipient ? [query.recipient] : undefined,
    agency: query.agency,
    naicsCodes: query.naics ? [query.naics] : undefined,
    pscCodes: query.psc ? [query.psc] : undefined,
    keywords: query.keyword ? [query.keyword] : undefined,
    fiscalYears,
    limit: query.limit,
    page: query.page,
  });

  return {
    awards: result.awards,
    filters: {
      recipient: query.recipient ?? null,
      agency: query.agency ?? null,
      naics: query.naics ?? null,
      psc: query.psc ?? null,
      keyword: query.keyword ?? null,
      fiscalYears,
    },
    sourceMetadata: result.sourceMetadata,
  };
});
