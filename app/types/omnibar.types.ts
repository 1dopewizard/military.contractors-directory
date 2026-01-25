/**
 * @file Omnibar type definitions
 * @description Types for the unified omnibar search with intent detection and navigation
 */

import type { ClearanceLevel } from './community.types'
import type { MosCode } from './mos.types'

// ===========================================
// Intent Types
// ===========================================

/**
 * Detected user intent from search query
 * - salaries: User wants to see salary reports
 * - interviews: User wants to see interview experiences
 * - companies: User wants to browse companies
 * - search: General search (default)
 */
export type OmnibarIntent = 'salaries' | 'interviews' | 'companies' | 'search'

/**
 * Result type categories for omnibar
 */
export type OmnibarResultType = 'mos' | 'company' | 'action'

// ===========================================
// Parsed Query
// ===========================================

/**
 * Matched company from search
 */
export interface MatchedCompany {
  id: string
  slug: string
  name: string
}

/**
 * Result of parsing user query for intent and entities
 */
export interface ParsedQuery {
  /** Original query string */
  raw: string
  /** Detected MOS code (e.g., "25B", "35F") */
  mosCode?: string
  /** Matched company from search */
  company?: MatchedCompany
  /** Detected clearance level (e.g., "TS_SCI", "SECRET") */
  clearance?: ClearanceLevel
  /** Detected intent from keywords */
  intent?: OmnibarIntent
  /** Remaining keywords after entity extraction */
  keywords: string[]
}

// ===========================================
// Omnibar Actions
// ===========================================

/**
 * Action that can be taken from an omnibar result
 */
export interface OmnibarAction {
  /** Display label for the action */
  label: string
  /** Navigation URL */
  href: string
  /** Optional icon (mdi icon name) */
  icon?: string
  /** Whether this is the primary/default action */
  primary?: boolean
}

// ===========================================
// Omnibar Results
// ===========================================

/**
 * Individual result shown in omnibar dropdown
 */
export interface OmnibarResult {
  /** Result type for grouping in UI */
  type: OmnibarResultType
  /** Unique identifier */
  id: string
  /** Primary label */
  label: string
  /** Secondary/subtitle text */
  sublabel?: string
  /** Icon to display (mdi icon name) */
  icon?: string
  /** Available actions for this result */
  actions: OmnibarAction[]
}

/**
 * MOS-specific result with branch info
 */
export interface OmnibarMosResult extends OmnibarResult {
  type: 'mos'
  mos: MosCode
}

/**
 * Company-specific result
 */
export interface OmnibarCompanyResult extends OmnibarResult {
  type: 'company'
  company: MatchedCompany
}

/**
 * Quick action result (context-aware shortcuts)
 */
export interface OmnibarActionResult extends OmnibarResult {
  type: 'action'
}

// ===========================================
// Categorized Results
// ===========================================

/**
 * Results organized by category for dropdown display
 */
export interface OmnibarResults {
  /** Detected query info */
  query: ParsedQuery
  /** MOS code results */
  mosResults: OmnibarMosResult[]
  /** Company results */
  companyResults: OmnibarCompanyResult[]
  /** Quick action results based on detected intent */
  actionResults: OmnibarActionResult[]
  /** Whether results are currently loading */
  isLoading: boolean
}

// ===========================================
// URL Building
// ===========================================

/**
 * Filters for building navigation URLs
 */
export interface OmnibarNavigationFilters {
  mos?: string
  company?: string
  clearance?: ClearanceLevel
  q?: string
}

// ===========================================
// Clearance Detection Patterns
// ===========================================

/**
 * Clearance keyword patterns for detection
 */
export const CLEARANCE_PATTERNS: Record<string, ClearanceLevel> = {
  // TS/SCI variants
  'ts/sci': 'TS_SCI',
  'tssci': 'TS_SCI',
  'ts-sci': 'TS_SCI',
  'ts sci': 'TS_SCI',
  
  // Top Secret
  'top secret': 'TOP_SECRET',
  'topsecret': 'TOP_SECRET',
  'top-secret': 'TOP_SECRET',
  'ts': 'TOP_SECRET',
  
  // Secret
  'secret': 'SECRET',
  
  // Public Trust
  'public trust': 'PUBLIC_TRUST',
  'publictrust': 'PUBLIC_TRUST',
  'public-trust': 'PUBLIC_TRUST',
  'pt': 'PUBLIC_TRUST',
  
  // TS/SCI with Poly
  'ts/sci poly': 'TS_SCI_POLY',
  'tssci poly': 'TS_SCI_POLY',
  'poly': 'TS_SCI_POLY',
  'polygraph': 'TS_SCI_POLY',
}

/**
 * Intent keyword patterns for detection
 */
export const INTENT_KEYWORDS: Record<string, OmnibarIntent> = {
  // Salary intent
  'salary': 'salaries',
  'salaries': 'salaries',
  'pay': 'salaries',
  'compensation': 'salaries',
  'comp': 'salaries',
  
  // Interview intent
  'interview': 'interviews',
  'interviews': 'interviews',
  'experience': 'interviews',
  'experiences': 'interviews',
  
  // Company intent
  'company': 'companies',
  'companies': 'companies',
  'employer': 'companies',
  'employers': 'companies',
  'contractor': 'companies',
  'contractors': 'companies',
  
  // Search/jobs intent (default)
  'job': 'search',
  'jobs': 'search',
}
