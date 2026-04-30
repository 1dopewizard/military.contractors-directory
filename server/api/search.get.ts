/**
 * @file GET /api/search
 * @description Snapshot-backed directory search endpoint
 */

import { queryContractorSnapshots } from "@/server/utils/contractor-snapshot";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const result = await queryContractorSnapshots({
    ...query,
    limit: query.limit ?? 20,
    sort: query.sort ?? "totalObligations36m",
  });

  return {
    query: ((query.q as string) || "").trim(),
    rows: result.rows,
    contractors: result.rows.map((row, index) => ({
      id: row.id,
      rank: result.offset + index + 1,
      slug: row.slug,
      name: row.recipientName,
      recipientName: row.recipientName,
      headquarters: null,
      defenseNewsRank: null,
      logoUrl: null,
      totalObligations36m: row.totalObligations36m,
      awardCount36m: row.awardCount36m,
      topAwardingAgency: row.topAwardingAgency,
      topAwardingSubagency: row.topAwardingSubagency,
    })),
    pagination: {
      limit: result.limit,
      offset: result.offset,
      total: result.total,
      has_more: result.offset + result.limit < result.total,
    },
    sourceMetadata: result.sourceMetadata,
  };
});
