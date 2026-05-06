/**
 * @file Contractor intelligence operations
 * @description Deterministic planning, USAspending execution, DB-backed caching, and aggregation
 */

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type {
  AwardSummary,
  ContractorIntelligence,
  AwardSearchIntent,
  AwardSearchPlan,
  IntelligenceBucket,
  IntelligenceFilter,
  RankingRow,
  SourceMetadata,
  TrendPoint,
} from "@/app/types/intelligence.types";
import { getDb, schema } from "@/server/utils/db";
import {
  fetchUsaSpendingCategoryRankings,
  fetchUsaSpendingToptierAgencies,
  fetchUsaSpendingTrend,
  filtersToLabels,
  formatUsaSpendingMessages,
  getFiscalYears,
  resolveUsaSpendingRecipients,
  searchUsaSpendingAwards,
  slugify,
  sourceLinksForAwards,
  USA_SPENDING_BASE_URL,
  type UsaSpendingAwardSearchInput,
} from "@/server/utils/usaspending";

export const awardSearchIntentSchema = z.enum([
  "company_lookup",
  "company_comparison",
  "agency_top_contractors",
  "category_search",
  "location_search",
  "award_keyword_search",
  "unsupported",
]);

const awardSearchPlanSortSchema = z.object({
  field: z.enum(["awardAmount", "startDate"]),
  direction: z.enum(["asc", "desc"]),
});

export const awardSearchPlanSchema = z
  .object({
    intent: awardSearchIntentSchema,
    contractors: z.array(z.string()).default([]),
    agency: z.string().nullable().default(null),
    naics: z.string().nullable().default(null),
    psc: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    keywords: z.array(z.string()).default([]),
    recipientSearchText: z.array(z.string()).default([]),
    fiscalYears: z.array(z.number().int()).default([]),
    limit: z.number().int().min(1).max(100).default(10),
    sort: awardSearchPlanSortSchema.nullable().default(null),
  })
  .strict() satisfies z.ZodType<AwardSearchPlan>;

export const PUBLIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const STALE_FALLBACK_MS = 14 * 24 * 60 * 60 * 1000;

export const rankingPresets = [
  {
    slug: "top-defense-contractors",
    title: "Top Defense Contractors",
    description:
      "Recipients ranked by current fiscal year contract obligations.",
    filters: { agency: "Department of Defense" },
  },
  {
    slug: "navy-contractors",
    title: "Top Navy Contractors",
    description:
      "Recipients ranked by Department of the Navy contract obligations.",
    filters: { agency: "Department of the Navy" },
  },
  {
    slug: "army-contractors",
    title: "Top Army Contractors",
    description:
      "Recipients ranked by Department of the Army contract obligations.",
    filters: { agency: "Department of the Army" },
  },
  {
    slug: "air-force-contractors",
    title: "Top Air Force Contractors",
    description:
      "Recipients ranked by Department of the Air Force contract obligations.",
    filters: { agency: "Department of the Air Force" },
  },
  {
    slug: "cyber-it-contractors",
    title: "Cyber and IT Contractors",
    description:
      "Recipients ranked across computer systems and cyber-related work.",
    filters: { naics: "541512", keywords: ["cyber"] },
  },
  {
    slug: "shipbuilding-contractors",
    title: "Shipbuilding Contractors",
    description: "Recipients ranked across ship building and repair awards.",
    filters: { naics: "336611" },
  },
  {
    slug: "missile-defense-contractors",
    title: "Missile Defense Contractors",
    description: "Recipients ranked across missile and guided weapons awards.",
    filters: { keywords: ["missile"], psc: "1410" },
  },
] as const;

