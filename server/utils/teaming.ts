/**
 * @file Teaming discovery utilities
 * @description Public-data matching helpers for prime and small-business discovery
 */

import { and, desc, like, or } from "drizzle-orm";
import { z } from "zod";
import type {
  AwardSummary,
  ContractorIntelligence,
  IntelligenceBucket,
} from "@/app/types/intelligence.types";
import { getDb, schema } from "@/server/utils/db";
import { getCachedSnapshotProfileIntelligence } from "@/server/utils/contractor-snapshot";

export const teamingSearchSchema = z.object({
  q: z.string().trim().optional().default(""),
  naics: z.string().trim().optional(),
  psc: z.string().trim().optional(),
  agency: z.string().trim().optional(),
  role: z.enum(["any", "prime", "sub"]).optional().default("any"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type TeamingSearchInput = z.infer<typeof teamingSearchSchema>;

export interface TeamingMatchReason {
  label: string;
  value: string;
  provenance: "public_data" | "contractor_declared";
}

export interface TeamingSearchResult {
  slug: string;
  name: string;
  obligations36m: number;
  awardCount36m: number;
  sourceUrl: string;
  matchScore: number;
  roleFit: "likely_prime" | "potential_sub";
  reasons: TeamingMatchReason[];
}

type DirectoryGroupRow = typeof schema.contractorDirectoryGroup.$inferSelect;

interface EnrichedTeamingRow {
  row: DirectoryGroupRow;
  intelligence: ContractorIntelligence | null;
  awardCount: number;
  topNaics: IntelligenceBucket[];
  topPsc: IntelligenceBucket[];
  recentAwards: AwardSummary[];
  topAwards: AwardSummary[];
}

export async function searchTeamingMatches(
  input: TeamingSearchInput,
): Promise<TeamingSearchResult[]> {
  const db = getDb();
  const conditions = [];

  if (input.q) {
    const value = `%${input.q}%`;
    conditions.push(
      or(
        like(schema.contractorDirectoryGroup.canonicalName, value),
        like(schema.contractorDirectoryGroup.topNaicsTitle, value),
        like(schema.contractorDirectoryGroup.topPscTitle, value),
      ),
    );
  }

  if (input.agency) {
    const value = `%${input.agency}%`;
    conditions.push(
      or(
        like(schema.contractorDirectoryGroup.topAwardingAgency, value),
        like(schema.contractorDirectoryGroup.topAwardingSubagency, value),
      ),
    );
  }

  const candidateLimit = input.naics || input.psc ? 1000 : input.limit * 8;
  const rows = await db
    .select()
    .from(schema.contractorDirectoryGroup)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.contractorDirectoryGroup.totalObligations36m))
    .limit(candidateLimit);

  const enrichedRows = await Promise.all(rows.map(enrichTeamingRow));

  return enrichedRows
    .filter((entry) => matchesCapabilityFilters(entry, input))
    .filter((entry) => matchesKeywordFilter(entry, input.q))
    .map((entry) => toTeamingSearchResult(entry, input))
    .filter((result) => matchesRoleFilter(result, input.role))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, input.limit);
}

async function enrichTeamingRow(
  row: DirectoryGroupRow,
): Promise<EnrichedTeamingRow> {
  const cached = await getCachedSnapshotProfileIntelligence(row.slug).catch(
    () => null,
  );
  const intelligence = cached?.intelligence ?? null;
  const snapshotNaics = row.topNaicsCode
    ? [
        {
          key: row.topNaicsCode,
          label: row.topNaicsTitle ?? `NAICS ${row.topNaicsCode}`,
          obligation: row.totalObligations36m,
          awardCount: row.awardCount36m,
        },
      ]
    : [];
  const snapshotPsc = row.topPscCode
    ? [
        {
          key: row.topPscCode,
          label: row.topPscTitle ?? `PSC ${row.topPscCode}`,
          obligation: row.totalObligations36m,
          awardCount: row.awardCount36m,
        },
      ]
    : [];

  return {
    row,
    intelligence,
    awardCount: row.awardCount36m || intelligence?.summary.awardCount || 0,
    topNaics: intelligence?.topNaics.length
      ? intelligence.topNaics
      : snapshotNaics,
    topPsc: intelligence?.topPsc.length ? intelligence.topPsc : snapshotPsc,
    recentAwards: intelligence?.recentAwards ?? [],
    topAwards: intelligence?.topAwards ?? [],
  };
}

