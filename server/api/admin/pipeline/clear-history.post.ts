/**
 * POST /api/admin/pipeline/clear-history
 * Clear pipeline job history or remove a specific job (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  const body = await readBody(event)
  const { jobId } = body as { jobId?: string }

  const db = getDb()

  if (jobId) {
    // Remove specific job
    try {
      await db
        .delete(schema.pipelineJob)
        .where(eq(schema.pipelineJob.id, jobId))
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  // Clear all history (keep running jobs)
  try {
    const result = await db
      .delete(schema.pipelineJob)
      .where(ne(schema.pipelineJob.status, 'running'))
    
    return { success: true, deleted: result.rowsAffected ?? 0 }
  } catch (error) {
    console.error('Failed to clear pipeline history:', error)
    return { success: false, deleted: 0 }
  }
})
