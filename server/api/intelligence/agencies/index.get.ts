/**
 * @file GET /api/intelligence/agencies
 * @description List public agency references plus directory-wide aggregates
 */

import { getAgencies } from "@/server/utils/intelligence";
import { getDb, schema } from "@/server/utils/db";
import { desc, sql } from "drizzle-orm";

export default defineEventHandler(async () => {
  const agencies = await getAgencies();
  const db = getDb();

  let totalAgencies = 0;
  let totalObligated = 0;
  let topSubagency: string | null = null;

  try {
    const [aggregates] = await db
      .select({
        agencies: sql<number>`count(distinct ${schema.contractorSnapshot.topAwardingSubagency})`,
        obligated: sql<number>`coalesce(sum(${schema.contractorSnapshot.totalObligations36m}), 0)`,
      })
      .from(schema.contractorSnapshot);

    const [topRow] = await db
      .select({
        subagency: schema.contractorSnapshot.topAwardingSubagency,
      })
      .from(schema.contractorSnapshot)
      .where(sql`${schema.contractorSnapshot.topAwardingSubagency} is not null`)
      .groupBy(schema.contractorSnapshot.topAwardingSubagency)
      .orderBy(desc(sql`sum(${schema.contractorSnapshot.totalObligations36m})`))
      .limit(1);

    totalAgencies = aggregates?.agencies ?? 0;
    totalObligated = aggregates?.obligated ?? 0;
    topSubagency = topRow?.subagency ?? null;
  } catch {
    // Aggregates are best-effort; fall through with defaults.
  }

  return {
    agencies,
    aggregates: {
      totalAgencies,
      totalObligated,
      topSubagency,
    },
    sourceMetadata: {
      sources: [
        { label: "USAspending.gov", url: "https://www.usaspending.gov" },
      ],
      generatedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      expiresAt: null,
      freshness:
        "USAspending agency references with defense sub-agency shortcuts.",
      cacheStatus: "live",
      structuredRecords: agencies.length,
      filters: [],
      warnings: [],
    },
  };
});
