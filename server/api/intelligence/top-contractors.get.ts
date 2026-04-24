/**
 * @file GET /api/intelligence/top-contractors
 * @description Ranked contractor intelligence by public award obligations
 */

import {
  explorerPlanSchema,
  searchAwards,
  type IntelligenceAward,
} from "@/server/utils/intelligence";
import { z } from "zod";

const querySchema = z.object({
  agency: z.string().trim().optional(),
  naics: z.string().trim().optional(),
  psc: z.string().trim().optional(),
  location: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  const plan = explorerPlanSchema.parse({
    intent: query.agency ? "agency_top_contractors" : "award_keyword_search",
    contractors: [],
    agency: query.agency ?? null,
    naics: query.naics ?? null,
    psc: query.psc ?? null,
    location: query.location ?? null,
    keywords: query.keyword ? [query.keyword] : [],
    fiscalYears: [],
    limit: query.limit,
  });

  const awards = searchAwards(plan);
  const contractors = aggregateTopContractors(awards).slice(0, query.limit);

  return {
    filters: {
      agency: query.agency ?? null,
      naics: query.naics ?? null,
      psc: query.psc ?? null,
      location: query.location ?? null,
      keyword: query.keyword ?? null,
    },
    contractors,
    source: {
      name: "USAspending.gov",
      url: "https://www.usaspending.gov/search",
      note: "Seeded MVP records modeled after USAspending fields.",
    },
  };
});

function aggregateTopContractors(awards: IntelligenceAward[]) {
  const buckets = new Map<
    string,
    { slug: string; name: string; obligations: number; awardCount: number }
  >();

  for (const award of awards) {
    const existing = buckets.get(award.contractorSlug);
    if (existing) {
      existing.obligations += award.obligation;
      existing.awardCount += 1;
    } else {
      buckets.set(award.contractorSlug, {
        slug: award.contractorSlug,
        name: award.contractorName,
        obligations: award.obligation,
        awardCount: 1,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => b.obligations - a.obligations);
}
