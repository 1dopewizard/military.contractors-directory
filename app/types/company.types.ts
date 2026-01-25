/**
 * @file Company type definitions
 * @description Shapes for contractor companies and MOS match metadata
 */

import type { Ref } from 'vue'
export type CompanyMosMatchStrength = 'WEAK' | 'MEDIUM' | 'STRONG'

export interface CompanyMosMatch {
  mosCode: string
  strength: CompanyMosMatchStrength
  /** MOS title/name */
  mosTitle?: string
  /** Military branch */
  branch?: string
  /** Typical civilian job titles for this MOS at this company */
  typicalRoles?: string[]
  /** Typical clearance requirement */
  typicalClearance?: string | null
  /** Confidence level (HIGH, MEDIUM, LOW) */
  confidence?: string | null
  /**
   * @deprecated Use typicalRoles instead
   * Short explanation of how/why this MOS fits this company.
   */
  notes?: string
  /**
   * @deprecated Jobs are no longer tracked per-MOS
   * Number of active jobs for this MOS (legacy)
   */
  jobCount?: number
  /**
   * @deprecated Jobs are no longer tracked per-MOS
   * Average confidence score across jobs (legacy)
   */
  avgConfidence?: number
}

/**
 * Company hiring statistics (computed from MOS mappings)
 */
export interface CompanyStats {
  /** Total number of MOS codes matched to this company */
  totalMosMatches: number
  /** Count of STRONG strength matches */
  strongMatches: number
  /** Count of MEDIUM strength matches */
  mediumMatches: number
  /** Count of WEAK strength matches */
  weakMatches: number
  /** Unique clearance levels across all MOS matches */
  clearanceLevels: string[]
  /** Military branches represented in MOS matches */
  branches: string[]
  /**
   * @deprecated Use totalMosMatches instead
   */
  totalJobs?: number
  /**
   * @deprecated Location type stats no longer tracked
   */
  oconusJobs?: number
  /**
   * @deprecated Location type stats no longer tracked
   */
  conusJobs?: number
  /**
   * @deprecated Use branches instead
   */
  theaters?: string[]
}

export interface Company {
  id: string
  slug: string
  name: string
  summary: string

  /**
   * High-level domains / verticals this company hires for.
   * Example: ['IT/Comms', 'LOGCAP/Base Ops', 'Intel']
   */
  domains: string[]

  /**
   * Theaters / regions where this company is known to operate.
   * Example: ['Kuwait', 'Afghanistan', 'Qatar', 'CONUS']
   */
  theaters: string[]

  /**
   * MOS-level mappings for this company.
   * Computed from job_mos_map data in Phase 0+.
   */
  mosMatches: CompanyMosMatch[]

  /**
   * Computed hiring statistics (Phase 0+)
   */
  stats?: CompanyStats

  /**
   * Job count for list views (computed from API)
   */
  job_count?: number

  websiteUrl?: string
  headquartersCountry?: string
  logoUrl?: string
}

/**
 * Filters for the company browser and derived queries.
 */
export interface CompanyFilters {
  searchQuery?: string
  theater?: string
  domain?: string
}

/**
 * Options for MOS → companies queries.
 */
export interface CompaniesForMosOptions {
  /**
   * Minimum match strength to include.
   * Default: 'MEDIUM'
   */
  minStrength?: CompanyMosMatchStrength

  /**
   * Optional max number of companies to return.
   * Default: no limit.
   */
  limit?: number
}

/**
 * Strong typing for the useCompanies composable return.
 */
export interface UseCompaniesReturn {
  allCompanies: Ref<Company[]>

  getAllCompanies: () => Promise<Company[]>
  getCompanyById: (id: string) => Promise<Company | undefined>
  getCompanyBySlug: (slug: string) => Promise<Company | undefined>
  searchCompanies: (query: string, limit?: number) => Promise<Company[]>
  filterCompanies: (filters?: CompanyFilters) => Promise<Company[]>
  getCompaniesForMos: (
    mosCode: string,
    options?: CompaniesForMosOptions
  ) => Promise<Company[]>
}


