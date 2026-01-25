/**
 * @file Pipeline Executor
 * @description Main entry point for the TypeScript pipeline execution framework
 * 
 * This module provides:
 * - Pipeline execution with SQL job tracking (Drizzle/libSQL)
 * - Real-time log streaming via SQL
 * - Progress reporting
 * - Cancellation support
 * - Error handling and recovery
 * 
 * Usage:
 * ```typescript
 * import { runPipeline } from '@/lib/pipeline'
 * import { getDb } from '@/server/utils/db'
 * 
 * const db = getDb()
 * const result = await runPipeline(db, 'mos-classify', { dryRun: true })
 * ```
 */

import { eq } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type {
  PipelineScriptName,
  PipelineRunOptions,
  PipelineContext,
  PipelineResult,
  PipelineProgress,
  PipelineJobStatus,
} from './types'
import { createPipelineLogger } from './logger'
import { getScript, isScriptRegistered, registerPlaceholderScripts } from './registry'

// Re-export types and utilities
export * from './types'
export { createPipelineLogger, createConsoleLogger } from './logger'
export {
  registerScript,
  getScript,
  getAllScripts,
  getScriptsByCategory,
  getScriptNames,
  getScriptMetadata,
  defineScript,
  replaceScriptHandler,
  registerPlaceholderScripts,
  isScriptRegistered,
} from './registry'
export {
  htmlToMarkdown,
  cleanHtmlSnippet,
  extractAndConvertContent,
  createMilitarySiteTurndown,
  createPresetTurndown,
  getPresetOptions,
  type TurndownOptions,
  type SitePreset,
} from './turndown'

// Scraper base classes and utilities
export {
  BaseMilitaryScraper,
  PlaywrightMilitaryScraper,
  CheerioMilitaryScraper,
  HttpApiMilitaryScraper,
  normalizeMosCode,
  parsePersonnelCategory,
  buildCoolUrl,
  DEFAULT_SCRAPER_CONFIG,
  type MilitaryBranch,
  type MosCategory,
  type PersonnelCategory,
  type MosRawData,
  type ScraperConfig,
  type ScraperResult,
  type PlaywrightExtractionContext,
  type CheerioExtractionContext,
} from './scraper'

// Import schema types for db access
import * as pipelineSchema from '@/server/database/schema/pipeline'


/**
 * Run a pipeline script with full job tracking using SQL database
 */
export async function runPipeline(
  db: LibSQLDatabase<any>,
  scriptName: PipelineScriptName,
  options: PipelineRunOptions = {}
): Promise<PipelineResult> {
  const startTime = Date.now()
  let jobId: string | null = null
  let status: PipelineJobStatus = 'running'
  let error: string | undefined
  let exitCode = 0

  // Ensure scripts are registered
  ensureScriptsRegistered()

  // Validate script exists
  if (!isScriptRegistered(scriptName)) {
    throw new Error(`Unknown script: ${scriptName}`)
  }

  const script = getScript(scriptName)
  if (!script) {
    throw new Error(`Script "${scriptName}" not found in registry`)
  }

  try {
    // Create job in SQL database
    jobId = crypto.randomUUID()
    const now = new Date()

    await db.insert(pipelineSchema.pipelineJob).values({
      id: jobId,
      script: scriptName,
      status: 'running',
      dryRun: options.dryRun ?? false,
      args: options.args ? JSON.stringify(options.args) : null,
      startedAt: now,
      createdAt: now,
      logs: [],
    })

    // Create logger with SQL persistence
    const log = createPipelineLogger({
      db,
      schema: pipelineSchema,
      jobId,
      minLevel: 'info',
      batchSize: 10,
      flushInterval: 1000,
    })

    // Log start
    log.info(`Starting pipeline: ${scriptName}`)
    if (options.dryRun) {
      log.info('Running in DRY RUN mode - no changes will be persisted')
    }
    if (options.args) {
      log.info('Arguments:', options.args)
    }

    // Create progress reporter
    const progress = async (p: PipelineProgress): Promise<void> => {
      const percent = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0
      const phaseInfo = p.phase ? ` [${p.phase}]` : ''
      const itemInfo = p.item ? `: ${p.item}` : ''
      log.info(`Progress${phaseInfo}: ${p.current}/${p.total} (${percent}%)${itemInfo}`)
    }

    // Create cancellation checker
    const isCancelled = async (): Promise<boolean> => {
      try {
        const [job] = await db
          .select({ status: pipelineSchema.pipelineJob.status })
          .from(pipelineSchema.pipelineJob)
          .where(eq(pipelineSchema.pipelineJob.id, jobId!))
          .limit(1)
        return job?.status === 'cancelled'
      } catch {
        return false
      }
    }

    // Create context
    const ctx: PipelineContext = {
      jobId,
      script: scriptName,
      options,
      log,
      progress,
      isCancelled,
    }

    // Run the script handler
    await script.handler(ctx)

    // Success
    status = 'completed'
    exitCode = 0
    log.success(`Pipeline ${scriptName} completed successfully`)
    
    // Flush final logs
    await log.flush()

  } catch (err) {
    status = 'failed'
    exitCode = 1
    error = err instanceof Error ? err.message : String(err)
    
    console.error(`Pipeline ${scriptName} failed:`, error)
    
    // Try to log the error to SQL
    if (jobId) {
      try {
        const log = createPipelineLogger({
          db,
          schema: pipelineSchema,
          jobId,
          minLevel: 'info',
        })
        log.error(`Pipeline failed: ${error}`)
        await log.flush()
      } catch {
        // Ignore logging errors during failure handling
      }
    }
  } finally {
    // Update job status in SQL
    if (jobId) {
      try {
        await db
          .update(pipelineSchema.pipelineJob)
          .set({
            status,
            exitCode,
            error,
            completedAt: new Date(),
          })
          .where(eq(pipelineSchema.pipelineJob.id, jobId))
      } catch (completeError) {
        console.error('Failed to update job status:', completeError)
      }
    }
  }

  const durationMs = Date.now() - startTime

  return {
    jobId: jobId!,
    status,
    durationMs,
    error,
    exitCode,
  }
}

