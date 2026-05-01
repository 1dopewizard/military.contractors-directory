/**
 * @file GET /api/contractors/[slug]
 * @description Snapshot-first contractor/recipient detail with curated overlay and award intelligence
 */

import { getDb, schema } from "@/server/utils/db";
import {
  getContractorSnapshotBySlug,
  getCuratedContractorOverlay,
  getSnapshotProfileIntelligence,
} from "@/server/utils/contractor-snapshot";
import { getContractorIntelligenceLive } from "@/server/utils/intelligence";
import { eq } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  refresh: z.coerce.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  const db = getDb();
  const snapshot = await getContractorSnapshotBySlug(slug);
  const curated =
    (await getCuratedContractorOverlay(snapshot, slug)) ??
    (await getCuratedContractorBySlug(slug));

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
  const intelligence = snapshot
    ? await getSnapshotProfileIntelligence(snapshot.slug, {
        forceRefresh: query.refresh,
      })
    : await getContractorIntelligenceLive(curated!.slug, {
        forceRefresh: query.refresh,
      });

  const name = snapshot?.recipientName ?? curated!.name;
  const response = {
    id: snapshot?.id ?? curated!.id,
    slug: snapshot?.slug ?? curated!.slug,
    name,
    recipientName: snapshot?.recipientName ?? null,
    normalizedName: snapshot?.normalizedName ?? null,
    recipientUei: snapshot?.recipientUei ?? null,
    recipientCode: snapshot?.recipientCode ?? null,
    totalObligations36m: snapshot?.totalObligations36m ?? null,
    awardCount36m: snapshot?.awardCount36m ?? null,
    lastAwardDate: snapshot?.lastAwardDate?.toISOString() ?? null,
    topAwardingAgency: snapshot?.topAwardingAgency ?? null,
    topAwardingSubagency: snapshot?.topAwardingSubagency ?? null,
    topNaicsCode: snapshot?.topNaicsCode ?? null,
    topNaicsTitle: snapshot?.topNaicsTitle ?? null,
    topPscCode: snapshot?.topPscCode ?? null,
    topPscTitle: snapshot?.topPscTitle ?? null,
    sourceUrl: snapshot?.sourceUrl ?? null,
    sourceMetadata: snapshot?.sourceMetadata ?? null,
    snapshotWindowStart: snapshot?.snapshotWindowStart?.toISOString() ?? null,
    snapshotWindowEnd: snapshot?.snapshotWindowEnd?.toISOString() ?? null,
    refreshedAt: snapshot?.refreshedAt?.toISOString() ?? null,
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
    curated: curated
      ? {
          id: curated.id,
          slug: curated.slug,
          name: curated.name,
          description: curated.description,
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
    intelligence,
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
