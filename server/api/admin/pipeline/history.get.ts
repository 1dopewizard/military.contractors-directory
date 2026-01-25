/**
 * GET /api/admin/pipeline/history
 * Query persistent job history (Drizzle-backed)
 *
 * Query params:
 *   - script: Filter by script name
 *   - status: Filter by status
 *   - startDate: Filter by start date (ISO string)
 *   - endDate: Filter by end date (ISO string)
 *   - limit: Max results to return (default 20)
 *   - offset: Offset for pagination
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm'
import type { PipelineScriptName, PipelineJobStatus } from '@/lib/pipeline'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check

  const query = getQuery(event)

  // Parse query options
  const scriptFilter = query.script as PipelineScriptName | undefined
  const statusFilter = query.status as PipelineJobStatus | undefined
  const startDate = query.startDate ? new Date(query.startDate as string) : undefined
  const endDate = query.endDate ? new Date(query.endDate as string) : undefined
  const limit = query.limit ? parseInt(query.limit as string, 10) : 20
  const offset = query.offset ? parseInt(query.offset as string, 10) : 0

  const db = getDb()

  try {
    // Build conditions
    const conditions = []
    if (scriptFilter) {
      conditions.push(eq(schema.pipelineJob.script, scriptFilter))
    }
    if (statusFilter) {
      conditions.push(eq(schema.pipelineJob.status, statusFilter))
    }
    if (startDate) {
      conditions.push(gte(schema.pipelineJob.startedAt, startDate))
    }
    if (endDate) {
      conditions.push(lte(schema.pipelineJob.startedAt, endDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get jobs
    const jobs = await db
      .select()
      .from(schema.pipelineJob)
      .where(whereClause)
      .orderBy(desc(schema.pipelineJob.startedAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(schema.pipelineJob)
      .where(whereClause)

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        script: job.script,
        status: job.status,
        startedAt: job.startedAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        dryRun: job.dryRun ?? false,
        args: (job.args as Record<string, unknown>) ?? {},
        exitCode: job.exitCode ?? null,
        error: job.error ?? null,
      })),
      total: countResult?.count ?? 0,
      limit,
      offset,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch pipeline history: ${message}`,
    })
  }
})
