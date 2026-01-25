/**
 * @file Unified omnibar composable for intelligent search
 * @usage const { parseQuery, getResults, buildNavigationUrl } = useOmnibar()
 * @description Parses user queries to detect MOS codes, company names, clearance levels,
 * and intent keywords. Returns categorized results with context-aware navigation actions.
 * @dependencies useMosData, useCompanies, /api/search
 */

import type {
  ParsedQuery,
  OmnibarIntent,
  OmnibarResults,
  OmnibarMosResult,
  OmnibarCompanyResult,
  OmnibarActionResult,
  OmnibarNavigationFilters,
  MatchedCompany,
} from '@/app/types/omnibar.types'
import type { ClearanceLevel } from '@/app/types/community.types'
import type { MosSearchResult } from '@/app/types/mos.types'
import type { SearchResponse } from '@/app/types/search.types'
import { CLEARANCE_PATTERNS, INTENT_KEYWORDS } from '@/app/types/omnibar.types'

// ===========================================
// MOS Pattern Detection
// ===========================================

/**
 * Search behavior thresholds
 * - Always search MOS for numeric queries or short queries
 * - Start company search at 2 chars for better responsiveness  
 * - Queries that look like MOS codes get MOS-priority treatment
 */
const COMPANY_SEARCH_MIN_LENGTH = 2

/**
 * Determine if query looks primarily numeric (likely MOS)
 */
const isNumericQuery = (query: string): boolean => {
  return /^\d+$/.test(query)
}

/**
 * Determine if query looks like a word (likely company name)
 */
const isWordQuery = (query: string): boolean => {
  // 3+ consecutive letters suggests a word/company name
  return /^[a-zA-Z]{3,}/.test(query)
}

/**
 * Regular expression patterns for MOS code detection
 * Matches common military occupational specialty formats:
 * - Army: 11B, 25U, 35F, 68W, 35L, 25B, etc.
 * - Navy: IT, CTN, CTR, GM, etc.
 * - Air Force: 1D7X1, 3D0X2, etc.
 * - Marine: 0311, 0621, etc.
 */
const MOS_PATTERNS = [
  // Army MOS: 2-3 digits followed by optional letter (11B, 25U, 35F, 92Y)
  /^(\d{2,3}[A-Z]?)$/i,
  // Army with specialty: 25B1O, 35F10, etc.
  /^(\d{2}[A-Z]\d{1,2}[A-Z]?)$/i,
  // Navy ratings: 2-4 letters (IT, CTN, YN, LS, etc.)
  /^([A-Z]{2,4})$/i,
  // Air Force AFSC: 1D7X1, 3D0X2, etc.
  /^([0-9][A-Z][0-9X][A-Z]?[0-9]?)$/i,
  // Marine MOS: 4 digits (0311, 0621, etc.)
  /^(\d{4})$/i,
  // Partial MOS code (for prefix matching): single or double digit
  /^(\d{1,2})$/,
]

/**
 * Check if a query looks like a MOS code
 */
const looksLikeMosCode = (query: string): boolean => {
  const normalized = query.trim().toUpperCase()
  return MOS_PATTERNS.some(pattern => pattern.test(normalized))
}

/**
 * Extract potential MOS code from query
 * Returns the MOS portion and remaining query
 */
const extractMosFromQuery = (query: string): { mosCode?: string; remaining: string } => {
  const words = query.trim().split(/\s+/)
  
  for (const word of words) {
    if (looksLikeMosCode(word)) {
      const remaining = words.filter(w => w.toLowerCase() !== word.toLowerCase()).join(' ')
      return { mosCode: word.toUpperCase(), remaining }
    }
  }
  
  return { remaining: query }
}

// ===========================================
// Clearance Detection
// ===========================================

/**
 * Detect clearance level from query string
 * Returns the clearance level and query with clearance terms removed
 */
const detectClearance = (query: string): { clearance?: ClearanceLevel; remaining: string } => {
  const lowerQuery = query.toLowerCase()
  
  // Sort patterns by length (longest first) to match "ts/sci" before "ts"
  const sortedPatterns = Object.entries(CLEARANCE_PATTERNS)
    .sort(([a], [b]) => b.length - a.length)
  
  for (const [pattern, level] of sortedPatterns) {
    if (lowerQuery.includes(pattern)) {
      // Remove the clearance term from query
      const remaining = query.replace(new RegExp(pattern, 'gi'), '').trim()
      return { clearance: level, remaining }
    }
  }
  
  return { remaining: query }
}

