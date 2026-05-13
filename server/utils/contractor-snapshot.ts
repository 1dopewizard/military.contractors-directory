/**
 * @file Contractor snapshot operations
 * @description USAspending recipient snapshot refresh, querying, and profile enrichment
 */

import { createHash } from "node:crypto";
import { z } from "zod";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import type {
  AwardSummary,
  ContractorIntelligence,
  IntelligenceBucket,
  IntelligenceFilter,
  RankingRow,
  SourceMetadata,
  TrendPoint,
} from "@/app/types/intelligence.types";
import { getDb, schema } from "@/server/utils/db";
import { buildContractorIntelligenceSignals } from "@/server/utils/intelligence";
import {
  buildUsaSpendingFilters,
  CONTRACT_AWARD_TYPE_CODES,
  fetchUsaSpendingTrend,
  formatUsaSpendingMessages,
  searchUsaSpendingAwards,
  slugify,
  sourceLinksForAwards,
  USA_SPENDING_API_BASE_URL,
  USA_SPENDING_BASE_URL,
  type UsaSpendingAgencyFilter,
  type UsaSpendingAwardSearchInput,
} from "@/server/utils/usaspending";

const RECIPIENT_CATEGORY_URL = `${USA_SPENDING_API_BASE_URL}/search/spending_by_category/recipient/`;
const PUBLIC_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const snapshotProfileRefreshes = new Map<string, Promise<void>>();

export const SNAPSHOT_WINDOW_MONTHS = 36;
export const DEFAULT_SNAPSHOT_LIMIT = 100;
export const MAX_SNAPSHOT_LIMIT = 100;

export const DOD_AWARDING_AGENCY_FILTERS: UsaSpendingAgencyFilter[] = [
  {
    type: "awarding",
    tier: "toptier",
    name: "Department of Defense",
  },
];

const CURATED_DIRECTORY_ALIAS_MAPPINGS: CuratedDirectoryAliasMapping[] = [];

const snapshotCategoryRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullable().optional(),
    recipient_id: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    code: z.union([z.string(), z.number()]).nullable().optional(),
    uei: z.string().nullable().optional(),
    amount: z.coerce.number().default(0),
    count: z.coerce.number().nullable().optional(),
    award_count: z.coerce.number().nullable().optional(),
    transaction_count: z.coerce.number().nullable().optional(),
    last_award_date: z.string().nullable().optional(),
    top_awarding_agency: z.string().nullable().optional(),
    top_awarding_subagency: z.string().nullable().optional(),
    top_naics_code: z.union([z.string(), z.number()]).nullable().optional(),
    top_naics_title: z.string().nullable().optional(),
    top_psc_code: z.union([z.string(), z.number()]).nullable().optional(),
    top_psc_title: z.string().nullable().optional(),
  })
  .passthrough();

const snapshotCategoryResponseSchema = z.object({
  results: z.array(snapshotCategoryRowSchema).default([]),
  page_metadata: z
    .object({
      page: z.coerce.number().optional(),
      hasNext: z.boolean().optional(),
      total: z.coerce.number().optional(),
    })
    .passthrough()
    .optional(),
  messages: z.array(z.string()).default([]),
});

const snapshotQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  agency: z.string().trim().max(160).optional().default(""),
  naics: z.string().trim().max(80).optional().default(""),
  psc: z.string().trim().max(80).optional().default(""),
  sort: z
    .enum([
      "totalObligations36m",
      "awardCount36m",
      "lastAwardDate",
      "recipientName",
      "topAwardingAgency",
      "topNaics",
      "topPsc",
    ])
    .optional()
    .default("totalObligations36m"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_SNAPSHOT_LIMIT)
    .optional()
    .default(25),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SnapshotQuery = z.infer<typeof snapshotQuerySchema>;
type SnapshotCategoryRow = z.infer<typeof snapshotCategoryRowSchema>;

export interface SnapshotWindow {
  startDate: string;
  endDate: string;
}

export type CachedProfileIntelligenceStatus =
  | "ready"
  | "stale"
  | "refreshing"
  | "unavailable";

export interface CachedProfileIntelligence {
  status: CachedProfileIntelligenceStatus;
  intelligence: ContractorIntelligence | null;
  refreshedAt: string | null;
  expiresAt: string | null;
  warnings: string[];
}

export interface NormalizedSnapshotRow {
  id: string;
  slug: string;
  recipientName: string;
  normalizedName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: Date | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string;
  sourceMetadata: Record<string, unknown>;
  rawAggregate: Record<string, unknown>;
}

export type DirectoryAliasMatchReason =
  | "single_snapshot"
  | "shared_identifier"
  | "shared_name"
  | "curated_alias";

export interface ContractorDirectoryAliasResponse {
  id: string;
  groupId: string;
  snapshotId: string;
  slug: string;
  recipientName: string;
  normalizedName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: string | null;
  sourceUrl: string;
  isCanonical: boolean;
  matchReason: DirectoryAliasMatchReason;
  matchKey: string;
}

export interface ContractorSnapshotListRow {
  id: string;
  slug: string;
  canonicalSlug: string;
  recipientName: string;
  normalizedName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: string | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string;
  refreshedAt: string;
  snapshotWindowStart: string;
  snapshotWindowEnd: string;
  aliasCount: number;
  alternateRecipientNames: string[];
}

export interface ContractorSnapshotListResponse {
  rows: ContractorSnapshotListRow[];
  contractors: Array<ContractorSnapshotListRow & { name: string }>;
  total: number;
  limit: number;
  offset: number;
  sourceMetadata: SourceMetadata;
}

export interface ContractorDirectoryProfile {
  group: typeof schema.contractorDirectoryGroup.$inferSelect;
  snapshot: typeof schema.contractorSnapshot.$inferSelect | null;
  aliases: ContractorDirectoryAliasResponse[];
  requestedAlias: ContractorDirectoryAliasResponse | null;
  isAliasRequest: boolean;
}

export interface ContractorDirectorySnapshotInput {
  id: string;
  slug: string;
  recipientName: string;
  normalizedName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: Date | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string;
  sourceMetadata: Record<string, unknown> | null;
  snapshotWindowStart: Date;
  snapshotWindowEnd: Date;
  refreshedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CuratedDirectoryAliasMapping {
  canonicalSlug: string;
  canonicalName: string;
  snapshotSlugs?: string[];
  recipientNames?: string[];
  recipientUeis?: string[];
  recipientCodes?: string[];
}

export interface BuiltContractorDirectoryAlias {
  id: string;
  groupId: string;
  snapshotId: string;
  slug: string;
  recipientName: string;
  normalizedName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: Date | null;
  sourceUrl: string;
  isCanonical: boolean;
  matchReason: DirectoryAliasMatchReason;
  matchKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuiltContractorDirectoryGroup {
  id: string;
  slug: string;
  canonicalName: string;
  normalizedName: string;
  primarySnapshotId: string;
  primaryRecipientUei: string | null;
  primaryRecipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: Date | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string;
  sourceMetadata: Record<string, unknown>;
  aliasCount: number;
  snapshotWindowStart: Date;
  snapshotWindowEnd: Date;
  refreshedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  aliases: BuiltContractorDirectoryAlias[];
}

export interface RefreshContractorSnapshotOptions {
  window?: SnapshotWindow;
  limit?: number;
  maxPages?: number;
}

export function getTrailingSnapshotWindow(
  date = new Date(),
  months = SNAPSHOT_WINDOW_MONTHS,
): SnapshotWindow {
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - months);

  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
  };
}

export function buildContractorSnapshotFilters(
  window = getTrailingSnapshotWindow(),
): Record<string, unknown> {
  return buildUsaSpendingFilters({
    timePeriod: [{ startDate: window.startDate, endDate: window.endDate }],
    agencies: DOD_AWARDING_AGENCY_FILTERS,
    awardTypeCodes: CONTRACT_AWARD_TYPE_CODES,
  });
}

export function parseContractorSnapshotQuery(input: unknown): SnapshotQuery {
  return snapshotQuerySchema.parse(input);
}

export async function fetchContractorSnapshotPage(options: {
  page: number;
  limit?: number;
  window?: SnapshotWindow;
}): Promise<{
  rows: SnapshotCategoryRow[];
  hasNext: boolean;
  messages: string[];
  page: number;
  total: number | null;
}> {
  const limit = Math.min(options.limit ?? DEFAULT_SNAPSHOT_LIMIT, 100);
  const payload = {
    filters: buildContractorSnapshotFilters(options.window),
    limit,
    page: options.page,
    spending_level: "awards",
  };

  const response = await fetchJsonWithRetry(RECIPIENT_CATEGORY_URL, payload);
  const parsed = snapshotCategoryResponseSchema.parse(response);

  return {
    rows: parsed.results,
    hasNext:
      parsed.page_metadata?.hasNext ??
      (parsed.results.length > 0 && parsed.results.length === limit),
    messages: parsed.messages,
    page: parsed.page_metadata?.page ?? options.page,
    total: parsed.page_metadata?.total ?? null,
  };
}

