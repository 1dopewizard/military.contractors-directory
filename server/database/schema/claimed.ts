/**
 * @file Claimed profiles and sponsored content schema
 * @description Tables for employer profile claiming and sponsored content management
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { user } from './auth'
import { contractor } from './directory'

/**
 * Claimed profile - Links a user to a contractor they manage
 */
export const claimedProfile = sqliteTable('claimedProfile', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contractorId: text('contractorId')
    .notNull()
    .references(() => contractor.id, { onDelete: 'cascade' })
    .unique(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  tier: text('tier', { enum: ['claimed', 'premium', 'enterprise'] }).notNull().default('claimed'),
  status: text('status', { enum: ['pending', 'active', 'suspended'] }).notNull().default('pending'),
  verifiedAt: integer('verifiedAt', { mode: 'timestamp' }),
  verificationMethod: text('verificationMethod', { enum: ['email_domain', 'manual', 'document'] }),
  monthlyPrice: integer('monthlyPrice'), // in cents
  billingStartedAt: integer('billingStartedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('claimedProfile_contractor_idx').on(table.contractorId),
  index('claimedProfile_user_idx').on(table.userId),
  index('claimedProfile_status_idx').on(table.status),
])

/**
 * Employer users - Users who can manage claimed profiles
 */
export const employerUser = sqliteTable('employerUser', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  claimedProfileId: text('claimedProfileId')
    .notNull()
    .references(() => claimedProfile.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'editor'] }).notNull().default('editor'),
  invitedBy: text('invitedBy').references(() => user.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('employerUser_user_idx').on(table.userId),
  index('employerUser_profile_idx').on(table.claimedProfileId),
])

/**
 * Sponsored content blocks on profile pages
 */
export const sponsoredContent = sqliteTable('sponsoredContent', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  claimedProfileId: text('claimedProfileId')
    .notNull()
    .references(() => claimedProfile.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['spotlight', 'why_work_here', 'testimonial', 'programs'] }).notNull(),
  status: text('status', { enum: ['draft', 'pending_review', 'approved', 'rejected'] }).notNull().default('draft'),
  title: text('title'),
  content: text('content'), // JSON for type-specific fields
  mediaUrl: text('mediaUrl'),
  ctaText: text('ctaText'),
  ctaUrl: text('ctaUrl'),
  reviewedBy: text('reviewedBy').references(() => user.id),
  reviewedAt: integer('reviewedAt', { mode: 'timestamp' }),
  rejectionReason: text('rejectionReason'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('sponsoredContent_profile_idx').on(table.claimedProfileId),
  index('sponsoredContent_status_idx').on(table.status),
])

/**
 * "Why Work Here" benefits
 */
export const employerBenefit = sqliteTable('employerBenefit', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  claimedProfileId: text('claimedProfileId')
    .notNull()
    .references(() => claimedProfile.id, { onDelete: 'cascade' }),
  icon: text('icon').notNull(), // Iconify icon name
  title: text('title').notNull(), // 50 chars max
  description: text('description').notNull(), // 150 chars max
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('employerBenefit_profile_idx').on(table.claimedProfileId),
])

/**
 * Notable programs/products
 */
export const employerProgram = sqliteTable('employerProgram', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  claimedProfileId: text('claimedProfileId')
    .notNull()
    .references(() => claimedProfile.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category'),
  description: text('description'), // 200 chars max
  imageUrl: text('imageUrl'),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('employerProgram_profile_idx').on(table.claimedProfileId),
])

/**
 * Employee testimonials
 */
export const employerTestimonial = sqliteTable('employerTestimonial', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  claimedProfileId: text('claimedProfileId')
    .notNull()
    .references(() => claimedProfile.id, { onDelete: 'cascade' }),
  quote: text('quote').notNull(), // 300 chars max
  employeeName: text('employeeName').notNull(),
  employeeTitle: text('employeeTitle').notNull(),
  employeePhotoUrl: text('employeePhotoUrl'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('employerTestimonial_profile_idx').on(table.claimedProfileId),
  index('employerTestimonial_status_idx').on(table.status),
])

// Relations
export const claimedProfileRelations = relations(claimedProfile, ({ one, many }) => ({
  contractor: one(contractor, {
    fields: [claimedProfile.contractorId],
    references: [contractor.id],
  }),
  owner: one(user, {
    fields: [claimedProfile.userId],
    references: [user.id],
  }),
  employerUsers: many(employerUser),
  sponsoredContent: many(sponsoredContent),
  benefits: many(employerBenefit),
  programs: many(employerProgram),
  testimonials: many(employerTestimonial),
}))

export const employerUserRelations = relations(employerUser, ({ one }) => ({
  user: one(user, {
    fields: [employerUser.userId],
    references: [user.id],
  }),
  claimedProfile: one(claimedProfile, {
    fields: [employerUser.claimedProfileId],
    references: [claimedProfile.id],
  }),
  inviter: one(user, {
    fields: [employerUser.invitedBy],
    references: [user.id],
  }),
}))

export const sponsoredContentRelations = relations(sponsoredContent, ({ one }) => ({
  claimedProfile: one(claimedProfile, {
    fields: [sponsoredContent.claimedProfileId],
    references: [claimedProfile.id],
  }),
  reviewer: one(user, {
    fields: [sponsoredContent.reviewedBy],
    references: [user.id],
  }),
}))

export const employerBenefitRelations = relations(employerBenefit, ({ one }) => ({
  claimedProfile: one(claimedProfile, {
    fields: [employerBenefit.claimedProfileId],
    references: [claimedProfile.id],
  }),
}))

export const employerProgramRelations = relations(employerProgram, ({ one }) => ({
  claimedProfile: one(claimedProfile, {
    fields: [employerProgram.claimedProfileId],
    references: [claimedProfile.id],
  }),
}))

export const employerTestimonialRelations = relations(employerTestimonial, ({ one }) => ({
  claimedProfile: one(claimedProfile, {
    fields: [employerTestimonial.claimedProfileId],
    references: [claimedProfile.id],
  }),
}))
