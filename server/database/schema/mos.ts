/**
 * @file MOS (Military Occupational Specialty) schema
 * @description MOS codes and related mappings
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { company } from './companies'
import { job } from './jobs'

// JSON type definitions
interface ClearanceProfile {
  typical?: string
  typical_min?: string
  typical_target?: string
  polygraphCommon?: boolean
  sci_exposure_likelihood?: string
}

interface DeploymentProfile {
  conusPercent?: number
  oconusPercent?: number
  remotePercent?: number
  oconus_likelihood?: string
  hardship_likelihood?: string
  common_theaters?: string[]
}

interface SeniorityDistribution {
  entry?: number
  mid?: number
  senior?: number
  entry_level?: number
  mid_level?: number
}

export const mosCode = sqliteTable('mos_code', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  branch: text('branch').notNull(), // army, navy, air_force, marine_corps, coast_guard, space_force
  code: text('code').notNull(),
  name: text('name').notNull(),
  rank: text('rank').notNull(),
  description: text('description'),
  sourceUrl: text('sourceUrl').notNull(),
  mosCategory: text('mosCategory'), // IT_CYBER, INTELLIGENCE, COMMUNICATIONS, COMBAT, LOGISTICS, MEDICAL, AVIATION, ENGINEERING, SUPPORT, UNCLASSIFIED
  summarizedDescription: text('summarizedDescription'),
  source: text('source'),
  // Enrichment fields
  coreSkills: text('coreSkills', { mode: 'json' }).$type<string[]>(),
  toolsPlatforms: text('toolsPlatforms', { mode: 'json' }).$type<string[]>(),
  missionDomains: text('missionDomains', { mode: 'json' }).$type<string[]>(),
  environments: text('environments', { mode: 'json' }).$type<string[]>(),
  civilianRoles: text('civilianRoles', { mode: 'json' }).$type<string[]>(),
  roleFamilies: text('roleFamilies', { mode: 'json' }).$type<string[]>(),
  companyArchetypes: text('companyArchetypes', { mode: 'json' }).$type<string[]>(),
  clearanceProfile: text('clearanceProfile', { mode: 'json' }).$type<ClearanceProfile>(),
  deploymentProfile: text('deploymentProfile', { mode: 'json' }).$type<DeploymentProfile>(),
  seniorityDistribution: text('seniorityDistribution', { mode: 'json' }).$type<SeniorityDistribution>(),
  payBandHint: text('payBandHint'), // LOW, MEDIUM, HIGH
  commonCerts: text('commonCerts', { mode: 'json' }).$type<string[]>(),
  recommendedCertsContract: text('recommendedCertsContract', { mode: 'json' }).$type<string[]>(),
  trainingPaths: text('trainingPaths', { mode: 'json' }).$type<string[]>(),
  // Job counts
  jobCountTotal: integer('jobCountTotal').default(0),
  jobCountOconus: integer('jobCountOconus').default(0),
  jobCountConus: integer('jobCountConus').default(0),
  // Enrichment metadata
  enrichmentVersion: integer('enrichmentVersion'),
  lastEnrichedAt: integer('lastEnrichedAt', { mode: 'timestamp' }),
  // Vector embedding
  embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
  // Timestamps
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('mos_branch_idx').on(table.branch),
  index('mos_code_idx').on(table.code),
  index('mos_branch_code_idx').on(table.branch, table.code),
  index('mos_category_idx').on(table.mosCategory),
])

export const jobMosMapping = sqliteTable('job_mos_mapping', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text('jobId').notNull().references(() => job.id, { onDelete: 'cascade' }),
  mosId: text('mosId').notNull().references(() => mosCode.id, { onDelete: 'cascade' }),
  matchScore: real('matchScore'),
  mappingSource: text('mappingSource'),
  explanation: text('explanation'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('job_mos_job_idx').on(table.jobId),
  index('job_mos_mos_idx').on(table.mosId),
  index('job_mos_unique_idx').on(table.jobId, table.mosId),
])

export const companyMos = sqliteTable('company_mos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('companyId').notNull().references(() => company.id, { onDelete: 'cascade' }),
  mosId: text('mosId').notNull().references(() => mosCode.id, { onDelete: 'cascade' }),
  jobCount: integer('jobCount').default(0),
  matchScore: real('matchScore'),
  strength: text('strength'), // STRONG, MEDIUM, WEAK
  typicalRoles: text('typicalRoles', { mode: 'json' }).$type<string[]>(),
  typicalClearance: text('typicalClearance'),
  source: text('source'),
  confidence: text('confidence'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('company_mos_company_idx').on(table.companyId),
  index('company_mos_mos_idx').on(table.mosId),
  index('company_mos_unique_idx').on(table.companyId, table.mosId),
])

export const mosJobRanking = sqliteTable('mos_job_ranking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mosId: text('mosId').notNull().references(() => mosCode.id, { onDelete: 'cascade' }),
  jobId: text('jobId').notNull().references(() => job.id, { onDelete: 'cascade' }),
  score: real('score').notNull(),
  rank: integer('rank'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('mos_job_ranking_mos_idx').on(table.mosId),
  index('mos_job_ranking_job_idx').on(table.jobId),
  index('mos_job_ranking_mos_score_idx').on(table.mosId, table.score),
])

export const mosStat = sqliteTable('mos_stat', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mosId: text('mosId').notNull().references(() => mosCode.id, { onDelete: 'cascade' }).unique(),
  mosCode: text('mosCode').notNull(),
  activeJobs: integer('activeJobs').notNull().default(0),
  strongMatches: integer('strongMatches').notNull().default(0),
  mediumMatches: integer('mediumMatches').notNull().default(0),
  weakMatches: integer('weakMatches').notNull().default(0),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('mos_stat_mos_idx').on(table.mosId),
  index('mos_stat_code_idx').on(table.mosCode),
])
