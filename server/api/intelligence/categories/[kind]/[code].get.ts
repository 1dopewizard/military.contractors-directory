/**
 * @file GET /api/intelligence/categories/[kind]/[code]
 * @description NAICS/PSC category intelligence page data
 */

import { getAwardSearch, getTopContractors } from "@/server/utils/intelligence";
import { getFiscalYears } from "@/server/utils/usaspending";
import { z } from "zod";

const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, "kind");
  const code = getRouterParam(event, "code");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (kind !== "naics" && kind !== "psc") {
    throw createError({
      statusCode: 400,
      statusMessage: "Category kind must be naics or psc",
    });
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category code is required",
    });
  }

  const normalizedCode = code.toUpperCase();
  const fiscalYears = query.fiscalYear ? [query.fiscalYear] : getFiscalYears(1);
  const filters =
    kind === "naics"
      ? { naicsCodes: [normalizedCode] }
      : { pscCodes: [normalizedCode] };
  const [ranking, awards] = await Promise.all([
    getTopContractors({ ...filters, fiscalYears, limit: query.limit }),
    getAwardSearch({ ...filters, fiscalYears, limit: 20 }),
  ]);

  return {
    category: {
      kind,
      code: normalizedCode,
      title:
        awards.awards[0]?.[kind === "naics" ? "naicsTitle" : "pscTitle"] ??
        `${kind.toUpperCase()} ${normalizedCode}`,
    },
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