export const topicPresets = [
  {
    slug: "missile-defense",
    title: "Missile Defense",
    description:
      "Missile, guided weapons, radar, and air defense award activity.",
    keywords: ["missile", "radar"],
    psc: "1410",
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    description: "Cybersecurity and secure IT services award activity.",
    keywords: ["cyber"],
    naics: "541512",
  },
  {
    slug: "shipbuilding",
    title: "Shipbuilding",
    description:
      "Ship construction, repair, and naval platform award activity.",
    keywords: ["ship"],
    naics: "336611",
  },
  {
    slug: "space-systems",
    title: "Space Systems",
    description:
      "Space, satellite, launch, and missile warning award activity.",
    keywords: ["space", "satellite"],
    naics: "336414",
  },
  {
    slug: "ai-autonomy",
    title: "AI and Autonomy",
    description: "AI, autonomy, data platform, and autonomous systems awards.",
    keywords: ["ai", "autonomous", "data"],
  },
] as const;

const knownContractors = [
  {
    slug: "lockheed-martin",
    name: "Lockheed Martin",
    aliases: ["Lockheed Martin Corporation", "LMT"],
  },
  {
    slug: "rtx",
    name: "RTX",
    aliases: ["RTX Corporation", "Raytheon", "Raytheon Technologies"],
  },
  {
    slug: "northrop-grumman",
    name: "Northrop Grumman",
    aliases: ["Northrop Grumman Corporation", "NOC"],
  },
  {
    slug: "the-boeing-company",
    name: "The Boeing Company",
    aliases: ["Boeing", "Boeing Defense"],
  },
  {
    slug: "general-dynamics",
    name: "General Dynamics",
    aliases: ["General Dynamics Corporation", "Electric Boat", "GDIT"],
  },
  {
    slug: "leidos",
    name: "Leidos",
    aliases: ["Leidos Holdings", "Leidos Inc"],
  },
  {
    slug: "booz-allen-hamilton",
    name: "Booz Allen Hamilton",
    aliases: ["Booz Allen", "BAH"],
  },
  { slug: "caci-international", name: "CACI International", aliases: ["CACI"] },
  { slug: "anduril", name: "Anduril", aliases: ["Anduril Industries"] },
  {
    slug: "palantir-technologies",
    name: "Palantir Technologies",
    aliases: ["Palantir", "Palantir USG"],
  },
];

const agencyNames = [
  "Department of Defense",
  "Department of the Army",
  "Department of the Navy",
  "Department of the Air Force",
  "Defense Logistics Agency",
  "Defense Information Systems Agency",
  "Defense Intelligence Agency",
];

const locationNames = [
  "Alabama",
  "Arizona",
  "California",
  "Colorado",
  "Connecticut",
  "District of Columbia",
  "Florida",
  "Maryland",
  "Massachusetts",
  "Missouri",
  "Texas",
  "Utah",
  "Virginia",
  "Washington",
];

const keywordVocabulary = [
  "ai",
  "aircraft",
  "autonomous",
  "cloud",
  "cyber",
  "data",
  "intelligence",
  "missile",
  "radar",
  "ship",
  "software",
  "space",
  "sustainment",
];

const demoAwards: AwardSummary[] = [
  demoAward(
    "LMT-2026-001",
    "Lockheed Martin Corporation",
    "Department of Defense",
    "Department of the Navy",
    "336414",
    "Guided Missile and Space Vehicle Manufacturing",
    "1410",
    "Guided missiles",
    "2025-11-10",
    5_240_000_000,
    "F-35 modernization, sustainment, and mission systems support.",
  ),
  demoAward(
    "RTX-2026-001",
    "RTX Corporation",
    "Department of Defense",
    "Department of the Navy",
    "334511",
    "Search and navigation systems",
    "5840",
    "Radar equipment",
    "2025-12-12",
    2_860_000_000,
    "Air and missile defense radar production and integration.",
  ),
  demoAward(
    "NOC-2026-001",
    "Northrop Grumman Corporation",
    "Department of Defense",
    "Department of the Air Force",
    "336414",
    "Guided Missile and Space Vehicle Manufacturing",
    "1420",
    "Rockets and space vehicles",
    "2026-01-08",
    3_920_000_000,
    "Strategic deterrent engineering and manufacturing development.",
  ),
  demoAward(
    "LDOS-2026-001",
    "Leidos Inc.",
    "Department of Defense",
    "Defense Information Systems Agency",
    "541512",
    "Computer Systems Design Services",
    "D399",
    "IT and telecom services",
    "2025-10-28",
    1_180_000_000,
    "Enterprise IT modernization, cloud migration, and cybersecurity operations in Virginia.",
  ),
];

