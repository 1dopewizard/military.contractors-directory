/**
 * @file Contractor snapshot grouping tests
 * @description Regression coverage for canonical directory grouping over raw USAspending snapshots
 */

import { describe, expect, it } from "vitest";

import {
  buildContractorDirectoryGroups,
  findBuiltContractorDirectoryGroupBySlug,
  type ContractorDirectorySnapshotInput,
  type CuratedDirectoryAliasMapping,
} from "@/server/utils/contractor-snapshot";

const windowStart = new Date("2023-05-01T00:00:00.000Z");
const windowEnd = new Date("2026-05-01T00:00:00.000Z");
const refreshedAt = new Date("2026-05-01T12:00:00.000Z");

function snapshotRow(
  overrides: Partial<ContractorDirectorySnapshotInput> & {
    id: string;
    slug: string;
    recipientName: string;
  },
): ContractorDirectorySnapshotInput {
  return {
    id: overrides.id,
    slug: overrides.slug,
    recipientName: overrides.recipientName,
    normalizedName:
      overrides.normalizedName ??
      overrides.recipientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    recipientUei: overrides.recipientUei ?? null,
    recipientCode: overrides.recipientCode ?? null,
    totalObligations36m: overrides.totalObligations36m ?? 0,
    awardCount36m: overrides.awardCount36m ?? 0,
    lastAwardDate: overrides.lastAwardDate ?? null,
    topAwardingAgency: overrides.topAwardingAgency ?? "Department of Defense",
    topAwardingSubagency: overrides.topAwardingSubagency ?? null,
    topNaicsCode: overrides.topNaicsCode ?? null,
    topNaicsTitle: overrides.topNaicsTitle ?? null,
    topPscCode: overrides.topPscCode ?? null,
    topPscTitle: overrides.topPscTitle ?? null,
    sourceUrl:
      overrides.sourceUrl ??
      `https://www.usaspending.gov/recipient/${overrides.id}/latest`,
    sourceMetadata: overrides.sourceMetadata ?? { source: "test" },
    snapshotWindowStart: overrides.snapshotWindowStart ?? windowStart,
    snapshotWindowEnd: overrides.snapshotWindowEnd ?? windowEnd,
    refreshedAt: overrides.refreshedAt ?? refreshedAt,
    createdAt: overrides.createdAt ?? refreshedAt,
    updatedAt: overrides.updatedAt ?? refreshedAt,
  };
}

describe("contractor directory grouping", () => {
  it("groups recipient rows that share a UEI and aggregates totals", () => {
    const groups = buildContractorDirectoryGroups([
      snapshotRow({
        id: "snapshot-1",
        slug: "acme-defense",
        recipientName: "ACME Defense LLC",
        recipientUei: "UEI123456789",
        recipientCode: "recipient-a",
        totalObligations36m: 12_000_000,
        awardCount36m: 8,
      }),
      snapshotRow({
        id: "snapshot-2",
        slug: "acme-defense-inc",
        recipientName: "ACME DEFENSE, INC.",
        recipientUei: "UEI123456789",
        recipientCode: "recipient-b",
        totalObligations36m: 3_500_000,
        awardCount36m: 4,
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      canonicalName: "ACME Defense LLC",
      totalObligations36m: 15_500_000,
      awardCount36m: 12,
      aliasCount: 2,
    });
    expect(groups[0]?.aliases.map((alias) => alias.recipientName)).toEqual([
      "ACME Defense LLC",
      "ACME DEFENSE, INC.",
    ]);
  });

  it("resolves alias slugs to the canonical built group", () => {
    const groups = buildContractorDirectoryGroups([
      snapshotRow({
        id: "snapshot-1",
        slug: "prime-systems",
        recipientName: "Prime Systems LLC",
        recipientUei: "PRIMEUEI0001",
        totalObligations36m: 20_000_000,
      }),
      snapshotRow({
        id: "snapshot-2",
        slug: "prime-systems-old-name",
        recipientName: "Prime Systems Old Name",
        recipientUei: "PRIMEUEI0001",
        totalObligations36m: 1_000_000,
      }),
    ]);

    const canonical = findBuiltContractorDirectoryGroupBySlug(
      groups,
      "prime-systems",
    );
    const byAlias = findBuiltContractorDirectoryGroupBySlug(
      groups,
      "prime-systems-old-name",
    );

    expect(byAlias).not.toBeNull();
    expect(byAlias?.id).toBe(canonical?.id);
    expect(byAlias?.slug).toBe("prime-systems");
  });

  it("groups exact normalized names even when identifiers differ", () => {
    const groups = buildContractorDirectoryGroups([
      snapshotRow({
        id: "snapshot-1",
        slug: "the-boeing-company",
        recipientName: "THE BOEING COMPANY",
        recipientUei: "BOEINGUEI001",
        recipientCode: "recipient-1",
        totalObligations36m: 10_000_000,
      }),
      snapshotRow({
        id: "snapshot-2",
        slug: "the-boeing-company-f27dcd52",
        recipientName: "THE BOEING COMPANY",
        recipientUei: "BOEINGUEI002",
        recipientCode: "recipient-2",
        totalObligations36m: 5_000_000,
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      slug: "the-boeing-company",
      canonicalName: "THE BOEING COMPANY",
      totalObligations36m: 15_000_000,
      aliasCount: 2,
    });
    expect(groups[0]?.aliases.map((alias) => alias.matchReason)).toEqual([
      "shared_name",
      "shared_name",
    ]);
  });

  it("does not merge similar names without shared identifiers", () => {
    const groups = buildContractorDirectoryGroups([
      snapshotRow({
        id: "snapshot-1",
        slug: "falcon-analytics",
        recipientName: "Falcon Analytics LLC",
        recipientUei: "FALCONUEI001",
        recipientCode: "recipient-1",
      }),
      snapshotRow({
        id: "snapshot-2",
        slug: "falcon-analytic-solutions",
        recipientName: "Falcon Analytic Solutions LLC",
        recipientUei: "FALCONUEI002",
        recipientCode: "recipient-2",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.aliasCount)).toEqual([1, 1]);
  });

  it("keeps missing-identifier rows separate unless a curated mapping links them", () => {
    const rows = [
      snapshotRow({
        id: "snapshot-1",
        slug: "northstar-defense",
        recipientName: "Northstar Defense",
        totalObligations36m: 7_000_000,
        awardCount36m: 5,
      }),
      snapshotRow({
        id: "snapshot-2",
        slug: "north-star-defense-llc",
        recipientName: "North Star Defense LLC",
        totalObligations36m: 2_000_000,
        awardCount36m: 2,
      }),
    ];

    expect(buildContractorDirectoryGroups(rows)).toHaveLength(2);

    const curatedMappings: CuratedDirectoryAliasMapping[] = [
      {
        canonicalSlug: "northstar-defense",
        canonicalName: "Northstar Defense",
        snapshotSlugs: ["northstar-defense", "north-star-defense-llc"],
      },
    ];
    const groups = buildContractorDirectoryGroups(rows, curatedMappings);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      slug: "northstar-defense",
      totalObligations36m: 9_000_000,
      awardCount36m: 7,
      aliasCount: 2,
    });
    expect(
      groups[0]?.aliases.every(
        (alias) => alias.matchReason === "curated_alias",
      ),
    ).toBe(true);
  });
});
