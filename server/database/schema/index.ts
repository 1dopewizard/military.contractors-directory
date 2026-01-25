/**
 * @file Schema index - Re-exports all schema tables
 * @description Unified schema export for the military.contractors database
 */

// Auth tables (Better Auth)
export * from './auth'

// Core reference tables
export * from './core'

// Companies
export * from './companies'

// Directory (contractors, specialties, locations)
export * from './directory'

// Jobs
export * from './jobs'

// MOS (Military Occupational Specialty)
export * from './mos'

// User profiles and preferences
export * from './users'

// Campaigns and advertising
export * from './campaigns'

// CRM and leads
export * from './crm'

// Pipeline jobs
export * from './pipeline'

// Admin
export * from './admin'

// Community intel
export * from './community'

// Analytics
export * from './analytics'
