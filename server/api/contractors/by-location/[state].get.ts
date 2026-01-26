/**
 * @file Contractors by location API endpoint
 * @route GET /api/contractors/by-location/[state]
 * @description Returns contractors with offices in a specific state
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, asc, or, sql } from 'drizzle-orm'

// Map of state codes to full names
const stateNames: Record<string, string> = {
  'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas', 'ca': 'California',
  'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware', 'fl': 'Florida', 'ga': 'Georgia',
  'hi': 'Hawaii', 'id': 'Idaho', 'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa',
  'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
  'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi', 'mo': 'Missouri',
  'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey',
  'nm': 'New Mexico', 'ny': 'New York', 'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio',
  'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
  'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah', 'vt': 'Vermont',
  'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming',
  'dc': 'District of Columbia',
}

export default defineEventHandler(async (event) => {
  const stateParam = getRouterParam(event, 'state')

  if (!stateParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'State is required',
    })
  }

  const db = getDb()

  // Normalize state param (could be code like "va" or slug like "virginia")
  const stateSlug = stateParam.toLowerCase().replace(/\s+/g, '-')
  const stateCode = stateSlug.length === 2 ? stateSlug : null
  const stateName = stateCode 
    ? stateNames[stateCode] 
    : Object.values(stateNames).find(n => n.toLowerCase().replace(/\s+/g, '-') === stateSlug)

  if (!stateName) {
    throw createError({
      statusCode: 404,
      statusMessage: `State "${stateParam}" not found`,
    })
  }

  try {
    // Get contractors with locations in this state
    const contractorLocations = await db
      .select({
        contractorId: schema.contractorLocation.contractorId,
        city: schema.contractorLocation.city,
        isHeadquarters: schema.contractorLocation.isHeadquarters,
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
      .from(schema.contractorLocation)
      .innerJoin(
        schema.contractor,
        eq(schema.contractorLocation.contractorId, schema.contractor.id)
      )
      .where(
        or(
          sql`lower(${schema.contractorLocation.state}) = ${stateName.toLowerCase()}`,
          stateCode ? sql`lower(${schema.contractorLocation.state}) = ${stateCode.toLowerCase()}` : undefined
        )
      )
      .orderBy(asc(schema.contractor.defenseNewsRank))

    // Deduplicate contractors (may have multiple locations in same state)
    const seenContractors = new Set<string>()
    const uniqueContractors = contractorLocations
      .filter(cl => {
        if (seenContractors.has(cl.contractorId)) return false
        seenContractors.add(cl.contractorId)
        return true
      })
      .map(cl => ({
        ...cl.contractor,
        city: cl.city,
        isHeadquarters: cl.isHeadquarters,
      }))

    return {
      state: stateName,
      stateSlug,
      contractors: uniqueContractors,
      contractorCount: uniqueContractors.length,
    }
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch contractors: ${message}`,
    })
  }
})
