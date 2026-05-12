/**
 * @file GET /api/teaming/search
 * @description Search public contractor snapshot activity for teaming discovery
 */

import {
  searchTeamingMatches,
  teamingSearchSchema,
} from "@/server/utils/teaming";

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, teamingSearchSchema.parse);
  const results = await searchTeamingMatches(query);

  return {
    results,
    total: results.length,
    provenance: {
      publicData:
        "Matches are inferred from USAspending-backed recipient snapshot activity.",
      contractorDeclared:
        "Contractor-declared capabilities are reserved for verified claimed profiles and are not mixed into public-data matches yet.",
    },
  };
});
