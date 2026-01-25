/**
 * @file Community intelligence schema
 * @description Salary reports, interview experiences, helpful votes
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth'
import { company } from './companies'
import { mosCode } from './mos'

export const salaryReport = sqliteTable('salary_report', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mosCode: text('mosCode').notNull(),
  mosId: text('mosId').references(() => mosCode.id),
  companyId: text('companyId').notNull().references(() => company.id, { onDelete: 'cascade' }),
  location: text('location').notNull(),
  baseSalary: integer('baseSalary').notNull(),
  signingBonus: integer('signingBonus'),
  clearanceLevel: text('clearanceLevel').notNull(), // NONE, PUBLIC_TRUST, SECRET, TOP_SECRET, TS_SCI, TS_SCI_POLY
  yearsExperience: integer('yearsExperience').notNull(),
  employmentType: text('employmentType').notNull(), // FULL_TIME, PART_TIME, CONTRACT, CONTRACT_TO_HIRE, INTERN
  isOconus: integer('isOconus', { mode: 'boolean' }).notNull().default(false),
  verificationStatus: text('verificationStatus').notNull().default('PENDING'), // PENDING, VERIFIED, REJECTED
  submittedBy: text('submittedBy').references(() => user.id),
  helpfulCount: integer('helpfulCount').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('salary_company_idx').on(table.companyId),
  index('salary_mos_idx').on(table.mosId),
  index('salary_mos_code_idx').on(table.mosCode),
  index('salary_location_idx').on(table.location),
  index('salary_clearance_idx').on(table.clearanceLevel),
  index('salary_verification_idx').on(table.verificationStatus),
  index('salary_submitter_idx').on(table.submittedBy),
  index('salary_helpful_idx').on(table.helpfulCount),
])

export const interviewExperience = sqliteTable('interview_experience', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('companyId').notNull().references(() => company.id, { onDelete: 'cascade' }),
  mosCode: text('mosCode').notNull(),
  mosId: text('mosId').references(() => mosCode.id),
  roleTitle: text('roleTitle').notNull(),
  interviewDate: integer('interviewDate', { mode: 'timestamp' }).notNull(),
  processDescription: text('processDescription').notNull(),
  questionsAsked: text('questionsAsked', { mode: 'json' }).$type<string[]>().notNull(),
  tips: text('tips').notNull(),
  difficulty: text('difficulty').notNull(), // EASY, MEDIUM, HARD
  outcome: text('outcome').notNull(), // OFFER, REJECTED, GHOSTED, WITHDREW
  timelineWeeks: integer('timelineWeeks').notNull(),
  verificationStatus: text('verificationStatus').notNull().default('PENDING'), // PENDING, VERIFIED, REJECTED
  submittedBy: text('submittedBy').references(() => user.id),
  helpfulCount: integer('helpfulCount').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('interview_company_idx').on(table.companyId),
  index('interview_mos_idx').on(table.mosId),
  index('interview_mos_code_idx').on(table.mosCode),
  index('interview_outcome_idx').on(table.outcome),
  index('interview_difficulty_idx').on(table.difficulty),
  index('interview_verification_idx').on(table.verificationStatus),
  index('interview_submitter_idx').on(table.submittedBy),
  index('interview_helpful_idx').on(table.helpfulCount),
])

export const helpfulVote = sqliteTable('helpful_vote', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  targetType: text('targetType').notNull(), // salary, interview
  targetId: text('targetId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('helpful_vote_user_idx').on(table.userId),
  index('helpful_vote_target_idx').on(table.targetType, table.targetId),
  index('helpful_vote_unique_idx').on(table.userId, table.targetType, table.targetId),
])
