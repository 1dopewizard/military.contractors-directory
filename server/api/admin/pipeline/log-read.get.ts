/**
 * GET /api/admin/pipeline/log-read
 * Read logs for a specific pipeline job (Drizzle-backed)
 * Query params:
 *   - file: The job_id (required) - named 'file' for UI compatibility
 *   - offset: Line offset for pagination
 *   - limit: Max lines to return
 *   - reverse: Return lines in reverse order
 *   - levels: Comma-separated log levels to filter
 */

import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  
  const query = getQuery(event)
  const jobId = query.file as string | undefined
  
  if (!jobId) {
    throw createError({
      statusCode: 400,
      message: 'Job ID (file) is required'
    })
  }
  
  const offset = query.offset ? parseInt(query.offset as string) : 0
  const limit = query.limit ? parseInt(query.limit as string) : 500
  const reverse = query.reverse === 'true'
  const levels = query.levels ? (query.levels as string).split(',') : undefined
  
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
        message: `Job not found: ${jobId}`
      })
    }
    
    let lines: string[] = (job.logs as string[]) || []
    const totalLines = lines.length
    
    // Apply level filtering if requested
    if (levels && levels.length > 0) {
      const validLevels = levels
        .map(l => l.toUpperCase())
        .filter(l => ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].includes(l))
      
      if (validLevels.length > 0) {
        lines = lines.filter(line => {
          const levelMatch = line.match(/\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b/i)
          return levelMatch && validLevels.includes(levelMatch[1]!.toUpperCase())
        })
      }
    }
    
    // Reverse if requested (show newest first)
    if (reverse) {
      lines = [...lines].reverse()
    }
    
    // Apply pagination
    const truncated = lines.length > offset + limit
    lines = lines.slice(offset, offset + limit)
    
    return {
      name: job.id,
      script: job.script,
      status: job.status,
      startedAt: job.startedAt?.getTime() ?? null,
      completedAt: job.completedAt?.getTime() ?? null,
      lines,
      totalLines,
      offset,
      limit,
      truncated,
      reverse
    }
  } catch (error) {
    const err = error as { statusCode?: number }
    if (err.statusCode) throw error
    
    console.error('Failed to read pipeline log:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to read pipeline log'
    })
  }
})
