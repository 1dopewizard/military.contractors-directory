/**
 * @file USAspending adapter
 * @description Validated fetch boundary and normalization helpers for public award data
 */

import { z } from "zod";
import type {
  AwardSummary,
  IntelligenceFilter,
  RankingRow,
  SourceLink,
  TrendPoint,
} from "@/app/types/intelligence.types";

export const USA_SPENDING_BASE_URL = "https://www.usaspending.gov";
export const USA_SPENDING_API_BASE_URL = "https://api.usaspending.gov/api/v2";
export const USA_SPENDING_MIN_DATE = "2007-10-01";
export const CONTRACT_AWARD_TYPE_CODES = ["A", "B", "C", "D"];

const SEARCH_AWARDS_URL = `${USA_SPENDING_API_BASE_URL}/search/spending_by_award/`;
const CATEGORY_URL = `${USA_SPENDING_API_BASE_URL}/search/spending_by_category`;
const SPENDING_OVER_TIME_URL = `${USA_SPENDING_API_BASE_URL}/search/spending_over_time/`;
const AUTOCOMPLETE_RECIPIENT_URL = `${USA_SPENDING_API_BASE_URL}/autocomplete/recipient/`;
const TOPTIER_AGENCIES_URL = `${USA_SPENDING_API_BASE_URL}/references/toptier_agencies/`;

export const usaSpendingAwardSchema = z
  .object({
    internal_id: z.union([z.string(), z.number()]).nullable().optional(),
    generated_internal_id: z.string().nullable().optional(),
    "Award ID": z.string().nullable().optional(),
    "Recipient Name": z.string().nullable().optional(),
    "Recipient UEI": z.string().nullable().optional(),
    "Start Date": z.string().nullable().optional(),
    "End Date": z.string().nullable().optional(),
    "Award Amount": z.coerce.number().default(0),
    "Awarding Agency": z.string().nullable().optional(),
    "Awarding Sub Agency": z.string().nullable().optional(),
    "Funding Agency": z.string().nullable().optional(),
    "Funding Sub Agency": z.string().nullable().optional(),
    "Award Type": z.string().nullable().optional(),
    Description: z.string().nullable().optional(),
    "NAICS Code": z.string().nullable().optional(),
    "NAICS Description": z.string().nullable().optional(),
    "PSC Code": z.string().nullable().optional(),
    "PSC Description": z.string().nullable().optional(),
  })
  .passthrough();

const usaSpendingSearchResponseSchema = z.object({
  results: z.array(usaSpendingAwardSchema).default([]),
  page_metadata: z
    .object({
      page: z.number().optional(),
      hasNext: z.boolean().optional(),
      total: z.number().optional(),
    })
    .passthrough()
    .optional(),
  messages: z.array(z.string()).default([]),
});

const usaSpendingCategoryRowSchema = z
  .object({
    amount: z.coerce.number().default(0),
    name: z.string().nullable().optional(),
    code: z.union([z.string(), z.number()]).nullable().optional(),
    uei: z.string().nullable().optional(),
  })
  .passthrough();

const usaSpendingCategoryResponseSchema = z.object({
  results: z.array(usaSpendingCategoryRowSchema).default([]),
  page_metadata: z.record(z.string(), z.unknown()).optional(),
  messages: z.array(z.string()).default([]),
});

