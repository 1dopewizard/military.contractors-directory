/**
 * @file Search API type definitions
 * @description Types for the MOS-aware search endpoint - returns companies for MOS queries
 */

import type { Job, SponsorCategory, Json } from '@/app/types/legacy-types'

/** Match strength type for search results */
export type SearchMatchStrength = 'STRONG' | 'MEDIUM' | 'WEAK'

/** Confidence level for company-MOS mappings */
export type MappingConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

// ============================================================================
// Query Types
// ============================================================================

/** Query resolution type - how the search query was interpreted */
export type SearchQueryType = 'MOS' | 'FREE_TEXT' | 'BROWSE'

/** What type of results are being returned */
export type SearchResultType = 'companies' | 'jobs'

/** Location filter options */
export type LocationFilter = 'ANY' | 'OCONUS' | 'REMOTE'

/** Theater filter options (combatant commands) */
export type TheaterFilter = 'ANY' | 'CENTCOM' | 'EUCOM' | 'INDOPACOM' | 'AFRICOM' | 'SOUTHCOM'

/** Sort options for company results */
export type SearchSort = 'best' | 'name' | 'relevance'

/** Clearance filter options */
export type ClearanceFilter = 'ANY' | 'NONE' | 'SECRET' | 'TS' | 'TS_SCI' | 'TS_SCI_POLY'

/** Domain filter options (for company filtering) */
export type DomainFilter = 'ANY' | 'IT' | 'Intelligence' | 'Cyber' | 'Logistics' | 'Engineering' | 'Medical' | 'Aviation' | 'Security' | 'Base Operations'

// ============================================================================
// Search Request
// ============================================================================

export interface SearchFilters {
  location?: LocationFilter
  theater?: TheaterFilter
  clearance?: ClearanceFilter
  domain?: DomainFilter
  sort?: SearchSort
}

export interface SearchQuery {
  q: string
  filters?: SearchFilters
  limit?: number
  offset?: number
}

// ============================================================================
// Resolved MOS (Knowledge Card)
// ============================================================================

/** MOS context for the knowledge card when query resolves to a MOS code */
export interface ResolvedMos {
  code: string
  title: string
  branch: string
  category: string | null
  description: string | null
  core_skills: string[]
  common_certs: string[]
  clearance_profile: Json | null
  /** Count of companies that hire this MOS */
  company_count: number
  is_it_cyber: boolean
}

// ============================================================================
// Company Search Result
// ============================================================================

/** MOS match info for a company */
export interface CompanyMosMatchInfo {
  mos_code: string
  strength: SearchMatchStrength
  confidence: MappingConfidence
  typical_roles: string[]
  typical_clearance: string | null
  source: string
}

/** Individual company search result */
export interface CompanySearchResult {
  company_id: string
  rank: number
  slug: string
  name: string
  summary: string
  domains: string[]
  theaters: string[]
  careers_url: string | null
  logo_url: string | null
  is_prime_contractor: boolean
  /** MOS match info when searching by MOS code */
  mos_match: CompanyMosMatchInfo | null
}

// ============================================================================
// Legacy Job Search Result (for backwards compatibility)
// ============================================================================

/** MOS match info for a job in search results */
export interface MosMatchInfo {
  mos_code: string
  match_strength: SearchMatchStrength
  confidence_score: number
}

/** Individual search result - job with ranking and match info (legacy, kept for compatibility) */
export interface SearchResult {
  job_id: string
  rank: number
  score: number
  // Job fields
  title: string
  company: string
  company_id: string | null
  company_slug: string | null
  location: string
  location_type: Job['location_type']
  is_oconus: boolean | null
  theater: string | null
  salary_min: number | null
  salary_max: number | null
  clearance_required: string | null
  sponsor_category: SponsorCategory
  is_featured: boolean
  posted_at: string
  snippet: string | null
  slug: string | null
  // MOS matches for this job (subset for display)
  mos_matches: MosMatchInfo[]
}

// ============================================================================
// Search Response
// ============================================================================

export interface SearchPagination {
  limit: number
  offset: number
  total: number
  has_more: boolean
}

/** Full search API response shape - returns companies for MOS queries */
export interface SearchResponse {
  query: string
  query_type: SearchQueryType
  /** What type of results are being returned */
  result_type: SearchResultType
  resolved_mos: ResolvedMos | null
  /** All matching MOS codes when duplicates exist across branches (for disambiguation UI) */
  mos_variants?: ResolvedMos[]
  /** Company results (primary for MOS and browse queries) */
  company_results: CompanySearchResult[]
  /** Legacy job results (kept for backwards compatibility, empty for company searches) */
  results: SearchResult[]
  pagination: SearchPagination
  // Messaging for edge cases
  message?: string
}

// ============================================================================
// Composable State Types
// ============================================================================

export interface SearchState {
  query: string
  queryType: SearchQueryType | null
  resultType: SearchResultType | null
  resolvedMos: ResolvedMos | null
  companyResults: CompanySearchResult[]
  results: SearchResult[]
  pagination: SearchPagination | null
  message: string | null
  isLoading: boolean
  error: Error | null
}
