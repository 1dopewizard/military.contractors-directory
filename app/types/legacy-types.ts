/**
 * @file Legacy type aliases for API compatibility
 * @description Provides type definitions for API responses and legacy compatibility.
 * These types mirror the database schema for use in frontend components.
 */

// ===========================================
// Table Type Aliases
// ===========================================

/**
 * Job type for API responses
 */
export interface Job {
  id: string
  title: string
  company: string
  location: string
  location_type?: string | null
  theater?: string | null
  clearance_required: string | null
  description: string
  snippet: string | null
  salary_min: number | null
  salary_max: number | null
  slug: string | null
  is_active: boolean
  featured?: boolean | null
  posted_at: string | null
  created_at: string
  updated_at: string
}

/**
 * MilitarySpecialty type for API responses
 */
export interface MilitarySpecialty {
  id: string
  code: string
  name: string
  title?: string // Alias for name
  branch: string
  rank?: string | null
  rank_range?: string | null
  description?: string | null
  summarized_description?: string | null
  source?: string | null
  source_url?: string | null
  mos_category?: string | null
  category?: string | null
  // Enrichment fields
  core_skills?: unknown[] | null
  tools_platforms?: unknown[] | null
  mission_domains?: unknown[] | null
  environments?: unknown[] | null
  civilian_roles?: unknown[] | null
  role_families?: unknown[] | null
  company_archetypes?: unknown[] | null
  clearance_profile?: string | null
  deployment_profile?: Record<string, unknown> | null
  location_profile?: Record<string, unknown> | null
  seniority_distribution?: Record<string, unknown> | null
  pay_band_hint?: Record<string, unknown> | null
  common_certs?: unknown[] | null
  recommended_certs_contract?: unknown[] | null
  training_paths?: unknown[] | null
  transition_guidance?: string | null
  // Stats
  job_count_oconus?: number
  job_count_conus?: number
  job_count_total?: number
  // Metadata
  enrichment_version?: number
  last_enriched_at?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Company type for API responses
 */
export interface Company {
  id: string
  slug: string
  name: string
  summary?: string | null
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  headquarters?: string | null
  domains?: string[] | null
  theaters?: string[] | null
  is_prime_contractor?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * User profile type for API responses
 */
export interface Profile {
  id: string
  user_id: string
  branch?: string | null
  mos_code?: string | null
  clearance?: string | null
  email_job_alerts?: boolean
  created_at?: string
  updated_at?: string
}

// ===========================================
// Enum Types
// ===========================================

/**
 * Sponsor category for clearance sponsorship status
 */
export type SponsorCategory =
  | 'WILL_SPONSOR'
  | 'ELIGIBLE_TO_OBTAIN'
  | 'ACTIVE_ONLY'
  | 'NOT_SPECIFIED'
  | 'NOT_CLEARANCE'

/**
 * Ad status enum
 */
export type AdStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_payment'
  | 'active'
  | 'paused'
  | 'expired'
  | 'cancelled'

/**
 * Ad type enum
 */
export type AdType = 'company_spotlight' | 'sponsored_job'

/**
 * Job status enum
 */
export type JobStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED'

/**
 * Location type enum
 */
export type LocationType = 'CONUS' | 'OCONUS' | 'Remote' | 'Hybrid'

/**
 * Branch enum
 */
export type Branch =
  | 'army'
  | 'navy'
  | 'air_force'
  | 'marine_corps'
  | 'coast_guard'
  | 'space_force'

/**
 * Theater of operations
 */
export type Theater =
  | 'CENTCOM'
  | 'EUCOM'
  | 'INDOPACOM'
  | 'AFRICOM'
  | 'NORTHCOM'
  | 'SOUTHCOM'

/**
 * MOS category classification
 */
export type MosCategory =
  | 'IT_CYBER'
  | 'INTELLIGENCE'
  | 'COMMUNICATIONS'
  | 'COMBAT'
  | 'LOGISTICS'
  | 'MEDICAL'
  | 'AVIATION'
  | 'ENGINEERING'
  | 'SUPPORT'
  | 'UNCLASSIFIED'

// ===========================================
// Utility Types
// ===========================================

/**
 * JSON-compatible value type
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