// ===========================================
// Intent Detection
// ===========================================

/**
 * Detect user intent from query keywords
 * Returns the intent and query with intent terms removed
 */
const detectIntent = (query: string): { intent?: OmnibarIntent; remaining: string } => {
  const words = query.toLowerCase().split(/\s+/)
  
  for (const word of words) {
    if (word in INTENT_KEYWORDS) {
      const intent = INTENT_KEYWORDS[word]
      // Remove the intent keyword from query
      const remaining = words.filter(w => w !== word).join(' ')
      return { intent, remaining }
    }
  }
  
  return { remaining: query }
}

// ===========================================
// Composable
// ===========================================

export const useOmnibar = () => {
  const logger = useLogger('useOmnibar')
  const { searchMos } = useMosData()
  
  // Reactive state for results
  const isLoading = ref(false)
  const lastQuery = ref('')
  
  /**
   * Parse a query string to extract entities and intent
   * @param q - Raw search query from user
   * @returns ParsedQuery with detected MOS, company, clearance, intent, and remaining keywords
   */
  const parseQuery = (q: string): ParsedQuery => {
    let remaining = q.trim()
    
    const parsed: ParsedQuery = {
      raw: q,
      keywords: [],
    }
    
    if (!remaining) {
      return parsed
    }
    
    // 1. Extract MOS code (if present)
    const mosResult = extractMosFromQuery(remaining)
    if (mosResult.mosCode) {
      parsed.mosCode = mosResult.mosCode
      remaining = mosResult.remaining
      logger.debug({ mosCode: mosResult.mosCode }, 'Detected MOS code in query')
    }
    
    // 2. Detect clearance level
    const clearanceResult = detectClearance(remaining)
    if (clearanceResult.clearance) {
      parsed.clearance = clearanceResult.clearance
      remaining = clearanceResult.remaining
      logger.debug({ clearance: clearanceResult.clearance }, 'Detected clearance in query')
    }
    
    // 3. Detect intent
    const intentResult = detectIntent(remaining)
    if (intentResult.intent) {
      parsed.intent = intentResult.intent
      remaining = intentResult.remaining
      logger.debug({ intent: intentResult.intent }, 'Detected intent in query')
    }
    
    // 4. Remaining words become keywords
    const keywords = remaining.split(/\s+/).filter(w => w.length > 0)
    parsed.keywords = keywords
    
    return parsed
  }
  
  /**
   * Build a navigation URL based on intent and filters
   * @param intent - Target intent/page type
   * @param filters - Filters to apply as URL parameters
   * @returns URL string with encoded query parameters
   */
  const buildNavigationUrl = (
    intent: OmnibarIntent,
    filters: OmnibarNavigationFilters
  ): string => {
    const params = new URLSearchParams()
    
    // Add filters as query params
    if (filters.mos) {
      params.set('mos', filters.mos)
    }
    if (filters.company) {
      params.set('company', filters.company)
    }
    if (filters.clearance) {
      params.set('clearance', filters.clearance)
    }
    if (filters.q) {
      params.set('q', filters.q)
    }
    
    // Build URL based on intent
    const queryString = params.toString()
    const suffix = queryString ? `?${queryString}` : ''
    
    switch (intent) {
      case 'salaries':
        return `/salaries${suffix}`
      case 'interviews':
        return `/interviews${suffix}`
      case 'companies':
        return `/companies${suffix}`
      case 'search':
      default:
        return `/search${suffix}`
    }
  }
  
  /**
   * Create MOS result with navigation actions
   */
  const createMosResult = (
    mosResult: MosSearchResult,
    parsedQuery: ParsedQuery
  ): OmnibarMosResult => {
    const { mos } = mosResult
    const baseFilters: OmnibarNavigationFilters = {
      mos: mos.code,
      clearance: parsedQuery.clearance,
    }
    
    // Determine primary action based on intent
    const primaryIntent = parsedQuery.intent || 'search'
    
    const actions = [
      {
        label: 'Salaries',
        href: buildNavigationUrl('salaries', baseFilters),
        icon: 'mdi:currency-usd',
        primary: primaryIntent === 'salaries' || primaryIntent === 'search',
      },
      {
        label: 'Interviews',
        href: buildNavigationUrl('interviews', baseFilters),
        icon: 'mdi:comment-quote-outline',
        primary: primaryIntent === 'interviews',
      },
    ]
    
    // Move primary action to front
    actions.sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
    
    return {
      type: 'mos',
      id: `mos-${mos.id}`,
      label: mos.code,
      sublabel: mos.title,
      icon: 'mdi:shield-outline',
      mos,
      actions,
    }
  }
  
  /**
   * Create company result with navigation actions
   */
  const createCompanyResult = (
    company: MatchedCompany,
    parsedQuery: ParsedQuery
  ): OmnibarCompanyResult => {
    const baseFilters: OmnibarNavigationFilters = {
      company: company.slug,
      clearance: parsedQuery.clearance,
    }
    
    const primaryIntent = parsedQuery.intent || 'companies'
    
    const actions = [
      {
        label: 'View Company',
        href: `/companies/${company.slug}`,
        icon: 'mdi:office-building',
        primary: primaryIntent === 'companies' || primaryIntent === 'search',
      },
      {
        label: 'Salaries',
        href: buildNavigationUrl('salaries', baseFilters),
        icon: 'mdi:currency-usd',
        primary: primaryIntent === 'salaries',
      },
      {
        label: 'Interviews',
        href: buildNavigationUrl('interviews', baseFilters),
        icon: 'mdi:comment-quote-outline',
        primary: primaryIntent === 'interviews',
      },
    ]
    
    actions.sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
    
    return {
      type: 'company',
      id: `company-${company.id}`,
      label: company.name,
      icon: 'mdi:office-building',
      company,
      actions,
    }
  }
  
  /**
   * Create context-aware quick action results
   */
  const createActionResults = (parsedQuery: ParsedQuery): OmnibarActionResult[] => {
    const results: OmnibarActionResult[] = []
    const { intent, clearance, keywords, mosCode } = parsedQuery
    
    // If we have a clearance but no specific entities, suggest clearance-filtered searches
    if (clearance && !mosCode) {
      const clearanceLabel = clearance.replace(/_/g, '/')
      
      results.push({
        type: 'action',
        id: 'action-clearance-salaries',
        label: `${clearanceLabel} Salaries`,
        sublabel: `Browse salary reports requiring ${clearanceLabel}`,
        icon: 'mdi:currency-usd',
        actions: [
          {
            label: 'Browse',
            href: buildNavigationUrl('salaries', { clearance }),
            primary: true,
          },
        ],
      })
      
      results.push({
        type: 'action',
        id: 'action-clearance-interviews',
        label: `${clearanceLabel} Interviews`,
        sublabel: `Browse interview experiences requiring ${clearanceLabel}`,
        icon: 'mdi:comment-quote-outline',
        actions: [
          {
            label: 'Browse',
            href: buildNavigationUrl('interviews', { clearance }),
            primary: true,
          },
        ],
      })
    }
    
    // If we have keywords but no detected entities, suggest keyword searches
    if (keywords.length > 0 && !mosCode) {
      const queryString = keywords.join(' ')
      
      // Only show if there's no clear intent (otherwise MOS/company results will guide)
      if (!intent || intent === 'search') {
        results.push({
          type: 'action',
          id: 'action-search-companies',
          label: `Search "${queryString}"`,
          sublabel: 'Search all companies',
          icon: 'mdi:magnify',
          actions: [
            {
              label: 'Search',
              href: buildNavigationUrl('search', { q: queryString }),
              primary: true,
            },
          ],
        })
      }
    }
    
    // Intent-specific quick actions
    if (intent === 'salaries') {
      results.push({
        type: 'action',
        id: 'action-browse-salaries',
        label: 'Browse All Salaries',
        sublabel: 'View community salary reports',
        icon: 'mdi:chart-bar',
        actions: [
          {
            label: 'Browse',
            href: '/salaries',
            primary: true,
          },
        ],
      })
    }
    
    if (intent === 'interviews') {
      results.push({
        type: 'action',
        id: 'action-browse-interviews',
        label: 'Browse All Interviews',
        sublabel: 'View community interview experiences',
        icon: 'mdi:forum-outline',
        actions: [
          {
            label: 'Browse',
            href: '/interviews',
            primary: true,
          },
        ],
      })
    }
    
    return results
  }
  
  /**
   * Get categorized results for a search query
   * @param q - Search query string
   * @returns Promise<OmnibarResults> with categorized results
   */
  const getResults = async (q: string): Promise<OmnibarResults> => {
    const trimmedQuery = q.trim()
    lastQuery.value = trimmedQuery
    
    // Parse the query first
    const parsed = parseQuery(trimmedQuery)
    
    const results: OmnibarResults = {
      query: parsed,
      mosResults: [],
      companyResults: [],
      actionResults: [],
      isLoading: true,
    }
    
    if (!trimmedQuery) {
      results.isLoading = false
      return results
    }
    
    isLoading.value = true
    
    try {
      // Parallel fetch for MOS and company results
      const fetchPromises: Promise<void>[] = []
      
      // Determine search strategy based on query characteristics
      const isNumeric = isNumericQuery(trimmedQuery)
      const isWord = isWordQuery(trimmedQuery)
      const isMosPattern = parsed.mosCode || looksLikeMosCode(trimmedQuery)
      
      // MOS search conditions:
      // - Always for numeric queries (likely MOS prefix like "2", "25")
      // - Always for detected MOS patterns
      // - For short queries under 4 chars (could be MOS or abbreviation)
      // - For non-word queries (mixed alphanumeric like "25B")
      const shouldSearchMos = 
        isNumeric || 
        isMosPattern || 
        trimmedQuery.length < 4 ||
        !isWord

      if (shouldSearchMos) {
        const mosLimit = isNumeric || isMosPattern ? 8 : 4 // More results for likely MOS queries
        const mosPromise = searchMos(parsed.mosCode || trimmedQuery, mosLimit)
          .then((mosResults) => {
            results.mosResults = mosResults.map(mr => createMosResult(mr, parsed))
            logger.debug({ count: results.mosResults.length }, 'MOS results fetched')
          })
          .catch((error) => {
            logger.error({ error }, 'Failed to fetch MOS results')
          })
        fetchPromises.push(mosPromise)
      }
      
      // Company search conditions:
      // - Query is 2+ chars AND
      // - Query looks like a word/name OR query is 4+ chars (catch abbreviations)
      // - NOT a pure numeric query (those are definitely MOS)
      const shouldSearchCompanies =
        trimmedQuery.length >= COMPANY_SEARCH_MIN_LENGTH &&
        !isNumeric &&
        (isWord || trimmedQuery.length >= 4)
        
      if (shouldSearchCompanies) {
        const companySearchQuery = parsed.keywords.join(' ') || trimmedQuery
        
        const companyPromise = $fetch<SearchResponse>('/api/search', {
          query: {
            q: companySearchQuery,
            limit: 5,
            offset: 0,
          },
        })
          .then((response) => {
            results.companyResults = response.company_results.map(company =>
              createCompanyResult(
                {
                  id: company.company_id,
                  slug: company.slug,
                  name: company.name,
                },
                parsed
              )
            )
            logger.debug({ count: results.companyResults.length }, 'Company results fetched')
          })
          .catch((error) => {
            logger.error({ error }, 'Failed to fetch company results')
          })
        fetchPromises.push(companyPromise)
      }
      
      // Wait for all fetches to complete
      await Promise.all(fetchPromises)
      
      // Generate action results based on parsed query context
      results.actionResults = createActionResults(parsed)
      
    } catch (error) {
      logger.error({ error, query: trimmedQuery }, 'Omnibar search failed')
    } finally {
      isLoading.value = false
      results.isLoading = false
    }
    
    return results
  }
  
  /**
   * Get the primary navigation URL for a parsed query
   * Used when user presses Enter without selecting a specific result
   */
  const getPrimaryNavigationUrl = (parsed: ParsedQuery): string => {
    const filters: OmnibarNavigationFilters = {
      mos: parsed.mosCode,
      clearance: parsed.clearance,
      q: parsed.keywords.length > 0 ? parsed.keywords.join(' ') : undefined,
    }
    
    // Determine intent, defaulting to search
    const intent = parsed.intent || 'search'
    
    // If we have a MOS code, go to the appropriate page with MOS filter
    // Default to salaries when no specific intent (MOS detail pages live in mos.directory)
    if (parsed.mosCode) {
      if (intent === 'interviews') {
        return buildNavigationUrl('interviews', filters)
      }
      // Default: go to salaries filtered by MOS
      return buildNavigationUrl('salaries', filters)
    }
    
    // If we have a clearance with intent, go to filtered page
    if (parsed.clearance && (intent === 'salaries' || intent === 'interviews')) {
      return buildNavigationUrl(intent, filters)
    }
    
    // Otherwise, go to search page with query
    return buildNavigationUrl(intent, { q: parsed.raw })
  }
  
  return {
    // Core parsing functions
    parseQuery,
    buildNavigationUrl,
    getPrimaryNavigationUrl,
    
    // Results fetching
    getResults,
    
    // State
    isLoading: readonly(isLoading),
    lastQuery: readonly(lastQuery),
    
    // Utility functions (exported for testing)
    looksLikeMosCode,
  }
}
