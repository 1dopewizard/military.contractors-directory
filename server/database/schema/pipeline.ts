/**
 * @file Pipeline schema
 * @description Pipeline jobs and schedules for background processing
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const pipelineJob = sqliteTable('pipeline_job', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  script: text('script').notNull(),
  status: text('status').notNull().default('idle'), // idle, running, completed, failed, cancelled
  dryRun: integer('dryRun', { mode: 'boolean' }).default(false),
  args: text('args', { mode: 'json' }),
  startedAt: integer('startedAt', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  exitCode: integer('exitCode'),
  error: text('error'),
  logs: text('logs', { mode: 'json' }).$type<string[]>(),
  createdBy: text('createdBy').references(() => user.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('pipeline_job_status_idx').on(table.status),
  index('pipeline_job_script_idx').on(table.script),
  index('pipeline_job_started_idx').on(table.startedAt),
])

export const pipelineSchedule = sqliteTable('pipeline_schedule', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  script: text('script').notNull(),
  cronExpression: text('cronExpression').notNull(),
  args: text('args', { mode: 'json' }),
  dryRun: integer('dryRun', { mode: 'boolean' }).notNull().default(false),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastRunAt: integer('lastRunAt', { mode: 'timestamp' }),
  nextRunAt: integer('nextRunAt', { mode: 'timestamp' }),
  createdBy: text('createdBy').references(() => user.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('pipeline_schedule_enabled_idx').on(table.enabled),
  index('pipeline_schedule_script_idx').on(table.script),
  index('pipeline_schedule_next_run_idx').on(table.nextRunAt),
])