export function normalizeContractorSnapshotRow(
  row: SnapshotCategoryRow,
  window = getTrailingSnapshotWindow(),
  options: {
    slug?: string;
  } = {},
): NormalizedSnapshotRow {
  const recipientName = (row.name ?? "Unknown recipient").trim();
  const recipientCode =
    stringOrNull(row.recipient_id) ??
    stringOrNull(row.uei) ??
    stringOrNull(row.code) ??
    stringOrNull(row.id);
  const normalizedName = normalizeText(recipientName);
  const recipientUei = stringOrNull(row.uei) ?? inferUei(row.code);
  const slug = options.slug ?? snapshotSlug(recipientName, recipientCode);
  const lastAwardDate = row.last_award_date
    ? parseDateOnly(row.last_award_date)
    : null;

  return {
    id: stableId(recipientCode ?? normalizedName),
    slug,
    recipientName,
    normalizedName,
    recipientUei,
    recipientCode,
    totalObligations36m: row.amount,
    awardCount36m: Math.max(
      0,
      Number(row.award_count ?? row.count ?? row.transaction_count ?? 0),
    ),
    lastAwardDate,
    topAwardingAgency: row.top_awarding_agency ?? "Department of Defense",
    topAwardingSubagency: row.top_awarding_subagency ?? null,
    topNaicsCode:
      row.top_naics_code == null ? null : String(row.top_naics_code),
    topNaicsTitle: row.top_naics_title ?? null,
    topPscCode: row.top_psc_code == null ? null : String(row.top_psc_code),
    topPscTitle: row.top_psc_title ?? null,
    sourceUrl: recipientCode
      ? `${USA_SPENDING_BASE_URL}/recipient/${encodeURIComponent(recipientCode)}/latest`
      : `${USA_SPENDING_BASE_URL}/search`,
    sourceMetadata: {
      api: "usaspending",
      endpoint: "/api/v2/search/spending_by_category/recipient/",
      window,
      filters: buildContractorSnapshotFilters(window),
    },
    rawAggregate: row as Record<string, unknown>,
  };
}

export async function refreshContractorSnapshot(
  options: RefreshContractorSnapshotOptions = {},
) {
  const db = getDb();
  const window = options.window ?? getTrailingSnapshotWindow();
  const limit = Math.min(options.limit ?? DEFAULT_SNAPSHOT_LIMIT, 100);
  const maxPages = options.maxPages ?? 1000;
  const startedAt = new Date();
  const now = startedAt;
  const messages: string[] = [];
  let pageCount = 0;
  let rowCount = 0;

  const [run] = await db
    .insert(schema.contractorSnapshotRun)
    .values({
      id: stableId(`snapshot:${startedAt.toISOString()}`),
      status: "running",
      windowStart: parseDateOnly(window.startDate),
      windowEnd: parseDateOnly(window.endDate),
      startedAt,
      sourceMetadata: {
        api: "usaspending",
        endpoint: "/api/v2/search/spending_by_category/recipient/",
        window,
        filters: buildContractorSnapshotFilters(window),
      },
      updatedAt: now,
    })
    .returning();

  if (!run) {
    throw new Error("Failed to create contractor snapshot run");
  }

  const runId = run.id;
  const slugOwners = await existingSnapshotSlugOwners();
  const usedSlugs = new Map<string, string>();

  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetchContractorSnapshotPage({
        page,
        limit,
        window,
      });
      pageCount = page;
      messages.push(...response.messages);

      for (const row of response.rows) {
        const owner = snapshotOwnerKey(row);
        const slug = uniqueSnapshotSlug(
          row.name ?? "Unknown recipient",
          owner,
          {
            slugOwners,
            usedSlugs,
          },
        );
        const normalized = normalizeContractorSnapshotRow(row, window, {
          slug,
        });
        await upsertSnapshotRow(normalized, runId, window);
        rowCount += 1;
      }

      await db
        .update(schema.contractorSnapshotRun)
        .set({
          pageCount,
          rowCount,
          updatedAt: new Date(),
          sourceMetadata: {
            api: "usaspending",
            endpoint: "/api/v2/search/spending_by_category/recipient/",
            window,
            filters: buildContractorSnapshotFilters(window),
            messages: formatUsaSpendingMessages(messages),
            upstreamTotal: response.total,
          },
        })
        .where(eq(schema.contractorSnapshotRun.id, runId));

      if (!response.hasNext) break;
      if (page === maxPages) {
        throw new Error(`Stopped after maxPages=${maxPages}`);
      }
    }

    const completedAt = new Date();

    await db.transaction(async (tx) => {
      const currentRunRows = await tx
        .select()
        .from(schema.contractorSnapshot)
        .where(eq(schema.contractorSnapshot.runId, runId));
      const groups = buildContractorDirectoryGroups(
        currentRunRows,
        CURATED_DIRECTORY_ALIAS_MAPPINGS,
      );

      await tx.delete(schema.contractorDirectoryAlias);
      await tx.delete(schema.contractorDirectoryGroup);
      await tx
        .delete(schema.contractorSnapshot)
        .where(
          sql`${schema.contractorSnapshot.runId} IS NULL OR ${schema.contractorSnapshot.runId} <> ${runId}`,
        );

      for (const group of groups) {
        await tx.insert(schema.contractorDirectoryGroup).values({
          id: group.id,
          slug: group.slug,
          canonicalName: group.canonicalName,
          normalizedName: group.normalizedName,
          primarySnapshotId: group.primarySnapshotId,
          primaryRecipientUei: group.primaryRecipientUei,
          primaryRecipientCode: group.primaryRecipientCode,
          totalObligations36m: group.totalObligations36m,
          awardCount36m: group.awardCount36m,
          lastAwardDate: group.lastAwardDate,
          topAwardingAgency: group.topAwardingAgency,
          topAwardingSubagency: group.topAwardingSubagency,
          topNaicsCode: group.topNaicsCode,
          topNaicsTitle: group.topNaicsTitle,
          topPscCode: group.topPscCode,
          topPscTitle: group.topPscTitle,
          sourceUrl: group.sourceUrl,
          sourceMetadata: group.sourceMetadata,
          aliasCount: group.aliasCount,
          snapshotWindowStart: group.snapshotWindowStart,
          snapshotWindowEnd: group.snapshotWindowEnd,
          refreshedAt: group.refreshedAt,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        });

        for (const alias of group.aliases) {
          await tx.insert(schema.contractorDirectoryAlias).values({
            id: alias.id,
            groupId: alias.groupId,
            snapshotId: alias.snapshotId,
            slug: alias.slug,
            recipientName: alias.recipientName,
            normalizedName: alias.normalizedName,
            recipientUei: alias.recipientUei,
            recipientCode: alias.recipientCode,
            totalObligations36m: alias.totalObligations36m,
            awardCount36m: alias.awardCount36m,
            lastAwardDate: alias.lastAwardDate,
            sourceUrl: alias.sourceUrl,
            isCanonical: alias.isCanonical,
            matchReason: alias.matchReason,
            matchKey: alias.matchKey,
            createdAt: alias.createdAt,
            updatedAt: alias.updatedAt,
          });
        }
      }

      await tx
        .update(schema.contractorSnapshotRun)
        .set({
          status: "completed",
          completedAt,
          pageCount,
          rowCount,
          updatedAt: completedAt,
          sourceMetadata: {
            api: "usaspending",
            endpoint: "/api/v2/search/spending_by_category/recipient/",
            window,
            filters: buildContractorSnapshotFilters(window),
            messages: formatUsaSpendingMessages(messages),
            directoryGroups: groups.length,
            directoryAliases: groups.reduce(
              (sum, group) => sum + group.aliasCount,
              0,
            ),
          },
        })
        .where(eq(schema.contractorSnapshotRun.id, runId));
    });
  } catch (error) {
    const completedAt = new Date();
    await db
      .update(schema.contractorSnapshotRun)
      .set({
        status: rowCount > 0 ? "partial" : "failed",
        completedAt,
        pageCount,
        rowCount,
        error: error instanceof Error ? error.message : "Snapshot failed",
        updatedAt: completedAt,
        sourceMetadata: {
          api: "usaspending",
          endpoint: "/api/v2/search/spending_by_category/recipient/",
          window,
          filters: buildContractorSnapshotFilters(window),
          messages: formatUsaSpendingMessages(messages),
        },
      })
      .where(eq(schema.contractorSnapshotRun.id, runId));
  }

  const [finishedRun] = await db
    .select()
    .from(schema.contractorSnapshotRun)
    .where(eq(schema.contractorSnapshotRun.id, runId))
    .limit(1);

  if (!finishedRun) {
    throw new Error(
      `Contractor snapshot run ${runId} was not found after refresh`,
    );
  }

  return {
    id: finishedRun.id,
    status: finishedRun.status,
    windowStart: finishedRun.windowStart.toISOString(),
    windowEnd: finishedRun.windowEnd.toISOString(),
    startedAt: finishedRun.startedAt.toISOString(),
    completedAt: finishedRun.completedAt?.toISOString() ?? null,
    pageCount: finishedRun.pageCount,
    rowCount: finishedRun.rowCount,
    error: finishedRun.error,
    sourceMetadata: finishedRun.sourceMetadata,
  };
}

