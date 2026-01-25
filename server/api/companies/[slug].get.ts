/**
 * @file Company detail API endpoint
 * @route GET /api/companies/[slug]
 * @description Returns company details with MOS matches
 *
 * Uses company_mos mappings (domain-based) for MOS relationships
 * This is the career intelligence approach - no job scraping required
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'

interface MosMatch {
  mosCode: string
  mosTitle: string
  branch: string
  strength: 'STRONG' | 'MEDIUM' | 'WEAK'
  typicalRoles: string[]
  typicalClearance: string | null
  confidence: string | null
}

interface CompanyStats {
  totalMosMatches: number
  strongMatches: number
  mediumMatches: number
  weakMatches: number
  clearanceLevels: string[]
  branches: string[]
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company slug is required',
    })
  }

  const db = getDb()

  try {
    // Get company by slug
    const [company] = await db
      .select()
      .from(schema.company)
      .where(eq(schema.company.slug, slug.toLowerCase()))
      .limit(1)

    if (!company) {
      throw createError({
        statusCode: 404,
        statusMessage: `Company "${slug}" not found`,
      })
    }

    // Get MOS matches for this company
    const mosMatches = await db
      .select({
        mosCode: schema.mosCode.code,
        mosTitle: schema.mosCode.name,
        branch: schema.mosCode.branch,
        strength: schema.companyMos.strength,
        typicalRoles: schema.companyMos.typicalRoles,
        typicalClearance: schema.companyMos.typicalClearance,
        confidence: schema.companyMos.confidence,
      })
      .from(schema.companyMos)
      .innerJoin(schema.mosCode, eq(schema.companyMos.mosId, schema.mosCode.id))
      .where(eq(schema.companyMos.companyId, company.id))
      .limit(100)

    // Calculate stats
    const stats: CompanyStats = {
      totalMosMatches: mosMatches.length,
      strongMatches: mosMatches.filter(m => m.strength === 'STRONG').length,
      mediumMatches: mosMatches.filter(m => m.strength === 'MEDIUM').length,
      weakMatches: mosMatches.filter(m => m.strength === 'WEAK').length,
      clearanceLevels: [...new Set(mosMatches.map(m => m.typicalClearance).filter(Boolean))] as string[],
      branches: [...new Set(mosMatches.map(m => m.branch))],
    }

    // Transform to snake_case for API compatibility
    return {
      id: company.id,
      slug: company.slug,
      name: company.name,
      summary: company.summary,
      description: company.description ?? null,
      logo_url: company.logoUrl ?? null,
      website_url: company.websiteUrl ?? null,
      careers_url: company.careersUrl ?? null,
      headquarters: company.headquarters ?? null,
      employee_count: company.employeeCount ?? null,
      founded_year: company.foundedYear ?? null,
      stock_symbol: company.stockSymbol ?? null,
      domains: company.domains ?? [],
      theaters: company.theaters ?? [],
      is_prime_contractor: company.isPrimeContractor ?? false,
      created_at: company.createdAt?.toISOString() ?? null,
      updated_at: company.updatedAt?.toISOString() ?? null,
      mosMatches: mosMatches.map(m => ({
        mosCode: m.mosCode,
        mosTitle: m.mosTitle,
        branch: m.branch,
        strength: (m.strength ?? 'MEDIUM') as 'STRONG' | 'MEDIUM' | 'WEAK',
        typicalRoles: m.typicalRoles ?? [],
        typicalClearance: m.typicalClearance,
        confidence: m.confidence,
      })) as MosMatch[],
      stats,
    }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch company: ${message}`,
    })
  }
})
