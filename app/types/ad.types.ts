/**
 * @file Ad system types
 * @description TypeScript types for featured ads and featured jobs
 */

import type { SponsorCategory } from "./legacy-types";

/** Re-export for convenience */
export type { SponsorCategory };

/** Ad status enum matching database */
export type AdStatus =
  | "draft"
  | "pending_review"
  | "pending_payment"
  | "active"
  | "paused"
  | "expired"
  | "cancelled";

/** Ad type enum matching database */
export type AdType = "company_spotlight" | "featured_job";

/** Location type for jobs */
export type AdLocationType = "CONUS" | "OCONUS" | "Remote" | "Hybrid";

/** Standard clearance levels */
export type ClearanceLevel =
  | "None"
  | "Public Trust"
  | "Secret"
  | "Top Secret"
  | "TS/SCI"
  | "TS/SCI w/ Poly";

/** Industry categories for company spotlight badges */
export type AdIndustry =
  | "Defense"
  | "Intelligence"
  | "Cyber"
  | "Aerospace"
  | "IT Services"
  | "Logistics"
  | "Engineering"
  | "Healthcare"
  | "Training";

/**
 * Company spotlight ad (brand awareness)
 * Displayed in search sidebar to promote company/brand
 */
export interface FeaturedAd {
  id: string;
  /** Company or organization name */
  advertiser: string;
  /** Short brand tagline (max 50 chars) */
  tagline: string;
  /** Primary headline - the hook (max 80 chars) */
  headline: string;
  /** Body copy - value proposition and details (max 200 chars) */
  description: string;
  /** Industry categories for badge display (max 3) */
  industries: AdIndustry[];
  /** Call-to-action button text (max 25 chars) */
  cta_text: string;
  /** Destination URL */
  cta_url: string;
  /** Current status */
  status: AdStatus;
  /** When ad becomes active */
  starts_at: string | null;
  /** When ad expires */
  ends_at: string | null;
  /** Total impressions */
  impressions: number;
  /** Total clicks */
  clicks: number;
  /** User who created the ad */
  created_by: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Admin who reviewed the ad */
  reviewed_by: string | null;
  /** When the ad was reviewed */
  reviewed_at: string | null;
  /** Reason for rejection (if rejected) */
  rejection_reason: string | null;
  /** MOS codes matched via embedding similarity (auto-generated) */
  matched_mos_codes?: string[];
  /** Priority tier for placement (1 = standard, 2 = premium) */
  priority?: number;
}

/**
 * Featured job ad (direct response)
 * Displayed in search sidebar to promote specific job opening
 */
export interface FeaturedJob {
  id: string;
  /** Job title (max 60 chars) */
  title: string;
  /** Company/organization name */
  company: string;
  /** Work location (e.g. "Arlington, VA" or "Kuwait City") */
  location: string;
  /** Work location type for badge display */
  location_type: AdLocationType | null;
  /** Required clearance level */
  clearance: string;
  /** Clearance sponsorship category */
  sponsor_category: SponsorCategory;
  /** Salary or compensation range */
  salary: string;
  /** Primary selling point (max 120 chars) */
  pitch: string;
  /** URL to apply or learn more */
  apply_url: string;
  /** Current status */
  status: AdStatus;
  /** When ad becomes active */
  starts_at: string | null;
  /** When ad expires */
  ends_at: string | null;
  /** Total impressions */
  impressions: number;
  /** Total clicks */
  clicks: number;
  /** User who created the ad */
  created_by: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Admin who reviewed the ad */
  reviewed_by: string | null;
  /** When the ad was reviewed */
  reviewed_at: string | null;
  /** Reason for rejection (if rejected) */
  rejection_reason: string | null;
  /** MOS codes matched via embedding similarity (auto-generated) */
  matched_mos_codes?: string[];
  /** Priority tier for placement (1 = standard, 2 = premium) */
  priority?: number;
}

/** Ad placement tier */
export type AdPlacementTier = "standard" | "premium";

/** Featured listing request status */
export type FeaturedListingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

/** Request data stored when employer requests featured status */
export interface FeaturedRequestData {
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  requested_at: string;
}

/**
 * Featured listing (job with time scheduling)
 * Time-based placement managed by admin
 */
export interface FeaturedListing {
  id: string;
  job_id: string;
  /** Display order (lower = first) */
  display_order: number;
  /** When featuring starts */
  starts_at: string;
  /** When featuring ends */
  ends_at: string;
  /** Pinned to top */
  is_pinned: boolean;
  /** Total impressions */
  impressions: number;
  /** Total clicks */
  clicks: number;
  /** Request status: pending, approved, rejected, expired */
  status?: FeaturedListingStatus;
  /** Contact info for pending requests */
  request_data?: FeaturedRequestData | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Form input for creating a company spotlight ad
 */
export interface FeaturedAdInput {
  advertiser: string;
  tagline: string;
  headline: string;
  description: string;
  /** Industry categories for badge display (max 3) */
  industries: AdIndustry[];
  cta_text: string;
  cta_url: string;
  starts_at?: string;
  ends_at?: string;
  /** Placement tier (1 = standard, 2 = premium) */
  priority?: number;
}

/**
 * Form input for creating a featured job ad
 */
export interface FeaturedJobInput {
  title: string;
  company: string;
  /** Location string (e.g. "Arlington, VA" or "Kuwait City") */
  location: string;
  /** Work location type for badge display */
  location_type: AdLocationType;
  clearance: string;
  sponsor_category?: SponsorCategory;
  salary: string;
  pitch: string;
  apply_url: string;
  starts_at?: string;
  ends_at?: string;
  /** Placement tier (1 = standard, 2 = premium) */
  priority?: number;
}
