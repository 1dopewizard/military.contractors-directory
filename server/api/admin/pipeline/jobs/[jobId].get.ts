/**
 * GET /api/admin/pipeline/jobs/[jobId]
 * Get details and logs for a specific pipeline job (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  const jobId = getRouterParam(event, 'jobId')

  if (!jobId) {
    throw createError({
      statusCode: 400,
      message: 'Job ID is required',
    })
  }

  const db = getDb()

  try {
    const [job] = await db
      .select()
      .from(schema.pipelineJob)
      .where(eq(schema.pipelineJob.id, jobId))
      .limit(1)

    if (!job) {
      throw createError({
        statusCode: 404,
        message: `Job not found: ${jobId}`,
      })
    }

    return {
      id: job.id,
      script: job.script,
      status: job.status,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      dryRun: job.dryRun ?? false,
      args: (job.args as Record<string, unknown>) ?? {},
      logs: (job.logs as string[]) ?? [],
      exitCode: job.exitCode ?? null,
      error: job.error ?? null,
      createdAt: job.createdAt?.toISOString() ?? null,
    }
  } catch (err) {
    // Re-throw H3 errors
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    const message = err instanceof Error ? err.message : 'Failed to fetch job'
    throw createError({
      statusCode: 500,
      message,
    })
  }
})
