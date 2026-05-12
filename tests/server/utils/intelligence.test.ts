/**
 * @file Intelligence utility tests
 * @description Covers deterministic award aggregation and snapshot helpers
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildContractorIntelligenceSignals,
  compareContractors,
  createPlanHash,
  formatMoney,
  getContractorIntelligence,
  getSpendingTrend,
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
import type { ContractorIntelligence } from "@/app/types/intelligence.types";
import {
  buildContractorSnapshotFilters,
  fetchContractorSnapshotPage,
  getTrailingSnapshotWindow,
  normalizeContractorSnapshotRow,
  parseContractorSnapshotQuery,
} from "@/server/utils/contractor-snapshot";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("contractor intelligence utilities", () => {
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
    expect(intelligence?.signals.map((signal) => signal.key)).toContain(
      "agency-concentration",
    );
    expect(
      intelligence?.signals.every((signal) => signal.status !== undefined),
    ).toBe(true);
  });

  it("reports lower concentration for multi-agency award profiles", () => {
    const intelligence = getContractorIntelligence("lockheed-martin");
    expect(intelligence).not.toBeNull();

    const singleAgencySignals = buildContractorIntelligenceSignals({
      ...(intelligence as ContractorIntelligence),
      summary: {
        ...(intelligence as ContractorIntelligence).summary,
        totalObligations: 100,
        topAgency: {
          key: "navy",
          label: "Department of the Navy",
          obligation: 100,
          awardCount: 2,
        },
      },
      topAgencies: [
        {
          key: "navy",
          label: "Department of the Navy",
          obligation: 100,
          awardCount: 2,
        },
      ],
    });
    const multiAgencySignals = buildContractorIntelligenceSignals({
      ...(intelligence as ContractorIntelligence),
      summary: {
        ...(intelligence as ContractorIntelligence).summary,
        totalObligations: 100,
        topAgency: {
          key: "navy",
          label: "Department of the Navy",
          obligation: 40,
          awardCount: 2,
        },
      },
      topAgencies: [
        {
          key: "navy",
          label: "Department of the Navy",
          obligation: 40,
          awardCount: 2,
        },
        {
          key: "army",
          label: "Department of the Army",
          obligation: 35,
          awardCount: 2,
        },
      ],
    });

    expect(
      singleAgencySignals.find(
        (signal) => signal.key === "agency-concentration",
      )?.status,
    ).toBe("concentrated");
    expect(
      multiAgencySignals.find((signal) => signal.key === "agency-concentration")
        ?.status,
    ).toBe("healthy");
  });

  it("marks missing NAICS/PSC signal inputs unavailable", () => {
    const intelligence = getContractorIntelligence("lockheed-martin");
    expect(intelligence).not.toBeNull();

    const signals = buildContractorIntelligenceSignals({
      ...(intelligence as ContractorIntelligence),
      summary: {
        ...(intelligence as ContractorIntelligence).summary,
        topNaics: null,
        topPsc: null,
      },
      topNaics: [],
      topPsc: [],
    });

    expect(
      signals.find((signal) => signal.key === "naics-concentration"),
    ).toMatchObject({ status: "unavailable" });
    expect(
      signals.find((signal) => signal.key === "psc-concentration"),
    ).toMatchObject({ status: "unavailable" });
  });

  it("reflects stale source metadata as degraded freshness confidence", () => {
    const intelligence = getContractorIntelligence("lockheed-martin");
    expect(intelligence).not.toBeNull();

    const signals = buildContractorIntelligenceSignals({
      ...(intelligence as ContractorIntelligence),
      sourceMetadata: {
        ...(intelligence as ContractorIntelligence).sourceMetadata,
        cacheStatus: "stale",
        warnings: ["Cached profile is older than the refresh window."],
      },
    });

    expect(
      signals.find((signal) => signal.key === "source-freshness"),
    ).toMatchObject({
      status: "stale",
      caveats: ["Cached profile is older than the refresh window."],
    });
  });

  it("compares known contractors", () => {
    const comparison = compareContractors(["lockheed-martin", "rtx"]);

    expect(comparison).toHaveLength(2);
    expect(comparison[0]?.contractor.name).toBe("Lockheed Martin");
  });

  it("creates stable cache hashes and formats large obligations", () => {
    expect(createPlanHash({ source: "contractor-database" })).toHaveLength(64);
    expect(formatMoney(1_200_000_000)).toBe("$1.2B");
  });
});

describe("contractor snapshot helpers", () => {
  it("builds trailing 36-month DoD-awarded contract filters", () => {
    const window = getTrailingSnapshotWindow(
      new Date("2026-04-30T12:00:00.000Z"),
    );
    const filters = buildContractorSnapshotFilters(window);

    expect(window).toEqual({
      startDate: "2023-04-30",
      endDate: "2026-04-30",
    });
    expect(filters.award_type_codes).toEqual(["A", "B", "C", "D"]);
    expect(filters.time_period).toEqual([
      { start_date: "2023-04-30", end_date: "2026-04-30" },
    ]);
    expect(filters.agencies).toEqual([
      {
        type: "awarding",
        tier: "toptier",
        name: "Department of Defense",
      },
    ]);
  });

  it("normalizes recipient aggregate rows into snapshot rows", () => {
    const row = normalizeContractorSnapshotRow(
      {
        id: 123,
        recipient_id: "abc-recipient",
        name: " ACME Defense, LLC ",
        code: null,
        amount: 12000000,
        count: 7,
      },
      { startDate: "2023-04-30", endDate: "2026-04-30" },
      { slug: "acme-defense" },
    );

    expect(row.slug).toBe("acme-defense");
    expect(row.recipientName).toBe("ACME Defense, LLC");
    expect(row.normalizedName).toBe("acme defense llc");
    expect(row.recipientCode).toBe("abc-recipient");
    expect(row.recipientUei).toBeNull();
    expect(row.totalObligations36m).toBe(12000000);
    expect(row.awardCount36m).toBe(7);
    expect(row.topAwardingAgency).toBe("Department of Defense");
    expect(row.topNaicsCode).toBeNull();
    expect(row.topPscCode).toBeNull();
  });

  it("validates snapshot query limits and defaults", () => {
    expect(parseContractorSnapshotQuery({}).sort).toBe("totalObligations36m");
    expect(parseContractorSnapshotQuery({ limit: "100" }).limit).toBe(100);
    expect(() => parseContractorSnapshotQuery({ limit: "101" })).toThrow();
    expect(() => parseContractorSnapshotQuery({ sort: "bad" })).toThrow();
  });

  it("fetches recipient snapshot pages with pagination metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            recipient_id: "recipient-1",
            name: "TEST RECIPIENT",
            amount: 42,
            count: 2,
          },
        ],
        page_metadata: { page: 1, hasNext: false, total: 1 },
        messages: ["ok"],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await fetchContractorSnapshotPage({
      page: 1,
      limit: 100,
      window: { startDate: "2023-04-30", endDate: "2026-04-30" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.usaspending.gov/api/v2/search/spending_by_category/recipient/",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.filters.agencies).toEqual([
      {
        type: "awarding",
        tier: "toptier",
        name: "Department of Defense",
      },
    ]);
    expect(page.rows).toHaveLength(1);
    expect(page.hasNext).toBe(false);
    expect(page.total).toBe(1);
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
