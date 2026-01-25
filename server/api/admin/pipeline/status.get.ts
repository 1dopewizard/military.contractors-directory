/**
 * GET /api/admin/pipeline/status
 * Returns current pipeline job status, recent jobs, and available scripts (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, desc, isNull, and } from 'drizzle-orm'
import { initializePipeline, getScriptMetadata } from '@/lib/pipeline'

export default defineEventHandler(async () => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  // Initialize pipeline scripts registry
  initializePipeline()

  const db = getDb()

  // Fetch current job (running) and recent jobs
  const [currentJobResult, recentJobs] = await Promise.all([
    db
      .select()
      .from(schema.pipelineJob)
      .where(eq(schema.pipelineJob.status, 'running'))
      .limit(1),
    db
      .select()
      .from(schema.pipelineJob)
      .orderBy(desc(schema.pipelineJob.startedAt))
      .limit(20),
  ])

  const currentJob = currentJobResult[0] ?? null

  // Get script metadata from TypeScript registry
  const scriptsList = getScriptMetadata()

  // Transform scripts array to object keyed by name (matches legacy format expected by frontend)
  const scripts: Record<
    string,
    {
      name: string
      description: string
      estimatedTime: string
      category: string
      isPipeline: boolean
      supportsDryRun: boolean
    }
  > = {}

  for (const script of scriptsList) {
    scripts[script.name] = {
      name: formatScriptName(script.name),
      description: script.description,
      estimatedTime: estimateTime(script.category),
      category: script.category,
      isPipeline: script.category === 'mos' && script.name === 'mos',
      supportsDryRun: script.supportsDryRun,
    }
  }

  // Transform job data to match frontend expectations
  const formatJob = (job: typeof currentJob) =>
    job
      ? {
          id: job.id,
          script: job.script,
          status: job.status,
          startedAt: job.startedAt?.toISOString() ?? new Date().toISOString(),
          completedAt: job.completedAt?.toISOString() ?? null,
          dryRun: job.dryRun ?? false,
          args: (job.args as Record<string, unknown>) ?? {},
          logs: (job.logs as string[]) ?? [],
          exitCode: job.exitCode ?? null,
          error: job.error ?? null,
        }
      : null

  return {
    currentJob: formatJob(currentJob),
    recentJobs: recentJobs.map(formatJob).filter(Boolean),
    scripts,
  }
})

/**
 * Format script name for display
 */
function formatScriptName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Estimate execution time based on script category
 */
function estimateTime(category: string): string {
  switch (category) {
    case 'mos':
      return '2-10 min'
    case 'scraper':
      return '5-15 min'
    case 'data':
      return '1-5 min'
    case 'maintenance':
      return '< 1 min'
    default:
      return 'Unknown'
  }
}
