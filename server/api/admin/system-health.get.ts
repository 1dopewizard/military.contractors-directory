/**
 * @file Admin System Health API
 * @description Returns system health metrics for admin dashboard (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, count } from 'drizzle-orm'

interface SystemHealth {
  database: {
    status: 'connected' | 'error'
    latencyMs: number | null
  }
  contractors: {
    total: number
    claimed: number
  }
  claims: {
    pending: number
  }
}

export default defineEventHandler(async (_event): Promise<SystemHealth> => {
  const db = getDb()
  const startTime = Date.now()

  try {
    // Query database in parallel for all stats
    const [
      totalContractorsResult,
      claimedContractorsResult,
      pendingClaimsResult,
    ] = await Promise.all([
      // Total contractors
      db.select({ count: count() }).from(schema.contractor),
      // Claimed contractors
      db.select({ count: count() }).from(schema.claimedProfile).where(eq(schema.claimedProfile.status, 'active')),
      // Pending claims
      db.select({ count: count() }).from(schema.claimedProfile).where(eq(schema.claimedProfile.status, 'pending')),
    ])

    const latencyMs = Date.now() - startTime

    return {
      database: {
        status: 'connected',
        latencyMs,
      },
      contractors: {
        total: totalContractorsResult[0]?.count ?? 0,
        claimed: claimedContractorsResult[0]?.count ?? 0,
      },
      claims: {
        pending: pendingClaimsResult[0]?.count ?? 0,
      },
    }
  } catch (error) {
    // If database query fails, return error state
    console.error('[system-health] Database query failed:', error)
    return {
      database: {
        status: 'error',
        latencyMs: null,
      },
      contractors: {
        total: 0,
        claimed: 0,
      },
      claims: {
        pending: 0,
      },
    }
  }
})