/**
 * Run a pipeline script from CLI (standalone execution)
 * 
 * This is a convenience wrapper for CLI scripts that:
 * - Creates the database client
 * - Parses common CLI arguments
 * - Handles process exit codes
 */
export async function runPipelineCLI(
  scriptName: PipelineScriptName,
  args: string[] = process.argv.slice(2)
): Promise<void> {
  // Parse CLI arguments
  const options: PipelineRunOptions = {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50'),
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || undefined,
  }

  // Parse additional key=value args
  const additionalArgs: Record<string, unknown> = {}
  for (const arg of args) {
    if (arg.startsWith('--') && arg.includes('=') && !['batch-size', 'limit', 'dry-run'].some(k => arg.includes(k))) {
      const [key, value] = arg.slice(2).split('=')
      additionalArgs[key!] = value
    }
  }
  if (Object.keys(additionalArgs).length > 0) {
    options.args = { ...options.args, ...additionalArgs }
  }

  console.log('='.repeat(60))
  console.log(`Pipeline: ${scriptName}`)
  console.log('='.repeat(60))
  console.log()

  // Dynamically import db to avoid circular dependencies
  const { getDb } = await import('@/server/utils/db')
  const db = getDb()
  
  try {
    const result = await runPipeline(db, scriptName, options)
    
    console.log()
    console.log('='.repeat(60))
    console.log(`Status: ${result.status}`)
    console.log(`Duration: ${(result.durationMs / 1000).toFixed(2)}s`)
    if (result.error) {
      console.log(`Error: ${result.error}`)
    }
    console.log('='.repeat(60))
    
    process.exit(result.exitCode)
  } catch (err) {
    console.error('Pipeline execution failed:', err)
    process.exit(1)
  }
}

/**
 * Get the current running job (if any)
 */
export async function getCurrentJob(db: LibSQLDatabase<any>) {
  const [job] = await db
    .select()
    .from(pipelineSchema.pipelineJob)
    .where(eq(pipelineSchema.pipelineJob.status, 'running'))
    .limit(1)
  return job ?? null
}

/**
 * Get job by ID
 */
export async function getJob(db: LibSQLDatabase<any>, jobId: string) {
  const [job] = await db
    .select()
    .from(pipelineSchema.pipelineJob)
    .where(eq(pipelineSchema.pipelineJob.id, jobId))
    .limit(1)
  return job ?? null
}

/**
 * List recent jobs
 */
export async function listJobs(
  db: LibSQLDatabase<any>,
  options?: { limit?: number; status?: PipelineJobStatus; script?: PipelineScriptName }
) {
  const { desc } = await import('drizzle-orm')
  
  const query = db
    .select()
    .from(pipelineSchema.pipelineJob)
    .orderBy(desc(pipelineSchema.pipelineJob.startedAt))
    .limit(options?.limit ?? 20)

  // Note: Drizzle doesn't support dynamic where clauses easily
  // For simple filtering, we handle it at the application level
  const jobs = await query
  
  return jobs.filter(job => {
    if (options?.status && job.status !== options.status) return false
    if (options?.script && job.script !== options.script) return false
    return true
  })
}

// ===========================================
// Script Registration
// ===========================================

let scriptsRegistered = false

/**
 * Ensure placeholder scripts are registered
 * Called automatically when running pipelines
 */
function ensureScriptsRegistered(): void {
  if (scriptsRegistered) return
  registerPlaceholderScripts()
  scriptsRegistered = true
}

/**
 * Initialize the pipeline framework
 * Call this once during app startup if you need early access to script metadata
 */
export function initializePipeline(): void {
  ensureScriptsRegistered()
}
