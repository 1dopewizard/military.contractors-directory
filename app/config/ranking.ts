/**
 * @file Ranking configuration for MOS-to-job matching
 * @description Tunable parameters for the job ranking algorithm (PRD Section 5.4)
 */

// ============================================================================
// Weight Configuration
// ============================================================================

/**
 * Weights for computing the final ranking score per job
 * Must sum to 1.0
 */
export const RANKING_WEIGHTS = {
  /** LLM confidence score from job_mos_mappings */
  confidence: 0.40,
  /** Sponsor category alignment with veteran clearance */
  sponsorBoost: 0.20,
  /** Recency of job posting */
  recency: 0.15,
  /** Featured/promoted job status */
  featuredBoost: 0.15,
  /** Match strength categorical boost */
  matchStrengthBoost: 0.10,
} as const

// ============================================================================
// Decay & Boost Parameters
// ============================================================================

/**
 * Recency decay configuration
 * Uses exponential decay: score = e^(-days / halfLife)
 */
export const RECENCY_DECAY = {
  /** Days until job loses 50% recency score */
  halfLifeDays: 14,
  /** Maximum age (days) before recency score floors to minimum */
  maxAgeDays: 90,
  /** Minimum recency score (floor) */
  minScore: 0.1,
} as const

/**
 * Boost values for categorical fields
 */
export const CATEGORY_BOOSTS = {
  /** Match strength boosts */
  matchStrength: {
    STRONG: 1.0,
    MEDIUM: 0.7,
    WEAK: 0.3,
  },
  /** Sponsor category boosts (clearance alignment) */
  sponsorCategory: {
    WILL_SPONSOR: 1.0,
    ELIGIBLE_TO_OBTAIN: 0.9,
    ACTIVE_ONLY: 0.8,
    NOT_SPECIFIED: 0.5,
    NOT_CLEARANCE: 0.3,
  },
  /** Featured listing boost */
  featured: 0.25,
} as const

// ============================================================================
// Top-K Configuration
// ============================================================================

export const TOP_K_CONFIG = {
  /** Default number of jobs to show per MOS */
  defaultK: 10,
  /** Maximum K allowed via API */
  maxK: 50,
  /** Minimum confidence score to include in rankings */
  minConfidenceThreshold: 0.3,
  /** Minimum match strength to include */
  minMatchStrength: 'WEAK' as const,
} as const

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate recency score based on days since posting
 */
export function calculateRecencyScore(daysSincePosted: number): number {
  if (daysSincePosted >= RECENCY_DECAY.maxAgeDays) {
    return RECENCY_DECAY.minScore
  }
  const decay = Math.exp(-daysSincePosted / RECENCY_DECAY.halfLifeDays)
  return Math.max(decay, RECENCY_DECAY.minScore)
}

/**
 * Calculate composite ranking score for a job-MOS pairing
 */
export function calculateRankingScore(params: {
  confidenceScore: number
  matchStrength: 'STRONG' | 'MEDIUM' | 'WEAK'
  sponsorCategory: keyof typeof CATEGORY_BOOSTS.sponsorCategory
  isFeatured: boolean
  daysSincePosted: number
}): number {
  const {
    confidenceScore,
    matchStrength,
    sponsorCategory,
    isFeatured,
    daysSincePosted,
  } = params

  const w = RANKING_WEIGHTS

  // Confidence component (0-1 normalized)
  const confidenceComponent = confidenceScore * w.confidence

  // Match strength component
  const matchStrengthComponent =
    CATEGORY_BOOSTS.matchStrength[matchStrength] * w.matchStrengthBoost

  // Sponsor category component
  const sponsorComponent =
    CATEGORY_BOOSTS.sponsorCategory[sponsorCategory] * w.sponsorBoost

  // Featured boost component
  const featuredComponent = isFeatured ? CATEGORY_BOOSTS.featured * w.featuredBoost : 0

  // Recency component
  const recencyComponent = calculateRecencyScore(daysSincePosted) * w.recency

  return (
    confidenceComponent +
    matchStrengthComponent +
    sponsorComponent +
    featuredComponent +
    recencyComponent
  )
}

