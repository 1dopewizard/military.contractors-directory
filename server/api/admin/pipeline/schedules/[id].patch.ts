/**
 * PATCH /api/admin/pipeline/schedules/[id]
 * Update a pipeline schedule
 */

import { updateSchedule, validateCronExpression } from '@/server/utils/pipeline-scheduler'
import { initializePipeline, isScriptRegistered, type PipelineScriptName } from '@/lib/pipeline'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Schedule ID is required',
    })
  }

  const body = await readBody(event)
  const { name, script, cronExpression, args, dryRun, enabled } = body as {
    name?: string
    script?: string
    cronExpression?: string
    args?: Record<string, string | number | boolean>
    dryRun?: boolean
    enabled?: boolean
  }

  // Initialize pipeline and validate script if provided
  initializePipeline()
  if (script && !isScriptRegistered(script)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid script name',
    })
  }

  if (cronExpression) {
    const validation = validateCronExpression(cronExpression)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        message: validation.error,
      })
    }
  }

  try {
    const schedule = await updateSchedule(id, {
      name: name?.trim(),
      script: script as PipelineScriptName | undefined,
      cronExpression,
      args,
      dryRun,
      enabled,
    })

    if (!schedule) {
      throw createError({
        statusCode: 404,
        message: 'Schedule not found',
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
      message: err instanceof Error ? err.message : 'Failed to update schedule',
    })
  }
})
