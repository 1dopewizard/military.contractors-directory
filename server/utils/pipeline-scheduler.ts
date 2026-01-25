/**
 * Pipeline Scheduler Service
 * Manages scheduled pipeline job execution using cron expressions.
 * Schedule persistence is handled via libSQL/Drizzle.
 *
 * This module uses the TypeScript pipeline framework for job execution.
 */

import { db, getDb, schema } from './db'
import { eq } from 'drizzle-orm'
import {
  runPipeline,
  initializePipeline,
  isScriptRegistered,
  type PipelineScriptName,
} from '@/lib/pipeline'

export interface Schedule {
  id: string
  name: string
  script: PipelineScriptName
  cronExpression: string
  args: Record<string, string | number | boolean>
  dryRun: boolean
  enabled: boolean
  lastRunAt: Date | null
  nextRunAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// In-memory store for active cron jobs (timeout instances)
const activeSchedules = new Map<string, NodeJS.Timeout>()

/**
 * Convert database record to Schedule interface
 */
function dbRecordToSchedule(record: typeof schema.pipelineSchedule.$inferSelect): Schedule {
  return {
    id: record.id,
    name: record.name,
    script: record.script as PipelineScriptName,
    cronExpression: record.cronExpression,
    args: (record.args as Record<string, string | number | boolean>) ?? {},
    dryRun: record.dryRun ?? false,
    enabled: record.enabled ?? true,
    lastRunAt: record.lastRunAt ? new Date(record.lastRunAt) : null,
    nextRunAt: record.nextRunAt ? new Date(record.nextRunAt) : null,
    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
  }
}

/**
 * Parse a cron expression and get the next run time
 * This is a simplified implementation - for production, use a library like cron-parser
 */
export function getNextRunTime(cronExpression: string): Date | null {
  try {
    // Very basic cron parsing for common patterns
    // Format: minute hour day month weekday
    const parts = cronExpression.trim().split(/\s+/)
    if (parts.length !== 5) return null

    const now = new Date()
    const next = new Date(now)

    // Parse minute
    const [minute = '', hour = ''] = parts

    if (minute !== '*') {
      next.setMinutes(parseInt(minute))
      if (next.getMinutes() <= now.getMinutes() && hour === '*') {
        next.setHours(next.getHours() + 1)
      }
    }

    if (hour !== '*') {
      next.setHours(parseInt(hour))
      if (
        next.getHours() < now.getHours() ||
        (next.getHours() === now.getHours() && next.getMinutes() <= now.getMinutes())
      ) {
        next.setDate(next.getDate() + 1)
      }
    }

    next.setSeconds(0)
    next.setMilliseconds(0)

    return next
  } catch {
    return null
  }
}

/**
 * Validate a cron expression
 */
export function validateCronExpression(expression: string): { valid: boolean; error?: string } {
  const parts = expression.trim().split(/\s+/)

  if (parts.length !== 5) {
    return {
      valid: false,
      error: 'Cron expression must have 5 fields (minute hour day month weekday)',
    }
  }

  const [minute = '', hour = '', day = '', month = '', weekday = ''] = parts

  // Basic validation
  const validateField = (field: string, min: number, max: number, name: string): string | null => {
    if (field === '*') return null
    if (field.includes('/')) {
      const [base = '', step = ''] = field.split('/')
      if (
        base !== '*' &&
        (isNaN(parseInt(base)) || parseInt(base) < min || parseInt(base) > max)
      ) {
        return `Invalid ${name} base value`
      }
      if (isNaN(parseInt(step)) || parseInt(step) < 1) {
        return `Invalid ${name} step value`
      }
      return null
    }
    if (field.includes('-')) {
      const [start = '', end = ''] = field.split('-')
      if (isNaN(parseInt(start)) || isNaN(parseInt(end))) {
        return `Invalid ${name} range`
      }
      return null
    }
    if (field.includes(',')) {
      const values = field.split(',')
      for (const v of values) {
        const num = parseInt(v)
        if (isNaN(num) || num < min || num > max) {
          return `Invalid ${name} list value: ${v}`
        }
      }
      return null
    }
    const num = parseInt(field)
    if (isNaN(num) || num < min || num > max) {
      return `${name} must be between ${min} and ${max}`
    }
    return null
  }

  const minuteError = validateField(minute, 0, 59, 'Minute')
  if (minuteError) return { valid: false, error: minuteError }

  const hourError = validateField(hour, 0, 23, 'Hour')
  if (hourError) return { valid: false, error: hourError }

  const dayError = validateField(day, 1, 31, 'Day')
  if (dayError) return { valid: false, error: dayError }

  const monthError = validateField(month, 1, 12, 'Month')
  if (monthError) return { valid: false, error: monthError }

  const weekdayError = validateField(weekday, 0, 6, 'Weekday')
  if (weekdayError) return { valid: false, error: weekdayError }

  return { valid: true }
}

/**
 * List all schedules
 */
export async function listSchedules(): Promise<Schedule[]> {
  const records = await db.query.pipelineSchedule.findMany()
  return records.map(dbRecordToSchedule)
}

/**
 * Get a schedule by ID
 */
export async function getSchedule(id: string): Promise<Schedule | null> {
  const record = await db.query.pipelineSchedule.findFirst({
    where: eq(schema.pipelineSchedule.id, id),
  })
  return record ? dbRecordToSchedule(record) : null
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: {
  name: string
  script: PipelineScriptName
  cronExpression: string
  args?: Record<string, string | number | boolean>
  dryRun?: boolean
  enabled?: boolean
}): Promise<Schedule> {
  // Validate cron expression
  const validation = validateCronExpression(data.cronExpression)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Validate script exists
  initializePipeline()
  if (!isScriptRegistered(data.script)) {
    throw new Error(`Unknown script: ${data.script}`)
  }

  const nextRunAt = getNextRunTime(data.cronExpression)
  const now = Date.now()

  const [newSchedule] = await db.insert(schema.pipelineSchedule).values({
    name: data.name,
    script: data.script,
    cronExpression: data.cronExpression,
    args: data.args || {},
    dryRun: data.dryRun ?? false,
    enabled: data.enabled ?? true,
    nextRunAt: nextRunAt?.getTime() || null,
    createdAt: now,
    updatedAt: now,
  }).returning()

  if (!newSchedule) throw new Error('Failed to create schedule')

  return dbRecordToSchedule(newSchedule)
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<{
    name: string
    script: PipelineScriptName
    cronExpression: string
    args: Record<string, string | number | boolean>
    dryRun: boolean
    enabled: boolean
  }>
): Promise<Schedule | null> {
  // Validate cron expression if provided
  if (data.cronExpression) {
    const validation = validateCronExpression(data.cronExpression)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
  }

  // Validate script if provided
  if (data.script) {
    initializePipeline()
    if (!isScriptRegistered(data.script)) {
      throw new Error(`Unknown script: ${data.script}`)
    }
  }

  // Calculate next run time if cron changed
  let nextRunAt: number | undefined
  if (data.cronExpression) {
    const nextRun = getNextRunTime(data.cronExpression)
    nextRunAt = nextRun?.getTime()
  }

  await db.update(schema.pipelineSchedule)
    .set({
      name: data.name,
      script: data.script,
      cronExpression: data.cronExpression,
      args: data.args,
      dryRun: data.dryRun,
      enabled: data.enabled,
      nextRunAt: nextRunAt,
      updatedAt: Date.now(),
    })
    .where(eq(schema.pipelineSchedule.id, id))

  // Stop/restart in-memory schedule if enabled status changed
  if (data.enabled === false) {
    stopSchedule(id)
  }

  // Fetch updated schedule
  const record = await db.query.pipelineSchedule.findFirst({
    where: eq(schema.pipelineSchedule.id, id),
  })
  return record ? dbRecordToSchedule(record) : null
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  // Stop the in-memory schedule
  stopSchedule(id)

  try {
    await db.delete(schema.pipelineSchedule).where(eq(schema.pipelineSchedule.id, id))
    return true
  } catch {
    return false
  }
}

/**
 * Execute a scheduled job using the TypeScript pipeline framework
 */
async function executeScheduledJob(schedule: Schedule): Promise<void> {
  console.log(`[Scheduler] Executing scheduled job: ${schedule.name} (${schedule.script})`)

  const pipelineDb = getDb()

  try {
    const result = await runPipeline(pipelineDb, schedule.script, {
      dryRun: schedule.dryRun,
      args: schedule.args,
    })

    console.log(`[Scheduler] Job ${schedule.name} completed with status: ${result.status}`)
  } catch (err) {
    console.error(`[Scheduler] Job ${schedule.name} failed:`, err)
  }
}

/**
 * Start a schedule (set up the interval/timeout)
 * This is a simplified implementation using setTimeout
 * For production, use node-cron for proper cron scheduling
 */
function startSchedule(schedule: Schedule) {
  if (!schedule.enabled || !schedule.nextRunAt) return

  // Calculate delay until next run
  const now = Date.now()
  const nextRun = schedule.nextRunAt.getTime()
  const delay = Math.max(0, nextRun - now)

  // Don't schedule if more than 24 hours away (will be re-scheduled on next server start)
  if (delay > 24 * 60 * 60 * 1000) return

  const timeout = setTimeout(async () => {
    try {
      // Execute the job using TypeScript pipeline framework
      await executeScheduledJob(schedule)

      // Calculate next run time
      const nextRunTime = getNextRunTime(schedule.cronExpression)

      // Record the run in database
      try {
        await db.update(schema.pipelineSchedule)
          .set({
            lastRunAt: Date.now(),
            nextRunAt: nextRunTime?.getTime() || null,
            updatedAt: Date.now(),
          })
          .where(eq(schema.pipelineSchedule.id, schedule.id))
      } catch (err) {
        console.error(`Failed to record schedule run for ${schedule.id}:`, err)
      }

      // Schedule next run
      if (nextRunTime) {
        const updatedSchedule = { ...schedule, lastRunAt: new Date(), nextRunAt: nextRunTime }
        startSchedule(updatedSchedule)
      }
    } catch (err) {
      console.error(`Failed to execute scheduled job ${schedule.id}:`, err)
    }
  }, delay)

  activeSchedules.set(schedule.id, timeout)
}

/**
 * Stop a schedule
 */
function stopSchedule(id: string) {
  const timeout = activeSchedules.get(id)
  if (timeout) {
    clearTimeout(timeout)
    activeSchedules.delete(id)
  }
}

/**
 * Initialize all enabled schedules on server start
 */
export async function initializeSchedules() {
  try {
    // Initialize the pipeline framework
    initializePipeline()

    const records = await db.query.pipelineSchedule.findMany({
      where: eq(schema.pipelineSchedule.enabled, true),
    })
    const schedules = records.map(dbRecordToSchedule)

    for (const schedule of schedules) {
      if (schedule.enabled) {
        // Recalculate next run time if needed
        if (!schedule.nextRunAt || schedule.nextRunAt < new Date()) {
          const nextRun = getNextRunTime(schedule.cronExpression)
          if (nextRun) {
            schedule.nextRunAt = nextRun
            // Update in database
            try {
              await db.update(schema.pipelineSchedule)
                .set({
                  nextRunAt: nextRun.getTime(),
                  updatedAt: Date.now(),
                })
                .where(eq(schema.pipelineSchedule.id, schedule.id))
            } catch (err) {
              console.error(`Failed to update next run time for schedule ${schedule.id}:`, err)
            }
          }
        }

        startSchedule(schedule)
      }
    }

    console.log(
      `[Pipeline] Initialized ${schedules.filter((s) => s.enabled).length} pipeline schedules`
    )
  } catch (err) {
    console.error('[Pipeline] Failed to initialize schedules:', err)
  }
}

/**
 * Get common cron presets for UI
 */
export function getCronPresets(): { label: string; value: string; description: string }[] {
  return [
    { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
    { label: 'Daily at midnight', value: '0 0 * * *', description: 'Runs at 00:00 every day' },
    { label: 'Daily at 6 AM', value: '0 6 * * *', description: 'Runs at 06:00 every day' },
    { label: 'Daily at noon', value: '0 12 * * *', description: 'Runs at 12:00 every day' },
    { label: 'Daily at 6 PM', value: '0 18 * * *', description: 'Runs at 18:00 every day' },
    { label: 'Weekly on Sunday', value: '0 0 * * 0', description: 'Runs at midnight on Sunday' },
    { label: 'Weekly on Monday', value: '0 6 * * 1', description: 'Runs at 6 AM on Monday' },
    {
      label: 'Monthly',
      value: '0 0 1 * *',
      description: 'Runs at midnight on the 1st of each month',
    },
  ]
}
