/**
 * @file MOS/AFSC type definitions
 * @description Core types for Military Occupational Specialties and job mapping
 *
 * This file re-exports canonical database types and adds view-model types
 * for the frontend. Database types are the source of truth.
 */

import type { MosJobFilters } from "@/app/types/app.types";
import type { Job, MilitarySpecialty, Json } from "@/app/types/legacy-types";

// ============================================================================
// Re-export Database Types (Source of Truth)
// ============================================================================

/**
 * MOS with full ontology enrichment (canonical type from database)
 */
export type { MilitarySpecialty };

/**
 * Frontend-friendly MOS type with 'title' instead of 'name'
 * Used by composables that transform database data for UI consumption
 */
export interface MosCode {
  id: string;
  code: string;
  title: string; // Mapped from mos_codes.name
  branch: string;
  category?: string; // Mapped from mos_category
  description: string | null;
  status?: string;
  // Additional enrichment fields when available
  is_it_cyber?: boolean;
  job_count?: number;
  core_skills?: string[];
  common_certs?: string[];
  summarized_description?: string | null;
}

// ============================================================================
// Ontology Types (JSON blobs in database)
// ============================================================================

/** Mission domain tags */
export type MissionDomain = string;

/** Environment tags */
export type Environment = string;

/** Role family tags */
export type RoleFamily = string;

/** Company archetype tags */
export type CompanyArchetype = string;

/** Clearance band */
export type ClearanceBand =
  | "NONE"
  | "PUBLIC_TRUST"
  | "SECRET"
  | "TOP_SECRET"
  | "TS_SCI";

/** Theater code (OCONUS theaters only) */
export type TheaterCode =
  | "CENTCOM"
  | "EUCOM"
  | "INDOPACOM"
  | "AFRICOM"
  | "SOUTHCOM";

/** Pay band hint */
export type PayBand = string;

/** Likelihood rating */
export type Likelihood = "LOW" | "MEDIUM" | "HIGH";

/** Clearance profile (JSON structure) */
export type ClearanceProfile = Json;

/** Deployment profile (JSON structure) */
export type DeploymentProfile = Json;

/** Seniority distribution (JSON structure) */
export type SeniorityDistribution = Json;

/** Training paths (JSON structure) */
export type TrainingPaths = Json;

/**
 * Military branch enum
 */
export enum Branch {
  ARMY = "Army",
  NAVY = "Navy",
  AIR_FORCE = "Air Force",
  MARINE_CORPS = "Marine Corps",
  SPACE_FORCE = "Space Force",
  COAST_GUARD = "Coast Guard",
}

/**
 * MOS category enum (from classification phase)
 */
export enum MosCategory {
  UNCLASSIFIED = "UNCLASSIFIED",
  IT_CYBER = "IT_CYBER",
  INTELLIGENCE = "INTELLIGENCE",
  LOGISTICS = "LOGISTICS",
  MEDICAL = "MEDICAL",
  AVIATION = "AVIATION",
  COMBAT = "COMBAT",
  SUPPORT = "SUPPORT",
}

/**
 * Theater of operations (matches TheaterCode from database)
 */
export enum Theater {
  CENTCOM = "CENTCOM",
  EUCOM = "EUCOM",
  INDOPACOM = "INDOPACOM",
  AFRICOM = "AFRICOM",
  NORTHCOM = "NORTHCOM",
  SOUTHCOM = "SOUTHCOM",
  OTHER = "Other",
}

// ============================================================================
// Frontend-Specific Enums & Types
// ============================================================================

/**
 * Match strength for job-to-MOS mapping
 */
export enum MatchStrength {
  STRONG = "STRONG",
  MEDIUM = "MEDIUM",
  WEAK = "WEAK",
}

/**
 * Mapping source type
 */
export enum MappingSource {
  RULE_BASED = "RULE_BASED",
  LLM = "LLM",
  MANUAL_REVIEW = "MANUAL_REVIEW",
}

/**
 * Region type
 */
export type Region = "CONUS" | "OCONUS";

/**
 * Work location type
 */
export type WorkLocationType = "On-base" | "Deployed" | "Remote" | "Hybrid";

// ============================================================================
// View Models & Frontend Types
// ============================================================================

/**
 * Job family/role cluster (used for grouping related roles)
 */
export interface JobFamily {
  id: string;
  name: string;
  description: string;
  typical_clearance?: string | null;
  typical_pay_min?: number | null;
  typical_pay_max?: number | null;
  mos_codes: string[];
}

/**
 * MOS skill profile (derived from enriched MOS data)
 */
export interface MosSkillProfile {
  id: string;
  mos_id: string;
  core_skills: string[];
  recommended_certs: string[];
  typical_job_families: string[];
  transition_guidance: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * MOS stats snapshot (computed from job mappings)
 */
export interface MosStats {
  mos_code: string;
  active_jobs: number;
  top_regions: Array<{ region: Region; count: number }>;
  top_theaters: Array<{ theater: Theater; count: number }>;
  clearance_distribution: Array<{ clearance: string; percentage: number }>;
  pay_band: {
    min: number | null;
    max: number | null;
    median: number | null;
    sample_size: number;
  };
}

/**
 * Job with MOS match information (used in job lists on MOS pages)
 */
export interface JobWithMosMatch extends Job {
  // MOS match fields from job_mos_mappings
  match_strength?: MatchStrength;
  mapping_reason?: string;
  confidence_score?: number;
  // Ranking fields from mos_job_rankings
  ranking_score?: number;
  highlight_rank?: number;
  // Formatted display fields
  formatted_salary?: string;
  formatted_date?: string;
  // Company link
  company_slug?: string | null;
}

/**
 * MOS with related jobs (used in search/browse)
 */
export interface MosWithJobs extends MilitarySpecialty {
  job_count?: number;
  top_jobs?: JobWithMosMatch[];
}

/**
 * MOS search result (uses transformed MosCode, not raw MilitarySpecialty)
 */
export interface MosSearchResult {
  mos: MosCode;
  relevance_score: number;
  matched_on: "code" | "title" | "description" | "skills";
}

/**
 * User MOS preference (for personalization)
 */
export interface UserMosPreference {
  user_id: string;
  mos_code: string;
  is_primary: boolean;
  created_at?: string;
}

/**
 * User favorites (for saved jobs)
 */
export interface UserFavorite {
  id: string;
  user_id: string;
  job_id: string;
  created_at?: string;
}

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  id: string;
  event_type:
    | "mos_search"
    | "mos_page_view"
    | "mos_filter_change"
    | "job_click"
    | "job_detail_view"
    | "favorite_job_added"
    | "account_created"
    | "profile_updated";
  user_id: string | null;
  session_id: string | null;
  mos_code: string | null;
  job_id: string | null;
  metadata: Record<string, any> | null;
  created_at?: string;
}

/**
 * View-model for the MOS detail route (/mos/[code])
 * @deprecated MOS pages have been removed. Keep for reference.
 */
export interface MosDetailViewModel {
  mos: MilitarySpecialty;
  jobs: JobWithMosMatch[];
  filters: MosJobFilters;
  stats?: MosStats;
}
