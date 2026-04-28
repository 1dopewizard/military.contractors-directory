/**
 * @file Admin System Health API
 * @description Returns system health metrics for the admin dashboard
 */

import { getDb, schema } from "@/server/utils/db";
import { count, isNotNull } from "drizzle-orm";

interface SystemHealth {
  database: {
    status: "connected" | "error";
    latencyMs: number | null;
  };
  contractors: {
    total: number;
    withLogos: number;
  };
}

export default defineEventHandler(async (_event): Promise<SystemHealth> => {
  const db = getDb();
  const startTime = Date.now();

  try {
    const [totalContractorsResult, contractorsWithLogosResult] =
      await Promise.all([
        db.select({ count: count() }).from(schema.contractor),
        db
          .select({ count: count() })
          .from(schema.contractor)
          .where(isNotNull(schema.contractor.logoUrl)),
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
    };
  } catch (error) {
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
    };
  }
});
