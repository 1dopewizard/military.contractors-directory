/**
 * @file Teaming utility tests
 * @description Covers deterministic public-data teaming match explanations
 */

import { describe, expect, it } from "vitest";

import {
  buildTeamingMatchReasons,
  scoreTeamingMatch,
  teamingSearchSchema,
} from "@/server/utils/teaming";
import type { ContractorSnapshot } from "@/server/database/schema/snapshot";

const snapshot: ContractorSnapshot = {
  id: "snapshot-1",
  runId: null,
  slug: "acme-defense",
  recipientName: "ACME Defense",
  normalizedName: "acme defense",
  recipientUei: "ABC123",
  recipientCode: "recipient-1",
  totalObligations36m: 50_000_000,
  awardCount36m: 12,
  lastAwardDate: null,
  topAwardingAgency: "Department of Defense",
  topAwardingSubagency: "Department of the Navy",
  topNaicsCode: "541512",
  topNaicsTitle: "Computer Systems Design Services",
  topPscCode: "D399",
  topPscTitle: "IT and telecom services",
  sourceUrl: "https://www.usaspending.gov/recipient/recipient-1",
  sourceMetadata: null,
  rawAggregate: null,
  snapshotWindowStart: new Date("2023-04-30"),
  snapshotWindowEnd: new Date("2026-04-30"),
  refreshedAt: new Date("2026-04-30"),
  createdAt: new Date("2026-04-30"),
  updatedAt: new Date("2026-04-30"),
};

describe("teaming utilities", () => {
  it("explains NAICS, PSC, and agency public-data matches", () => {
    const reasons = buildTeamingMatchReasons(snapshot, {
      q: "",
      naics: "541512",
      psc: "D399",
      agency: "Navy",
      limit: 20,
    });

    expect(reasons.map((reason) => reason.label)).toEqual([
      "NAICS overlap",
      "PSC overlap",
      "Agency activity",
    ]);
    expect(reasons.every((reason) => reason.provenance === "public_data")).toBe(
      true,
    );
  });

  it("returns a helpful public activity reason for empty filters", () => {
    const reasons = buildTeamingMatchReasons(snapshot, {
      q: "",
      limit: 20,
    });

    expect(reasons).toEqual([
      {
        label: "Public activity",
        value: "DoD award recipient in the current snapshot",
        provenance: "public_data",
      },
    ]);
  });

  it("rejects invalid filter limits", () => {
    expect(() => teamingSearchSchema.parse({ limit: 200 })).toThrow();
  });

  it("scores stronger matches above broad public activity matches", () => {
    const broadReasons = buildTeamingMatchReasons(snapshot, {
      q: "",
      limit: 20,
    });
    const specificReasons = buildTeamingMatchReasons(snapshot, {
      q: "cyber",
      naics: "541512",
      psc: "D399",
      agency: "Navy",
      limit: 20,
    });

    expect(scoreTeamingMatch(snapshot, specificReasons)).toBeGreaterThan(
      scoreTeamingMatch(snapshot, broadReasons),
    );
  });
});
