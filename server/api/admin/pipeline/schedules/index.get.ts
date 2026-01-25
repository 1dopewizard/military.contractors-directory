/**
 * GET /api/admin/pipeline/schedules
 * List all pipeline schedules
 */

import { listSchedules, getCronPresets } from '@/server/utils/pipeline-scheduler'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check
  
  const schedules = await listSchedules()
  const presets = getCronPresets()
  
  return {
    schedules: schedules.map(s => ({
      ...s,
      lastRunAt: s.lastRunAt?.toISOString() ?? null,
      nextRunAt: s.nextRunAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    })),
    presets
  }
})

