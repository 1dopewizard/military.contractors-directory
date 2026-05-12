/**
 * @file GET /api/contractors/[slug]
 * @description Snapshot-first contractor/recipient detail with curated overlay and award intelligence
 */

import { getDb, schema } from "@/server/utils/db";
import {
  getContractorDirectoryProfileBySlug,
  getContractorSnapshotBySlug,
  getCuratedContractorOverlay,
} from "@/server/utils/contractor-snapshot";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  const directoryProfile = await getContractorDirectoryProfileBySlug(slug);
  const snapshot =
    directoryProfile?.snapshot ?? (await getContractorSnapshotBySlug(slug));
  const canonicalSlug = directoryProfile?.group.slug ?? snapshot?.slug ?? slug;
  const canonicalName =
    directoryProfile?.group.canonicalName ?? snapshot?.recipientName ?? null;
  const directoryAliases =
    directoryProfile?.aliases ??
    (snapshot
      ? [
          {
            id: snapshot.id,
            groupId: snapshot.id,
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
            matchReason: "single_snapshot" as const,
            matchKey: `snapshot:${snapshot.id}`,
          },
        ]
      : []);
  const curated =
    (await getCuratedContractorOverlay(
      snapshot,
      canonicalSlug,
      canonicalName,
    )) ?? (await getCuratedContractorBySlug(canonicalSlug));

  if (!snapshot && !curated) {
    throw createError({
      statusCode: 404,
      statusMessage: `Contractor "${slug}" not found`,
    });
  }

  const [specialties, locations] = curated
    ? await Promise.all([
        getCuratedSpecialties(curated.id),
        getCuratedLocations(curated.id),
      ])
    : [[], []];
  const primarySpecialty =
    specialties.find((specialty) => specialty.isPrimary) ??
    specialties[0] ??
    null;

  const name = canonicalName ?? curated!.name;
  const response = {
    id: snapshot?.id ?? curated!.id,
    slug: canonicalSlug,
    canonicalSlug,
    requestedSlug: slug.toLowerCase(),
    isAliasSlug: directoryProfile?.isAliasRequest ?? false,
    name,
    recipientName: canonicalName,
    normalizedName:
      directoryProfile?.group.normalizedName ??
      snapshot?.normalizedName ??
      null,
    recipientUei:
      directoryProfile?.group.primaryRecipientUei ??
      snapshot?.recipientUei ??
      null,
    recipientCode:
      directoryProfile?.group.primaryRecipientCode ??
      snapshot?.recipientCode ??
      null,
    totalObligations36m:
      directoryProfile?.group.totalObligations36m ??
      snapshot?.totalObligations36m ??
      null,
    awardCount36m:
      directoryProfile?.group.awardCount36m ?? snapshot?.awardCount36m ?? null,
    lastAwardDate:
      directoryProfile?.group.lastAwardDate?.toISOString() ??
      snapshot?.lastAwardDate?.toISOString() ??
      null,
    topAwardingAgency:
      directoryProfile?.group.topAwardingAgency ??
      snapshot?.topAwardingAgency ??
      null,
    topAwardingSubagency:
      directoryProfile?.group.topAwardingSubagency ??
      snapshot?.topAwardingSubagency ??
      null,
    topNaicsCode:
      directoryProfile?.group.topNaicsCode ?? snapshot?.topNaicsCode ?? null,
    topNaicsTitle:
      directoryProfile?.group.topNaicsTitle ?? snapshot?.topNaicsTitle ?? null,
    topPscCode:
      directoryProfile?.group.topPscCode ?? snapshot?.topPscCode ?? null,
    topPscTitle:
      directoryProfile?.group.topPscTitle ?? snapshot?.topPscTitle ?? null,
    sourceUrl: directoryProfile?.group.sourceUrl ?? snapshot?.sourceUrl ?? null,
    sourceMetadata:
      directoryProfile?.group.sourceMetadata ??
      snapshot?.sourceMetadata ??
      null,
    snapshotWindowStart:
      directoryProfile?.group.snapshotWindowStart?.toISOString() ??
      snapshot?.snapshotWindowStart?.toISOString() ??
      null,
    snapshotWindowEnd:
      directoryProfile?.group.snapshotWindowEnd?.toISOString() ??
      snapshot?.snapshotWindowEnd?.toISOString() ??
      null,
    refreshedAt:
      directoryProfile?.group.refreshedAt?.toISOString() ??
      snapshot?.refreshedAt?.toISOString() ??
      null,
    description: curated?.description ?? null,
    defenseNewsRank: curated?.defenseNewsRank ?? null,
    country: curated?.country ?? null,
    headquarters: curated?.headquarters ?? null,
    founded: curated?.founded ?? null,
    employeeCount: curated?.employeeCount ?? null,
    website: curated?.website ?? null,
    linkedinUrl: curated?.linkedinUrl ?? null,
    wikipediaUrl: curated?.wikipediaUrl ?? null,
    stockTicker: curated?.stockTicker ?? null,
    isPublic: curated?.isPublic ?? false,
    totalRevenue: curated?.totalRevenue ?? null,
    defenseRevenue: curated?.defenseRevenue ?? null,
    defenseRevenuePercent: curated?.defenseRevenuePercent ?? null,
    logoUrl: curated?.logoUrl ?? null,
    specialties,
    primarySpecialty,
    locations,
    directoryAliases,
    alternateRecipientNames: directoryAliases
      .filter((alias) => !alias.isCanonical)
      .map((alias) => alias.recipientName),
    curated: curated
      ? {
          id: curated.id,
          slug: curated.slug,
          name: curated.name,
          description: curated.description,
        }
      : null,
    directoryGroup: directoryProfile
      ? {
          id: directoryProfile.group.id,
          slug: directoryProfile.group.slug,
          canonicalName: directoryProfile.group.canonicalName,
          aliasCount: directoryProfile.group.aliasCount,
        }
      : null,
    snapshot: snapshot
      ? {
          id: snapshot.id,
          slug: snapshot.slug,
          recipientName: snapshot.recipientName,
          normalizedName: snapshot.normalizedName,
          recipientUei: snapshot.recipientUei,
          recipientCode: snapshot.recipientCode,
          totalObligations36m: snapshot.totalObligations36m,
          awardCount36m: snapshot.awardCount36m,
          lastAwardDate: snapshot.lastAwardDate?.toISOString() ?? null,
          topAwardingAgency: snapshot.topAwardingAgency,
          topAwardingSubagency: snapshot.topAwardingSubagency,
          topNaicsCode: snapshot.topNaicsCode,
          topNaicsTitle: snapshot.topNaicsTitle,
          topPscCode: snapshot.topPscCode,
          topPscTitle: snapshot.topPscTitle,
          sourceUrl: snapshot.sourceUrl,
          refreshedAt: snapshot.refreshedAt.toISOString(),
          snapshotWindowStart: snapshot.snapshotWindowStart.toISOString(),
          snapshotWindowEnd: snapshot.snapshotWindowEnd.toISOString(),
        }
      : null,
    intelligence: null,
    intelligenceStatus: "separate_endpoint" as const,
    createdAt:
      snapshot?.createdAt?.toISOString() ??
      curated?.createdAt?.toISOString() ??
      null,
    updatedAt:
      snapshot?.updatedAt?.toISOString() ??
      curated?.updatedAt?.toISOString() ??
      null,
  };

  return response;
});

