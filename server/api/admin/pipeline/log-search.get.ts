/**
 * GET /api/admin/pipeline/log-search
 * Search across all pipeline job logs (Drizzle-backed)
 * Query params:
 *   - q: Search query (required)
 *   - script: Filter by script name
 *   - context: Number of context lines around matches
 *   - limit: Max results to return
 */

import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq, desc } from 'drizzle-orm'

interface SearchResult {
  jobId: string
  script: string
  status: string
  startedAt: number | null
  line: number
  content: string
  context: {
    before: string[]
    after: string[]
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  
  const query = getQuery(event)
  const searchQuery = query.q as string | undefined
  const scriptFilter = query.script as string | undefined
  const contextLines = query.context ? parseInt(query.context as string) : 2
  const maxResults = query.limit ? parseInt(query.limit as string) : 100
  
  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'Search query (q) is required'
    })
  }
  
  const db = getDb()
  
  try {
    // Build query
    let jobsQuery = db
      .select()
      .from(schema.pipelineJob)
      .orderBy(desc(schema.pipelineJob.startedAt))
      .limit(200)

    if (scriptFilter) {
      jobsQuery = jobsQuery.where(eq(schema.pipelineJob.script, scriptFilter)) as typeof jobsQuery
    }

    const jobs = await jobsQuery
    
    // Search through logs
    const results: SearchResult[] = []
    const queryLower = searchQuery.toLowerCase()
    
    for (const job of jobs) {
      if (results.length >= maxResults) break
      
      const lines: string[] = (job.logs as string[]) || []
      
      for (let i = 0; i < lines.length && results.length < maxResults; i++) {
        const line = lines[i]
        if (line && line.toLowerCase().includes(queryLower)) {
          // Get context lines
          const beforeStart = Math.max(0, i - contextLines)
          const afterEnd = Math.min(lines.length, i + contextLines + 1)
          
          results.push({
            jobId: job.id,
            script: job.script,
            status: job.status,
            startedAt: job.startedAt?.getTime() ?? null,
            line: i + 1,
            content: line,
            context: {
              before: lines.slice(beforeStart, i),
              after: lines.slice(i + 1, afterEnd)
            }
          })
        }
      }
    }
    
    // Get unique scripts for filter UI
    const scripts = [...new Set(jobs.map(j => j.script))]
    
    return {
      query: searchQuery,
      results,
      totalResults: results.length,
      scripts,
      truncated: results.length >= maxResults
    }
  } catch (error) {
    console.error('Failed to search pipeline logs:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to search pipeline logs'
    })
  }
})
