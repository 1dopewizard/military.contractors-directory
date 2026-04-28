/**
 * @file Contractor detail API endpoint
 * @route GET /api/contractors/[slug]
 * @description Returns single contractor details with specialties and locations
 */

import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  const db = getDb();

  try {
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

    const contractorSpecialties = await db
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
      .where(eq(schema.contractorSpecialty.contractorId, contractor.id));

    const locations = await db
      .select()
      .from(schema.contractorLocation)
      .where(eq(schema.contractorLocation.contractorId, contractor.id));

    const specialties = contractorSpecialties.map((cs) => ({
      id: cs.specialtyId,
      slug: cs.specialtySlug,
      name: cs.specialtyName,
      description: cs.specialtyDescription ?? null,
      icon: cs.specialtyIcon ?? null,
      isPrimary: cs.isPrimary ?? false,
    }));

    const primarySpecialty =
      specialties.find((s) => s.isPrimary) ?? specialties[0] ?? null;

    const locationsFormatted = locations.map((loc) => ({
      id: loc.id,
      city: loc.city ?? null,
      state: loc.state ?? null,
      country: loc.country,
      isHeadquarters: loc.isHeadquarters ?? false,
    }));

    return {
      id: contractor.id,
      slug: contractor.slug,
      name: contractor.name,
      description: contractor.description ?? null,
      defenseNewsRank: contractor.defenseNewsRank ?? null,
      country: contractor.country ?? null,
      headquarters: contractor.headquarters ?? null,
      founded: contractor.founded ?? null,
      employeeCount: contractor.employeeCount ?? null,
      website: contractor.website ?? null,
      careersUrl: contractor.careersUrl ?? null,
      linkedinUrl: contractor.linkedinUrl ?? null,
      wikipediaUrl: contractor.wikipediaUrl ?? null,
      stockTicker: contractor.stockTicker ?? null,
      isPublic: contractor.isPublic ?? false,
      totalRevenue: contractor.totalRevenue ?? null,
      defenseRevenue: contractor.defenseRevenue ?? null,
      defenseRevenuePercent: contractor.defenseRevenuePercent ?? null,
      logoUrl: contractor.logoUrl ?? null,
      specialties,
      primarySpecialty,
      locations: locationsFormatted,
      createdAt: contractor.createdAt?.toISOString() ?? null,
      updatedAt: contractor.updatedAt?.toISOString() ?? null,
    };
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch contractor: ${message}`,
    });
  }
});
