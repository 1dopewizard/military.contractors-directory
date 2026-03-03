/**
 * @file Community Intel type definitions
 * @description Types for salary reports, interview experiences, helpful votes, and stats
 */

// ID type alias (was previously from Convex)
type Id<T extends string> = string & { __tableName: T };

// ===========================================
// Enum-like string literal types
// ===========================================

export type ClearanceLevel =
  | "NONE"
  | "PUBLIC_TRUST"
  | "SECRET"
  | "TOP_SECRET"
  | "TS_SCI"
  | "TS_SCI_POLY";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "CONTRACT_TO_HIRE"
  | "INTERN";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";

export type InterviewOutcome = "OFFER" | "REJECTED" | "GHOSTED" | "WITHDREW";

export type HelpfulVoteTarget = "salary" | "interview";

export type SalaryReportSort = "recent" | "helpful" | "salary";

export type InterviewSort = "recent" | "helpful";

// ===========================================
// Access Control Types
// ===========================================

/**
 * User's access level for community intel
 * - anonymous: Not logged in, aggregates only
 * - limited: Logged in non-contributor, 10 views/month
 * - full: Contributor or admin, unlimited access
 */
export type CommunityAccessLevel = "anonymous" | "limited" | "full";

/**
 * User's contributor status
 */
export type ContributorStatus = "none" | "contributor";

/**
 * Result from checking user's access status
 */
export interface AccessCheckResult {
  level: CommunityAccessLevel;
  viewsRemaining?: number; // Only for 'limited' level
  canViewFullReports: boolean;
}

/**
 * Detailed contributor status for a user
 */
export interface ContributorStatusDetails {
  status: ContributorStatus;
  contributionCount: number;
  actualContributions: number;
  verifiedContributions: number;
  salaryReportsCount: number;
  interviewExperiencesCount: number;
  viewsThisMonth: number;
  viewsRemaining: number | null; // null = unlimited
}

/**
 * Result from recording a report view
 */
export interface RecordViewResult {
  allowed: boolean;
  viewsRemaining: number; // -1 = unlimited
}

/**
 * Top contributor for leaderboard
 */
export interface TopContributor {
  userId: Id<"users">;
  name: string;
  image?: string;
  contributionCount: number;
  salaryReportsCount: number;
  interviewExperiencesCount: number;
  totalHelpfulVotes: number;
  score: number;
}

// ===========================================
// Salary Report Types
// ===========================================

/**
 * Base salary report data (without enrichment)
 */
