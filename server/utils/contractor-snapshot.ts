/**
 * @file Contractor snapshot operations
 * @description USAspending recipient snapshot refresh, querying, and profile enrichment
 */

import { createHash } from "node:crypto";
import { z } from "zod";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
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

export interface ContractorSnapshotListRow {
  id: string;
  slug: string;
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
}

export interface ContractorSnapshotListResponse {
  rows: ContractorSnapshotListRow[];
  contractors: Array<ContractorSnapshotListRow & { name: string }>;
  total: number;
  limit: number;
  offset: number;
  sourceMetadata: SourceMetadata;
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
        const slug = uniqueSnapshotSlug(row.name ?? "Unknown recipient", owner, {
          slugOwners,
          usedSlugs,
        });
        const normalized = normalizeContractorSnapshotRow(row, window, { slug });
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
    await db
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
        },
      })
      .where(eq(schema.contractorSnapshotRun.id, runId));

    await db
      .delete(schema.contractorSnapshot)
      .where(
        sql`${schema.contractorSnapshot.runId} IS NULL OR ${schema.contractorSnapshot.runId} <> ${runId}`,
      );
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
  const whereClause = buildSnapshotWhereClause(query);
  const orderBy = snapshotOrderBy(query);

  const rows = await db
    .select()
    .from(schema.contractorSnapshot)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(query.limit)
    .offset(query.offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contractorSnapshot)
    .where(whereClause);

  const sourceMetadata = await snapshotSourceMetadata(query);
  const mappedRows = rows.map(snapshotRowToResponse);

  return {
    rows: mappedRows,
    contractors: mappedRows.map((row) => ({ ...row, name: row.recipientName })),
    total: totalResult?.count ?? 0,
    limit: query.limit,
    offset: query.offset,
    sourceMetadata,
  };
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

export async function getCuratedContractorOverlay(
  snapshot: typeof schema.contractorSnapshot.$inferSelect | null,
  slug: string,
) {
  const db = getDb();
  const normalized = snapshot?.normalizedName ?? normalizeText(slug);
  const [bySlug] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.slug, slug.toLowerCase()))
    .limit(1);

  if (bySlug) return bySlug;
  if (!snapshot) return null;

  const [byName] = await db
    .select()
    .from(schema.contractor)
    .where(sql`lower(${schema.contractor.name}) = ${snapshot.recipientName.toLowerCase()}`)
    .limit(1);

  if (byName) return byName;

  const [looseMatch] = await db
    .select()
    .from(schema.contractor)
    .where(sql`lower(${schema.contractor.name}) LIKE ${`%${normalized}%`}`)
    .limit(1);

  return looseMatch ?? null;
}

