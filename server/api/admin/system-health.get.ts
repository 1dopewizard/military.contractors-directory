/**
 * @file Admin System Health API
 * @description Returns system health metrics for admin dashboard (Drizzle-backed)
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, count, isNotNull } from "drizzle-orm";

interface SystemHealth {
  database: {
    status: "connected" | "error";
    latencyMs: number | null;
  };
  contractors: {
    total: number;
    withLogos: number;
  };
  claims: {
    pending: number;
    approved: number;
  };
  content: {
    pendingReview: number;
  };
}

export default defineEventHandler(async (_event): Promise<SystemHealth> => {
  const db = getDb();
  const startTime = Date.now();

  try {
    // Query database in parallel for all stats
    const [
      totalContractorsResult,
      contractorsWithLogosResult,
      pendingClaimsResult,
      approvedClaimsResult,
      pendingContentResult,
    ] = await Promise.all([
      // Total contractors
      db.select({ count: count() }).from(schema.contractor),
      // Contractors with logos
      db
        .select({ count: count() })
        .from(schema.contractor)
        .where(isNotNull(schema.contractor.logoUrl)),
      // Pending claims
      db
        .select({ count: count() })
        .from(schema.claimedProfile)
        .where(eq(schema.claimedProfile.status, "pending")),
      // Approved claims
      db
        .select({ count: count() })
        .from(schema.claimedProfile)
        .where(eq(schema.claimedProfile.status, "active")),
      // Pending content (sponsored content pending review)
      db
        .select({ count: count() })
        .from(schema.sponsoredContent)
        .where(eq(schema.sponsoredContent.status, "pending_review")),
    ]);

    const latencyMs = Date.now() - startTime;

    return {
      database: {
        status: "connected",
        latencyMs,
      },
      contractors: {
        total: totalContractorsResult[0]?.count ?? 0,
        withLogos: contractorsWithLogosResult[0]?.count ?? 0,
      },
      claims: {
        pending: pendingClaimsResult[0]?.count ?? 0,
        approved: approvedClaimsResult[0]?.count ?? 0,
      },
      content: {
        pendingReview: pendingContentResult[0]?.count ?? 0,
      },
    };
  } catch (error) {
    // If database query fails, return error state
    console.error("[system-health] Database query failed:", error);
    return {
      database: {
        status: "error",
        latencyMs: null,
      },
      contractors: {
        total: 0,
        withLogos: 0,
      },
      claims: {
        pending: 0,
        approved: 0,
      },
      content: {
        pendingReview: 0,
      },
    };
  }
});
