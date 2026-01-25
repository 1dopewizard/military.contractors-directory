/**
 * @file Core reference tables
 * @description Theaters and bases reference data
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const theater = sqliteTable('theater', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(), // CENTCOM, EUCOM, etc.
  name: text('name').notNull(),
  description: text('description'),
  region: text('region'),
  countries: text('countries', { mode: 'json' }).$type<string[]>(),
  majorBases: text('majorBases', { mode: 'json' }).$type<string[]>(),
  jobCount: integer('jobCount').default(0),
  avgSalaryMin: integer('avgSalaryMin'),
  avgSalaryMax: integer('avgSalaryMax'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const base = sqliteTable('base', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  theaterCode: text('theaterCode').references(() => theater.code),
  country: text('country').notNull(),
  city: text('city'),
  description: text('description'),
  jobCount: integer('jobCount').default(0),
  coordinatesLat: real('coordinatesLat'),
  coordinatesLng: real('coordinatesLng'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
