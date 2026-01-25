/**
 * @file Company data composable (API-backed)
 * @description Provides company atlas helpers backed by server API routes
 */

import type {
  Company,
  CompanyFilters,
  CompaniesForMosOptions,
} from '@/app/types/company.types'
import { useLogger } from '@/app/composables/useLogger'

export const useCompanies = () => {
  const logger = useLogger('useCompanies')
  
  logger.info('useCompanies composable initialized (API-backed)')

  // Shared state for all companies (cached)
  const allCompanies = useState<Company[]>('all-companies', () => [])

  const getAllCompanies = async (): Promise<Company[]> => {
    logger.debug('getAllCompanies called')
    
    // Return cached if available
    if (allCompanies.value.length > 0) {
      logger.debug({ count: allCompanies.value.length }, 'Returning cached companies')
      return allCompanies.value
    }

    try {
      const data = await $fetch<Company[]>('/api/companies', {
        query: { limit: 500 }
      })
      
      // Sort by name
      const companies = (data || []).sort((a: Company, b: Company) => 
        a.name.localeCompare(b.name)
      )
      
      // Update state
      allCompanies.value = companies
      
      logger.debug({ count: companies.length }, 'Companies fetched and cached')
      return companies
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to fetch companies')
      return []
    }
  }

  const getCompanyById = async (id: string): Promise<Company | undefined> => {
    logger.debug({ id }, 'getCompanyById called')
    
    try {
      // Check cache first
      const cached = allCompanies.value.find(c => c.id === id)
      if (cached) {
        return cached
      }

      // Fetch from API using slug (assuming id might be a slug)
      const data = await $fetch<Company>(`/api/companies/${id}`)
      
      if (!data) {
        logger.warn({ id }, 'Company not found for ID')
        return undefined
      }

      return data
    } catch (error: unknown) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 404) {
        logger.warn({ id }, 'Company not found for ID')
        return undefined
      }
      
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, id }, 'Failed to fetch company by ID')
      return undefined
    }
  }

  const getCompanyBySlug = async (slug: string): Promise<Company | undefined> => {
    logger.debug({ slug }, 'getCompanyBySlug called')
    
    try {
      // Use the API endpoint that aggregates MOS matches from company data
      const data = await $fetch<Company>(`/api/companies/${slug.toLowerCase()}`)
      
      if (!data) {
        logger.warn({ slug }, 'Company not found for slug')
        return undefined
      }

      logger.debug({ 
        slug, 
        mosMatchCount: data.mosMatches?.length || 0,
        totalMosMatches: data.stats?.totalMosMatches || 0 
      }, 'Company fetched with MOS matches')

      return data
    } catch (error: unknown) {
      // Handle 404 gracefully
      const err = error as { statusCode?: number; message?: string }
      if (err?.statusCode === 404) {
        logger.warn({ slug }, 'Company not found for slug')
        return undefined
      }
      
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, slug }, 'Failed to fetch company by slug')
      return undefined
    }
  }

  const searchCompanies = async (query: string, limit = 25): Promise<Company[]> => {
    const trimmed = query.trim()
    if (!trimmed) {
      logger.debug('searchCompanies called with empty query, returning []')
      return []
    }

    logger.debug({ query: trimmed, limit }, 'Searching companies')
    
    try {
      // Use the search API endpoint
      const response = await $fetch<{ company_results: Array<{ slug: string; name: string; summary: string; domains: string[]; theaters: string[] }> }>('/api/search', {
        query: { q: trimmed, limit }
      })
      
      // Transform search results to Company type
      const companies: Company[] = (response.company_results || []).map(r => ({
        id: r.slug, // Use slug as ID for now
        slug: r.slug,
        name: r.name,
        summary: r.summary,
        domains: r.domains || [],
        theaters: r.theaters || [],
        mosMatches: [],
      }))

      logger.debug({ query: trimmed, resultCount: companies.length }, 'searchCompanies completed')
      return companies
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, 'Failed to search companies')
      return []
    }
  }

  const filterCompanies = async (filters: CompanyFilters = {}): Promise<Company[]> => {
    logger.debug({ filters }, 'filterCompanies called')

    const { searchQuery, theater, domain } = filters
    
    try {
      // Fetch companies with optional search query
      let companies: Company[]
      
      if (searchQuery && searchQuery.trim().length > 0) {
        companies = await searchCompanies(searchQuery, 500)
      } else {
        companies = await getAllCompanies()
      }
      
      // Apply client-side filters for theater and domain (array contains)
      let filtered = companies
      
      if (theater && theater.trim().length > 0) {
        filtered = filtered.filter(c => c.theaters.includes(theater))
      }
      
      if (domain && domain.trim().length > 0) {
        filtered = filtered.filter(c => c.domains.includes(domain))
      }
      
      // Sort alphabetically by name
      filtered.sort((a: Company, b: Company) => a.name.localeCompare(b.name))

      logger.debug({ filters, resultCount: filtered.length }, 'filterCompanies completed')
      return filtered
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, filters }, 'Failed to filter companies')
      return []
    }
  }

  const getCompaniesForMos = async (
    mosCode: string,
    options: CompaniesForMosOptions = {}
  ): Promise<Company[]> => {
    const { limit = 25 } = options
    const normalizedMos = mosCode.trim().toUpperCase()

    logger.debug({ mosCode: normalizedMos, options, limit }, 'getCompaniesForMos called')

    try {
      // Use the companies by MOS API endpoint
      const data = await $fetch<Array<{
        id: string
        slug: string
        name: string
        summary: string | null
        domains: string[]
        theaters: string[]
        mosMatch: {
          mosCode: string
          strength: string
          confidence: string
          typicalRoles: string[]
          typicalClearance: string | null
        }
      }>>(`/api/companies/by-mos/${normalizedMos}`, {
        query: { limit }
      })

      // Transform to Company type
      const companies: Company[] = (data || []).map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        summary: c.summary || '',
        domains: c.domains || [],
        theaters: c.theaters || [],
        mosMatches: c.mosMatch ? [{
          mosCode: c.mosMatch.mosCode,
          mosTitle: '', // Not provided by API
          branch: '', // Not provided by API
          strength: c.mosMatch.strength as 'STRONG' | 'MEDIUM' | 'WEAK',
          typicalRoles: c.mosMatch.typicalRoles,
          typicalClearance: c.mosMatch.typicalClearance,
          confidence: c.mosMatch.confidence,
        }] : [],
      }))

      logger.debug({ mosCode: normalizedMos, resultCount: companies.length }, 'getCompaniesForMos completed')
      return companies
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message, mosCode: normalizedMos }, 'Failed to get companies for MOS')
      return []
    }
  }

  return {
    allCompanies,
    getAllCompanies,
    getCompanyById,
    getCompanyBySlug,
    searchCompanies,
    filterCompanies,
    getCompaniesForMos
  }
}
