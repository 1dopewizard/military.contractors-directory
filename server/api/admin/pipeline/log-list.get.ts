/**
 * GET /api/admin/pipeline/log-list
 * List pipeline jobs with logs (Drizzle-backed)
 */

import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  
  const db = getDb()
  
  try {
    const jobs = await db
      .select()
      .from(schema.pipelineJob)
      .orderBy(desc(schema.pipelineJob.startedAt))
      .limit(100)
    
    // Transform to file-like structure for UI compatibility
    const files = jobs.map((job) => {
      const logsArray = (job.logs as string[]) || []
      const logContent = logsArray.join('\n')
      
      return {
        name: job.id,
        script: job.script,
        status: job.status,
        size: logContent.length,
        sizeFormatted: formatSize(logContent.length),
        lineCount: logsArray.length,
        modifiedAt: job.completedAt?.getTime() ?? job.startedAt?.getTime() ?? null,
        createdAt: job.createdAt?.getTime() ?? null,
      }
    })
    
    // Calculate stats
    const totalSize = files.reduce((sum: number, f) => sum + f.size, 0)
    const totalLines = files.reduce((sum: number, f) => sum + f.lineCount, 0)
    
    return {
      files,
      stats: {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: formatSize(totalSize),
        totalLines,
        oldestFile: files.length > 0 ? files[files.length - 1]?.name ?? null : null,
        newestFile: files.length > 0 ? files[0]?.name ?? null : null
      }
    }
  } catch (error) {
    console.error('Failed to fetch pipeline jobs:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch pipeline jobs'
    })
  }
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