export function createQueryHash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function createPlanHash(plan: unknown, query = ""): string {
  return createQueryHash(JSON.stringify({ query: query.trim(), plan }));
}

export function formatMoney(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function planAwardSearchQuery(query: string): AwardSearchPlan {
  const normalized = normalizeText(query);
  const contractors = knownContractors
    .filter((contractor) =>
      [contractor.slug, contractor.name, ...contractor.aliases].some((name) =>
        normalized.includes(normalizeText(name)),
      ),
    )
    .map((contractor) => contractor.slug);
  const fiscalYears = Array.from(query.matchAll(/\b20\d{2}\b/g)).map((match) =>
    Number(match[0]),
  );
  const agency = extractAgency(normalized);
  const location = extractLocation(normalized);
  const naics = extractCode(query, "naics");
  const psc = extractCode(query, "psc");
  const keywords = extractKeywords(normalized);
  const limit = extractLimit(normalized) ?? 10;

  let intent: AwardSearchIntent = "award_keyword_search";
  if (
    contractors.length === 1 &&
    /profile|lookup|summary|show|tell/.test(normalized)
  ) {
    intent = "company_lookup";
  } else if (contractors.length > 1 || /compare|versus| vs /.test(normalized)) {
    intent = "company_comparison";
  } else if (/top|largest|rank|biggest/.test(normalized) && agency) {
    intent = "agency_top_contractors";
  } else if (naics || psc || /category|naics|psc/.test(normalized)) {
    intent = "category_search";
  } else if (location) {
    intent = "location_search";
  } else if (!keywords.length && !contractors.length) {
    intent = "unsupported";
  }

  return awardSearchPlanSchema.parse({
    intent,
    contractors,
    agency,
    naics,
    psc,
    location,
    keywords,
    fiscalYears,
    limit,
  });
}

export async function getContractorIntelligenceLive(
  slug: string,
  options: { forceRefresh?: boolean } = {},
): Promise<ContractorIntelligence> {
  const db = getDb();
  const [contractor] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.slug, slug.toLowerCase()))
    .limit(1);

  if (!contractor) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor "${slug}" not found`,
    });
  }

  const aliases = aliasesForContractor(contractor.slug, contractor.name);
  const fiscalYears = getFiscalYears(5);
  const plan = awardSearchPlanSchema.parse({
    intent: "company_lookup",
    contractors: [contractor.slug],
    fiscalYears,
    limit: 100,
  });
  const query = `contractor:${contractor.slug}:${fiscalYears.join(",")}`;
  const queryHash = createPlanHash(plan, query);
  const cached = await getIntelligenceCacheByHash(queryHash);

  if (
    cached &&
    !options.forceRefresh &&
    Date.now() - cached.refreshedAt.getTime() < PROFILE_CACHE_TTL_MS
  ) {
    return cached.result as ContractorIntelligence;
  }

  try {
    const searchInput: UsaSpendingAwardSearchInput = {
      recipientSearchText: [contractor.name, ...aliases],
      fiscalYears,
      limit: 100,
    };
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
    const result = buildContractorIntelligence(
      {
        id: contractor.id,
        slug: contractor.slug,
        name: contractor.name,
        headquarters: contractor.headquarters ?? null,
        website: contractor.website ?? null,
        defenseRevenue: contractor.defenseRevenue ?? null,
        totalRevenue: contractor.totalRevenue ?? null,
      },
      aliases,
      awards,
      trend,
      awardResponse.messages,
    );
    await writeRawCache(query, queryHash, result, result.sourceMetadata);
    await persistAwards(awards);
    return result;
  } catch (error) {
    if (cached) {
      const result = cached.result as ContractorIntelligence;
      result.sourceMetadata = {
        ...result.sourceMetadata,
        cacheStatus: "stale",
        warnings: [
          ...result.sourceMetadata.warnings,
          error instanceof Error
            ? error.message
            : "USAspending refresh failed.",
        ],
      };
      return result;
    }
    throw error;
  }
}

export async function resolveRecipients(searchText: string) {
  return resolveUsaSpendingRecipients(searchText);
}

export async function getAwardSearch(
  input: UsaSpendingAwardSearchInput,
): Promise<{
  awards: AwardSummary[];
  sourceMetadata: SourceMetadata;
}> {
  const response = await searchUsaSpendingAwards(input);
  const filters = filtersToLabels(input);
  return {
    awards: response.results,
    sourceMetadata: sourceMetadata(
      response.results.length,
      filters,
      response.messages,
      "live",
    ),
  };
}

export async function getTopContractors(
  input: UsaSpendingAwardSearchInput,
): Promise<{
  contractors: RankingRow[];
  sourceMetadata: SourceMetadata;
}> {
  const response = await fetchUsaSpendingCategoryRankings("recipient", input);
  const filters = filtersToLabels(input);
  return {
    contractors: response.results,
    sourceMetadata: sourceMetadata(
      response.results.length,
      filters,
      response.messages,
      "live",
    ),
  };
}

export async function getAgencies() {
  try {
    const agencies = await fetchUsaSpendingToptierAgencies();
    const defenseAgencies = agencyNames
      .filter((name) => name !== "Department of Defense")
      .map((name) => ({
        code: slugify(name),
        name,
        abbreviation: abbreviationForAgency(name),
        slug: slugify(name),
      }));
    return [...defenseAgencies, ...agencies];
  } catch {
    return agencyNames.map((name) => ({
      code: slugify(name),
      name,
      abbreviation: abbreviationForAgency(name),
      slug: slugify(name),
    }));
  }
}

export function getAgencyBySlug(slug: string): {
  slug: string;
  name: string;
  abbreviation: string | null;
} | null {
  const agency = agencyNames.find((name) => slugify(name) === slug);
  if (!agency) return null;
  return {
    slug,
    name: agency,
    abbreviation: abbreviationForAgency(agency),
  };
}

export function getRankingPreset(slug: string) {
  return rankingPresets.find((preset) => preset.slug === slug) ?? null;
}

export function getTopicPreset(slug: string) {
  return topicPresets.find((topic) => topic.slug === slug) ?? null;
}

export function getSpendingTrend(awards: AwardSummary[]): TrendPoint[] {
  return trendFromAwards(awards);
}

export function searchAwards(plan: AwardSearchPlan): AwardSummary[] {
  const awards = filterDemoAwards(plan);

  if (plan.sort?.field === "startDate") {
    return awards.sort((a, b) => {
      const comparison = String(a.startDate).localeCompare(String(b.startDate));
      return plan.sort?.direction === "asc" ? comparison : -comparison;
    });
  }

  return awards.sort((a, b) =>
    plan.sort?.direction === "asc"
      ? a.obligation - b.obligation
      : b.obligation - a.obligation,
  );
}

export function getContractorIntelligence(
  slug: string,
): ContractorIntelligence | null {
  const contractor = knownContractors.find((item) => item.slug === slug);
  if (!contractor) return null;
  const names = [contractor.name, ...contractor.aliases].map(normalizeText);
  const awards = demoAwards.filter((award) =>
    names.some((name) => normalizeText(award.recipientName).includes(name)),
  );
  return buildContractorIntelligence(
    {
      id: null,
      slug: contractor.slug,
      name: contractor.name,
      headquarters: null,
      website: null,
      defenseRevenue: null,
      totalRevenue: null,
    },
    contractor.aliases,
    awards,
    trendFromAwards(awards),
    [],
  );
}

export function compareContractors(slugs: string[]): ContractorIntelligence[] {
  return slugs
    .map((slug) => getContractorIntelligence(slug))
    .filter((item): item is ContractorIntelligence => Boolean(item));
}

function buildContractorIntelligence(
  contractor: ContractorIntelligence["contractor"],
  aliases: string[],
  awards: AwardSummary[],
  yearlyTrend: TrendPoint[],
  warnings: string[],
): ContractorIntelligence {
  const topAgencies = aggregateAwards(
    awards,
    (award) => award.awardingAgency ?? "Unknown agency",
  );
  const topSubAgencies = aggregateAwards(
    awards,
    (award) =>
      award.awardingSubAgency ?? award.awardingAgency ?? "Unknown agency",
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

  return {
    contractor,
    summary: {
      totalObligations: awards.reduce(
        (sum, award) => sum + award.obligation,
        0,
      ),
      awardCount: awards.length,
      latestFiscalYear,
      yoyDelta:
        currentYear != null && previousYear != null
          ? currentYear - previousYear
          : null,
      topAgency: topAgencies[0] ?? null,
      topSubAgency: topSubAgencies[0] ?? null,
      topNaics: topNaics[0] ?? null,
      topPsc: topPsc[0] ?? null,
    },
    aliases,
    identifiers: {
      uei: linkedRecipients[0]?.uei ?? null,
      cageCode: null,
    },
    linkedRecipients,
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
    sourceLinks: sourceLinksForAwards(awards),
    sourceMetadata: sourceMetadata(
      awards.length,
      [
        {
          kind: "contractor",
          label: "Contractor",
          value: contractor.name,
          code: contractor.slug,
        },
      ],
      warnings,
      "live",
    ),
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

function sourceMetadata(
  structuredRecords: number,
  filters: IntelligenceFilter[],
  warnings: string[],
  cacheStatus: SourceMetadata["cacheStatus"],
): SourceMetadata {
  const now = new Date();

  return {
    sources: [{ label: "USAspending.gov", url: USA_SPENDING_BASE_URL }],
    generatedAt: now.toISOString(),
    refreshedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PUBLIC_CACHE_TTL_MS).toISOString(),
    freshness:
      cacheStatus === "live"
        ? "Live USAspending data normalized by military.contractors."
        : "Cached USAspending data served from the local normalized cache.",
    cacheStatus,
    structuredRecords,
    filters,
    warnings: formatUsaSpendingMessages(warnings),
  };
}

async function getIntelligenceCacheByHash(queryHash: string): Promise<{
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
  const result = entry.result as unknown as ContractorIntelligence;
  if (result.sourceMetadata?.warnings?.length) {
    result.sourceMetadata = {
      ...result.sourceMetadata,
      warnings: formatUsaSpendingMessages(result.sourceMetadata.warnings),
    };
  }
  return {
    result,
    refreshedAt: entry.refreshedAt,
  };
}

async function writeRawCache(
  query: string,
  queryHash: string,
  result: ContractorIntelligence,
  metadata: SourceMetadata,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PUBLIC_CACHE_TTL_MS);

  await db
    .insert(schema.explorerQueryCache)
    .values({
      id: queryHash.slice(0, 16),
      query,
      normalizedQuery: normalizeText(query),
      queryHash,
      plan: null,
      result: result as unknown as Record<string, unknown>,
      sourceMetadata: metadata as unknown as Record<string, unknown>,
      cacheStatus: "live",
      refreshedAt: now,
      expiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.explorerQueryCache.queryHash,
      set: {
        query,
        normalizedQuery: normalizeText(query),
        plan:
          "plan" in result
            ? (result.plan as unknown as Record<string, unknown>)
            : null,
        result: result as unknown as Record<string, unknown>,
        sourceMetadata: metadata as unknown as Record<string, unknown>,
        cacheStatus: "live",
        refreshedAt: now,
        expiresAt,
        updatedAt: now,
      },
    });
}

async function persistAwards(awards: AwardSummary[]): Promise<void> {
  if (!awards.length) return;
  const db = getDb();
  const now = new Date();

  try {
    for (const item of awards) {
      const recipientId = createQueryHash(
        item.recipientUei ?? item.recipientName,
      ).slice(0, 24);
      await db
        .insert(schema.recipientEntity)
        .values({
          id: recipientId,
          recipientName: item.recipientName,
          normalizedName: normalizeText(item.recipientName),
          uei: item.recipientUei,
          cageCode: item.recipientCageCode,
          aliases: [],
          source: "usaspending",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.recipientEntity.id,
          set: {
            recipientName: item.recipientName,
            normalizedName: normalizeText(item.recipientName),
            uei: item.recipientUei,
            updatedAt: now,
          },
        });

      const awardingAgencyId = item.awardingAgency
        ? await upsertAgency(item.awardingAgency)
        : null;
      const fundingAgencyId = item.fundingAgency
        ? await upsertAgency(item.fundingAgency)
        : null;

      if (item.naicsCode) {
        await db
          .insert(schema.naicsCode)
          .values({
            code: item.naicsCode,
            title: item.naicsTitle ?? `NAICS ${item.naicsCode}`,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.naicsCode.code,
            set: {
              title: item.naicsTitle ?? `NAICS ${item.naicsCode}`,
              updatedAt: now,
            },
          });
      }

      if (item.pscCode) {
        await db
          .insert(schema.pscCode)
          .values({
            code: item.pscCode,
            title: item.pscTitle ?? `PSC ${item.pscCode}`,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.pscCode.code,
            set: {
              title: item.pscTitle ?? `PSC ${item.pscCode}`,
              updatedAt: now,
            },
          });
      }

      await db
        .insert(schema.award)
        .values({
          id: createQueryHash(item.key).slice(0, 24),
          awardId: item.awardId,
          generatedAwardId: item.generatedAwardId,
          piid: item.piid,
          recipientEntityId: recipientId,
          recipientName: item.recipientName,
          recipientUei: item.recipientUei,
          awardingAgencyId,
          fundingAgencyId,
          awardingSubAgencyName: item.awardingSubAgency,
          fundingSubAgencyName: item.fundingSubAgency,
          naicsCode: item.naicsCode,
          pscCode: item.pscCode,
          fiscalYear: item.fiscalYear ?? getFiscalYears(1)[0]!,
          description: item.description,
          baseObligation: item.obligation,
          totalObligation: item.obligation,
          awardType: item.awardType,
          periodStartDate: item.startDate ? new Date(item.startDate) : null,
          periodEndDate: item.endDate ? new Date(item.endDate) : null,
          sourceUrl: item.sourceUrl,
          sourceApi: "usaspending",
          cachedAt: now,
          raw: item as unknown as Record<string, unknown>,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.award.awardId,
          set: {
            generatedAwardId: item.generatedAwardId,
            recipientName: item.recipientName,
            recipientUei: item.recipientUei,
            awardingAgencyId,
            fundingAgencyId,
            awardingSubAgencyName: item.awardingSubAgency,
            fundingSubAgencyName: item.fundingSubAgency,
            naicsCode: item.naicsCode,
            pscCode: item.pscCode,
            fiscalYear: item.fiscalYear ?? getFiscalYears(1)[0]!,
            totalObligation: item.obligation,
            description: item.description,
            sourceUrl: item.sourceUrl,
            sourceApi: "usaspending",
            cachedAt: now,
            raw: item as unknown as Record<string, unknown>,
            updatedAt: now,
          },
        });
    }
  } catch {
    // Cache writes must not block public read paths.
  }
}

async function upsertAgency(name: string): Promise<string> {
  const db = getDb();
  const id = createQueryHash(name).slice(0, 24);
  const now = new Date();

  await db
    .insert(schema.agency)
    .values({
      id,
      toptierCode: slugify(name),
      name,
      abbreviation: abbreviationForAgency(name),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.agency.id,
      set: {
        name,
        abbreviation: abbreviationForAgency(name),
        updatedAt: now,
      },
    });

  return id;
}

function filterDemoAwards(plan: AwardSearchPlan): AwardSummary[] {
  let awards = [...demoAwards];

  if (plan.contractors.length) {
    awards = awards.filter((award) =>
      plan.contractors.some((slug) => {
        const contractor = knownContractors.find((item) => item.slug === slug);
        const names = contractor
          ? [contractor.name, ...contractor.aliases].map(normalizeText)
          : [slug];
        const recipient = normalizeText(award.recipientName);
        return names.some(
          (name) => recipient.includes(name) || name.includes(recipient),
        );
      }),
    );
  }

  if (plan.recipientSearchText?.length) {
    const recipients = plan.recipientSearchText.map(normalizeText);
    awards = awards.filter((award) => {
      const recipient = normalizeText(award.recipientName);
      return recipients.some(
        (name) => recipient.includes(name) || name.includes(recipient),
      );
    });
  }

  if (plan.agency) {
    const agency = normalizeText(plan.agency);
    awards = awards.filter((award) =>
      normalizeText(
        `${award.awardingAgency ?? ""} ${award.awardingSubAgency ?? ""}`,
      ).includes(agency),
    );
  }

  if (plan.naics) {
    awards = awards.filter((award) => award.naicsCode === plan.naics);
  }

  if (plan.psc) {
    awards = awards.filter((award) => award.pscCode === plan.psc);
  }

  if (plan.location) {
    awards = awards.filter((award) =>
      normalizeText(award.description ?? "").includes(
        normalizeText(plan.location!),
      ),
    );
  }

  if (plan.keywords.length) {
    const keywords = plan.keywords.map(normalizeText);
    awards = awards.filter((award) =>
      keywords.every((keyword) =>
        normalizeText(
          `${award.description ?? ""} ${award.naicsTitle ?? ""} ${award.pscTitle ?? ""}`,
        ).includes(keyword),
      ),
    );
  }

  return awards;
}

function demoAward(
  awardId: string,
  recipientName: string,
  awardingAgency: string,
  awardingSubAgency: string,
  naicsCode: string,
  naicsTitle: string,
  pscCode: string,
  pscTitle: string,
  startDate: string,
  obligation: number,
  description: string,
): AwardSummary {
  return {
    key: awardId,
    awardId,
    generatedAwardId: awardId,
    piid: awardId,
    recipientName,
    recipientSlug: slugify(recipientName),
    recipientUei: null,
    recipientCageCode: null,
    awardingAgency,
    awardingSubAgency,
    fundingAgency: awardingAgency,
    fundingSubAgency: awardingSubAgency,
    naicsCode,
    naicsTitle,
    pscCode,
    pscTitle,
    fiscalYear:
      new Date(`${startDate}T00:00:00Z`).getUTCMonth() >= 9 ? 2026 : 2025,
    startDate,
    endDate: null,
    obligation,
    awardType: "Contract",
    description,
    placeOfPerformance: null,
    sourceUrl: `${USA_SPENDING_BASE_URL}/award/${awardId}`,
  };
}

function aliasesForContractor(slug: string, name: string): string[] {
  return (
    knownContractors.find((contractor) => contractor.slug === slug)
      ?.aliases ?? [name]
  );
}

function extractAgency(normalized: string): string | null {
  return (
    agencyNames.find((agency) => normalized.includes(normalizeText(agency))) ??
    null
  );
}

function extractLocation(normalized: string): string | null {
  return (
    locationNames.find((location) =>
      normalized.includes(normalizeText(location)),
    ) ?? null
  );
}

function extractCode(query: string, label: "naics" | "psc"): string | null {
  const regex =
    label === "naics" ? /naics\s+(\d{2,6})/i : /psc\s+([a-z0-9]{4})/i;
  return query.match(regex)?.[1]?.toUpperCase() ?? null;
}

function extractKeywords(normalized: string): string[] {
  return keywordVocabulary.filter((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(normalized);
  });
}

function extractLimit(normalized: string): number | null {
  const match =
    normalized.match(/\btop\s+(\d{1,3})\b/) ??
    normalized.match(/\b(\d{1,3})\s+(?:contract\s+)?awards?\b/);
  if (!match?.[1]) return null;
  const limit = Number(match[1]);
  if (!Number.isFinite(limit)) return null;
  return Math.min(Math.max(limit, 1), 100);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function abbreviationForAgency(name: string): string | null {
  const normalized = normalizeText(name);
  if (normalized === "department of defense") return "DOD";
  if (normalized === "department of the army") return "Army";
  if (normalized === "department of the navy") return "Navy";
  if (normalized === "department of the air force") return "Air Force";
  if (normalized === "defense logistics agency") return "DLA";
  if (normalized === "defense information systems agency") return "DISA";
  if (normalized === "defense intelligence agency") return "DIA";
  return null;
}