export async function queryContractorSnapshots(
  input: unknown,
): Promise<ContractorSnapshotListResponse> {
  const query = parseContractorSnapshotQuery(input);
  const db = getDb();
  const whereClause = buildDirectoryGroupWhereClause(query);
  const orderBy = directoryGroupOrderBy(query);

  const rows = await db
    .select()
    .from(schema.contractorDirectoryGroup)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(query.limit)
    .offset(query.offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contractorDirectoryGroup)
    .where(whereClause);

  const aliasesByGroup = await aliasesForGroups(rows.map((row) => row.id));
  const sourceMetadata = await snapshotSourceMetadata(query);
  const mappedRows = rows.map((row) =>
    directoryGroupRowToResponse(row, aliasesByGroup.get(row.id) ?? []),
  );
  const { rows: enrichedRows, queuedRefreshCount } =
    await enrichSnapshotRowsFromProfileCaches(mappedRows);
  const enrichedSourceMetadata = queuedRefreshCount
    ? {
        ...sourceMetadata,
        warnings: formatUsaSpendingMessages([
          ...sourceMetadata.warnings,
          `Queued ${queuedRefreshCount} visible contractor profile refreshes to populate award counts, last-award dates, and contract codes.`,
        ]),
      }
    : sourceMetadata;

  return {
    rows: enrichedRows,
    contractors: enrichedRows.map((row) => ({
      ...row,
      name: row.recipientName,
    })),
    total: totalResult?.count ?? 0,
    limit: query.limit,
    offset: query.offset,
    sourceMetadata: enrichedSourceMetadata,
  };
}

async function enrichSnapshotRowsFromProfileCaches(
  rows: ContractorSnapshotListRow[],
): Promise<{ rows: ContractorSnapshotListRow[]; queuedRefreshCount: number }> {
  let queuedRefreshCount = 0;
  const enrichedRows = await Promise.all(
    rows.map(async (row) => {
      const cached = await getSnapshotProfileCache(
        snapshotProfileCacheKey(row.slug),
      );
      if (!cached) {
        if (snapshotRowNeedsProfileEnrichment(row)) {
          queuedRefreshCount += enqueueSnapshotProfileRefresh(row.slug) ? 1 : 0;
        }
        return row;
      }

      const enriched = mergeSnapshotRowProfileCache(row, cached.result);
      if (snapshotRowNeedsProfileEnrichment(enriched)) {
        queuedRefreshCount += enqueueSnapshotProfileRefresh(row.slug) ? 1 : 0;
      }
      return enriched;
    }),
  );

  return { rows: enrichedRows, queuedRefreshCount };
}

function snapshotRowNeedsProfileEnrichment(row: ContractorSnapshotListRow) {
  return (
    row.awardCount36m === 0 ||
    !row.lastAwardDate ||
    !row.topNaicsCode ||
    !row.topPscCode
  );
}

function mergeSnapshotRowProfileCache(
  row: ContractorSnapshotListRow,
  intelligence: ContractorIntelligence,
): ContractorSnapshotListRow {
  const latestAwardDate = latestDateString(
    [...intelligence.topAwards, ...intelligence.recentAwards].map(
      (award) => award.startDate,
    ),
  );
  const topNaics = intelligence.summary.topNaics ?? intelligence.topNaics[0];
  const topPsc = intelligence.summary.topPsc ?? intelligence.topPsc[0];

  return {
    ...row,
    awardCount36m: row.awardCount36m || intelligence.summary.awardCount,
    lastAwardDate: row.lastAwardDate ?? latestAwardDate,
    topNaicsCode: row.topNaicsCode ?? topNaics?.key ?? null,
    topNaicsTitle: row.topNaicsTitle ?? topNaics?.label ?? null,
    topPscCode: row.topPscCode ?? topPsc?.key ?? null,
    topPscTitle: row.topPscTitle ?? topPsc?.label ?? null,
  };
}

function latestDateString(values: Array<string | null>): string | null {
  const latest = values
    .filter((value): value is string => !!value)
    .sort()
    .at(-1);
  return latest ?? null;
}

export async function getContractorSnapshotBySlug(slug: string) {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(schema.contractorSnapshot)
    .where(eq(schema.contractorSnapshot.slug, slug.toLowerCase()))
    .limit(1);

  return snapshot ?? null;
}

export async function getContractorDirectoryProfileBySlug(
  slug: string,
): Promise<ContractorDirectoryProfile | null> {
  const db = getDb();
  const normalizedSlug = slug.toLowerCase();
  let requestedAlias: ContractorDirectoryAliasResponse | null = null;

  const [groupBySlug] = await db
    .select()
    .from(schema.contractorDirectoryGroup)
    .where(eq(schema.contractorDirectoryGroup.slug, normalizedSlug))
    .limit(1);

  let group = groupBySlug ?? null;

  if (!group) {
    const [aliasBySlug] = await db
      .select()
      .from(schema.contractorDirectoryAlias)
      .where(eq(schema.contractorDirectoryAlias.slug, normalizedSlug))
      .limit(1);

    if (!aliasBySlug) return null;

    requestedAlias = directoryAliasRowToResponse(aliasBySlug);
    const [groupByAlias] = await db
      .select()
      .from(schema.contractorDirectoryGroup)
      .where(eq(schema.contractorDirectoryGroup.id, aliasBySlug.groupId))
      .limit(1);

    group = groupByAlias ?? null;
  }

  if (!group) return null;

  const aliases = await getDirectoryAliasesForGroupId(group.id);
  if (!requestedAlias) {
    requestedAlias =
      aliases.find((alias) => alias.slug === normalizedSlug) ?? null;
  }

  const snapshot = group.primarySnapshotId
    ? await getContractorSnapshotById(group.primarySnapshotId)
    : null;

  return {
    group,
    snapshot,
    aliases,
    requestedAlias,
    isAliasRequest: normalizedSlug !== group.slug,
  };
}

export async function getCuratedContractorOverlay(
  snapshot: typeof schema.contractorSnapshot.$inferSelect | null,
  slug: string,
  canonicalName?: string | null,
) {
  const db = getDb();
  const [bySlug] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.slug, slug.toLowerCase()))
    .limit(1);

  if (bySlug) return bySlug;

  const exactNames = [canonicalName, snapshot?.recipientName]
    .filter((value): value is string => !!value?.trim())
    .map((value) => value.trim().toLowerCase());

  for (const name of new Set(exactNames)) {
    const [byName] = await db
      .select()
      .from(schema.contractor)
      .where(sql`lower(${schema.contractor.name}) = ${name}`)
      .limit(1);

    if (byName) return byName;
  }

  return null;
}

