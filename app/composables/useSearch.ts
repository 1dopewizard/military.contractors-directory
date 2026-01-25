/**
 * @file Search composable for SERP functionality
 * @usage import { useSearch } from '@/composables/useSearch'
 * @description Provides reactive search state and URL sync - returns companies for MOS queries
 */

import type {
  SearchResponse,
  CompanySearchResult,
  SearchResult,
  ResolvedMos,
  SearchQueryType,
  SearchResultType,
  TheaterFilter,
  DomainFilter,
  SearchSort,
  SearchFilters,
} from '@/app/types/search.types'

export type SearchErrorType = 'network' | 'timeout' | 'server' | 'unknown'

export interface SearchError {
  type: SearchErrorType
  message: string
  originalError?: Error
}

export interface UseSearchOptions {
  defaultLimit?: number
}

/**
 * Detect the type of error for user-friendly messaging
 */
const detectErrorType = (err: unknown): SearchErrorType => {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    const name = err.name.toLowerCase()
    
    // Network errors (no internet, DNS failure, connection refused)
    if (
      name === 'typeerror' && msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('net::') ||
      msg.includes('dns') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('offline')
    ) {
      return 'network'
    }
    
    // Timeout errors
    if (
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      name.includes('timeout') ||
      msg.includes('aborted')
    ) {
      return 'timeout'
    }
    
    // Server errors (5xx)
    if (
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('server error') ||
      msg.includes('internal error')
    ) {
      return 'server'
    }
  }
  
  return 'unknown'
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const logger = useLogger('useSearch')
  const route = useRoute()
  const router = useRouter()

  const defaultLimit = options.defaultLimit || 20

  // Reactive state
  const query = ref('')
  const queryType = ref<SearchQueryType | null>(null)
  const resultType = ref<SearchResultType | null>(null)
  const resolvedMos = ref<ResolvedMos | null>(null)
  const mosVariants = ref<ResolvedMos[]>([])
  const companyResults = ref<CompanySearchResult[]>([])
  const results = ref<SearchResult[]>([]) // Legacy, kept for compatibility
  const total = ref(0)
  const offset = ref(0)
  const limit = ref(defaultLimit)
  const hasMore = ref(false)
  const message = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<SearchError | null>(null)

  // Filters
  const theater = ref<TheaterFilter>('ANY')
  const domain = ref<DomainFilter>('ANY')
  const sort = ref<SearchSort>('best')
  const selectedBranch = ref<string>('')

  // Initialize from URL params
  const initFromUrl = () => {
    const q = route.query.q as string
    const thr = route.query.theater as TheaterFilter
    const dom = route.query.domain as DomainFilter
    const srt = route.query.sort as SearchSort
    const br = route.query.branch as string
    const pg = Number(route.query.page) || 1

    if (q) query.value = q
    if (thr && ['ANY', 'CENTCOM', 'EUCOM', 'INDOPACOM', 'AFRICOM', 'SOUTHCOM'].includes(thr)) theater.value = thr
    if (dom && ['ANY', 'IT', 'Intelligence', 'Cyber', 'Logistics', 'Engineering', 'Medical', 'Aviation', 'Security', 'Base Operations'].includes(dom)) domain.value = dom
    if (srt && ['best', 'name', 'relevance'].includes(srt)) sort.value = srt
    if (br) selectedBranch.value = br
    offset.value = (pg - 1) * limit.value
  }

  // Update URL with current state
  const updateUrl = () => {
    const newQuery: Record<string, string> = {}

    if (query.value) newQuery.q = query.value
    if (theater.value !== 'ANY') newQuery.theater = theater.value
    if (domain.value !== 'ANY') newQuery.domain = domain.value
    if (sort.value !== 'best') newQuery.sort = sort.value
    if (selectedBranch.value) newQuery.branch = selectedBranch.value
    if (offset.value > 0) newQuery.page = String(Math.floor(offset.value / limit.value) + 1)

    router.replace({ query: newQuery })
  }

  // Perform search (empty query triggers browse mode)
  const search = async (searchQuery?: string, filters?: SearchFilters) => {
    const q = searchQuery !== undefined ? searchQuery : query.value

    query.value = q
    if (filters?.theater) theater.value = filters.theater
    if (filters?.domain) domain.value = filters.domain
    if (filters?.sort) sort.value = filters.sort

    isLoading.value = true
    error.value = null

    logger.debug({ query: q, theater: theater.value, domain: domain.value, sort: sort.value, branch: selectedBranch.value }, 'Executing search')

    try {
      const response = await $fetch<SearchResponse>('/api/search', {
        query: {
          q,
          theater: theater.value,
          domain: domain.value,
          sort: sort.value,
          branch: selectedBranch.value || undefined,
          limit: limit.value,
          offset: offset.value,
        },
      })

      queryType.value = response.query_type
      resultType.value = response.result_type
      resolvedMos.value = response.resolved_mos
      mosVariants.value = response.mos_variants || []
      companyResults.value = response.company_results
      results.value = response.results // Legacy field
      total.value = response.pagination.total
      hasMore.value = response.pagination.has_more
      message.value = response.message || null

      logger.info({ 
        query: q, 
        queryType: response.query_type,
        resultType: response.result_type,
        companyCount: response.company_results.length,
        total: response.pagination.total,
        variantCount: mosVariants.value.length,
      }, 'Search completed')

      updateUrl()
    } catch (err) {
      const errorType = detectErrorType(err)
      logger.error({ error: err, query: q, errorType }, 'Search failed')
      
      error.value = {
        type: errorType,
        message: err instanceof Error ? err.message : 'Search failed',
        originalError: err instanceof Error ? err : undefined,
      }
      companyResults.value = []
      results.value = []
      total.value = 0
      mosVariants.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Load more results
  const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return

    offset.value += limit.value
    await search()
  }

  // Go to specific page
  const goToPage = async (page: number) => {
    offset.value = (page - 1) * limit.value
    await search()
  }

  // Reset filters and search again
  const resetFilters = async () => {
    theater.value = 'ANY'
    domain.value = 'ANY'
    sort.value = 'best'
    offset.value = 0
    await search()
  }

  // Apply filter and re-search
  const applyFilter = async (filterType: 'theater' | 'domain' | 'sort', value: string) => {
    offset.value = 0 // Reset pagination when filter changes

    if (filterType === 'theater') {
      theater.value = value as TheaterFilter
    } else if (filterType === 'domain') {
      domain.value = value as DomainFilter
    } else if (filterType === 'sort') {
      sort.value = value as SearchSort
    }

    await search()
  }

  // Select a specific branch when MOS code exists in multiple branches
  const selectBranch = async (branch: string) => {
    selectedBranch.value = branch
    offset.value = 0 // Reset pagination when branch changes
    await search()
  }

  // Computed values
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasResults = computed(() => companyResults.value.length > 0)
  // isEmpty is true when a search was performed (queryType exists) but returned no results
  const isEmpty = computed(() => !isLoading.value && !hasResults.value && queryType.value !== null)
  // Track if we're in browse mode (empty query shows all companies)
  const isBrowseMode = computed(() => queryType.value === 'BROWSE')
  const hasActiveFilters = computed(() => 
    theater.value !== 'ANY' ||
    domain.value !== 'ANY' || 
    sort.value !== 'best'
  )

  return {
    // State
    query,
    queryType,
    resultType,
    resolvedMos,
    mosVariants,
    companyResults,
    results, // Legacy
    total,
    offset,
    limit,
    hasMore,
    message,
    isLoading,
    error,
    // Filters
    theater,
    domain,
    sort,
    selectedBranch,
    // Computed
    currentPage,
    totalPages,
    hasResults,
    isEmpty,
    isBrowseMode,
    hasActiveFilters,
    // Methods
    initFromUrl,
    search,
    loadMore,
    goToPage,
    resetFilters,
    applyFilter,
    selectBranch,
  }
}
