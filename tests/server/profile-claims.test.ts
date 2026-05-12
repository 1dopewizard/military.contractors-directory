/**
 * @file Profile claim and correction tests
 * @description Covers validation for profile submission workflows
 */

import { describe, expect, it } from "vitest";

import {
  normalizeSubmissionSlug,
  profileClaimSchema,
  profileCorrectionSchema,
} from "@/server/utils/profile-submissions";

describe("profile submission validation", () => {
  it("accepts a profile claim with contractor context and evidence", () => {
    const claim = profileClaimSchema.parse({
      contractorSlug: " Lockheed-Martin ",
      submitterName: "Jane Doe",
      companyRole: "Business development lead",
      evidenceUrl: "https://example.com/verify",
      requestedContext: {
        capabilities: ["space systems", "mission integration"],
      },
    });

    expect(claim.contractorSlug).toBe("Lockheed-Martin");
    expect(claim.requestedContext?.capabilities).toEqual([
      "space systems",
      "mission integration",
    ]);
  });

  it("stores correction requests as review payloads rather than source mutations", () => {
    const correction = profileCorrectionSchema.parse({
      contractorSlug: "acme-defense",
      targetField: "topNaicsCode",
      explanation:
        "The public profile appears to reference an outdated NAICS category for recent awards.",
      evidenceUrl: "https://www.usaspending.gov/award/CONT_AWD_TEST",
    });

    expect(correction).toMatchObject({
      contractorSlug: "acme-defense",
      targetField: "topNaicsCode",
    });
    expect(correction).not.toHaveProperty("replacementSnapshotValue");
  });

  it("rejects corrections without a meaningful explanation", () => {
    expect(() =>
      profileCorrectionSchema.parse({
        contractorSlug: "acme-defense",
        targetField: "recipientName",
        explanation: "wrong",
      }),
    ).toThrow();
  });

  it("normalizes profile target slugs consistently", () => {
    expect(normalizeSubmissionSlug("  ACME-Defense  ")).toBe("acme-defense");
  });
});
