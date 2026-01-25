/**
 * GET /api/admin/pipeline/schedules/[id]
 * Get a specific schedule by ID
 */

import { getSchedule } from '@/server/utils/pipeline-scheduler'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Schedule ID is required'
    })
  }
  
  const schedule = await getSchedule(id)
  
  if (!schedule) {
    throw createError({
      statusCode: 404,
      message: 'Schedule not found'
    })
  }
  
  return {
    ...schedule,
    lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
    nextRunAt: schedule.nextRunAt?.toISOString() ?? null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString()
  }
})

