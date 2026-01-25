/**
 * POST /api/admin/pipeline/schedules
 * Create a new pipeline schedule
 */

import { createSchedule, validateCronExpression } from '@/server/utils/pipeline-scheduler'
import { initializePipeline, isScriptRegistered, type PipelineScriptName } from '@/lib/pipeline'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check

  const body = await readBody(event)
  const { name, script, cronExpression, args, dryRun, enabled } = body as {
    name: string
    script: string
    cronExpression: string
    args?: Record<string, string | number | boolean>
    dryRun?: boolean
    enabled?: boolean
  }

  // Validation
  if (!name || !name.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Schedule name is required',
    })
  }

  // Initialize pipeline and validate script
  initializePipeline()
  if (!script || !isScriptRegistered(script)) {
    throw createError({
      statusCode: 400,
      message: 'Valid script name is required',
    })
  }

  if (!cronExpression) {
    throw createError({
      statusCode: 400,
      message: 'Cron expression is required',
    })
  }

  const validation = validateCronExpression(cronExpression)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error,
    })
  }

  try {
    const schedule = await createSchedule({
      name: name.trim(),
      script: script as PipelineScriptName,
      cronExpression,
      args,
      dryRun,
      enabled,
    })

    if (!schedule) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create schedule',
      })
    }

    return {
      success: true,
      schedule: {
        ...schedule,
        lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
        nextRunAt: schedule.nextRunAt?.toISOString() ?? null,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
      },
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to create schedule',
    })
  }
})
