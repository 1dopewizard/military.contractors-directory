/**
 * @file Campaigns and advertising schema
 * @description Campaigns, toast ads, featured employers/listings, sponsored content
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { contractor } from './directory'
import { job } from './jobs'

export const campaign = sqliteTable('campaign', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  budget: integer('budget'),
  spent: integer('spent').default(0),
  startDate: integer('startDate', { mode: 'timestamp' }),
  endDate: integer('endDate', { mode: 'timestamp' }),
  targetingRules: text('targetingRules', { mode: 'json' }),
  createdBy: text('createdBy').references(() => user.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('campaign_status_idx').on(table.status),
  index('campaign_type_idx').on(table.type),
])

export const toastAd = sqliteTable('toast_ad', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  body: text('body').notNull(),
  ctaText: text('ctaText'),
  ctaUrl: text('ctaUrl'),
  imageUrl: text('imageUrl'),
  campaignId: text('campaignId').references(() => campaign.id),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  priority: integer('priority').default(0),
  startsAt: integer('startsAt', { mode: 'timestamp' }),
  endsAt: integer('endsAt', { mode: 'timestamp' }),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  dismissals: integer('dismissals').default(0),
  targeting: text('targeting', { mode: 'json' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('toast_ad_active_idx').on(table.isActive),
  index('toast_ad_campaign_idx').on(table.campaignId),
])

export const toastAdEvent = sqliteTable('toast_ad_event', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  toastAdId: text('toastAdId').notNull().references(() => toastAd.id, { onDelete: 'cascade' }),
  eventType: text('eventType').notNull(),
  userId: text('userId').references(() => user.id),
  sessionId: text('sessionId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('toast_event_ad_idx').on(table.toastAdId),
  index('toast_event_type_idx').on(table.eventType),
])

export const featuredEmployer = sqliteTable('featured_employer', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contractorId: text('contractorId').notNull().references(() => contractor.id, { onDelete: 'cascade' }),
  tagline: text('tagline'),
  displayOrder: integer('displayOrder'),
  startsAt: integer('startsAt', { mode: 'timestamp' }).notNull(),
  endsAt: integer('endsAt', { mode: 'timestamp' }).notNull(),
  isPinned: integer('isPinned', { mode: 'boolean' }).default(false),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('featured_employer_contractor_idx').on(table.contractorId),
  index('featured_employer_pinned_idx').on(table.isPinned),
])

interface FeaturedListingRequestData {
  contactName: string
  contactEmail: string
  contactPhone?: string
  requestedAt: string
}

export const featuredListing = sqliteTable('featured_listing', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text('jobId').notNull().references(() => job.id, { onDelete: 'cascade' }),
  displayOrder: integer('displayOrder'),
  startsAt: integer('startsAt', { mode: 'timestamp' }).notNull(),
  endsAt: integer('endsAt', { mode: 'timestamp' }).notNull(),
  isPinned: integer('isPinned', { mode: 'boolean' }).default(false),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  status: text('status').default('pending'), // pending, approved, rejected, expired
  requestData: text('requestData', { mode: 'json' }).$type<FeaturedListingRequestData>(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('featured_listing_job_idx').on(table.jobId),
  index('featured_listing_status_idx').on(table.status),
  index('featured_listing_pinned_idx').on(table.isPinned),
])

export const sponsoredAd = sqliteTable('sponsored_ad', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  advertiser: text('advertiser').notNull(),
  tagline: text('tagline'),
  headline: text('headline').notNull(),
  description: text('description'),
  ctaText: text('ctaText'),
  ctaUrl: text('ctaUrl'),
  status: text('status').notNull(),
  startsAt: integer('startsAt', { mode: 'timestamp' }),
  endsAt: integer('endsAt', { mode: 'timestamp' }),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  priority: integer('priority').default(0),
  industries: text('industries', { mode: 'json' }).$type<string[]>(),
  matchedMosCodes: text('matchedMosCodes', { mode: 'json' }).$type<string[]>(),
  embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
  createdBy: text('createdBy').references(() => user.id),
  reviewedBy: text('reviewedBy').references(() => user.id),
  reviewedAt: integer('reviewedAt', { mode: 'timestamp' }),
  rejectionReason: text('rejectionReason'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('sponsored_ad_status_idx').on(table.status),
  index('sponsored_ad_advertiser_idx').on(table.advertiser),
])

export const sponsoredJob = sqliteTable('sponsored_job', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  clearance: text('clearance'),
  salary: text('salary'),
  pitch: text('pitch'),
  applyUrl: text('applyUrl').notNull(),
  status: text('status').notNull(),
  locationType: text('locationType'),
  sponsorCategory: text('sponsorCategory'),
  startsAt: integer('startsAt', { mode: 'timestamp' }),
  endsAt: integer('endsAt', { mode: 'timestamp' }),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  priority: integer('priority').default(0),
  matchedMosCodes: text('matchedMosCodes', { mode: 'json' }).$type<string[]>(),
  embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
  createdBy: text('createdBy').references(() => user.id),
  reviewedBy: text('reviewedBy').references(() => user.id),
  reviewedAt: integer('reviewedAt', { mode: 'timestamp' }),
  rejectionReason: text('rejectionReason'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('sponsored_job_status_idx').on(table.status),
  index('sponsored_job_company_idx').on(table.company),
])
