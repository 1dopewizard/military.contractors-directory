/**
 * @file GET /api/search
 * @description MOS-aware search endpoint - returns companies that hire matching MOS codes (Drizzle-backed)
 * Career intelligence platform: "Discover who hires your MOS"
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, or, like, desc, asc, sql, inArray } from 'drizzle-orm'
import type {
  SearchResponse,
  TheaterFilter,
  DomainFilter,
  SearchSort,
  ResolvedMos,
  CompanySearchResult,
  SearchResult,
  SearchQueryType,
  SearchResultType,
} from '@/app/types/search.types'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()

  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = Number(query.offset) || 0
  const theater = (query.theater as TheaterFilter) || 'ANY'
  const domain = (query.domain as DomainFilter) || 'ANY'
  const sort = (query.sort as SearchSort) || 'best'
  const branch = (query.branch as string || '').trim()

  const db = getDb()

  try {
    // Determine query type and resolve MOS if applicable
    let queryType: SearchQueryType = 'BROWSE'
    let resultType: SearchResultType = 'companies'
    let resolvedMos: ResolvedMos | null = null
    let mosVariants: ResolvedMos[] = []
    let matchingMosIds: string[] = []

    if (q) {
      // Check if query matches a MOS code pattern (e.g., "11B", "25B", "0311", "IT", "1D7X1")
      // Patterns: Army (11B, 25B1O), Navy (IT, CTN), Air Force (1D7X1), Marine (0311)
      const mosPattern = /^(\d{2,3}[A-Z]?|\d{2}[A-Z]\d{1,2}[A-Z]?|[A-Z]{2,4}|[0-9][A-Z][0-9X][A-Z]?[0-9]?|\d{4})$/i
      const isMosQuery = mosPattern.test(q)

      if (isMosQuery) {
        // Try to find matching MOS codes
        const normalizedQuery = q.toUpperCase()

        let mosCodes = await db
          .select()
          .from(schema.mosCode)
          .where(eq(schema.mosCode.code, normalizedQuery))
          .limit(10)

        if (mosCodes.length === 0) {
          mosCodes = await db
            .select()
            .from(schema.mosCode)
            .where(like(schema.mosCode.code, `${normalizedQuery}%`))
            .limit(10)
        }

        if (mosCodes.length > 0) {
          queryType = 'MOS'
          matchingMosIds = mosCodes.map(m => m.id)

          // Build resolved MOS for the first match
          const primaryMos = mosCodes[0]
          
          // Count companies that hire this MOS
          const [companyCount] = await db
            .select({ count: sql<number>`count(DISTINCT ${schema.companyMos.companyId})` })
            .from(schema.companyMos)
            .where(eq(schema.companyMos.mosId, primaryMos.id))

          const isItCyber = (primaryMos.mosCategory || '').toLowerCase().includes('cyber') ||
            (primaryMos.mosCategory || '').toLowerCase().includes('information technology') ||
            (primaryMos.missionDomains as string[] || []).some(d => 
              d.toLowerCase().includes('cyber') || d.toLowerCase().includes('it')
            )

          resolvedMos = {
            code: primaryMos.code,
            title: primaryMos.name,
            branch: primaryMos.branch,
            category: primaryMos.mosCategory,
            description: primaryMos.summarizedDescription || primaryMos.description,
            core_skills: (primaryMos.coreSkills as string[]) || [],
            common_certs: (primaryMos.commonCerts as string[]) || [],
            clearance_profile: primaryMos.clearanceProfile,
            company_count: companyCount?.count ?? 0,
            is_it_cyber: isItCyber,
          }

          // Build variants if multiple branches have same MOS code
          if (mosCodes.length > 1) {
            mosVariants = mosCodes.map(m => ({
              code: m.code,
              title: m.name,
              branch: m.branch,
              category: m.mosCategory,
              description: m.summarizedDescription || m.description,
              core_skills: (m.coreSkills as string[]) || [],
              common_certs: (m.commonCerts as string[]) || [],
              clearance_profile: m.clearanceProfile,
              company_count: 0, // Would need additional queries
              is_it_cyber: false,
            }))
          }
        } else {
          queryType = 'FREE_TEXT'
        }
      } else {
        queryType = 'FREE_TEXT'
      }
    }

    // Build company search query
    let companyResults: CompanySearchResult[] = []

    if (queryType === 'MOS' && matchingMosIds.length > 0) {
      // Get companies that hire this MOS
      const companiesWithMos = await db
        .select({
          company: schema.company,
          companyMos: schema.companyMos,
        })
        .from(schema.companyMos)
        .innerJoin(schema.company, eq(schema.company.id, schema.companyMos.companyId))
        .where(inArray(schema.companyMos.mosId, matchingMosIds))
        .orderBy(
          sql`CASE 
            WHEN ${schema.companyMos.strength} = 'STRONG' THEN 1 
            WHEN ${schema.companyMos.strength} = 'MEDIUM' THEN 2 
            ELSE 3 
          END`,
          asc(schema.company.name)
        )
        .limit(limit)
        .offset(offset)

      companyResults = companiesWithMos.map(({ company, companyMos }, index) => {
        const confidenceScore = parseFloat(companyMos.confidence || '0')
        const confidence = confidenceScore > 0.7 ? 'HIGH' : confidenceScore > 0.4 ? 'MEDIUM' : 'LOW'

        return {
          company_id: company.id,
          rank: offset + index + 1,
          slug: company.slug,
          name: company.name,
          summary: company.summary || '',
          domains: (company.domains as string[]) || [],
          theaters: (company.theaters as string[]) || [],
          careers_url: company.careersUrl,
          logo_url: company.logoUrl,
          is_prime_contractor: company.isPrimeContractor ?? false,
          mos_match: {
            mos_code: resolvedMos?.code || q.toUpperCase(),
            strength: (companyMos.strength as 'STRONG' | 'MEDIUM' | 'WEAK') || 'WEAK',
            confidence: confidence as 'HIGH' | 'MEDIUM' | 'LOW',
            typical_roles: (companyMos.typicalRoles as string[]) || [],
            typical_clearance: companyMos.typicalClearance,
            source: companyMos.source || 'mapping',
          },
        }
      })
    } else if (queryType === 'FREE_TEXT' || queryType === 'BROWSE') {
      // Text search across companies
      const conditions = []
      
      if (q) {
        const searchPattern = `%${q}%`
        conditions.push(
          or(
            like(schema.company.name, searchPattern),
            like(schema.company.slug, searchPattern),
            like(schema.company.summary, searchPattern),
            like(schema.company.description, searchPattern),
            // Search aliases JSON array
            sql`EXISTS (SELECT 1 FROM json_each(${schema.company.aliases}) WHERE json_each.value LIKE ${searchPattern})`
          )!
        )
      }

      // Apply filters
      if (theater !== 'ANY') {
        conditions.push(sql`json_extract(${schema.company.theaters}, '$') LIKE ${'%' + theater + '%'}`)
      }
      if (domain !== 'ANY') {
        conditions.push(sql`json_extract(${schema.company.domains}, '$') LIKE ${'%' + domain + '%'}`)
      }

      const companies = await db
        .select()
        .from(schema.company)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          // Prioritize: exact name > name prefix > alias match > other matches
          q ? sql`CASE 
            WHEN LOWER(${schema.company.name}) = LOWER(${q}) THEN 0
            WHEN LOWER(${schema.company.name}) LIKE LOWER(${q + '%'}) THEN 1
            WHEN LOWER(${schema.company.slug}) = LOWER(${q}) THEN 2
            WHEN EXISTS (SELECT 1 FROM json_each(${schema.company.aliases}) WHERE LOWER(json_each.value) = LOWER(${q})) THEN 3
            WHEN EXISTS (SELECT 1 FROM json_each(${schema.company.aliases}) WHERE LOWER(json_each.value) LIKE LOWER(${q + '%'})) THEN 4
            ELSE 5
          END` : sql`0`,
          sort === 'name' ? asc(schema.company.name) : desc(schema.company.isPrimeContractor)
        )
        .limit(limit)
        .offset(offset)

      companyResults = companies.map((company, index) => ({
        company_id: company.id,
        rank: offset + index + 1,
        slug: company.slug,
        name: company.name,
        summary: company.summary || '',
        domains: (company.domains as string[]) || [],
        theaters: (company.theaters as string[]) || [],
        careers_url: company.careersUrl,
        logo_url: company.logoUrl,
        is_prime_contractor: company.isPrimeContractor ?? false,
        mos_match: null,
      }))
    }

    // Count total results
    let totalCount = companyResults.length
    if (queryType === 'MOS' && matchingMosIds.length > 0) {
      const [countResult] = await db
        .select({ count: sql<number>`count(DISTINCT ${schema.companyMos.companyId})` })
        .from(schema.companyMos)
        .where(inArray(schema.companyMos.mosId, matchingMosIds))
      totalCount = countResult?.count ?? 0
    }

    const response: SearchResponse = {
      query: q,
      query_type: queryType,
      result_type: resultType,
      resolved_mos: resolvedMos,
      mos_variants: mosVariants.length > 1 ? mosVariants : undefined,
      company_results: companyResults,
      results: [], // Legacy job results - empty for company searches
      pagination: {
        limit,
        offset,
        total: totalCount,
        has_more: offset + limit < totalCount,
      },
      message: companyResults.length === 0 && q 
        ? `No companies found for "${q}". Try a different search term.`
        : undefined,
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Search error: ${message}`,
    })
  }
})
