/**
 * @file Contractor detail API endpoint
 * @route GET /api/contractors/[slug]
 * @description Returns single contractor details with specialties, locations, and claimed profile data
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Contractor slug is required',
    })
  }

  const db = getDb()

  try {
    // Get contractor by slug
    const [contractor] = await db
      .select()
      .from(schema.contractor)
      .where(eq(schema.contractor.slug, slug.toLowerCase()))
      .limit(1)

    if (!contractor) {
      throw createError({
        statusCode: 404,
        statusMessage: `Contractor "${slug}" not found`,
      })
    }

    // Get all specialties for this contractor
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
        eq(schema.contractorSpecialty.specialtyId, schema.specialty.id)
      )
      .where(eq(schema.contractorSpecialty.contractorId, contractor.id))

    // Get all locations for this contractor
    const locations = await db
      .select()
      .from(schema.contractorLocation)
      .where(eq(schema.contractorLocation.contractorId, contractor.id))

    // Transform specialties
    const specialties = contractorSpecialties.map((cs) => ({
      id: cs.specialtyId,
      slug: cs.specialtySlug,
      name: cs.specialtyName,
      description: cs.specialtyDescription ?? null,
      icon: cs.specialtyIcon ?? null,
      isPrimary: cs.isPrimary ?? false,
    }))

    // Find primary specialty
    const primarySpecialty = specialties.find((s) => s.isPrimary) ?? specialties[0] ?? null

    // Transform locations
    const locationsFormatted = locations.map((loc) => ({
      id: loc.id,
      city: loc.city ?? null,
      state: loc.state ?? null,
      country: loc.country,
      isHeadquarters: loc.isHeadquarters ?? false,
    }))

    // Check for claimed profile
    const [claimedProfile] = await db
      .select({
        id: schema.claimedProfile.id,
        tier: schema.claimedProfile.tier,
        verifiedAt: schema.claimedProfile.verifiedAt,
      })
      .from(schema.claimedProfile)
      .where(
        and(
          eq(schema.claimedProfile.contractorId, contractor.id),
          eq(schema.claimedProfile.status, 'active')
        )
      )
      .limit(1)

    // Get benefits if claimed
    let benefits: Array<{
      id: string
      icon: string
      title: string
      description: string
    }> = []
    if (claimedProfile) {
      const benefitsData = await db
        .select()
        .from(schema.contractorBenefit)
        .where(eq(schema.contractorBenefit.claimedProfileId, claimedProfile.id))
        .orderBy(asc(schema.contractorBenefit.sortOrder))

      benefits = benefitsData.map(b => ({
        id: b.id,
        icon: b.icon,
        title: b.title,
        description: b.description,
      }))
    }

    // Get programs if claimed
    let programs: Array<{
      id: string
      name: string
      category: string | null
      description: string | null
    }> = []
    if (claimedProfile) {
      const programsData = await db
        .select()
        .from(schema.contractorProgram)
        .where(eq(schema.contractorProgram.claimedProfileId, claimedProfile.id))
        .orderBy(asc(schema.contractorProgram.sortOrder))

      programs = programsData.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
      }))
    }

    // Get approved spotlight content if premium tier
    let spotlight = null
    if (claimedProfile && (claimedProfile.tier === 'premium' || claimedProfile.tier === 'enterprise')) {
      const [spotlightData] = await db
        .select()
        .from(schema.sponsoredContent)
        .where(
          and(
            eq(schema.sponsoredContent.claimedProfileId, claimedProfile.id),
            eq(schema.sponsoredContent.type, 'spotlight'),
            eq(schema.sponsoredContent.status, 'approved')
          )
        )
        .limit(1)

      if (spotlightData) {
        spotlight = {
          title: spotlightData.title,
          content: spotlightData.content,
          mediaUrl: spotlightData.mediaUrl,
          ctaText: spotlightData.ctaText,
          ctaUrl: spotlightData.ctaUrl,
        }
      }
    }

    // Get approved testimonials if premium tier
    let testimonials: Array<{
      id: string
      quote: string
      employeeName: string
      employeeTitle: string
      employeePhotoUrl: string | null
    }> = []
    if (claimedProfile && (claimedProfile.tier === 'premium' || claimedProfile.tier === 'enterprise')) {
      const testimonialsData = await db
        .select()
        .from(schema.contractorTestimonial)
        .where(
          and(
            eq(schema.contractorTestimonial.claimedProfileId, claimedProfile.id),
            eq(schema.contractorTestimonial.status, 'approved')
          )
        )

      testimonials = testimonialsData.map(t => ({
        id: t.id,
        quote: t.quote,
        employeeName: t.employeeName,
        employeeTitle: t.employeeTitle,
        employeePhotoUrl: t.employeePhotoUrl,
      }))
    }

    // Return contractor with related data
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
      // Claimed profile data
      claimedProfile: claimedProfile ? {
        tier: claimedProfile.tier,
        verifiedAt: claimedProfile.verifiedAt?.toISOString() ?? null,
      } : null,
      benefits,
      programs,
      spotlight,
      testimonials,
      createdAt: contractor.createdAt?.toISOString() ?? null,
      updatedAt: contractor.updatedAt?.toISOString() ?? null,
    }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch contractor: ${message}`,
    })
  }
})
