/**
 * @file Intelligence utility tests
 * @description Covers explorer planning and deterministic award aggregation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateObject = vi.hoisted(() => vi.fn());
const mockCreateOpenAI = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateObject: mockGenerateObject,
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: mockCreateOpenAI,
}));

import {
  createPlanHash,
  compareContractors,
  explorerPlanSchema,
  formatMoney,
  getContractorIntelligence,
  getSpendingTrend,
  planExplorerQueryWithAi,
  planExplorerQuery,
  runExplorerQuery,
  searchAwards,
} from "@/server/utils/intelligence";
import {
  buildUsaSpendingFilters,
  clampUsaSpendingStartDate,
  dateToFiscalYear,
  fiscalYearToDateRange,
  normalizeUsaSpendingAward,
  sanitizeUsaSpendingKeywords,
} from "@/server/utils/usaspending";

beforeEach(() => {
  mockGenerateObject.mockReset();
  mockCreateOpenAI.mockReset();
  mockCreateOpenAI.mockReturnValue((model: string) => ({ model }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("contractor intelligence utilities", () => {
  it("plans an agency top-contractors query", () => {
    const plan = planExplorerQuery("Top Department of the Navy contractors");

    expect(plan.intent).toBe("agency_top_contractors");
    expect(plan.agency).toBe("Department of the Navy");
  });

  it("does not extract AI from NAICS as a keyword", () => {
    const plan = planExplorerQuery("Top NAICS 541512 contractors");

    expect(plan.intent).toBe("category_search");
    expect(plan.naics).toBe("541512");
    expect(plan.keywords).not.toContain("ai");
  });

  it("plans a company comparison query", () => {
    const plan = planExplorerQuery("Compare Lockheed Martin and RTX");

    expect(plan.intent).toBe("company_comparison");
    expect(plan.contractors).toEqual(["lockheed-martin", "rtx"]);
  });

  it("uses the AI planner for recent Aegis award questions", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockGenerateObject.mockResolvedValue({
      object: {
        intent: "award_keyword_search",
        contractors: [],
        agency: null,
        naics: null,
        psc: null,
        location: null,
        keywords: ["Aegis"],
        recipientSearchText: [],
        fiscalYears: [],
        limit: 3,
        sort: { field: "startDate", direction: "desc" },
      },
    });

    const { plan, warnings } = await planExplorerQueryWithAi(
      "What are the last 3 contract awards for Aegis?",
    );

    expect(warnings).toEqual([]);
    expect(plan.intent).toBe("award_keyword_search");
    expect(plan.keywords).toEqual(["Aegis"]);
    expect(plan.limit).toBe(3);
    expect(plan.sort).toEqual({ field: "startDate", direction: "desc" });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
  });

  it("uses recipientSearchText for unknown recipient names", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockGenerateObject.mockResolvedValue({
      object: {
        intent: "company_lookup",
        contractors: [],
        agency: null,
        naics: null,
        psc: null,
        location: null,
        keywords: [],
        recipientSearchText: ["Shield AI"],
        fiscalYears: [],
        limit: 10,
        sort: null,
      },
    });

    const { plan } = await planExplorerQueryWithAi("Show Shield AI awards");

    expect(plan.contractors).toEqual([]);
    expect(plan.recipientSearchText).toEqual(["Shield AI"]);
  });

  it("uses the AI planner for agency rankings", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockGenerateObject.mockResolvedValue({
      object: {
        intent: "agency_top_contractors",
        contractors: [],
        agency: "Department of the Navy",
        naics: null,
        psc: null,
        location: null,
        keywords: [],
        recipientSearchText: [],
        fiscalYears: [],
        limit: 10,
        sort: { field: "awardAmount", direction: "desc" },
      },
    });

    const { plan } = await planExplorerQueryWithAi(
      "Top Department of the Navy contractors",
    );

    expect(plan.intent).toBe("agency_top_contractors");
    expect(plan.agency).toBe("Department of the Navy");
    expect(plan.sort).toEqual({ field: "awardAmount", direction: "desc" });
  });

  it("falls back when the AI planner returns an invalid object", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockGenerateObject.mockResolvedValue({
      object: {
        intent: "made_up_intent",
        limit: 1000,
      },
    });

    const { plan, warnings } = await planExplorerQueryWithAi(
      "Top Department of the Navy contractors",
    );

    expect(plan.intent).toBe("agency_top_contractors");
    expect(plan.agency).toBe("Department of the Navy");
    expect(warnings).toEqual([
      "Explorer AI planner failed; using fallback parser.",
    ]);
  });

  it("uses the fallback parser when no planner API key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("NUXT_OPENAI_API_KEY", "");

    const { plan, warnings } = await planExplorerQueryWithAi(
      "Top Department of the Navy contractors",
    );

    expect(plan.intent).toBe("agency_top_contractors");
    expect(plan.agency).toBe("Department of the Navy");
    expect(warnings).toEqual([
      "Explorer planner API key is not configured; using fallback parser.",
    ]);
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it("rejects invalid planner payloads through the zod schema", () => {
    const result = explorerPlanSchema.safeParse({
      intent: "made_up_intent",
      limit: 1000,
    });

    expect(result.success).toBe(false);
  });

  it("filters awards by agency and computes spending trend", () => {
    const awards = searchAwards({
      intent: "agency_top_contractors",
      contractors: [],
      agency: "department of the navy",
      naics: null,
      psc: null,
      location: null,
      keywords: [],
      fiscalYears: [],
      limit: 10,
    });

    const trend = getSpendingTrend(awards);

    expect(awards.length).toBeGreaterThan(0);
    expect(
      awards.every((award) =>
        `${award.awardingAgency ?? ""} ${award.awardingSubAgency ?? ""}`.includes(
          "Navy",
        ),
      ),
    ).toBe(true);
    expect(trend[0]?.key).toBe("2026");
  });

  it("builds contractor intelligence with source-backed totals", () => {
    const intelligence = getContractorIntelligence("lockheed-martin");

    expect(intelligence?.summary.awardCount).toBeGreaterThan(0);
    expect(intelligence?.summary.totalObligations).toBeGreaterThan(0);
    expect(intelligence?.linkedRecipients[0]?.name).toContain("Lockheed");
    expect(intelligence?.sourceLinks[0]?.url).toContain("usaspending.gov");
  });

  it("compares known contractors", () => {
    const comparison = compareContractors(["lockheed-martin", "rtx"]);

    expect(comparison).toHaveLength(2);
    expect(comparison[0]?.contractor.name).toBe("Lockheed Martin");
  });

  it("returns structured explorer output", () => {
    const result = runExplorerQuery("Show cyber awards in Virginia");

    expect(result.resultType).toBe("location_search");
    expect(result.table.length).toBeGreaterThan(0);
    expect(result.cards[1]?.label).toBe("Obligations");
    expect(result.sourceMetadata.structuredRecords).toBeGreaterThan(0);
  });

  it("creates stable plan hashes", () => {
    const plan = planExplorerQuery("Top Department of the Navy contractors");

    expect(
      createPlanHash(plan, "Top Department of the Navy contractors"),
    ).toHaveLength(64);
    expect(formatMoney(1_200_000_000)).toBe("$1.2B");
  });
});

describe("USAspending adapter helpers", () => {
  it("clamps date windows to the USAspending public search minimum", () => {
    expect(clampUsaSpendingStartDate("2001-10-01")).toBe("2007-10-01");
    expect(fiscalYearToDateRange(2008).startDate).toBe("2007-10-01");
  });

  it("builds deterministic contract filters", () => {
    const filters = buildUsaSpendingFilters({
      agency: "Department of the Navy",
      fiscalYears: [2026],
      naicsCodes: ["541512"],
      keywords: ["cyber"],
    });

    expect(filters.award_type_codes).toEqual(["A", "B", "C", "D"]);
    expect(filters.naics_codes).toEqual({ require: ["541512"] });
    expect(filters.keywords).toEqual(["cyber"]);
    expect(filters.agencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "awarding",
          tier: "subtier",
          name: "Department of the Navy",
        }),
      ]),
    );
  });

  it("drops USAspending keywords shorter than the public API minimum", () => {
    expect(sanitizeUsaSpendingKeywords(["ai", "cyber", " cyber "])).toEqual([
      "cyber",
    ]);

    const filters = buildUsaSpendingFilters({
      fiscalYears: [2026],
      keywords: ["ai"],
    });

    expect(filters).not.toHaveProperty("keywords");
  });

  it("normalizes award search rows", () => {
    const award = normalizeUsaSpendingAward({
      internal_id: 1,
      generated_internal_id: "CONT_AWD_TEST",
      "Award ID": "N000001",
      "Recipient Name": "TEST CONTRACTOR",
      "Recipient UEI": "ABC123",
      "Start Date": "2025-10-01",
      "End Date": "2026-09-30",
      "Award Amount": 2500000,
      "Awarding Agency": "Department of Defense",
      "Awarding Sub Agency": "Department of the Navy",
      "Funding Agency": "Department of Defense",
      "Funding Sub Agency": "Department of the Navy",
      "Award Type": "Definitive Contract",
      Description: "Ship systems support",
      "NAICS Code": "336611",
      "NAICS Description": "Ship Building and Repairing",
      "PSC Code": "1905",
      "PSC Description": "Combat ships",
    });

    expect(award.key).toBe("CONT_AWD_TEST");
    expect(award.fiscalYear).toBe(2026);
    expect(award.recipientUei).toBe("ABC123");
    expect(dateToFiscalYear("2026-01-01")).toBe(2026);
  });
});
