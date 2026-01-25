/**
 * POST /api/admin/pipeline/run
 * Start a pipeline job using the TypeScript pipeline framework (Drizzle-backed)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import {
  runPipeline,
  initializePipeline,
  isScriptRegistered,
  getScriptMetadata,
  type PipelineScriptName,
} from '@/lib/pipeline'

const RunJobSchema = z.object({
  script: z.string(),
  dryRun: z.boolean().optional().default(false),
  args: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
})

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  const body = await readBody(event)

  // Validate request body
  const parseResult = RunJobSchema.safeParse(body)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: `Invalid request: ${parseResult.error.message}`,
    })
  }

  const { script, dryRun, args } = parseResult.data

  // Initialize pipeline scripts registry
  initializePipeline()

  // Validate script exists
  if (!isScriptRegistered(script)) {
    const available = getScriptMetadata().map((s) => s.name)
    throw createError({
      statusCode: 400,
      message: `Unknown script: ${script}. Available scripts: ${available.join(', ')}`,
    })
  }

  const db = getDb()

  // Check if a job is already running
  const [currentJob] = await db
    .select()
    .from(schema.pipelineJob)
    .where(eq(schema.pipelineJob.status, 'running'))
    .limit(1)

  if (currentJob) {
    throw createError({
      statusCode: 409,
      message: 'A job is already running. Please wait for it to complete or cancel it.',
    })
  }

  try {
    // Start the pipeline execution using SQL database directly
    const result = await runPipeline(db, script as PipelineScriptName, {
      dryRun,
      args,
    })

    // Get the created job from the database for the response
    const [job] = await db
      .select()
      .from(schema.pipelineJob)
      .where(eq(schema.pipelineJob.id, result.jobId))
      .limit(1)

    return {
      success: true,
      job: job
        ? {
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
          }
        : null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start job'
    throw createError({
      statusCode: 500,
      message,
    })
  }
})