export interface SalaryReport {
  _id: Id<"salaryReports">;
  mosCode: string;
  mosId?: Id<"mosCodes">;
  companyId: Id<"companies">;
  location: string;
  baseSalary: number;
  signingBonus?: number;
  clearanceLevel: ClearanceLevel;
  yearsExperience: number;
  employmentType: EmploymentType;
  isOconus: boolean;
  verificationStatus: VerificationStatus;
  submittedBy?: Id<"users">;
  helpfulCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Salary report with company enrichment
 */
export interface EnrichedSalaryReport extends SalaryReport {
  companyName: string;
  companySlug: string | null;
  _masked?: boolean;
}

/**
 * Masked salary report (for anonymous/limited users with no views)
 * Contains only non-sensitive data
 */
export interface MaskedSalaryReport {
  _id: Id<"salaryReports">;
  mosCode: string;
  location: string; // Masked to just region
  baseSalary: null;
  signingBonus: null;
  clearanceLevel: ClearanceLevel;
  yearsExperience: null;
  yearsExperienceRange: "0-2" | "3-5" | "6-10" | "10+";
  employmentType: EmploymentType;
  isOconus: boolean;
  verificationStatus: VerificationStatus;
  helpfulCount: number;
  createdAt: number;
  companyName: string | null;
  companySlug: string | null;
  _masked: true;
}

/**
 * Filters for listing salary reports
 */
export interface SalaryReportFilters {
  companyId?: string;
  mosCode?: string;
  location?: string;
  clearanceLevel?: ClearanceLevel;
  verificationStatus?: VerificationStatus;
  limit?: number;
  offset?: number;
  sort?: SalaryReportSort;
}

/**
 * Input for submitting a new salary report
 */
export interface SalaryReportInput {
  mosCode: string;
  mosId?: string;
  companyId: string;
  location: string;
  baseSalary: number;
  signingBonus?: number;
  clearanceLevel: ClearanceLevel;
  yearsExperience: number;
  employmentType: EmploymentType;
  isOconus: boolean;
  submittedBy?: string;
}

/**
 * Aggregate salary statistics (anonymous)
 */
export interface SalaryAggregates {
  reportCount: number;
  salary: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  signingBonus: {
    average: number;
    reportCount: number;
  } | null;
  clearanceBreakdown: Record<string, number>;
  experienceRanges: {
    "0-2": number;
    "3-5": number;
    "6-10": number;
    "10+": number;
  };
}

// ===========================================
// Interview Experience Types
// ===========================================

/**
 * Base interview experience data (without enrichment)
 */
export interface InterviewExperience {
  _id: Id<"interviewExperiences">;
  companyId: Id<"companies">;
  mosCode: string;
  mosId?: Id<"mosCodes">;
  roleTitle: string;
  interviewDate: number;
  processDescription: string;
  questionsAsked: string[];
  tips: string;
  difficulty: InterviewDifficulty;
  outcome: InterviewOutcome;
  timelineWeeks: number;
  verificationStatus: VerificationStatus;
  submittedBy?: Id<"users">;
  helpfulCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Interview experience with company enrichment
 */
export interface EnrichedInterviewExperience extends InterviewExperience {
  companyName: string;
  companySlug: string | null;
  _masked?: boolean;
}

/**
 * Masked interview experience (for anonymous/limited users with no views)
 * Contains only non-sensitive data
 */
export interface MaskedInterviewExperience {
  _id: Id<"interviewExperiences">;
  mosCode: string;
  roleTitle: string;
  difficulty: InterviewDifficulty;
  outcome: InterviewOutcome;
  timelineWeeks: number;
  processDescription: null;
  questionsAsked: string[]; // Empty array when masked
  tips: null;
  interviewDate: null;
  verificationStatus: VerificationStatus;
  helpfulCount: number;
  createdAt: number;
  companyName: string | null;
  companySlug: string | null;
  _masked: true;
}

/**
 * Filters for listing interview experiences
 */
export interface InterviewExperienceFilters {
  companyId?: string;
  mosCode?: string;
  difficulty?: InterviewDifficulty;
  outcome?: InterviewOutcome;
  verificationStatus?: VerificationStatus;
  limit?: number;
  offset?: number;
  sort?: InterviewSort;
}

/**
 * Input for submitting a new interview experience
 */
export interface InterviewExperienceInput {
  companyId: string;
  mosCode: string;
  mosId?: string;
  roleTitle: string;
  interviewDate: number;
  processDescription: string;
  questionsAsked: string[];
  tips: string;
  difficulty: InterviewDifficulty;
  outcome: InterviewOutcome;
  timelineWeeks: number;
  submittedBy?: string;
}

// ===========================================
// Helpful Vote Types
// ===========================================

/**
 * Vote input for helpful votes
 */
export interface HelpfulVoteInput {
  userId: string;
  targetType: HelpfulVoteTarget;
  targetId: string;
}

/**
 * User vote record
 */
export interface UserVote {
  targetType: HelpfulVoteTarget;
  targetId: string;
}

// ===========================================
// Community Stats Types
// ===========================================

/**
 * Aggregate statistics for homepage/community display
 */
export interface CommunityStats {
  totalSalaryReports: number;
  totalInterviewExperiences: number;
  totalContributors: number;
  totalHelpfulVotes: number;
  verifiedSalaryReports: number;
  verifiedInterviewExperiences: number;
}

/**
 * Recent activity item (salary)
 */
export interface RecentSalaryActivity {
  type: "salary";
  id: Id<"salaryReports">;
  mosCode: string;
  companyName: string;
  companySlug: string | null;
  location: string;
  baseSalary: number;
  signingBonus?: number;
  clearanceLevel: ClearanceLevel;
  helpfulCount: number;
  createdAt: number;
}

/**
 * Recent activity item (interview)
 */
export interface RecentInterviewActivity {
  type: "interview";
  id: Id<"interviewExperiences">;
  mosCode: string;
  roleTitle: string;
  companyName: string;
  companySlug: string | null;
  outcome: InterviewOutcome;
  difficulty: InterviewDifficulty;
  timelineWeeks: number;
  helpfulCount: number;
  createdAt: number;
}

/**
 * Union type for all recent activity
 */
export type RecentActivity = RecentSalaryActivity | RecentInterviewActivity;

// ===========================================
// Access-Controlled List Result Types
// ===========================================

/**
 * Inline aggregates for salary reports list
 */
export interface SalaryListAggregates {
  count: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

/**
 * Inline aggregates for interview experiences list
 */
export interface InterviewListAggregates {
  count: number;
  avgTimelineWeeks: number | null;
  outcomeBreakdown: {
    OFFER: number;
    REJECTED: number;
    GHOSTED: number;
    WITHDREW: number;
  };
  difficultyBreakdown: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  offerRate: number;
}

/**
 * Access-controlled salary reports list result
 */
export interface SalaryReportsWithAccessResult {
  reports: (EnrichedSalaryReport | MaskedSalaryReport)[];
  total: number;
  aggregates: SalaryListAggregates | null;
  accessLevel: CommunityAccessLevel;
  viewsRemaining?: number;
  requiresAuth?: boolean;
  requiresContribution?: boolean;
}

/**
 * Access-controlled interview experiences list result
 */
export interface InterviewExperiencesWithAccessResult {
  experiences: (EnrichedInterviewExperience | MaskedInterviewExperience)[];
  total: number;
  aggregates: InterviewListAggregates | null;
  accessLevel: CommunityAccessLevel;
  viewsRemaining?: number;
  requiresAuth?: boolean;
  requiresContribution?: boolean;
}

/**
 * User's own submissions
 */
export interface UserSubmissionsResult {
  submissions: (
    | (EnrichedSalaryReport & { type: "salary" })
    | (EnrichedInterviewExperience & { type: "interview" })
  )[];
  totalSalaryReports: number;
  totalInterviewExperiences: number;
}

// ===========================================
// Composable Return Types
// ===========================================

/**
 * Return type for useSalaryReports composable
 */
export interface UseSalaryReportsReturn {
  fetchSalaryReports: (
    filters?: SalaryReportFilters,
  ) => Promise<{ reports: EnrichedSalaryReport[]; total: number }>;
  fetchSalaryAggregates: (
    mosCode?: string,
    companyId?: string,
  ) => Promise<SalaryAggregates | null>;
  getSalaryReportById: (id: string) => Promise<EnrichedSalaryReport | null>;
  submitSalaryReport: (
    input: SalaryReportInput,
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  voteHelpful: (
    reportId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeVote: (
    reportId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  hasVoted: (reportId: string) => Promise<boolean>;
}

/**
 * Return type for useInterviewExperiences composable
 */
export interface UseInterviewExperiencesReturn {
  fetchInterviews: (
    filters?: InterviewExperienceFilters,
  ) => Promise<{ experiences: EnrichedInterviewExperience[]; total: number }>;
  getInterviewById: (id: string) => Promise<EnrichedInterviewExperience | null>;
  submitInterview: (
    input: InterviewExperienceInput,
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  voteHelpful: (
    experienceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeVote: (
    experienceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  hasVoted: (experienceId: string) => Promise<boolean>;
}

/**
 * Return type for useCommunityStats composable
 */
export interface UseCommunityStatsReturn {
  fetchStats: () => Promise<CommunityStats>;
  fetchRecentActivity: (limit?: number) => Promise<RecentActivity[]>;
}
