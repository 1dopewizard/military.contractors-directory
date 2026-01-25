/**
 * @file Admin System Health API
 * @description Returns system health metrics for admin dashboard (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, gte, lte, sql, count } from 'drizzle-orm'

interface SystemHealth {
  database: {
    status: 'connected' | 'error'
    latencyMs: number | null
  }
  jobs: {
    total: number
    active: number
    addedToday: number
    expiringIn7Days: number
  }
  pipeline: {
    lastRun: string | null
    status: 'idle' | 'running' | 'error'
  }
  featuredListings: {
    active: number
    pending: number
  }
}

export default defineEventHandler(async (_event): Promise<SystemHealth> => {
  const db = getDb()
  const startTime = Date.now()

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Query database in parallel for all stats
    const [
      totalJobsResult,
      activeJobsResult,
      addedTodayResult,
      expiringResult,
      activeListingsResult,
      pendingListingsResult,
      lastPipelineRun,
    ] = await Promise.all([
      // Total jobs
      db.select({ count: count() }).from(schema.job),
      // Active jobs
      db.select({ count: count() }).from(schema.job).where(eq(schema.job.isActive, true)),
      // Jobs added today
      db.select({ count: count() }).from(schema.job).where(gte(schema.job.createdAt, todayStart)),
      // Jobs expiring in 7 days
      db.select({ count: count() }).from(schema.job).where(
        and(
          eq(schema.job.isActive, true),
          lte(schema.job.expiresAt, sevenDaysFromNow)
        )
      ),
      // Active featured listings
      db.select({ count: count() }).from(schema.featuredListing).where(
        and(
          eq(schema.featuredListing.status, 'approved'),
          lte(schema.featuredListing.startsAt, now),
          gte(schema.featuredListing.endsAt, now)
        )
      ),
      // Pending featured listings
      db.select({ count: count() }).from(schema.featuredListing).where(
        eq(schema.featuredListing.status, 'pending')
      ),
      // Last pipeline run
      db.select()
        .from(schema.pipelineJob)
        .orderBy(sql`${schema.pipelineJob.startedAt} DESC`)
        .limit(1),
    ])

    const latencyMs = Date.now() - startTime

    // Determine pipeline status
    let pipelineStatus: 'idle' | 'running' | 'error' = 'idle'
    let lastRun: string | null = null
    
    if (lastPipelineRun.length > 0) {
      const lastJob = lastPipelineRun[0]
      lastRun = lastJob.startedAt?.toISOString() ?? null
      if (lastJob.status === 'running') {
        pipelineStatus = 'running'
      } else if (lastJob.status === 'failed') {
        pipelineStatus = 'error'
      }
    }

    return {
      database: {
        status: 'connected',
        latencyMs,
      },
      jobs: {
        total: totalJobsResult[0]?.count ?? 0,
        active: activeJobsResult[0]?.count ?? 0,
        addedToday: addedTodayResult[0]?.count ?? 0,
        expiringIn7Days: expiringResult[0]?.count ?? 0,
      },
      pipeline: {
        lastRun,
        status: pipelineStatus,
      },
      featuredListings: {
        active: activeListingsResult[0]?.count ?? 0,
        pending: pendingListingsResult[0]?.count ?? 0,
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
      jobs: {
        total: 0,
        active: 0,
        addedToday: 0,
        expiringIn7Days: 0,
      },
      pipeline: {
        lastRun: null,
        status: 'error',
      },
      featuredListings: {
        active: 0,
        pending: 0,
      },
    }
  }
})
