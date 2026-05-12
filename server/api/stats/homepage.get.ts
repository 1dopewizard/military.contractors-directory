/**
 * @file GET /api/stats/homepage
 * @description Aggregate directory stats for the home page stat ribbon
 */

import { getDb, schema } from "@/server/utils/db";
import { desc, sql } from "drizzle-orm";

export interface HomepageStatsResponse {
  contractors: number;
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
        contractors: sql<number>`count(*)`,
        totalObligated: sql<number>`coalesce(sum(${schema.contractorDirectoryGroup.totalObligations36m}), 0)`,
        totalAwards: sql<number>`coalesce(sum(${schema.contractorDirectoryGroup.awardCount36m}), 0)`,
        refreshedAt: sql<
          number | null
        >`max(${schema.contractorDirectoryGroup.refreshedAt})`,
      })
      .from(schema.contractorDirectoryGroup);

    const [recipientAggregate] = await db
      .select({ recipients: sql<number>`count(*)` })
      .from(schema.contractorDirectoryAlias);

    const [topAgencyRow] = await db
      .select({
        agency: schema.contractorDirectoryGroup.topAwardingAgency,
        obligations: sql<number>`sum(${schema.contractorDirectoryGroup.totalObligations36m})`,
      })
      .from(schema.contractorDirectoryGroup)
      .where(
        sql`${schema.contractorDirectoryGroup.topAwardingAgency} is not null`,
      )
      .groupBy(schema.contractorDirectoryGroup.topAwardingAgency)
      .orderBy(
        desc(sql`sum(${schema.contractorDirectoryGroup.totalObligations36m})`),
      )
      .limit(1);

    const refreshedAtMs = aggregates?.refreshedAt;

    return {
      contractors: aggregates?.contractors ?? 0,
      recipients: recipientAggregate?.recipients ?? 0,
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
