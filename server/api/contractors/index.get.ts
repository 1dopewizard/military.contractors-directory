/**
 * @file Contractors list API endpoint
 * @route GET /api/contractors
 * @description Returns paginated list of contractors with filters and sorting
 *
 * Query params:
 * - q: search query (company name)
 * - specialty: filter by specialty slug
 * - location: filter by state name or slug
 * - sort: 'rank' | 'revenue' | 'name' (default: 'rank')
 * - limit: number of results (default: 20, max: 50)
 * - offset: pagination offset (default: 0)
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, and, like, desc, asc, sql, inArray } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Map of state slugs to full names for location filtering
const stateNames: Record<string, string> = {
  alabama: "Alabama",
  alaska: "Alaska",
  arizona: "Arizona",
  arkansas: "Arkansas",
  california: "California",
  colorado: "Colorado",
  connecticut: "Connecticut",
  delaware: "Delaware",
  florida: "Florida",
  georgia: "Georgia",
  hawaii: "Hawaii",
  idaho: "Idaho",
  illinois: "Illinois",
  indiana: "Indiana",
  iowa: "Iowa",
  kansas: "Kansas",
  kentucky: "Kentucky",
  louisiana: "Louisiana",
  maine: "Maine",
  maryland: "Maryland",
  massachusetts: "Massachusetts",
  michigan: "Michigan",
  minnesota: "Minnesota",
  mississippi: "Mississippi",
  missouri: "Missouri",
  montana: "Montana",
  nebraska: "Nebraska",
  nevada: "Nevada",
  "new-hampshire": "New Hampshire",
  "new-jersey": "New Jersey",
  "new-mexico": "New Mexico",
  "new-york": "New York",
  "north-carolina": "North Carolina",
  "north-dakota": "North Dakota",
  ohio: "Ohio",
  oklahoma: "Oklahoma",
  oregon: "Oregon",
  pennsylvania: "Pennsylvania",
  "rhode-island": "Rhode Island",
  "south-carolina": "South Carolina",
  "south-dakota": "South Dakota",
  tennessee: "Tennessee",
  texas: "Texas",
  utah: "Utah",
  vermont: "Vermont",
  virginia: "Virginia",
  washington: "Washington",
  "west-virginia": "West Virginia",
  wisconsin: "Wisconsin",
  wyoming: "Wyoming",
  "district-of-columbia": "District of Columbia",
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = ((query.q as string) || "").trim();
  const specialtySlug = query.specialty as string | undefined;
  const locationSlug = query.location as string | undefined;
  const sort = (query.sort as string) || "rank";
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Number(query.offset) || 0;

  const db = getDb();

  try {
    // Build WHERE conditions
    const whereConditions = [];

    // Search by company name
    if (q) {
      const searchPattern = `%${q}%`;
      whereConditions.push(like(schema.contractor.name, searchPattern));
    }

    // Filter by specialty - need to join with contractorSpecialty and specialty tables
    let specialtyFilterContractorIds: string[] | null = null;
    if (specialtySlug) {
      // First, find the specialty by slug
      const [specialtyRecord] = await db
        .select({ id: schema.specialty.id })
        .from(schema.specialty)
        .where(eq(schema.specialty.slug, specialtySlug))
        .limit(1);

      if (specialtyRecord) {
        // Get all contractor IDs that have this specialty
        const contractorSpecialties = await db
          .select({ contractorId: schema.contractorSpecialty.contractorId })
          .from(schema.contractorSpecialty)
          .where(
            eq(schema.contractorSpecialty.specialtyId, specialtyRecord.id),
          );

        specialtyFilterContractorIds = contractorSpecialties.map(
          (cs) => cs.contractorId,
        );

        // If no contractors have this specialty, return empty result
        if (specialtyFilterContractorIds.length === 0) {
          return {
            contractors: [],
            total: 0,
            limit,
            offset,
          };
        }
      } else {
        // Specialty not found, return empty result
        return {
          contractors: [],
          total: 0,
          limit,
          offset,
        };
      }
    }

    // Add specialty filter to WHERE conditions if applicable
    if (specialtyFilterContractorIds) {
      whereConditions.push(
        inArray(schema.contractor.id, specialtyFilterContractorIds),
      );
    }

    // Filter by location - need to join with contractorLocation table
    let locationFilterContractorIds: string[] | null = null;
    if (locationSlug) {
      const stateName = stateNames[locationSlug.toLowerCase()];
      if (stateName) {
        // Get all contractor IDs that have offices in this state
        const contractorLocations = await db
          .select({ contractorId: schema.contractorLocation.contractorId })
          .from(schema.contractorLocation)
          .where(
            sql`lower(${schema.contractorLocation.state}) = ${stateName.toLowerCase()}`,
          );

        locationFilterContractorIds = contractorLocations.map(
          (cl) => cl.contractorId,
        );

        // If no contractors in this location, return empty result
        if (locationFilterContractorIds.length === 0) {
          return {
            contractors: [],
            total: 0,
            limit,
            offset,
          };
        }
      } else {
        // Location not found, return empty result
        return {
          contractors: [],
          total: 0,
          limit,
          offset,
        };
      }
    }

    // Add location filter to WHERE conditions if applicable
    if (locationFilterContractorIds) {
      whereConditions.push(
        inArray(schema.contractor.id, locationFilterContractorIds),
      );
    }

    // Build ORDER BY based on sort parameter
    let orderBy;
    switch (sort) {
      case "revenue":
        // Sort by defense revenue descending, then by total revenue
        orderBy = [
          desc(schema.contractor.defenseRevenue),
          desc(schema.contractor.totalRevenue),
        ];
        break;
      case "name":
        orderBy = [asc(schema.contractor.name)];
        break;
      case "rank":
      default:
        // Sort by Defense News rank ascending (lower rank = higher priority)
        // Null ranks go to the end
        orderBy = [
          asc(schema.contractor.defenseNewsRank),
          asc(schema.contractor.name),
        ];
        break;
    }

    // Build the main query
    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get contractors with their primary specialty
    const contractors = await db
      .select({
        id: schema.contractor.id,
        slug: schema.contractor.slug,
        name: schema.contractor.name,
        description: schema.contractor.description,
        defenseNewsRank: schema.contractor.defenseNewsRank,
        country: schema.contractor.country,
        headquarters: schema.contractor.headquarters,
        founded: schema.contractor.founded,
        employeeCount: schema.contractor.employeeCount,
        website: schema.contractor.website,
        careersUrl: schema.contractor.careersUrl,
        linkedinUrl: schema.contractor.linkedinUrl,
        wikipediaUrl: schema.contractor.wikipediaUrl,
        stockTicker: schema.contractor.stockTicker,
        isPublic: schema.contractor.isPublic,
        totalRevenue: schema.contractor.totalRevenue,
        defenseRevenue: schema.contractor.defenseRevenue,
        defenseRevenuePercent: schema.contractor.defenseRevenuePercent,
        logoUrl: schema.contractor.logoUrl,
        createdAt: schema.contractor.createdAt,
        updatedAt: schema.contractor.updatedAt,
        // Get primary specialty via correlated subquery
        // Note: Using raw SQL table/column names because Drizzle's template interpolation
        // doesn't work correctly inside subqueries. This is the documented pattern for
        // scalar subqueries in select fields.
        primarySpecialtySlug: sql<string | null>`(
          SELECT s.slug
          FROM contractorSpecialty cs
          JOIN specialty s ON cs.specialtyId = s.id
          WHERE cs.contractorId = contractor.id AND cs.isPrimary = 1
          LIMIT 1
        )`.as("primarySpecialtySlug"),
        primarySpecialtyName: sql<string | null>`(
          SELECT s.name
          FROM contractorSpecialty cs
          JOIN specialty s ON cs.specialtyId = s.id
          WHERE cs.contractorId = contractor.id AND cs.isPrimary = 1
          LIMIT 1
        )`.as("primarySpecialtyName"),
      })
      .from(schema.contractor)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Count total results
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contractor)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Transform contractors to include specialty info
    const contractorsWithSpecialties = contractors.map((contractor) => ({
      id: contractor.id,
      slug: contractor.slug,
      name: contractor.name,
      description: contractor.description,
      defenseNewsRank: contractor.defenseNewsRank,
      country: contractor.country,
      headquarters: contractor.headquarters,
      founded: contractor.founded,
      employeeCount: contractor.employeeCount,
      website: contractor.website,
      careersUrl: contractor.careersUrl,
      linkedinUrl: contractor.linkedinUrl,
      wikipediaUrl: contractor.wikipediaUrl,
      stockTicker: contractor.stockTicker,
      isPublic: contractor.isPublic,
      totalRevenue: contractor.totalRevenue,
      defenseRevenue: contractor.defenseRevenue,
      defenseRevenuePercent: contractor.defenseRevenuePercent,
      logoUrl: contractor.logoUrl,
      primarySpecialty: contractor.primarySpecialtySlug
        ? {
            slug: contractor.primarySpecialtySlug,
            name: contractor.primarySpecialtyName,
          }
        : null,
      createdAt: contractor.createdAt,
      updatedAt: contractor.updatedAt,
    }));

    return {
      contractors: contractorsWithSpecialties,
      total,
      limit,
      offset,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch contractors: ${message}`,
    });
  }
});