async function getCuratedContractorBySlug(slug: string) {
  const db = getDb();
  const [contractor] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.slug, slug.toLowerCase()))
    .limit(1);
  return contractor ?? null;
}

async function getCuratedSpecialties(contractorId: string) {
  const db = getDb();
  const rows = await db
    .select({
      specialtyId: schema.contractorSpecialty.specialtyId,
      isPrimary: schema.contractorSpecialty.isPrimary,
      specialtySlug: schema.specialty.slug,
      specialtyName: schema.specialty.name,
      specialtyDescription: schema.specialty.description,
      specialtyIcon: schema.specialty.icon,
    })
    .from(schema.contractorSpecialty)
    .innerJoin(
      schema.specialty,
      eq(schema.contractorSpecialty.specialtyId, schema.specialty.id),
    )
    .where(eq(schema.contractorSpecialty.contractorId, contractorId));

  return rows.map((row) => ({
    id: row.specialtyId,
    slug: row.specialtySlug,
    name: row.specialtyName,
    description: row.specialtyDescription ?? null,
    icon: row.specialtyIcon ?? null,
    isPrimary: row.isPrimary ?? false,
  }));
}

async function getCuratedLocations(contractorId: string) {
  const db = getDb();
  const locations = await db
    .select()
    .from(schema.contractorLocation)
    .where(eq(schema.contractorLocation.contractorId, contractorId));

  return locations.map((location) => ({
    id: location.id,
    city: location.city ?? null,
    state: location.state ?? null,
    country: location.country,
    isHeadquarters: location.isHeadquarters ?? false,
  }));
}
