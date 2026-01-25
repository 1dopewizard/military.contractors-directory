/**
 * @file Application-specific types
 * @description Extended types for application use with computed properties
 */

import type { SponsorCategory } from './legacy-types'
import type { CompanyMosMatchStrength } from '@/app/types/company.types'

/** Re-export for convenience */
export type { SponsorCategory }

/**
 * MOS Category classification for military specialties.
 * Used to filter which MOSes are in-scope for different product verticals.
 */
export type MosCategory =
  | 'UNCLASSIFIED'  // Default — not yet classified by LLM
  | 'IT_CYBER'      // IT, cybersecurity, signals, networks — in scope for this product
  | 'INTELLIGENCE'  // Intel analysis, SIGINT, counterintelligence
  | 'LOGISTICS'     // Supply chain, transportation, maintenance management
  | 'MEDICAL'       // Healthcare, medical services, dental
  | 'AVIATION'      // Aircraft operations, flight crew, aviation maintenance
  | 'COMBAT'        // Infantry, armor, artillery, combat arms
  | 'SUPPORT'       // Admin, legal, chaplain, finance, HR, other support

/**
 * Job with computed display properties
 * Standalone type to support both Supabase and Convex backends
 */
export interface JobWithMeta {
  // Core fields
  id: string
  title: string
  company: string
  company_id?: string | null
  location: string
  location_type?: string | null
  description: string
  snippet?: string | null
  requirements?: string[] | null
  clearance_required?: string | null
  salary_min?: number | null
  salary_max?: number | null
  currency?: string | null
  featured?: boolean | null
  posted_at?: string | null
  expires_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  status?: string | null
  sponsor_category?: string | null
  is_oconus?: boolean | null
  is_active?: boolean | null
  theater?: string | null
  source_site?: string | null
  external_id?: string | null
  slug?: string | null
  seniority?: string | null
  employment_type?: string | null
  // Computed/meta fields
  formatted_salary?: string
  formatted_date?: string
  is_new?: boolean
  days_old?: number
  is_pinned?: boolean
  company_slug?: string | null
  /** Featured listing ID for tracking impressions/clicks */
  listing_id?: string
}

/**
 * Filter options for job listings
 */
export interface JobFilters {
  location_type?: 'OCONUS' | 'Remote' | 'Hybrid'
  salary_min?: number
  salary_max?: number
  clearance_required?: string
  search?: string
  match_strength?: 'STRONG' | 'MEDIUM' | 'WEAK'
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

/**
 * MOS/AFSC to Job Match Result (Legacy - use JobWithMosMatch from mos.types.ts)
 */
export interface MOSJobMatch {
  id: string
  job_title: string
  company: string
  location: string
  location_type: 'CONUS' | 'OCONUS' | 'Remote' | 'Hybrid'
  salary_min: number
  salary_max: number
  clearance_required: string
  match_score: number
  relevant_skills: string[]
  description: string
  posted_date: string
}

/**
 * User preferences for MOS and job filtering
 */
export interface UserPreferences {
  user_id: string
  primary_mos_codes: string[]
  branch: string | null
  clearance_level: string | null
  preferred_regions: string[]
  preferred_theaters: string[]
  oconus_preference: boolean | null
}

/**
 * Job filters with MOS context
 */
export interface MosJobFilters extends JobFilters {
  theater?: string
  work_location_type?: string
  job_family?: string
}

/**
 * Flattened view of a company in the context of a specific MOS.
 */
export interface MosCompanyMatchMeta {
  companyId: string
  companySlug: string
  companyName: string
  strength: CompanyMosMatchStrength
  notes?: string
  domains: string[]
  theaters: string[]
}