export async function getCachedSnapshotProfileIntelligence(
  slug: string,
): Promise<CachedProfileIntelligence> {
  const profile = await getContractorDirectoryProfileBySlug(slug);
  const snapshot =
    profile?.snapshot ?? (await getContractorSnapshotBySlug(slug));

  if (!snapshot) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor snapshot "${slug}" not found`,
    });
  }

  const profileSlug = profile?.group.slug ?? snapshot.slug;
  const cached = await getSnapshotProfileCache(
    snapshotProfileCacheKey(profileSlug),
  );
  const refreshKey = normalizeProfileRefreshKey(profileSlug);

  if (!cached) {
    return {
      status: snapshotProfileRefreshes.has(refreshKey)
        ? "refreshing"
        : "unavailable",
      intelligence: null,
      refreshedAt: null,
      expiresAt: null,
      warnings: [],
    };
  }

  const isStale =
    Date.now() - cached.refreshedAt.getTime() >= PROFILE_CACHE_TTL_MS;
  const needsCodeRefresh = profileCacheNeedsContractCodeRefresh(cached.result);
  const status = isStale || needsCodeRefresh ? "stale" : "ready";
  const warnings = needsCodeRefresh
    ? [
        ...cached.result.sourceMetadata.warnings,
        "Cached profile is missing NAICS/PSC contract code fields and will be refreshed.",
      ]
    : cached.result.sourceMetadata.warnings;

  return {
    status,
    intelligence: withProfileCacheStatus(
      {
        ...cached.result,
        sourceMetadata: {
          ...cached.result.sourceMetadata,
          warnings,
        },
      },
      status === "stale" ? "stale" : "cached",
    ),
    refreshedAt: cached.refreshedAt.toISOString(),
    expiresAt: cached.expiresAt?.toISOString() ?? null,
    warnings,
  };
}

export function enqueueSnapshotProfileRefresh(
  slug: string,
  options: { forceRefresh?: boolean } = {},
): boolean {
  const refreshKey = normalizeProfileRefreshKey(slug);
  if (snapshotProfileRefreshes.has(refreshKey)) return false;

  const refresh = getSnapshotProfileIntelligence(slug, {
    forceRefresh: options.forceRefresh ?? true,
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      snapshotProfileRefreshes.delete(refreshKey);
    });

  snapshotProfileRefreshes.set(refreshKey, refresh);
  return true;
}

export async function getSnapshotProfileIntelligence(
  slug: string,
  options: { forceRefresh?: boolean } = {},
): Promise<ContractorIntelligence> {
  const profile = await getContractorDirectoryProfileBySlug(slug);
  const snapshot =
    profile?.snapshot ?? (await getContractorSnapshotBySlug(slug));

  if (!snapshot) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor snapshot "${slug}" not found`,
    });
  }

  const profileSlug = profile?.group.slug ?? snapshot.slug;
  const profileName = profile?.group.canonicalName ?? snapshot.recipientName;
  const directoryAliases = profile?.aliases ?? [
    snapshotToDirectoryAlias(snapshot),
  ];
  const cacheKey = snapshotProfileCacheKey(profileSlug);
  const cached = await getSnapshotProfileCache(cacheKey);
  if (
    cached &&
    !options.forceRefresh &&
    Date.now() - cached.refreshedAt.getTime() < PROFILE_CACHE_TTL_MS &&
    !profileCacheNeedsContractCodeRefresh(cached.result)
  ) {
    return cached.result;
  }

  const searchInput: UsaSpendingAwardSearchInput = {
    recipientSearchText: uniqueRecipientNames(directoryAliases),
    agencies: DOD_AWARDING_AGENCY_FILTERS,
    timePeriod: [
      {
        startDate: toDateOnly(snapshot.snapshotWindowStart),
        endDate: toDateOnly(snapshot.snapshotWindowEnd),
      },
    ],
    limit: 100,
    sort: "Start Date",
    order: "desc",
  };

  try {
    const [awardResponse, trendResponse] = await Promise.all([
      searchUsaSpendingAwards(searchInput),
      fetchUsaSpendingTrend(searchInput).catch(() => ({
        results: [],
        messages: [],
      })),
    ]);
    const awards = awardResponse.results;
    const trend = trendResponse.results.length
      ? trendResponse.results
      : trendFromAwards(awards);
    const result = buildSnapshotIntelligence(
      snapshot,
      awards,
      trend,
      [...awardResponse.messages, ...trendResponse.messages],
      {
        aliases: directoryAliases,
        canonicalName: profileName,
        canonicalSlug: profileSlug,
      },
    );

    await writeSnapshotProfileCache(
      cacheKey,
      profileSlug,
      normalizeText(profileName),
      result,
    );
    if (directoryAliases.length === 1) {
      await applyProfileEnrichment(snapshot.slug, awards);
    }
    return result;
  } catch (error) {
    if (cached) {
      return {
        ...cached.result,
        sourceMetadata: {
          ...cached.result.sourceMetadata,
          cacheStatus: "stale",
          warnings: formatUsaSpendingMessages([
            ...cached.result.sourceMetadata.warnings,
            error instanceof Error
              ? error.message
              : "USAspending profile refresh failed.",
          ]),
        },
      };
    }

    return buildSnapshotIntelligence(
      snapshot,
      [],
      [],
      [
        error instanceof Error
          ? error.message
          : "USAspending profile refresh failed.",
      ],
      {
        aliases: directoryAliases,
        canonicalName: profileName,
        canonicalSlug: profileSlug,
      },
    );
  }
}

export async function rebuildContractorDirectoryGroups(): Promise<{
  groupCount: number;
  aliasCount: number;
}> {
  const db = getDb();
  const rows = await db.select().from(schema.contractorSnapshot);
  const groups = buildContractorDirectoryGroups(
    rows,
    CURATED_DIRECTORY_ALIAS_MAPPINGS,
  );

  await db.transaction(async (tx) => {
    await tx.delete(schema.contractorDirectoryAlias);
    await tx.delete(schema.contractorDirectoryGroup);

    for (const group of groups) {
      await tx.insert(schema.contractorDirectoryGroup).values({
        id: group.id,
        slug: group.slug,
        canonicalName: group.canonicalName,
        normalizedName: group.normalizedName,
        primarySnapshotId: group.primarySnapshotId,
        primaryRecipientUei: group.primaryRecipientUei,
        primaryRecipientCode: group.primaryRecipientCode,
        totalObligations36m: group.totalObligations36m,
        awardCount36m: group.awardCount36m,
        lastAwardDate: group.lastAwardDate,
        topAwardingAgency: group.topAwardingAgency,
        topAwardingSubagency: group.topAwardingSubagency,
        topNaicsCode: group.topNaicsCode,
        topNaicsTitle: group.topNaicsTitle,
        topPscCode: group.topPscCode,
        topPscTitle: group.topPscTitle,
        sourceUrl: group.sourceUrl,
        sourceMetadata: group.sourceMetadata,
        aliasCount: group.aliasCount,
        snapshotWindowStart: group.snapshotWindowStart,
        snapshotWindowEnd: group.snapshotWindowEnd,
        refreshedAt: group.refreshedAt,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      });

      for (const alias of group.aliases) {
        await tx.insert(schema.contractorDirectoryAlias).values({
          id: alias.id,
          groupId: alias.groupId,
          snapshotId: alias.snapshotId,
          slug: alias.slug,
          recipientName: alias.recipientName,
          normalizedName: alias.normalizedName,
          recipientUei: alias.recipientUei,
          recipientCode: alias.recipientCode,
          totalObligations36m: alias.totalObligations36m,
          awardCount36m: alias.awardCount36m,
          lastAwardDate: alias.lastAwardDate,
          sourceUrl: alias.sourceUrl,
          isCanonical: alias.isCanonical,
          matchReason: alias.matchReason,
          matchKey: alias.matchKey,
          createdAt: alias.createdAt,
          updatedAt: alias.updatedAt,
        });
      }
    }
  });

  return {
    groupCount: groups.length,
    aliasCount: groups.reduce((sum, group) => sum + group.aliasCount, 0),
  };
}

