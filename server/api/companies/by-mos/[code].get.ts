/**
 * @file Companies by MOS API endpoint
 * @route GET /api/companies/by-mos/[code]
 * @description Returns companies that hire a specific MOS code (Drizzle-backed)
 *
 * Queries companyMos table directly - no dependency on jobs table
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, desc, sql } from 'drizzle-orm'

interface CompanyMosMatch {
  id: string
  slug: string
  name: string
  summary: string | null
  domains: string[]
  theaters: string[]
  mosMatch: {
    mosCode: string
    strength: 'STRONG' | 'MEDIUM' | 'WEAK'
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    typicalRoles: string[]
    typicalClearance: string | null
    source: string
  }
}

export default defineEventHandler(async (event) => {
  const mosCode = getRouterParam(event, 'code')?.toUpperCase()

  if (!mosCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'MOS code is required',
    })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 25, 50)

  const db = getDb()

  try {
    // First get the MOS code ID
    const [mos] = await db
      .select({ id: schema.mosCode.id, code: schema.mosCode.code })
      .from(schema.mosCode)
      .where(eq(schema.mosCode.code, mosCode))
      .limit(1)

    if (!mos) {
      // Return empty array if MOS not found (graceful degradation)
      return []
    }

    // Get companies with this MOS mapping
    const companiesWithMos = await db
      .select({
        company: schema.company,
        companyMos: schema.companyMos,
      })
      .from(schema.companyMos)
      .innerJoin(schema.company, eq(schema.company.id, schema.companyMos.companyId))
      .where(eq(schema.companyMos.mosId, mos.id))
      .orderBy(
        // Order by strength (STRONG first, then MEDIUM, then WEAK)
        sql`CASE 
          WHEN ${schema.companyMos.strength} = 'STRONG' THEN 1 
          WHEN ${schema.companyMos.strength} = 'MEDIUM' THEN 2 
          ELSE 3 
        END`,
        desc(schema.company.name)
      )
      .limit(limit)

    if (companiesWithMos.length === 0) {
      return []
    }

    // Transform to expected response format
    const companyMatches: CompanyMosMatch[] = companiesWithMos.map(({ company, companyMos }) => {
      // Map confidence score to confidence level
      const confidenceScore = parseFloat(companyMos.confidence || '0')
      const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 
        confidenceScore > 0.7 ? 'HIGH' : 
        confidenceScore > 0.4 ? 'MEDIUM' : 'LOW'

      return {
        id: company.id,
        slug: company.slug,
        name: company.name,
        summary: company.summary,
        domains: (company.domains as string[]) || [],
        theaters: (company.theaters as string[]) || [],
        mosMatch: {
          mosCode: mosCode,
          strength: (companyMos.strength as 'STRONG' | 'MEDIUM' | 'WEAK') || 'WEAK',
          confidence,
          typicalRoles: (companyMos.typicalRoles as string[]) || [],
          typicalClearance: companyMos.typicalClearance,
          source: companyMos.source || 'mapping',
        },
      }
    })

    return companyMatches
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch companies: ${message}`,
    })
  }
})
