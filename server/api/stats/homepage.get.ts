/**
 * @file GET /api/stats/homepage
 * @description Aggregate directory stats for the home page stat ribbon
 */

import { getDb, schema } from "@/server/utils/db";
import { desc, sql } from "drizzle-orm";

export interface HomepageStatsResponse {
  recipients: number;
  totalObligated: number;
  totalAwards: number;
  topAgency: string | null;
  refreshedAt: string | null;
}

export default defineEventHandler(async (): Promise<HomepageStatsResponse> => {
  const db = getDb();

  try {
    const [aggregates] = await db
      .select({
        recipients: sql<number>`count(*)`,
        totalObligated: sql<number>`coalesce(sum(${schema.contractorSnapshot.totalObligations36m}), 0)`,
        totalAwards: sql<number>`coalesce(sum(${schema.contractorSnapshot.awardCount36m}), 0)`,
        refreshedAt: sql<
          number | null
        >`max(${schema.contractorSnapshot.refreshedAt})`,
      })
      .from(schema.contractorSnapshot);

    const [topAgencyRow] = await db
      .select({
        agency: schema.contractorSnapshot.topAwardingAgency,
        obligations: sql<number>`sum(${schema.contractorSnapshot.totalObligations36m})`,
      })
      .from(schema.contractorSnapshot)
      .where(sql`${schema.contractorSnapshot.topAwardingAgency} is not null`)
      .groupBy(schema.contractorSnapshot.topAwardingAgency)
      .orderBy(desc(sql`sum(${schema.contractorSnapshot.totalObligations36m})`))
      .limit(1);

    const refreshedAtMs = aggregates?.refreshedAt;

    return {
      recipients: aggregates?.recipients ?? 0,
      totalObligated: aggregates?.totalObligated ?? 0,
      totalAwards: aggregates?.totalAwards ?? 0,
      topAgency: topAgencyRow?.agency ?? null,
      refreshedAt: refreshedAtMs
        ? new Date(refreshedAtMs * 1000).toISOString()
        : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      message: `Failed to fetch homepage stats: ${message}`,
    });
  }
});
