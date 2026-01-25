/**
 * DELETE /api/admin/pipeline/schedules/[id]
 * Delete a pipeline schedule
 */

import { deleteSchedule } from '@/server/utils/pipeline-scheduler'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Schedule ID is required'
    })
  }
  
  const success = await deleteSchedule(id)
  
  if (!success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to delete schedule'
    })
  }
  
  return { success: true }
})