function matchesCapabilityFilters(
  entry: EnrichedTeamingRow,
  input: TeamingSearchInput,
): boolean {
  const naicsMatches = input.naics
    ? entry.topNaics.some((bucket) => bucket.key.startsWith(input.naics ?? ""))
    : true;
  const pscMatches = input.psc
    ? entry.topPsc.some((bucket) =>
        bucket.key.toLowerCase().startsWith((input.psc ?? "").toLowerCase()),
      )
    : true;
  return naicsMatches && pscMatches;
}

function matchesKeywordFilter(
  entry: EnrichedTeamingRow,
  keyword: string,
): boolean {
  if (!keyword) return true;
  const normalized = keyword.toLowerCase();
  const searchableText = [
    entry.row.canonicalName,
    entry.row.topNaicsTitle,
    entry.row.topPscTitle,
    ...entry.topNaics.map((bucket) => `${bucket.key} ${bucket.label}`),
    ...entry.topPsc.map((bucket) => `${bucket.key} ${bucket.label}`),
    ...entry.topAwards.map((award) => award.description ?? ""),
    ...entry.recentAwards.map((award) => award.description ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return searchableText.includes(normalized);
}

function toTeamingSearchResult(
  entry: EnrichedTeamingRow,
  input: TeamingSearchInput,
): TeamingSearchResult {
  const reasons = buildTeamingMatchReasons(entry, input);
  const roleFit = inferRoleFit(entry);
  return {
    slug: entry.row.slug,
    name: entry.row.canonicalName,
    obligations36m: entry.row.totalObligations36m,
    awardCount36m: entry.awardCount,
    sourceUrl: entry.row.sourceUrl,
    matchScore: scoreTeamingMatch(entry, reasons, roleFit),
    roleFit,
    reasons,
  };
}

function buildTeamingMatchReasons(
  entry: EnrichedTeamingRow,
  input: TeamingSearchInput,
): TeamingMatchReason[] {
  const reasons: TeamingMatchReason[] = [];

  if (input.naics) {
    for (const bucket of entry.topNaics.filter((row) =>
      row.key.startsWith(input.naics ?? ""),
    )) {
      reasons.push({
        label: "NAICS capability",
        value: `${bucket.key} - ${bucket.label}`,
        provenance: "public_data",
      });
    }
  }

  if (input.psc) {
    for (const bucket of entry.topPsc.filter((row) =>
      row.key.toLowerCase().startsWith((input.psc ?? "").toLowerCase()),
    )) {
      reasons.push({
        label: "PSC capability",
        value: `${bucket.key} - ${bucket.label}`,
        provenance: "public_data",
      });
    }
  }

  if (input.agency) {
    const agencyText =
      `${entry.row.topAwardingAgency ?? ""} ${entry.row.topAwardingSubagency ?? ""}`.toLowerCase();
    if (agencyText.includes(input.agency.toLowerCase())) {
      reasons.push({
        label: "Agency activity",
        value:
          entry.row.topAwardingSubagency ??
          entry.row.topAwardingAgency ??
          input.agency,
        provenance: "public_data",
      });
    }
  }

  if (input.q) {
    reasons.push({
      label: "Keyword evidence",
      value: input.q,
      provenance: "public_data",
    });
  }

  if (!reasons.length) {
    reasons.push({
      label: "Public activity",
      value: "DoD award recipient in the current snapshot",
      provenance: "public_data",
    });
  }

  reasons.push({
    label:
      entry.row.totalObligations36m >= 100_000_000
        ? "Prime signal"
        : "Sub signal",
    value:
      entry.row.totalObligations36m >= 100_000_000
        ? "High direct-award volume"
        : "Focused or lower-volume award footprint",
    provenance: "public_data",
  });

  return reasons;
}

function inferRoleFit(
  entry: EnrichedTeamingRow,
): "likely_prime" | "potential_sub" {
  if (entry.row.totalObligations36m >= 100_000_000 || entry.awardCount >= 25) {
    return "likely_prime";
  }
  return "potential_sub";
}

function matchesRoleFilter(
  result: TeamingSearchResult,
  role: TeamingSearchInput["role"],
): boolean {
  if (role === "prime") return result.roleFit === "likely_prime";
  if (role === "sub") return result.roleFit === "potential_sub";
  return true;
}

function scoreTeamingMatch(
  entry: EnrichedTeamingRow,
  reasons: TeamingMatchReason[],
  roleFit: TeamingSearchResult["roleFit"],
): number {
  const reasonScore = reasons.length * 10;
  const volumeScore = Math.min(
    Math.log10(Math.max(entry.row.totalObligations36m, 1)),
    10,
  );
  const activityScore = Math.min(entry.awardCount, 20) / 2;
  const roleScore = roleFit === "likely_prime" ? 5 : 0;
  return Math.round(reasonScore + volumeScore + activityScore + roleScore);
}
