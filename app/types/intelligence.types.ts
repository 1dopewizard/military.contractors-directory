/**
 * @file Shared contractor intelligence types
 * @description Public response contracts for USAspending-backed intelligence surfaces
 */

export type ExplorerIntent =
  | "company_lookup"
  | "company_comparison"
  | "agency_top_contractors"
  | "category_search"
  | "location_search"
  | "award_keyword_search"
  | "unsupported";

export type FollowUpMode = "refine" | "pivot" | "answer";

export type IntelligenceFilterKind =
  | "contractor"
  | "recipient"
  | "agency"
  | "naics"
  | "psc"
  | "location"
  | "keyword"
  | "fiscal_year"
  | "time_period";

export interface IntelligenceFilter {
  kind: IntelligenceFilterKind;
  label: string;
  value: string;
  code?: string;
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface SourceMetadata {
  sources: SourceLink[];
  generatedAt: string;
  refreshedAt: string | null;
  expiresAt: string | null;
  freshness: string;
  cacheStatus: "live" | "cached" | "stale" | "error";
  structuredRecords: number;
  filters: IntelligenceFilter[];
  warnings: string[];
}

export interface AwardSummary {
  key: string;
  awardId: string;
  generatedAwardId: string | null;
  piid: string | null;
  recipientName: string;
  recipientSlug: string | null;
  recipientUei: string | null;
  recipientCageCode: string | null;
  awardingAgency: string | null;
  awardingSubAgency: string | null;
  fundingAgency: string | null;
  fundingSubAgency: string | null;
  naicsCode: string | null;
  naicsTitle: string | null;
  pscCode: string | null;
  pscTitle: string | null;
  fiscalYear: number | null;
  startDate: string | null;
  endDate: string | null;
  obligation: number;
  awardType: string | null;
  description: string | null;
  placeOfPerformance: string | null;
  sourceUrl: string;
}

export interface RankingRow {
  rank: number;
  slug: string | null;
  name: string;
  obligations: number;
  awardCount: number;
  uei?: string | null;
  code?: string | null;
  share?: number | null;
  sourceUrl?: string | null;
}

export interface TrendPoint {
  key: string;
  label: string;
  fiscalYear: number;
  obligation: number;
  awardCount: number;
}

export interface IntelligenceBucket {
  key: string;
  label: string;
  obligation: number;
  awardCount: number;
}

export interface ExplorerPlan {
  intent: ExplorerIntent;
  contractors: string[];
  agency: string | null;
  naics: string | null;
  psc: string | null;
  location: string | null;
  keywords: string[];
  fiscalYears: number[];
  limit: number;
}

export interface ExplorerResult {
  id: string;
  query: string;
  plan: ExplorerPlan;
  summary: string;
  resultType: ExplorerIntent;
  filtersUsed: IntelligenceFilter[];
  table: Array<Record<string, string | number | null>>;
  cards: Array<{ label: string; value: string; detail: string }>;
  chart: TrendPoint[];
  awards: AwardSummary[];
  rankings: RankingRow[];
  sourceLinks: SourceLink[];
  sourceMetadata: SourceMetadata;
  cached: boolean;
}

export interface FollowUpResult {
  id: string;
  mode: FollowUpMode;
  query: string;
  answer: string | null;
  result: ExplorerResult | null;
  sourceMetadata: SourceMetadata;
}

export interface ContractorIntelligence {
  contractor: {
    id: string | null;
    slug: string;
    name: string;
    headquarters: string | null;
    website: string | null;
    defenseRevenue: number | null;
    totalRevenue: number | null;
  };
  summary: {
    totalObligations: number;
    awardCount: number;
    latestFiscalYear: number | null;
    yoyDelta: number | null;
    topAgency: IntelligenceBucket | null;
    topSubAgency: IntelligenceBucket | null;
    topNaics: IntelligenceBucket | null;
    topPsc: IntelligenceBucket | null;
  };
  aliases: string[];
  identifiers: {
    uei: string | null;
    cageCode: string | null;
  };
  linkedRecipients: Array<{
    name: string;
    uei: string | null;
    awardCount: number;
    obligations: number;
  }>;
  topAwards: AwardSummary[];
  recentAwards: AwardSummary[];
  yearlyTrend: TrendPoint[];
  topAgencies: IntelligenceBucket[];
  topSubAgencies: IntelligenceBucket[];
  topNaics: IntelligenceBucket[];
  topPsc: IntelligenceBucket[];
  sourceLinks: SourceLink[];
  sourceMetadata: SourceMetadata;
}
