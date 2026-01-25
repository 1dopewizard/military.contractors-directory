/**
 * POST /api/admin/pipeline/cancel
 * Cancel the currently running pipeline job (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  const db = getDb()

  try {
    // Find the current running job
    const [currentJob] = await db
      .select()
      .from(schema.pipelineJob)
      .where(eq(schema.pipelineJob.status, 'running'))
      .limit(1)

    if (!currentJob) {
      throw createError({
        statusCode: 404,
        message: 'No job is currently running',
      })
    }

    // Update job status to cancelled
    await db
      .update(schema.pipelineJob)
      .set({
        status: 'cancelled',
        error: 'Job cancelled by user',
        completedAt: new Date(),
      })
      .where(eq(schema.pipelineJob.id, currentJob.id))

    return {
      success: true,
      message: 'Job cancellation requested. The job will stop at the next checkpoint.',
      jobId: currentJob.id,
    }
  } catch (err) {
    // Re-throw H3 errors
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    const message = err instanceof Error ? err.message : 'Failed to cancel job'
    throw createError({
      statusCode: 500,
      message,
    })
  }
})
