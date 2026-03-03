/**
 * @file Specialty detail API endpoint
 * @route GET /api/specialties/[slug]
 * @description Returns specialty details with contractors in that specialty
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, asc, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Specialty slug is required",
    });
  }

  const db = getDb();

  try {
    // Get specialty by slug
    const [specialty] = await db
      .select()
      .from(schema.specialty)
      .where(eq(schema.specialty.slug, slug.toLowerCase()))
      .limit(1);

    if (!specialty) {
      throw createError({
        statusCode: 404,
        statusMessage: `Specialty "${slug}" not found`,
      });
    }

    // Get contractors in this specialty
    const contractorSpecialties = await db
      .select({
        contractorId: schema.contractorSpecialty.contractorId,
        isPrimary: schema.contractorSpecialty.isPrimary,
        contractor: {
          id: schema.contractor.id,
          slug: schema.contractor.slug,
          name: schema.contractor.name,
          description: schema.contractor.description,
          defenseNewsRank: schema.contractor.defenseNewsRank,
          headquarters: schema.contractor.headquarters,
          employeeCount: schema.contractor.employeeCount,
          logoUrl: schema.contractor.logoUrl,
        },
      })
      .from(schema.contractorSpecialty)
      .innerJoin(
        schema.contractor,
        eq(schema.contractorSpecialty.contractorId, schema.contractor.id),
      )
      .where(eq(schema.contractorSpecialty.specialtyId, specialty.id))
      .orderBy(asc(schema.contractor.defenseNewsRank));

    // Get related specialties (most common co-occurring specialties)
    const relatedSpecialties = await db
      .select({
        id: schema.specialty.id,
        slug: schema.specialty.slug,
        name: schema.specialty.name,
        icon: schema.specialty.icon,
      })
      .from(schema.specialty)
      .limit(5);

    return {
      id: specialty.id,
      slug: specialty.slug,
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon,
      contractors: contractorSpecialties.map((cs) => ({
        ...cs.contractor,
        isPrimary: cs.isPrimary,
      })),
      contractorCount: contractorSpecialties.length,
      relatedSpecialties: relatedSpecialties.filter(
        (s) => s.id !== specialty.id,
      ),
    };
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch specialty: ${message}`,
    });
  }
});