const usaSpendingOverTimeResponseSchema = z.object({
  results: z
    .array(
      z
        .object({
          aggregated_amount: z.coerce.number().default(0),
          time_period: z
            .object({
              fiscal_year: z.union([z.string(), z.number()]).optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .default([]),
  messages: z.array(z.string()).default([]),
});

const recipientAutocompleteSchema = z.object({
  results: z
    .array(
      z
        .object({
          recipient_name: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
          uei: z.string().nullable().optional(),
          duns: z.string().nullable().optional(),
        })
        .passthrough(),
    )
    .default([]),
  messages: z.array(z.string()).default([]),
});

const toptierAgencySchema = z.object({
  results: z
    .array(
      z
        .object({
          toptier_code: z.string().nullable().optional(),
          agency_id: z.coerce.number().nullable().optional(),
          abbreviation: z.string().nullable().optional(),
          agency_name: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
        })
        .passthrough(),
    )
    .default([]),
});

export type UsaSpendingAward = z.infer<typeof usaSpendingAwardSchema>;

export interface UsaSpendingAgencyFilter {
  type: "awarding" | "funding";
  tier: "toptier" | "subtier";
  name: string;
  toptier_name?: string;
}

export interface UsaSpendingFiltersInput {
  recipientSearchText?: string[];
  keywords?: string[];
  fiscalYears?: number[];
  timePeriod?: Array<{ startDate: string; endDate: string }>;
  agency?: string | null;
  agencies?: UsaSpendingAgencyFilter[];
  naicsCodes?: string[];
  pscCodes?: string[];
  placeOfPerformanceLocations?: string[];
  awardTypeCodes?: string[];
}

export interface UsaSpendingAwardSearchInput extends UsaSpendingFiltersInput {
  limit?: number;
  page?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface UsaSpendingResponse<T> {
  results: T[];
  messages: string[];
}

const agencyFilterPresets: Record<string, UsaSpendingAgencyFilter[]> = {
  "department of defense": [
    { type: "awarding", tier: "toptier", name: "Department of Defense" },
    { type: "funding", tier: "toptier", name: "Department of Defense" },
  ],
  "department of the army": [
    {
      type: "awarding",
      tier: "subtier",
      name: "Department of the Army",
      toptier_name: "Department of Defense",
    },
    {
      type: "funding",
      tier: "subtier",
      name: "Department of the Army",
      toptier_name: "Department of Defense",
    },
  ],
  "department of the navy": [
    {
      type: "awarding",
      tier: "subtier",
      name: "Department of the Navy",
      toptier_name: "Department of Defense",
    },
    {
      type: "funding",
      tier: "subtier",
      name: "Department of the Navy",
      toptier_name: "Department of Defense",
    },
  ],
  "department of the air force": [
    {
      type: "awarding",
      tier: "subtier",
      name: "Department of the Air Force",
      toptier_name: "Department of Defense",
    },
    {
      type: "funding",
      tier: "subtier",
      name: "Department of the Air Force",
      toptier_name: "Department of Defense",
    },
  ],
};

export function getCurrentFiscalYear(date = new Date()): number {
  return date.getUTCMonth() >= 9
    ? date.getUTCFullYear() + 1
    : date.getUTCFullYear();
}

export function getFiscalYears(count: number, date = new Date()): number[] {
  const currentFiscalYear = getCurrentFiscalYear(date);
  return Array.from({ length: count }, (_, index) => currentFiscalYear - index);
}

export function fiscalYearToDateRange(year: number): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: clampUsaSpendingStartDate(`${year - 1}-10-01`),
    endDate: `${year}-09-30`,
  };
}

export function fiscalYearsToTimePeriod(
  fiscalYears: number[],
): Array<{ start_date: string; end_date: string }> {
  const years = fiscalYears.length ? fiscalYears : getFiscalYears(5);
  return years.map((year) => {
    const range = fiscalYearToDateRange(year);
    return { start_date: range.startDate, end_date: range.endDate };
  });
}

export function clampUsaSpendingStartDate(date: string): string {
  return date < USA_SPENDING_MIN_DATE ? USA_SPENDING_MIN_DATE : date;
}

export function buildUsaSpendingFilters(
  input: UsaSpendingFiltersInput,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    award_type_codes: input.awardTypeCodes ?? CONTRACT_AWARD_TYPE_CODES,
  };

  const timePeriod = input.timePeriod?.length
    ? input.timePeriod.map((range) => ({
        start_date: clampUsaSpendingStartDate(range.startDate),
        end_date: range.endDate,
      }))
    : fiscalYearsToTimePeriod(input.fiscalYears ?? []);

  filters.time_period = timePeriod;

  if (input.recipientSearchText?.length) {
    filters.recipient_search_text = input.recipientSearchText;
  }

  const keywords = sanitizeUsaSpendingKeywords(input.keywords ?? []);
  if (keywords.length) {
    filters.keywords = keywords;
  }

  const agencies = input.agencies ?? agencyFiltersForName(input.agency);
  if (agencies.length) {
    filters.agencies = agencies;
  }

  if (input.naicsCodes?.length) {
    filters.naics_codes = { require: input.naicsCodes };
  }

  if (input.pscCodes?.length) {
    filters.psc_codes = { require: input.pscCodes };
  }

  return filters;
}

export function sanitizeUsaSpendingKeywords(keywords: string[]): string[] {
  return [
    ...new Set(
      keywords
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length >= 3),
    ),
  ];
}

export function agencyFiltersForName(
  agencyName: string | null | undefined,
): UsaSpendingAgencyFilter[] {
  if (!agencyName) return [];
  const normalized = normalizeText(agencyName);
  return (
    agencyFilterPresets[normalized] ?? [
      { type: "awarding", tier: "toptier", name: agencyName },
      { type: "funding", tier: "toptier", name: agencyName },
    ]
  );
}

export async function searchUsaSpendingAwards(
  input: UsaSpendingAwardSearchInput,
): Promise<UsaSpendingResponse<AwardSummary>> {
  const payload = {
    filters: buildUsaSpendingFilters(input),
    fields: [
      "Award ID",
      "Recipient Name",
      "Recipient UEI",
      "Start Date",
      "End Date",
      "Award Amount",
      "Awarding Agency",
      "Awarding Sub Agency",
      "Funding Agency",
      "Funding Sub Agency",
      "Award Type",
      "Description",
      "NAICS Code",
      "NAICS Description",
      "PSC Code",
      "PSC Description",
    ],
    page: input.page ?? 1,
    limit: input.limit ?? 25,
    sort: input.sort ?? "Award Amount",
    order: input.order ?? "desc",
  };

  const response = await fetchJson(SEARCH_AWARDS_URL, payload);
  const parsed = usaSpendingSearchResponseSchema.parse(response);

  return {
    results: parsed.results.map(normalizeUsaSpendingAward),
    messages: parsed.messages,
  };
}

export async function fetchUsaSpendingCategoryRankings(
  category: "recipient" | "naics" | "psc" | "awarding_agency" | "funding_agency",
  input: UsaSpendingAwardSearchInput,
): Promise<UsaSpendingResponse<RankingRow>> {
  const response = await fetchJson(`${CATEGORY_URL}/${category}/`, {
    filters: buildUsaSpendingFilters(input),
    limit: input.limit ?? 25,
    page: input.page ?? 1,
  });
  const parsed = usaSpendingCategoryResponseSchema.parse(response);
  const total = parsed.results.reduce((sum, row) => sum + row.amount, 0);

  return {
    results: parsed.results.map((row, index) => ({
      rank: index + 1,
      slug: row.name ? slugify(row.name) : null,
      name: row.name ?? String(row.code ?? "Unknown"),
      obligations: row.amount,
      awardCount: Number(row.count ?? row.award_count ?? 0),
      uei: row.uei ?? null,
      code: row.code == null ? null : String(row.code),
      share: total > 0 ? row.amount / total : null,
      sourceUrl: `${USA_SPENDING_BASE_URL}/search`,
    })),
    messages: parsed.messages,
  };
}

export async function fetchUsaSpendingTrend(
  input: UsaSpendingAwardSearchInput,
): Promise<UsaSpendingResponse<TrendPoint>> {
  const response = await fetchJson(SPENDING_OVER_TIME_URL, {
    filters: buildUsaSpendingFilters(input),
    group: "fiscal_year",
  });
  const parsed = usaSpendingOverTimeResponseSchema.parse(response);

  return {
    results: parsed.results
      .map((row) => {
        const fiscalYear = Number(row.time_period?.fiscal_year ?? 0);
        return {
          key: String(fiscalYear),
          label: `FY${fiscalYear}`,
          fiscalYear,
          obligation: row.aggregated_amount,
          awardCount: 0,
        };
      })
      .filter((row) => Number.isFinite(row.fiscalYear) && row.fiscalYear > 0)
      .sort((a, b) => a.fiscalYear - b.fiscalYear),
    messages: parsed.messages,
  };
}

export async function resolveUsaSpendingRecipients(searchText: string) {
  const response = await fetchJson(AUTOCOMPLETE_RECIPIENT_URL, {
    search_text: searchText,
    limit: 10,
  });
  const parsed = recipientAutocompleteSchema.parse(response);

  return {
    results: parsed.results.map((recipient) => ({
      name: recipient.recipient_name ?? recipient.name ?? "Unknown recipient",
      uei: recipient.uei ?? null,
      duns: recipient.duns ?? null,
    })),
    messages: parsed.messages,
  };
}

export async function fetchUsaSpendingToptierAgencies() {
  const response = await fetchWithRetry(TOPTIER_AGENCIES_URL, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const parsed = toptierAgencySchema.parse(await response.json());

  return parsed.results.map((agency) => ({
    code: agency.toptier_code ?? String(agency.agency_id ?? ""),
    name: agency.agency_name ?? agency.name ?? "Unknown agency",
    abbreviation: agency.abbreviation ?? null,
    slug: slugify(agency.agency_name ?? agency.name ?? "unknown-agency"),
  }));
}

export function normalizeUsaSpendingAward(award: UsaSpendingAward): AwardSummary {
  const awardId = award["Award ID"] ?? String(award.internal_id ?? "unknown-award");
  const generatedAwardId = award.generated_internal_id ?? null;
  const startDate = award["Start Date"] ?? null;

  return {
    key: generatedAwardId ?? awardId,
    awardId,
    generatedAwardId,
    piid: awardId,
    recipientName: award["Recipient Name"] ?? "Unknown recipient",
    recipientSlug: award["Recipient Name"]
      ? slugify(award["Recipient Name"])
      : null,
    recipientUei: award["Recipient UEI"] ?? null,
    recipientCageCode: null,
    awardingAgency: award["Awarding Agency"] ?? null,
    awardingSubAgency: award["Awarding Sub Agency"] ?? null,
    fundingAgency: award["Funding Agency"] ?? null,
    fundingSubAgency: award["Funding Sub Agency"] ?? null,
    naicsCode: award["NAICS Code"] ?? null,
    naicsTitle: award["NAICS Description"] ?? null,
    pscCode: award["PSC Code"] ?? null,
    pscTitle: award["PSC Description"] ?? null,
    fiscalYear: startDate ? dateToFiscalYear(startDate) : null,
    startDate,
    endDate: award["End Date"] ?? null,
    obligation: award["Award Amount"],
    awardType: award["Award Type"] ?? null,
    description: award.Description ?? null,
    placeOfPerformance: null,
    sourceUrl: sourceUrlForAward(generatedAwardId ?? awardId),
  };
}

export function sourceUrlForAward(awardKey: string): string {
  return `${USA_SPENDING_BASE_URL}/award/${encodeURIComponent(awardKey)}`;
}

export function sourceLinksForAwards(awards: AwardSummary[]): SourceLink[] {
  return [
    {
      label: "USAspending award search",
      url: `${USA_SPENDING_BASE_URL}/search`,
    },
    ...awards.slice(0, 5).map((award) => ({
      label: `${award.recipientName} ${award.awardId}`,
      url: award.sourceUrl,
    })),
  ];
}

export function formatUsaSpendingMessages(messages: string[]): string[] {
  return [...new Set(messages.map((message) => message.trim()).filter(Boolean))];
}

export function filtersToLabels(input: UsaSpendingFiltersInput): IntelligenceFilter[] {
  return [
    ...(input.recipientSearchText ?? []).map((value) => ({
      kind: "recipient" as const,
      label: "Recipient",
      value,
    })),
    input.agency
      ? {
          kind: "agency" as const,
          label: "Agency",
          value: input.agency,
        }
      : null,
    ...(input.naicsCodes ?? []).map((code) => ({
      kind: "naics" as const,
      label: "NAICS",
      value: code,
      code,
    })),
    ...(input.pscCodes ?? []).map((code) => ({
      kind: "psc" as const,
      label: "PSC",
      value: code,
      code,
    })),
    ...sanitizeUsaSpendingKeywords(input.keywords ?? []).map((value) => ({
      kind: "keyword" as const,
      label: "Keyword",
      value,
    })),
    ...(input.fiscalYears ?? []).map((year) => ({
      kind: "fiscal_year" as const,
      label: "Fiscal year",
      value: String(year),
    })),
  ].filter((item): item is IntelligenceFilter => Boolean(item));
}

export function dateToFiscalYear(date: string): number | null {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getUTCMonth() >= 9
    ? parsed.getUTCFullYear() + 1
    : parsed.getUTCFullYear();
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-");
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchJson(url: string, payload: unknown): Promise<unknown> {
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      const body = await response.text();
      lastError = new Error(
        `USAspending returned ${response.status}: ${body.slice(0, 300)}`,
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
