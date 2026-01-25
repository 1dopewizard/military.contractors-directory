/**
 * @file Specialties list API endpoint
 * @route GET /api/specialties
 * @description Returns list of all specialties with optional contractor counts
 *
 * Query params:
 * - includeCounts: boolean - include contractor count per specialty (default: false)
 */

import { getDb, schema } from '@/server/utils/db'
import { asc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeCounts = query.includeCounts === 'true' || query.includeCounts === true

  const db = getDb()

  try {
    if (includeCounts) {
      // Get specialties with contractor counts
      const specialties = await db
        .select({
          id: schema.specialty.id,
          slug: schema.specialty.slug,
          name: schema.specialty.name,
          description: schema.specialty.description,
          icon: schema.specialty.icon,
          contractorCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${schema.contractorSpecialty}
            WHERE ${schema.contractorSpecialty.specialtyId} = ${schema.specialty.id}
          )`.as('contractorCount'),
          createdAt: schema.specialty.createdAt,
          updatedAt: schema.specialty.updatedAt,
        })
        .from(schema.specialty)
        .orderBy(asc(schema.specialty.name))

      return {
        specialties: specialties.map((specialty) => ({
          id: specialty.id,
          slug: specialty.slug,
          name: specialty.name,
          description: specialty.description,
          icon: specialty.icon,
          contractorCount: specialty.contractorCount,
          createdAt: specialty.createdAt,
          updatedAt: specialty.updatedAt,
        })),
      }
    } else {
      // Simple list without counts
      const specialties = await db
        .select({
          id: schema.specialty.id,
          slug: schema.specialty.slug,
          name: schema.specialty.name,
          description: schema.specialty.description,
          icon: schema.specialty.icon,
          createdAt: schema.specialty.createdAt,
          updatedAt: schema.specialty.updatedAt,
        })
        .from(schema.specialty)
        .orderBy(asc(schema.specialty.name))

      return {
        specialties: specialties.map((specialty) => ({
          id: specialty.id,
          slug: specialty.slug,
          name: specialty.name,
          description: specialty.description,
          icon: specialty.icon,
          createdAt: specialty.createdAt,
          updatedAt: specialty.updatedAt,
        })),
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch specialties: ${message}`,
    })
  }
})
