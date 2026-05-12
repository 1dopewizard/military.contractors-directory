/**
 * @file Teaming discovery utilities
 * @description Public-data matching helpers for prime and small-business discovery
 */

import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/utils/db";
import type { ContractorSnapshot } from "@/server/database/schema/snapshot";

export const teamingSearchSchema = z.object({
  q: z.string().trim().optional().default(""),
  naics: z.string().trim().optional(),
  psc: z.string().trim().optional(),
  agency: z.string().trim().optional(),
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
  reasons: TeamingMatchReason[];
}

export function buildTeamingMatchReasons(
  row: ContractorSnapshot,
  input: TeamingSearchInput,
): TeamingMatchReason[] {
  const reasons: TeamingMatchReason[] = [];

  if (input.naics && row.topNaicsCode === input.naics) {
    reasons.push({
      label: "NAICS overlap",
      value: row.topNaicsTitle ?? input.naics,
      provenance: "public_data",
    });
  }

  if (input.psc && row.topPscCode === input.psc) {
    reasons.push({
      label: "PSC overlap",
      value: row.topPscTitle ?? input.psc,
      provenance: "public_data",
    });
  }

  if (input.agency) {
    const agencyText =
      `${row.topAwardingAgency ?? ""} ${row.topAwardingSubagency ?? ""}`.toLowerCase();
    if (agencyText.includes(input.agency.toLowerCase())) {
      reasons.push({
        label: "Agency activity",
        value:
          row.topAwardingSubagency ?? row.topAwardingAgency ?? input.agency,
        provenance: "public_data",
      });
    }
  }

  if (input.q) {
    const text =
      `${row.recipientName} ${row.topNaicsTitle ?? ""} ${row.topPscTitle ?? ""}`.toLowerCase();
    if (text.includes(input.q.toLowerCase())) {
      reasons.push({
        label: "Keyword match",
        value: input.q,
        provenance: "public_data",
      });
    }
  }

  if (!reasons.length) {
    reasons.push({
      label: "Public activity",
      value: "DoD award recipient in the current snapshot",
      provenance: "public_data",
    });
  }

  return reasons;
}

export function scoreTeamingMatch(
  row: ContractorSnapshot,
  reasons: TeamingMatchReason[],
): number {
  const reasonScore = reasons.length * 10;
  const volumeScore = Math.min(
    Math.log10(Math.max(row.totalObligations36m, 1)),
    10,
  );
  const activityScore = Math.min(row.awardCount36m, 20) / 2;
  return Math.round(reasonScore + volumeScore + activityScore);
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
        like(schema.contractorSnapshot.recipientName, value),
        like(schema.contractorSnapshot.topNaicsTitle, value),
        like(schema.contractorSnapshot.topPscTitle, value),
      ),
    );
  }

  if (input.naics) {
    conditions.push(eq(schema.contractorSnapshot.topNaicsCode, input.naics));
  }

  if (input.psc) {
    conditions.push(eq(schema.contractorSnapshot.topPscCode, input.psc));
  }

  if (input.agency) {
    const value = `%${input.agency}%`;
    conditions.push(
      or(
        like(schema.contractorSnapshot.topAwardingAgency, value),
        like(schema.contractorSnapshot.topAwardingSubagency, value),
      ),
    );
  }

  const rows = await db
    .select()
    .from(schema.contractorSnapshot)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.contractorSnapshot.totalObligations36m))
    .limit(input.limit);

  return rows.map((row) => {
    const reasons = buildTeamingMatchReasons(row, input);
    return {
      slug: row.slug,
      name: row.recipientName,
      obligations36m: row.totalObligations36m,
      awardCount36m: row.awardCount36m,
      sourceUrl: row.sourceUrl,
      matchScore: scoreTeamingMatch(row, reasons),
      reasons,
    };
  });
}
