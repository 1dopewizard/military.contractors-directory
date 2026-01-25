/**
 * @file Analytics schema
 * @description Toast impressions and clicks tracking
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { campaign } from './campaigns'

export const toastImpression = sqliteTable('toast_impression', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text('campaignId').notNull().references(() => campaign.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => user.id),
  sessionId: text('sessionId'),
  pagePath: text('pagePath'),
  mosCode: text('mosCode'),
  companySlug: text('companySlug'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('toast_impression_campaign_idx').on(table.campaignId),
  index('toast_impression_session_idx').on(table.sessionId),
])

export const toastClick = sqliteTable('toast_click', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text('campaignId').notNull().references(() => campaign.id, { onDelete: 'cascade' }),
  impressionId: text('impressionId').references(() => toastImpression.id),
  userId: text('userId').references(() => user.id),
  sessionId: text('sessionId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('toast_click_campaign_idx').on(table.campaignId),
  index('toast_click_impression_idx').on(table.impressionId),
])
