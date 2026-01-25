/**
 * GET /api/admin/pipeline/stats
 * Get job execution statistics (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, sql, count, and, gte, avg } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // TODO: Add admin authentication check

  const db = getDb()

  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalJobs,
      completedJobs,
      failedJobs,
      runningJobs,
      cancelledJobs,
      last24hJobs,
      last7dJobs,
    ] = await Promise.all([
      db.select({ count: count() }).from(schema.pipelineJob),
      db.select({ count: count() }).from(schema.pipelineJob).where(eq(schema.pipelineJob.status, 'completed')),
      db.select({ count: count() }).from(schema.pipelineJob).where(eq(schema.pipelineJob.status, 'failed')),
      db.select({ count: count() }).from(schema.pipelineJob).where(eq(schema.pipelineJob.status, 'running')),
      db.select({ count: count() }).from(schema.pipelineJob).where(eq(schema.pipelineJob.status, 'cancelled')),
      db.select({ count: count() }).from(schema.pipelineJob).where(gte(schema.pipelineJob.startedAt, last24h)),
      db.select({ count: count() }).from(schema.pipelineJob).where(gte(schema.pipelineJob.startedAt, last7d)),
    ])

    // Calculate success rate
    const total = totalJobs[0]?.count ?? 0
    const completed = completedJobs[0]?.count ?? 0
    const failed = failedJobs[0]?.count ?? 0
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total: total,
      completed: completed,
      failed: failed,
      running: runningJobs[0]?.count ?? 0,
      cancelled: cancelledJobs[0]?.count ?? 0,
      last24h: last24hJobs[0]?.count ?? 0,
      last7d: last7dJobs[0]?.count ?? 0,
      successRate,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch pipeline stats: ${message}`,
    })
  }
})