export async function getSnapshotProfileIntelligence(
  slug: string,
  options: { forceRefresh?: boolean } = {},
): Promise<ContractorIntelligence> {
  const snapshot = await getContractorSnapshotBySlug(slug);

  if (!snapshot) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor snapshot "${slug}" not found`,
    });
  }

  const cacheKey = stableHash(`snapshot-profile:${snapshot.slug}`);
  const cached = await getSnapshotProfileCache(cacheKey);
  if (
    cached &&
    !options.forceRefresh &&
    Date.now() - cached.refreshedAt.getTime() < PROFILE_CACHE_TTL_MS
  ) {
    return cached.result;
  }

  const searchInput: UsaSpendingAwardSearchInput = {
    recipientSearchText: [snapshot.recipientName],
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
    const result = buildSnapshotIntelligence(snapshot, awards, trend, [
      ...awardResponse.messages,
      ...trendResponse.messages,
    ]);

    await writeSnapshotProfileCache(cacheKey, snapshot, result);
    await applyProfileEnrichment(snapshot.slug, awards);
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

    return buildSnapshotIntelligence(snapshot, [], [], [
      error instanceof Error
        ? error.message
        : "USAspending profile refresh failed.",
    ]);
  }
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

  await db
    .insert(schema.contractorSnapshot)
    .values(values)
    .onConflictDoUpdate({
      target: schema.contractorSnapshot.slug,
      set: {
        ...values,
        id: row.id,
      },
    });
}

function buildSnapshotWhereClause(query: SnapshotQuery) {
  const conditions = [];

  if (query.q) {
    const search = `%${query.q.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${schema.contractorSnapshot.recipientName}) LIKE ${search}`,
        sql`lower(${schema.contractorSnapshot.normalizedName}) LIKE ${search}`,
        sql`lower(${schema.contractorSnapshot.slug}) LIKE ${search}`,
        sql`lower(coalesce(${schema.contractorSnapshot.recipientUei}, '')) LIKE ${search}`,
        sql`lower(coalesce(${schema.contractorSnapshot.recipientCode}, '')) LIKE ${search}`,
      ),
    );
  }

  if (query.agency) {
    const agency = `%${query.agency.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorSnapshot.topAwardingAgency}, '')) LIKE ${agency}`,
        sql`lower(coalesce(${schema.contractorSnapshot.topAwardingSubagency}, '')) LIKE ${agency}`,
      ),
    );
  }

  if (query.naics) {
    const naics = `%${query.naics.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorSnapshot.topNaicsCode}, '')) LIKE ${naics}`,
        sql`lower(coalesce(${schema.contractorSnapshot.topNaicsTitle}, '')) LIKE ${naics}`,
      ),
    );
  }

  if (query.psc) {
    const psc = `%${query.psc.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(coalesce(${schema.contractorSnapshot.topPscCode}, '')) LIKE ${psc}`,
        sql`lower(coalesce(${schema.contractorSnapshot.topPscTitle}, '')) LIKE ${psc}`,
      ),
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

function snapshotOrderBy(query: SnapshotQuery) {
  const direction = query.order === "asc" ? asc : desc;

  switch (query.sort) {
    case "awardCount36m":
      return [
        direction(schema.contractorSnapshot.awardCount36m),
        asc(schema.contractorSnapshot.recipientName),
      ];
    case "lastAwardDate":
      return [
        direction(schema.contractorSnapshot.lastAwardDate),
        asc(schema.contractorSnapshot.recipientName),
      ];
    case "recipientName":
      return [direction(schema.contractorSnapshot.recipientName)];
    case "topAwardingAgency":
      return [
        direction(schema.contractorSnapshot.topAwardingAgency),
        asc(schema.contractorSnapshot.recipientName),
      ];
    case "topNaics":
      return [
        direction(schema.contractorSnapshot.topNaicsCode),
        asc(schema.contractorSnapshot.recipientName),
      ];
    case "topPsc":
      return [
        direction(schema.contractorSnapshot.topPscCode),
        asc(schema.contractorSnapshot.recipientName),
      ];
    case "totalObligations36m":
    default:
      return [
        direction(schema.contractorSnapshot.totalObligations36m),
        asc(schema.contractorSnapshot.recipientName),
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

function snapshotRowToResponse(
  row: typeof schema.contractorSnapshot.$inferSelect,
): ContractorSnapshotListRow {
  return {
    id: row.id,
    slug: row.slug,
    recipientName: row.recipientName,
    normalizedName: row.normalizedName,
    recipientUei: row.recipientUei,
    recipientCode: row.recipientCode,
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
  };
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
    (existingOwner && existingOwner !== owner) || (usedOwner && usedOwner !== owner);
  const slug = useSuffix ? snapshotSlug(name, owner) : base;
  options.usedSlugs.set(slug, owner);
  return slug;
}

function snapshotSlug(name: string, recipientCode: string | null): string {
  const base = slugify(name) || "unknown-recipient";
  return recipientCode ? `${base}-${stableHash(recipientCode).slice(0, 8)}` : base;
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

async function getSnapshotProfileCache(queryHash: string): Promise<{
  result: ContractorIntelligence;
  refreshedAt: Date;
} | null> {
  const db = getDb();
  const [entry] = await db
    .select()
    .from(schema.explorerQueryCache)
    .where(eq(schema.explorerQueryCache.queryHash, queryHash))
    .limit(1);

  if (!entry?.result) return null;
  return {
    result: entry.result as unknown as ContractorIntelligence,
    refreshedAt: entry.refreshedAt,
  };
}

async function writeSnapshotProfileCache(
  queryHash: string,
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
  result: ContractorIntelligence,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PROFILE_CACHE_TTL_MS);

  await db
    .insert(schema.explorerQueryCache)
    .values({
      id: queryHash.slice(0, 16),
      query: `snapshot-profile:${snapshot.slug}`,
      normalizedQuery: snapshot.normalizedName,
      queryHash,
      result: result as unknown as Record<string, unknown>,
      sourceMetadata: result.sourceMetadata as unknown as Record<string, unknown>,
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
      award.awardingSubAgency ?? award.awardingAgency ?? "Department of Defense",
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
      lastAwardDate: lastAward?.startDate ? parseDateOnly(lastAward.startDate) : null,
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

function buildSnapshotIntelligence(
  snapshot: typeof schema.contractorSnapshot.$inferSelect,
  awards: AwardSummary[],
  yearlyTrend: TrendPoint[],
  warnings: string[],
): ContractorIntelligence {
  const topAgencies = aggregateAwards(
    awards,
    (award) => award.awardingAgency ?? "Department of Defense",
  );
  const topSubAgencies = aggregateAwards(
    awards,
    (award) =>
      award.awardingSubAgency ?? award.awardingAgency ?? "Department of Defense",
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
  const latestFiscalYear = yearlyTrend.at(-1)?.fiscalYear ?? null;
  const currentYear = yearlyTrend.at(-1)?.obligation ?? null;
  const previousYear = yearlyTrend.at(-2)?.obligation ?? null;
  const filters: IntelligenceFilter[] = [
    {
      kind: "recipient",
      label: "Recipient",
      value: snapshot.recipientName,
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

  return {
    contractor: {
      id: snapshot.id,
      slug: snapshot.slug,
      name: snapshot.recipientName,
      headquarters: null,
      website: null,
      defenseRevenue: null,
      totalRevenue: null,
    },
    summary: {
      totalObligations: awards.length
        ? awards.reduce((sum, award) => sum + award.obligation, 0)
        : snapshot.totalObligations36m,
      awardCount: awards.length || snapshot.awardCount36m,
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
    aliases: [],
    identifiers: {
      uei: snapshot.recipientUei,
      cageCode: null,
    },
    linkedRecipients: linkedRecipients.length
      ? linkedRecipients
      : [
          {
            name: snapshot.recipientName,
            uei: snapshot.recipientUei,
            awardCount: snapshot.awardCount36m,
            obligations: snapshot.totalObligations36m,
          },
        ],
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
      : [{ label: "USAspending recipient", url: snapshot.sourceUrl }],
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

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stableId(value: string): string {
  return stableHash(value).slice(0, 24);
}

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