export function buildContractorDirectoryGroups(
  rows: ContractorDirectorySnapshotInput[],
  curatedMappings: CuratedDirectoryAliasMapping[] = [],
): BuiltContractorDirectoryGroup[] {
  const parent = new Map<string, string>();
  const identifierOwners = new Map<string, string>();
  const curatedByRow = new Map<string, CuratedDirectoryAliasMapping>();

  for (const row of rows) {
    parent.set(row.id, row.id);
  }

  const findRoot = (id: string): string => {
    const current = parent.get(id) ?? id;
    if (current === id) return current;
    const root = findRoot(current);
    parent.set(id, root);
    return root;
  };

  const unionRows = (left: string, right: string) => {
    const leftRoot = findRoot(left);
    const rightRoot = findRoot(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  for (const row of rows) {
    for (const key of directoryMergeKeys(row)) {
      const owner = identifierOwners.get(key);
      if (owner) {
        unionRows(row.id, owner);
      } else {
        identifierOwners.set(key, row.id);
      }
    }

    for (const mapping of curatedMappings) {
      if (!rowMatchesCuratedMapping(row, mapping)) continue;
      curatedByRow.set(row.id, mapping);
      const key = `curated:${slugify(mapping.canonicalSlug)}`;
      const owner = identifierOwners.get(key);
      if (owner) {
        unionRows(row.id, owner);
      } else {
        identifierOwners.set(key, row.id);
      }
    }
  }

  const rowsByRoot = new Map<string, ContractorDirectorySnapshotInput[]>();
  for (const row of rows) {
    const root = findRoot(row.id);
    rowsByRoot.set(root, [...(rowsByRoot.get(root) ?? []), row]);
  }

  const usedSlugs = new Map<string, string>();
  const groups = [...rowsByRoot.values()].map((members) => {
    const sortedMembers = [...members].sort(compareDirectoryRows);
    const canonicalRow = sortedMembers[0]!;
    const curated = sortedMembers
      .map((row) => curatedByRow.get(row.id))
      .find((mapping): mapping is CuratedDirectoryAliasMapping => !!mapping);
    const groupKey = directoryGroupKey(sortedMembers, curated);
    const groupId = stableId(`directory-group:${groupKey}`);
    const matchReason = directoryMatchReason(sortedMembers, curated);
    const slug = uniqueDirectoryGroupSlug(
      curated?.canonicalSlug ?? canonicalRow.slug,
      groupKey,
      usedSlugs,
    );
    const canonicalName = curated?.canonicalName ?? canonicalRow.recipientName;
    const now = new Date();
    const aliases = sortedMembers.map((row) => ({
      id: stableId(`directory-alias:${groupId}:${row.id}`),
      groupId,
      snapshotId: row.id,
      slug: row.slug,
      recipientName: row.recipientName,
      normalizedName: row.normalizedName,
      recipientUei: row.recipientUei,
      recipientCode: row.recipientCode,
      totalObligations36m: row.totalObligations36m,
      awardCount36m: row.awardCount36m,
      lastAwardDate: row.lastAwardDate,
      sourceUrl: row.sourceUrl,
      isCanonical: row.id === canonicalRow.id,
      matchReason,
      matchKey: groupKey,
      createdAt: row.createdAt ?? now,
      updatedAt: row.updatedAt ?? now,
    }));

    return {
      id: groupId,
      slug,
      canonicalName,
      normalizedName: normalizeText(canonicalName),
      primarySnapshotId: canonicalRow.id,
      primaryRecipientUei: canonicalRow.recipientUei,
      primaryRecipientCode: canonicalRow.recipientCode,
      totalObligations36m: sortedMembers.reduce(
        (sum, row) => sum + row.totalObligations36m,
        0,
      ),
      awardCount36m: sortedMembers.reduce(
        (sum, row) => sum + row.awardCount36m,
        0,
      ),
      lastAwardDate: latestDate(sortedMembers.map((row) => row.lastAwardDate)),
      topAwardingAgency: canonicalRow.topAwardingAgency,
      topAwardingSubagency: canonicalRow.topAwardingSubagency,
      topNaicsCode: canonicalRow.topNaicsCode,
      topNaicsTitle: canonicalRow.topNaicsTitle,
      topPscCode: canonicalRow.topPscCode,
      topPscTitle: canonicalRow.topPscTitle,
      sourceUrl: canonicalRow.sourceUrl,
      sourceMetadata: {
        ...(canonicalRow.sourceMetadata ?? {}),
        grouping: {
          matchReason,
          matchKey: groupKey,
          aliasCount: sortedMembers.length,
        },
      },
      aliasCount: sortedMembers.length,
      snapshotWindowStart:
        earliestDate(sortedMembers.map((row) => row.snapshotWindowStart)) ??
        canonicalRow.snapshotWindowStart,
      snapshotWindowEnd:
        latestDate(sortedMembers.map((row) => row.snapshotWindowEnd)) ??
        canonicalRow.snapshotWindowEnd,
      refreshedAt:
        latestDate(sortedMembers.map((row) => row.refreshedAt)) ??
        canonicalRow.refreshedAt,
      createdAt: canonicalRow.createdAt ?? now,
      updatedAt:
        latestDate(
          sortedMembers.map((row) => row.updatedAt ?? row.refreshedAt),
        ) ?? now,
      aliases,
    };
  });

  return groups.sort(
    (left, right) =>
      right.totalObligations36m - left.totalObligations36m ||
      left.canonicalName.localeCompare(right.canonicalName),
  );
}

export function findBuiltContractorDirectoryGroupBySlug(
  groups: BuiltContractorDirectoryGroup[],
  slug: string,
): BuiltContractorDirectoryGroup | null {
  const normalizedSlug = slug.trim().toLowerCase();
  return (
    groups.find(
      (group) =>
        group.slug === normalizedSlug ||
        group.aliases.some((alias) => alias.slug === normalizedSlug),
    ) ?? null
  );
}

async function upsertSnapshotRow(
  row: NormalizedSnapshotRow,
  runId: string,
  window: SnapshotWindow,
) {
  const db = getDb();
  const now = new Date();
  const values = {
    id: row.id,
    runId,
    slug: row.slug,
    recipientName: row.recipientName,
    normalizedName: row.normalizedName,
    recipientUei: row.recipientUei,
    recipientCode: row.recipientCode,
    totalObligations36m: row.totalObligations36m,
    awardCount36m: row.awardCount36m,
    lastAwardDate: row.lastAwardDate,
    topAwardingAgency: row.topAwardingAgency,
    topAwardingSubagency: row.topAwardingSubagency,
    topNaicsCode: row.topNaicsCode,
    topNaicsTitle: row.topNaicsTitle,
    topPscCode: row.topPscCode,
    topPscTitle: row.topPscTitle,
    sourceUrl: row.sourceUrl,
    sourceMetadata: row.sourceMetadata,
    rawAggregate: row.rawAggregate,
    snapshotWindowStart: parseDateOnly(window.startDate),
    snapshotWindowEnd: parseDateOnly(window.endDate),
    refreshedAt: now,
    updatedAt: now,
  };

  const { id: _id, ...updateValues } = values;

  await db.insert(schema.contractorSnapshot).values(values).onConflictDoUpdate({
    target: schema.contractorSnapshot.id,
    set: updateValues,
  });
}

function buildDirectoryGroupWhereClause(query: SnapshotQuery) {
  const conditions = [];

  if (query.q) {
    const search = `%${query.q.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${schema.contractorDirectoryGroup.canonicalName}) LIKE ${search}`,
        sql`lower(${schema.contractorDirectoryGroup.normalizedName}) LIKE ${search}`,
        sql`lower(${schema.contractorDirectoryGroup.slug}) LIKE ${search}`,
        sql`lower(coalesce(${schema.contractorDirectoryGroup.primaryRecipientUei}, '')) LIKE ${search}`,
        sql`lower(coalesce(${schema.contractorDirectoryGroup.primaryRecipientCode}, '')) LIKE ${search}`,
        sql`exists (
          select 1
          from ${schema.contractorDirectoryAlias}
          where ${schema.contractorDirectoryAlias.groupId} = ${schema.contractorDirectoryGroup.id}
            and (
              lower(${schema.contractorDirectoryAlias.recipientName}) LIKE ${search}
              or lower(${schema.contractorDirectoryAlias.normalizedName}) LIKE ${search}
              or lower(${schema.contractorDirectoryAlias.slug}) LIKE ${search}
              or lower(coalesce(${schema.contractorDirectoryAlias.recipientUei}, '')) LIKE ${search}
              or lower(coalesce(${schema.contractorDirectoryAlias.recipientCode}, '')) LIKE ${search}
            )
        )`,
      ),
    );
  }

  if (query.agency) {
    const agency = `%${query.agency.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topAwardingAgency}, '')) LIKE ${agency}`,
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topAwardingSubagency}, '')) LIKE ${agency}`,
      ),
    );
  }

  if (query.naics) {
    const naics = `%${query.naics.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topNaicsCode}, '')) LIKE ${naics}`,
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topNaicsTitle}, '')) LIKE ${naics}`,
      ),
    );
  }

  if (query.psc) {
    const psc = `%${query.psc.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topPscCode}, '')) LIKE ${psc}`,
        sql`lower(coalesce(${schema.contractorDirectoryGroup.topPscTitle}, '')) LIKE ${psc}`,
      ),
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

