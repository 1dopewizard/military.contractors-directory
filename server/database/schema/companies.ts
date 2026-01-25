/**
 * @file Company schema tables
 * @description Defense contractor companies
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const company = sqliteTable('company', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  aliases: text('aliases', { mode: 'json' }).$type<string[]>(), // Former names, abbreviations, common misspellings
  summary: text('summary').notNull(),
  description: text('description'),
  logoUrl: text('logoUrl'),
  websiteUrl: text('websiteUrl'),
  careersUrl: text('careersUrl'),
  headquarters: text('headquarters'),
  employeeCount: text('employeeCount'),
  foundedYear: integer('foundedYear'),
  stockSymbol: text('stockSymbol'),
  domains: text('domains', { mode: 'json' }).$type<string[]>(),
  theaters: text('theaters', { mode: 'json' }).$type<string[]>(),
  isPrimeContractor: integer('isPrimeContractor', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
