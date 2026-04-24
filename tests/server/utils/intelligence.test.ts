/**
 * @file Intelligence utility tests
 * @description Covers explorer planning and deterministic award aggregation
 */

import { describe, expect, it } from "vitest";
import {
  compareContractors,
  explorerPlanSchema,
  getContractorIntelligence,
  getSpendingTrend,
  planExplorerQuery,
  runExplorerQuery,
  searchAwards,
} from "@/server/utils/intelligence";

describe("contractor intelligence utilities", () => {
  it("plans an agency top-contractors query", () => {
    const plan = planExplorerQuery("Top Department of the Navy contractors");

    expect(plan.intent).toBe("agency_top_contractors");
    expect(plan.agency).toBe("department of the navy");
  });

  it("plans a company comparison query", () => {
    const plan = planExplorerQuery("Compare Lockheed Martin and RTX");

    expect(plan.intent).toBe("company_comparison");
    expect(plan.contractors).toEqual(["lockheed-martin", "rtx"]);
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
    expect(awards.every((award) => award.agency.includes("Navy"))).toBe(true);
    expect(trend[0]?.key).toBe("2025");
  });

  it("builds contractor intelligence with source-backed totals", () => {
    const intelligence = getContractorIntelligence("lockheed-martin");

    expect(intelligence?.summary.awardCount).toBeGreaterThan(0);
    expect(intelligence?.summary.totalObligations).toBeGreaterThan(0);
    expect(intelligence?.identifiers.uei).toBeTruthy();
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
});