function directoryGroupOrderBy(query: SnapshotQuery) {
  const direction = query.order === "asc" ? asc : desc;

  switch (query.sort) {
    case "awardCount36m":
      return [
        direction(schema.contractorDirectoryGroup.awardCount36m),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
    case "lastAwardDate":
      return [
        direction(schema.contractorDirectoryGroup.lastAwardDate),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
    case "recipientName":
      return [direction(schema.contractorDirectoryGroup.canonicalName)];
    case "topAwardingAgency":
      return [
        direction(schema.contractorDirectoryGroup.topAwardingAgency),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
    case "topNaics":
      return [
        direction(schema.contractorDirectoryGroup.topNaicsCode),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
    case "topPsc":
      return [
        direction(schema.contractorDirectoryGroup.topPscCode),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
    case "totalObligations36m":
    default:
      return [
        direction(schema.contractorDirectoryGroup.totalObligations36m),
        asc(schema.contractorDirectoryGroup.canonicalName),
      ];
  }
}

async function snapshotSourceMetadata(
  query: SnapshotQuery,
): Promise<SourceMetadata> {
  const db = getDb();
  const [run] = await db
    .select()
    .from(schema.contractorSnapshotRun)
    .orderBy(desc(schema.contractorSnapshotRun.startedAt))
    .limit(1);
  const now = new Date();
  const filters: IntelligenceFilter[] = [
    {
      kind: "time_period",
      label: "Window",
      value: run
        ? `${toDateOnly(run.windowStart)} to ${toDateOnly(run.windowEnd)}`
        : "Trailing 36 months",
    },
    {
      kind: "agency",
      label: "Awarding agency",
      value: "Department of Defense",
    },
    ...(query.q
      ? [{ kind: "keyword" as const, label: "Search", value: query.q }]
      : []),
    ...(query.agency
      ? [
          {
            kind: "agency" as const,
            label: "Agency filter",
            value: query.agency,
          },
        ]
      : []),
    ...(query.naics
      ? [{ kind: "naics" as const, label: "NAICS", value: query.naics }]
      : []),
    ...(query.psc
      ? [{ kind: "psc" as const, label: "PSC", value: query.psc }]
      : []),
  ];

  return {
    sources: [
      {
        label: "USAspending recipient category",
        url: `${USA_SPENDING_BASE_URL}/search`,
      },
    ],
    generatedAt: now.toISOString(),
    refreshedAt: run?.completedAt?.toISOString() ?? null,
    expiresAt: run?.completedAt
      ? new Date(run.completedAt.getTime() + PUBLIC_CACHE_TTL_MS).toISOString()
      : null,
    freshness: run
      ? `Snapshot ${run.status}; refreshed ${run.completedAt?.toISOString() ?? run.startedAt.toISOString()}.`
      : "Snapshot has not been refreshed yet.",
    cacheStatus: run?.status === "completed" ? "cached" : "stale",
    structuredRecords: run?.rowCount ?? 0,
    filters,
    warnings: run?.error ? [run.error] : [],
  };
}

function directoryGroupRowToResponse(
  row: typeof schema.contractorDirectoryGroup.$inferSelect,
  aliases: ContractorDirectoryAliasResponse[],
): ContractorSnapshotListRow {
  return {
    id: row.id,
    slug: row.slug,
    canonicalSlug: row.slug,
    recipientName: row.canonicalName,
    normalizedName: row.normalizedName,
    recipientUei: row.primaryRecipientUei,
    recipientCode: row.primaryRecipientCode,
    totalObligations36m: row.totalObligations36m,
    awardCount36m: row.awardCount36m,
    lastAwardDate: row.lastAwardDate?.toISOString() ?? null,
    topAwardingAgency: row.topAwardingAgency,
    topAwardingSubagency: row.topAwardingSubagency,
    topNaicsCode: row.topNaicsCode,
    topNaicsTitle: row.topNaicsTitle,
    topPscCode: row.topPscCode,
    topPscTitle: row.topPscTitle,
    sourceUrl: row.sourceUrl,
    refreshedAt: row.refreshedAt.toISOString(),
    snapshotWindowStart: row.snapshotWindowStart.toISOString(),
    snapshotWindowEnd: row.snapshotWindowEnd.toISOString(),
    aliasCount: row.aliasCount,
    alternateRecipientNames: aliases
      .filter((alias) => !alias.isCanonical)
      .map((alias) => alias.recipientName),
  };
}

function directoryAliasRowToResponse(
  row: typeof schema.contractorDirectoryAlias.$inferSelect,
): ContractorDirectoryAliasResponse {
  return {
    id: row.id,
    groupId: row.groupId,
    snapshotId: row.snapshotId,
    slug: row.slug,
    recipientName: row.recipientName,
    normalizedName: row.normalizedName,
    recipientUei: row.recipientUei,
    recipientCode: row.recipientCode,
    totalObligations36m: row.totalObligations36m,
    awardCount36m: row.awardCount36m,
    lastAwardDate: row.lastAwardDate?.toISOString() ?? null,
    sourceUrl: row.sourceUrl,
    isCanonical: row.isCanonical,
    matchReason: row.matchReason,
    matchKey: row.matchKey,
  };
}

async function aliasesForGroups(
  groupIds: string[],
): Promise<Map<string, ContractorDirectoryAliasResponse[]>> {
  const result = new Map<string, ContractorDirectoryAliasResponse[]>();
  if (!groupIds.length) return result;

  await Promise.all(
    groupIds.map(async (groupId) => {
      result.set(groupId, await getDirectoryAliasesForGroupId(groupId));
    }),
  );

  return result;
}

async function getDirectoryAliasesForGroupId(
  groupId: string,
): Promise<ContractorDirectoryAliasResponse[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.contractorDirectoryAlias)
    .where(eq(schema.contractorDirectoryAlias.groupId, groupId))
    .orderBy(
      desc(schema.contractorDirectoryAlias.isCanonical),
      desc(schema.contractorDirectoryAlias.totalObligations36m),
      asc(schema.contractorDirectoryAlias.recipientName),
    );

  return rows.map(directoryAliasRowToResponse);
}

async function getContractorSnapshotById(id: string) {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(schema.contractorSnapshot)
    .where(eq(schema.contractorSnapshot.id, id))
    .limit(1);

  return snapshot ?? null;
}

function directoryIdentifierKeys(
  row: ContractorDirectorySnapshotInput,
): string[] {
  const keys = new Set<string>();
  const uei = normalizeIdentifier(row.recipientUei);
  const code = normalizeIdentifier(row.recipientCode);

  if (uei) keys.add(`uei:${uei}`);
  if (code) keys.add(`recipient-code:${code}`);

  return [...keys].sort();
}

function directoryMergeKeys(row: ContractorDirectorySnapshotInput): string[] {
  const keys = new Set(directoryIdentifierKeys(row));
  if (row.normalizedName) keys.add(`name:${row.normalizedName}`);
  return [...keys].sort();
}

function rowMatchesCuratedMapping(
  row: ContractorDirectorySnapshotInput,
  mapping: CuratedDirectoryAliasMapping,
): boolean {
  const slugMatches = mapping.snapshotSlugs?.some(
    (slug) => slug.trim().toLowerCase() === row.slug,
  );
  if (slugMatches) return true;

  const nameMatches = mapping.recipientNames?.some(
    (name) => normalizeText(name) === row.normalizedName,
  );
  if (nameMatches) return true;

  const uei = normalizeIdentifier(row.recipientUei);
  const ueiMatches = mapping.recipientUeis?.some(
    (value) => normalizeIdentifier(value) === uei,
  );
  if (uei && ueiMatches) return true;

  const code = normalizeIdentifier(row.recipientCode);
  return Boolean(
    code &&
    mapping.recipientCodes?.some(
      (value) => normalizeIdentifier(value) === code,
    ),
  );
}

function directoryGroupKey(
  rows: ContractorDirectorySnapshotInput[],
  curated?: CuratedDirectoryAliasMapping,
): string {
  if (curated) return `curated:${slugify(curated.canonicalSlug)}`;

  const sharedIdentifier = sharedIdentifierKey(rows);
  if (sharedIdentifier) return sharedIdentifier;

  const sharedName = sharedNormalizedName(rows);
  if (sharedName) return `name:${sharedName}`;

  const identifierKeys = rows.flatMap(directoryIdentifierKeys).sort();
  return identifierKeys[0] ?? `snapshot:${rows[0]?.id ?? "unknown"}`;
}

function directoryMatchReason(
  rows: ContractorDirectorySnapshotInput[],
  curated?: CuratedDirectoryAliasMapping,
): DirectoryAliasMatchReason {
  if (curated) return "curated_alias";
  if (rows.length === 1) return "single_snapshot";
  return sharedIdentifierKey(rows) ? "shared_identifier" : "shared_name";
}

function sharedIdentifierKey(
  rows: ContractorDirectorySnapshotInput[],
): string | null {
  const counts = new Map<string, number>();
  for (const key of rows.flatMap(directoryIdentifierKeys)) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return (
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
      .sort()[0] ?? null
  );
}

function sharedNormalizedName(
  rows: ContractorDirectorySnapshotInput[],
): string | null {
  const names = new Set(rows.map((row) => row.normalizedName).filter(Boolean));
  return names.size === 1 ? [...names][0]! : null;
}

function uniqueDirectoryGroupSlug(
  value: string,
  groupKey: string,
  usedSlugs: Map<string, string>,
): string {
  const base = slugify(value) || "unknown-contractor";
  const existing = usedSlugs.get(base);
  const slug =
    existing && existing !== groupKey
      ? `${base}-${stableHash(groupKey).slice(0, 8)}`
      : base;
  usedSlugs.set(slug, groupKey);
  return slug;
}

function compareDirectoryRows(
  left: ContractorDirectorySnapshotInput,
  right: ContractorDirectorySnapshotInput,
): number {
  return (
    right.totalObligations36m - left.totalObligations36m ||
    right.awardCount36m - left.awardCount36m ||
    dateTime(right.lastAwardDate) - dateTime(left.lastAwardDate) ||
    left.recipientName.localeCompare(right.recipientName)
  );
}

function earliestDate(values: Array<Date | null | undefined>): Date | null {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (!dates.length) return null;
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

function latestDate(values: Array<Date | null | undefined>): Date | null {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function dateTime(value: Date | null | undefined): number {
  return value?.getTime() ?? 0;
}

async function existingSnapshotSlugOwners(): Promise<Map<string, string>> {
  const db = getDb();
  const rows = await db
    .select({
      slug: schema.contractorSnapshot.slug,
      recipientCode: schema.contractorSnapshot.recipientCode,
      normalizedName: schema.contractorSnapshot.normalizedName,
    })
    .from(schema.contractorSnapshot);

  return new Map(
    rows.map((row) => [
      row.slug,
      row.recipientCode ?? row.normalizedName ?? row.slug,
    ]),
  );
}

function uniqueSnapshotSlug(
  name: string,
  owner: string,
  options: {
    slugOwners: Map<string, string>;
    usedSlugs: Map<string, string>;
  },
): string {
  const base = slugify(name) || "unknown-recipient";
  const existingOwner = options.slugOwners.get(base);
  const usedOwner = options.usedSlugs.get(base);
  const useSuffix =
    (existingOwner && existingOwner !== owner) ||
    (usedOwner && usedOwner !== owner);
  const slug = useSuffix ? snapshotSlug(name, owner) : base;
  options.usedSlugs.set(slug, owner);
  return slug;
}

function snapshotSlug(name: string, recipientCode: string | null): string {
  const base = slugify(name) || "unknown-recipient";
  return recipientCode
    ? `${base}-${stableHash(recipientCode).slice(0, 8)}`
    : base;
}

function snapshotOwnerKey(row: SnapshotCategoryRow): string {
  return (
    stringOrNull(row.recipient_id) ??
    stringOrNull(row.uei) ??
    stringOrNull(row.code) ??
    stringOrNull(row.id) ??
    normalizeText(row.name ?? "unknown-recipient")
  );
}

function snapshotProfileCacheKey(slug: string): string {
  return stableHash(`snapshot-profile:${slug}`);
}

function normalizeProfileRefreshKey(slug: string): string {
  return slug.trim().toLowerCase();
}

function withProfileCacheStatus(
  result: ContractorIntelligence,
  cacheStatus: "cached" | "stale",
): ContractorIntelligence {
  const updated = {
    ...result,
    sourceMetadata: {
      ...result.sourceMetadata,
      cacheStatus,
      warnings: formatUsaSpendingMessages(result.sourceMetadata.warnings),
    },
  };

  return {
    ...updated,
    signals: updated.signals?.length
      ? updated.signals
      : buildContractorIntelligenceSignals(updated),
  };
}

function profileCacheNeedsContractCodeRefresh(
  intelligence: ContractorIntelligence,
): boolean {
  const structuredRecords = intelligence.sourceMetadata.structuredRecords;
  if (structuredRecords <= 0) return false;
  if (intelligence.topNaics.length || intelligence.topPsc.length) return false;

  const awards = [...intelligence.topAwards, ...intelligence.recentAwards];
  return (
    awards.length > 0 &&
    awards.every((award) => !award.naicsCode && !award.pscCode)
  );
}

async function getSnapshotProfileCache(queryHash: string): Promise<{
  result: ContractorIntelligence;
  refreshedAt: Date;
  expiresAt: Date | null;
} | null> {
  const db = getDb();
  const [entry] = await db
    .select()
    .from(schema.explorerQueryCache)
    .where(eq(schema.explorerQueryCache.queryHash, queryHash))
    .limit(1);

  if (!entry?.result) return null;
  const result = entry.result as unknown as ContractorIntelligence;
  const normalized = {
    ...result,
    sourceMetadata: {
      ...result.sourceMetadata,
      warnings: formatUsaSpendingMessages(result.sourceMetadata.warnings),
    },
  };

  return {
    result: {
      ...normalized,
      signals: normalized.signals?.length
        ? normalized.signals
        : buildContractorIntelligenceSignals(normalized),
    },
    refreshedAt: entry.refreshedAt,
    expiresAt: entry.expiresAt ?? null,
  };
}

async function writeSnapshotProfileCache(
  queryHash: string,
  profileSlug: string,
  normalizedQuery: string,
  result: ContractorIntelligence,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PROFILE_CACHE_TTL_MS);

  await db
    .insert(schema.explorerQueryCache)
    .values({
      id: queryHash.slice(0, 16),
      query: `snapshot-profile:${profileSlug}`,
      normalizedQuery,
      queryHash,
      result: result as unknown as Record<string, unknown>,
      sourceMetadata: result.sourceMetadata as unknown as Record<
        string,
        unknown
      >,
      cacheStatus: "live",
      refreshedAt: now,
      expiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.explorerQueryCache.queryHash,
      set: {
        result: result as unknown as Record<string, unknown>,
        sourceMetadata: result.sourceMetadata as unknown as Record<
          string,
          unknown
        >,
        cacheStatus: "live",
        refreshedAt: now,
        expiresAt,
        updatedAt: now,
      },
    });
}

async function applyProfileEnrichment(slug: string, awards: AwardSummary[]) {
  if (!awards.length) return;
  const db = getDb();
  const topAgencies = aggregateAwards(
    awards,
    (award) => award.awardingAgency ?? "Department of Defense",
  );
  const topSubAgencies = aggregateAwards(
    awards,
    (award) =>
      award.awardingSubAgency ??
      award.awardingAgency ??
      "Department of Defense",
  );
  const topNaics = aggregateAwards(
    awards.filter((award) => award.naicsCode),
    (award) => award.naicsCode ?? "Unknown NAICS",
    (award) => award.naicsTitle ?? `NAICS ${award.naicsCode}`,
  );
  const topPsc = aggregateAwards(
    awards.filter((award) => award.pscCode),
    (award) => award.pscCode ?? "Unknown PSC",
    (award) => award.pscTitle ?? `PSC ${award.pscCode}`,
  );
  const lastAward = [...awards].sort((a, b) =>
    String(b.startDate).localeCompare(String(a.startDate)),
  )[0];

  await db
    .update(schema.contractorSnapshot)
    .set({
      awardCount36m: awards.length,
      lastAwardDate: lastAward?.startDate
        ? parseDateOnly(lastAward.startDate)
        : null,
      topAwardingAgency: topAgencies[0]?.key ?? "Department of Defense",
      topAwardingSubagency: topSubAgencies[0]?.key ?? null,
      topNaicsCode: topNaics[0]?.key ?? null,
      topNaicsTitle: topNaics[0]?.label ?? null,
      topPscCode: topPsc[0]?.key ?? null,
      topPscTitle: topPsc[0]?.label ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.contractorSnapshot.slug, slug));
}

function snapshotToDirectoryAlias(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
): ContractorDirectoryAliasResponse {
  return {
    id: stableId(`directory-alias:fallback:${snapshot.id}`),
    groupId: stableId(`directory-group:fallback:${snapshot.id}`),
    snapshotId: snapshot.id,
    slug: snapshot.slug,
    recipientName: snapshot.recipientName,
    normalizedName: snapshot.normalizedName,
    recipientUei: snapshot.recipientUei,
    recipientCode: snapshot.recipientCode,
    totalObligations36m: snapshot.totalObligations36m,
    awardCount36m: snapshot.awardCount36m,
    lastAwardDate: snapshot.lastAwardDate?.toISOString() ?? null,
    sourceUrl: snapshot.sourceUrl,
    isCanonical: true,
    matchReason: "single_snapshot",
    matchKey: `snapshot:${snapshot.id}`,
  };
}

function uniqueRecipientNames(
  aliases: ContractorDirectoryAliasResponse[],
): string[] {
  const names = new Set<string>();
  for (const alias of aliases) {
    const name = alias.recipientName.trim();
    if (name) names.add(name);
  }
  return [...names];
}

interface SnapshotIntelligenceOptions {
  aliases: ContractorDirectoryAliasResponse[];
  canonicalName: string;
  canonicalSlug: string;
}

function buildSnapshotIntelligence(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
  awards: AwardSummary[],
  yearlyTrend: TrendPoint[],
  warnings: string[],
  options: SnapshotIntelligenceOptions = {
    aliases: [snapshotToDirectoryAlias(snapshot)],
    canonicalName: snapshot.recipientName,
    canonicalSlug: snapshot.slug,
  },
): ContractorIntelligence {
  const topAgencies = aggregateAwards(
    awards,
    (award) => award.awardingAgency ?? "Department of Defense",
  );
  const topSubAgencies = aggregateAwards(
    awards,
    (award) =>
      award.awardingSubAgency ??
      award.awardingAgency ??
      "Department of Defense",
  );
  const topNaics = aggregateAwards(
    awards.filter((award) => award.naicsCode),
    (award) => award.naicsCode ?? "Unknown NAICS",
    (award) => award.naicsTitle ?? `NAICS ${award.naicsCode}`,
  );
  const topPsc = aggregateAwards(
    awards.filter((award) => award.pscCode),
    (award) => award.pscCode ?? "Unknown PSC",
    (award) => award.pscTitle ?? `PSC ${award.pscCode}`,
  );
  const linkedRecipients = rankAwardsByRecipient(awards).map((row) => ({
    name: row.name,
    uei: row.uei ?? null,
    awardCount: row.awardCount,
    obligations: row.obligations,
  }));
  const snapshotLinkedRecipients = options.aliases.map((alias) => ({
    name: alias.recipientName,
    uei: alias.recipientUei,
    awardCount: alias.awardCount36m,
    obligations: alias.totalObligations36m,
  }));
  const fallbackObligations = options.aliases.length
    ? options.aliases.reduce((sum, alias) => sum + alias.totalObligations36m, 0)
    : snapshot.totalObligations36m;
  const fallbackAwardCount = options.aliases.length
    ? options.aliases.reduce((sum, alias) => sum + alias.awardCount36m, 0)
    : snapshot.awardCount36m;
  const latestFiscalYear = yearlyTrend.at(-1)?.fiscalYear ?? null;
  const currentYear = yearlyTrend.at(-1)?.obligation ?? null;
  const previousYear = yearlyTrend.at(-2)?.obligation ?? null;
  const filters: IntelligenceFilter[] = [
    {
      kind: "recipient",
      label: "Recipient",
      value: options.canonicalName,
      code: snapshot.recipientCode ?? undefined,
    },
    {
      kind: "agency",
      label: "Awarding agency",
      value: "Department of Defense",
    },
    {
      kind: "time_period",
      label: "Window",
      value: `${toDateOnly(snapshot.snapshotWindowStart)} to ${toDateOnly(snapshot.snapshotWindowEnd)}`,
    },
  ];

  const intelligence = {
    contractor: {
      id: snapshot.id,
      slug: options.canonicalSlug,
      name: options.canonicalName,
      headquarters: null,
      website: null,
      defenseRevenue: null,
      totalRevenue: null,
    },
    summary: {
      totalObligations: awards.length
        ? awards.reduce((sum, award) => sum + award.obligation, 0)
        : fallbackObligations,
      awardCount: awards.length || fallbackAwardCount,
      latestFiscalYear,
      yoyDelta:
        currentYear != null && previousYear != null
          ? currentYear - previousYear
          : null,
      topAgency: topAgencies[0] ?? bucketFromSnapshotAgency(snapshot),
      topSubAgency: topSubAgencies[0] ?? null,
      topNaics: topNaics[0] ?? bucketFromSnapshotNaics(snapshot),
      topPsc: topPsc[0] ?? bucketFromSnapshotPsc(snapshot),
    },
    aliases: options.aliases
      .filter((alias) => !alias.isCanonical)
      .map((alias) => alias.recipientName),
    identifiers: {
      uei: snapshot.recipientUei,
      cageCode: null,
    },
    linkedRecipients: linkedRecipients.length
      ? linkedRecipients
      : snapshotLinkedRecipients,
    topAwards: [...awards]
      .sort((a, b) => b.obligation - a.obligation)
      .slice(0, 10),
    recentAwards: [...awards]
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
      .slice(0, 10),
    yearlyTrend,
    topAgencies,
    topSubAgencies,
    topNaics,
    topPsc,
    sourceLinks: awards.length
      ? sourceLinksForAwards(awards)
      : options.aliases.map((alias) => ({
          label: alias.isCanonical
            ? "USAspending canonical recipient"
            : "USAspending alternate recipient",
          url: alias.sourceUrl,
        })),
    sourceMetadata: {
      sources: [{ label: "USAspending.gov", url: USA_SPENDING_BASE_URL }],
      generatedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + PROFILE_CACHE_TTL_MS).toISOString(),
      freshness:
        awards.length > 0
          ? "Live USAspending award rows normalized by military.contractors."
          : "Snapshot aggregate served because award-level profile rows were unavailable.",
      cacheStatus: awards.length > 0 ? "live" : "error",
      structuredRecords: awards.length,
      filters,
      warnings: formatUsaSpendingMessages(warnings),
    },
  } satisfies Omit<ContractorIntelligence, "signals">;

  return {
    ...intelligence,
    signals: buildContractorIntelligenceSignals(intelligence, awards),
  };
}

function aggregateAwards(
  awards: AwardSummary[],
  keyFor: (award: AwardSummary) => string,
  labelFor: (award: AwardSummary) => string = keyFor,
): IntelligenceBucket[] {
  const buckets = new Map<string, IntelligenceBucket>();

  for (const award of awards) {
    const key = keyFor(award);
    const existing = buckets.get(key);
    if (existing) {
      existing.obligation += award.obligation;
      existing.awardCount += 1;
    } else {
      buckets.set(key, {
        key,
        label: labelFor(award),
        obligation: award.obligation,
        awardCount: 1,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => b.obligation - a.obligation);
}

function rankAwardsByRecipient(awards: AwardSummary[]): RankingRow[] {
  return aggregateAwards(awards, (award) => award.recipientName).map(
    (bucket, index) => {
      const sample = awards.find((award) => award.recipientName === bucket.key);
      return {
        rank: index + 1,
        slug: slugify(bucket.key),
        name: bucket.label,
        obligations: bucket.obligation,
        awardCount: bucket.awardCount,
        uei: sample?.recipientUei ?? null,
        sourceUrl: sample?.sourceUrl ?? `${USA_SPENDING_BASE_URL}/search`,
      };
    },
  );
}

function trendFromAwards(awards: AwardSummary[]): TrendPoint[] {
  return aggregateAwards(
    awards.filter((award) => award.fiscalYear),
    (award) => String(award.fiscalYear),
    (award) => `FY${award.fiscalYear}`,
  )
    .map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      fiscalYear: Number(bucket.key),
      obligation: bucket.obligation,
      awardCount: bucket.awardCount,
    }))
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}

function bucketFromSnapshotAgency(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
): IntelligenceBucket | null {
  if (!snapshot.topAwardingAgency) return null;
  return {
    key: snapshot.topAwardingAgency,
    label: snapshot.topAwardingAgency,
    obligation: snapshot.totalObligations36m,
    awardCount: snapshot.awardCount36m,
  };
}

function bucketFromSnapshotNaics(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
): IntelligenceBucket | null {
  if (!snapshot.topNaicsCode) return null;
  return {
    key: snapshot.topNaicsCode,
    label: snapshot.topNaicsTitle ?? `NAICS ${snapshot.topNaicsCode}`,
    obligation: snapshot.totalObligations36m,
    awardCount: snapshot.awardCount36m,
  };
}

function bucketFromSnapshotPsc(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
): IntelligenceBucket | null {
  if (!snapshot.topPscCode) return null;
  return {
    key: snapshot.topPscCode,
    label: snapshot.topPscTitle ?? `PSC ${snapshot.topPscCode}`,
    obligation: snapshot.totalObligations36m,
    awardCount: snapshot.awardCount36m,
  };
}

async function fetchJsonWithRetry(
  url: string,
  payload: unknown,
  attempts = 3,
): Promise<unknown> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) return response.json();
      lastError = new Error(
        `USAspending returned ${response.status}: ${(await response.text()).slice(0, 300)}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("USAspending request failed");
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function stringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
}

function inferUei(value: unknown): string | null {
  const text = stringOrNull(value);
  if (!text) return null;
  return /^[A-Z0-9]{12}$/i.test(text) ? text : null;
}

function normalizeIdentifier(value: string | null | undefined): string | null {
  const text = stringOrNull(value);
  return text ? text.toLowerCase() : null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stableId(value: string): string {
  return stableHash(value).slice(0, 24);
}

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
