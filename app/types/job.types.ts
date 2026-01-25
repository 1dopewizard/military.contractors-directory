/**
 * @file Job detail type definitions
 * @description Types for the job detail page and related components
 */

// ============================================================================
// Location Types
// ============================================================================

export interface JobLocation {
  type?: string
  city?: string
  state?: string
  country?: string
  region?: string
  theater?: string
  siteNameOrBase?: string
  travelPercent?: number
}

// ============================================================================
// Clearance Types
// ============================================================================

export interface JobClearance {
  level?: string
  polygraph?: string
  activeRequired?: boolean
  usCitizenshipRequired?: boolean
  sponsorAvailable?: boolean
}

// ============================================================================
// Compensation Types
// ============================================================================

export interface JobCompensation {
  rateType?: string
  currency?: string
  min?: number
  max?: number
  period?: string
  normalizedAnnualUSD?: number
  benefits?: string[]
  perDiemDailyUSD?: number
  housingProvided?: boolean
  hardshipEligible?: boolean
}

// ============================================================================
// Contract Types
// ============================================================================

export interface JobContract {
  type?: string
  programOrMission?: string
  vehicleOrIDIQ?: string
  durationMonths?: number
}

// ============================================================================
// Qualifications Types
// ============================================================================

export interface JobEducation {
  level?: string
  fields?: string[]
  acceptsEquivalency?: boolean
}

export interface JobQualifications {
  certs?: string[]
  required?: string[]
  preferred?: string[]
  languages?: string[]
  licenses?: string[]
  education?: JobEducation
  yearsExperienceMin?: number
}

// ============================================================================
// Military Mapping Types
// ============================================================================

export interface JobMilitaryMapping {
  service?: string[]
  mos?: string[]
  afsc?: string[]
  necOrRating?: string[]
  billetKeywords?: string[]
}

// ============================================================================
// Compliance Types
// ============================================================================

export interface JobCompliance {
  itar?: boolean
  drugTest?: boolean
  backgroundCheck?: boolean
}

// ============================================================================
// Posting Types
// ============================================================================

export interface JobPosting {
  datePosted?: string
  validThrough?: string
  shift?: string
}

// ============================================================================
// Main Job Detail Type
// ============================================================================

export interface JobDetail {
  id: string
  title: string
  company: string
  seniority?: string
  location: JobLocation
  clearance: JobClearance
  compensation: JobCompensation
  employmentType?: string
  contract: JobContract
  qualifications: JobQualifications
  responsibilities?: string[]
  toolsTech?: string[]
  domainTags?: string[]
  militaryMapping?: JobMilitaryMapping
  compliance?: JobCompliance
  posting?: JobPosting
  sourceUrl: string
  description?: string
  // Flat field fallbacks (for legacy data)
  locationFlat?: string
  clearanceFlat?: string
  salaryMin?: number
  salaryMax?: number
  postedAt?: string
  // Company link
  companySlug?: string | null
}

// ============================================================================
// Benefit Labels
// ============================================================================

export interface BenefitLabel {
  label: string
  icon: string
}

export const BENEFIT_LABELS: Record<string, BenefitLabel> = {
  HOUSING: { label: 'Housing Provided', icon: 'mdi:home' },
  TRANSPORTATION: { label: 'Transportation', icon: 'mdi:car' },
  BONUS: { label: 'Completion Bonus', icon: 'mdi:cash-plus' },
  TUITION_REIMBURSEMENT: { label: 'Tuition Reimbursement', icon: 'mdi:school' },
  HEALTH: { label: 'Health Insurance', icon: 'mdi:hospital' },
  DENTAL: { label: 'Dental Insurance', icon: 'mdi:tooth' },
  VISION: { label: 'Vision Insurance', icon: 'mdi:eye' },
  RETIREMENT_401K: { label: '401(k)', icon: 'mdi:piggy-bank' },
  RELOCATION: { label: 'Relocation', icon: 'mdi:truck' },
  PER_DIEM: { label: 'Per Diem', icon: 'mdi:cash' },
  HARDSHIP_PAY: { label: 'Hardship Pay', icon: 'mdi:cash-plus' },
}
