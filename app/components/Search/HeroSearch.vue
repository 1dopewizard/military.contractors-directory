<!--
  @file Hero MOS/AFSC search component with inline results
  @usage <HeroSearch />
  @description Large prominent search input with inline page results
  - Short alphanumeric queries (≤5 chars) → MOS code results
  - Longer/keyword queries (>5 chars) → Job results from vector search
-->

<script setup lang="ts">
import type { MosSearchResult } from '@/app/types/mos.types'
import type { CompanySearchResult, SearchResponse } from '@/app/types/search.types'

const logger = useLogger('HeroSearch')
const router = useRouter()
const { searchMos } = useMosData()

// Trending codes with branch hints for tooltips
const trendingCodes = [
  { code: '11B', hint: 'Army Infantry' },
  { code: '0311', hint: 'Marine Rifleman' },
  { code: '25B', hint: 'Army IT Specialist' },
  { code: '68W', hint: 'Army Combat Medic' },
  { code: 'IT', hint: 'Keyword search' },
]

// Search state
const searchQuery = ref('')
const searchResults = ref<MosSearchResult[]>([]) as Ref<MosSearchResult[]>
const companyResults = ref<CompanySearchResult[]>([])
const companyResultsTotal = ref(0)
const isSearching = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref<{ $el: HTMLInputElement } | null>(null)

const HERO_COMPANY_LIMIT = 8

// Detect if query should trigger keyword/company search vs MOS lookup
// Same logic as search API: >5 chars OR non-alphanumeric = keyword search
const isKeywordQuery = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return false
  return q.length > 5 || !/^[A-Z0-9]+$/i.test(q)
})

// Computed states
const hasQuery = computed(() => searchQuery.value.trim().length > 0)
const hasMosResults = computed(() => searchResults.value.length > 0)
const hasCompanyResults = computed(() => companyResults.value.length > 0)
const hasResults = computed(() => isKeywordQuery.value ? hasCompanyResults.value : hasMosResults.value)
const showResults = computed(() => hasQuery.value && hasResults.value)
const showNoResults = computed(() => hasQuery.value && !hasResults.value && !isSearching.value)
const showTryBlock = computed(() => !hasQuery.value)
const hasMoreCompanies = computed(() => companyResultsTotal.value > HERO_COMPANY_LIMIT)

// Search with debounce - MOS search for short codes, company search for keywords
const performSearch = async () => {
  if (!hasQuery.value) {
    searchResults.value = []
    companyResults.value = []
    companyResultsTotal.value = 0
    isSearching.value = false
    return
  }

  isSearching.value = true
  const q = searchQuery.value.trim()

  try {
    if (isKeywordQuery.value) {
      // Keyword query → search for companies
      logger.debug({ query: q }, 'Performing keyword company search')
      
      const response = await $fetch<SearchResponse>('/api/search', {
        query: {
          q,
          limit: HERO_COMPANY_LIMIT,
          offset: 0,
        },
      })
      
      companyResults.value = response.company_results
      companyResultsTotal.value = response.pagination.total
      searchResults.value = [] // Clear MOS results
      selectedIndex.value = -1
      
      logger.info({ query: q, count: response.company_results.length, total: response.pagination.total }, 'Company search completed')
    } else {
      // Short alphanumeric query → MOS code lookup
      logger.debug({ query: q }, 'Performing MOS search')
      
      const results = await searchMos(q, 20)
      searchResults.value = results
      companyResults.value = [] // Clear company results
      companyResultsTotal.value = 0
      selectedIndex.value = -1
      
      logger.info({ query: q, count: results.length }, 'MOS search completed')
    }
  } catch (error) {
    logger.error({ error, query: q }, 'Search failed')
  } finally {
    isSearching.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(performSearch, 300)

// Watch search query
watch(searchQuery, (newQuery) => {
  if (newQuery.trim().length > 0) {
    isSearching.value = true
  }
  debouncedSearch()
})

// Navigate to search page with query
const navigateToSearch = (query: string) => {
  logger.info({ query }, 'Navigating to search page')
  searchQuery.value = ''
  router.push(`/search?q=${encodeURIComponent(query)}`)
}

// Handle selection - navigate to search with MOS code
const selectMos = (result: MosSearchResult) => {
  logger.info({ mosCode: result.mos.code }, 'MOS selected from search')
  navigateToSearch(result.mos.code)
}

// Handle Enter key - navigate to search page
const handleEnter = () => {
  const query = searchQuery.value.trim()
  
  if (!query) {
    router.push('/search')
    return
  }
  
  if (isKeywordQuery.value) {
    // For keyword queries, always go to search page with the query
    navigateToSearch(query)
  } else {
    // For MOS queries, select result or navigate with query
    const selectedResult = searchResults.value[selectedIndex.value]
    if (selectedIndex.value >= 0 && selectedResult) {
      navigateToSearch(selectedResult.mos.code)
    } else if (searchResults.value.length === 1 && searchResults.value[0]) {
      navigateToSearch(searchResults.value[0].mos.code)
    } else {
      navigateToSearch(query)
    }
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!showResults.value) return

  const maxIndex = isKeywordQuery.value 
    ? companyResults.value.length - 1 
    : searchResults.value.length - 1

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  } else if (event.key === 'Escape') {
    searchQuery.value = ''
    selectedIndex.value = -1
    searchInput.value?.$el?.blur()
  }
}

const branchLogos: Record<string, string> = {
  'Army': '/logos/branches/army.svg',
  'Navy': '/logos/branches/navy.svg',
  'Air Force': '/logos/branches/air_force.svg',
  'Marine Corps': '/logos/branches/marines.svg',
  'Space Force': '/logos/branches/space_force.svg',
  'Coast Guard': '/logos/branches/coast_guard.svg'
}

// Auto-focus on mount + "/" keyboard shortcut
onMounted(() => {
  nextTick(() => {
    searchInput.value?.$el?.focus()
  })

  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      e.preventDefault()
      searchInput.value?.$el?.focus()
    }
  })
})
</script>

<template>
  <div class="w-full">
    <!-- Hero Section -->
    <div class="text-center space-y-6 pb-8">
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight">
        Contractor Jobs by <span class="text-primary font-mono">MOS</span>
      </h1>
      <p class="text-lg text-muted-foreground">
        Enter your MOS. Discover defense contractors that hire your specialty.
      </p>

      <!-- Branch logos + Trending codes (above search) -->
      <div class="space-y-4">
        <div class="flex items-center justify-center gap-4">
          <TooltipProvider v-for="(logo, branch) in branchLogos" :key="branch">
            <Tooltip>
              <TooltipTrigger as-child>
                <img 
                  :src="logo" 
                  :alt="String(branch)"
                  class="h-6 w-6 object-contain opacity-40 hover:opacity-70 transition-opacity cursor-default"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{{ branch }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div class="flex items-center justify-center gap-1.5">
          <span class="text-sm text-muted-foreground/70">Trending:</span>
          <div class="flex items-center gap-1">
            <TooltipProvider v-for="item in trendingCodes" :key="item.code">
              <Tooltip>
                <TooltipTrigger as-child>
                  <NuxtLink 
                    :to="`/search?q=${item.code}`" 
                    class="px-2 py-1 text-sm font-mono font-medium text-muted-foreground bg-muted/50 border border-border/40 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150"
                  >
                    {{ item.code }}
                  </NuxtLink>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{{ item.hint }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <!-- Search Input -->
      <div class="max-w-2xl mx-auto pt-2">
        <div class="relative group">
          <InputGroup class="h-14 border-border bg-input hover:bg-input transition-all duration-200 focus-within:border-primary focus-within:bg-input">
            <InputGroupAddon class="pl-4">
              <Icon 
                name="mdi:magnify" 
                class="size-5 text-muted-foreground/70 transition-colors duration-200 group-focus-within:text-primary" 
              />
            </InputGroupAddon>
            <InputGroupInput
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Search by MOS code or keyword..."
              class="h-full text-base placeholder:text-muted-foreground/50"
              autocomplete="off"
              @keydown.enter="handleEnter"
              @keydown="handleKeydown"
            />
            <InputGroupAddon align="inline-end" class="pr-3">
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 scale-90"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-90"
              >
                <InputGroupButton
                  v-if="searchQuery"
                  variant="ghost"
                  size="icon-xs"
                  class="hidden sm:flex text-muted-foreground hover:text-primary hover:bg-transparent"
                  @click="searchQuery = ''; searchInput?.$el?.focus()"
                >
                  <Icon name="mdi:close-circle" class="size-5" />
                </InputGroupButton>
                <Kbd v-else class="hidden sm:inline-flex opacity-60">/</Kbd>
              </Transition>
            </InputGroupAddon>
          </InputGroup>
        </div>
        
        <!-- Search mode indicator (fixed height to prevent layout shift) -->
        <p 
          class="text-xs mt-2 h-1 transition-opacity duration-150"
          :class="isSearching && hasQuery ? 'text-muted-foreground/60' : 'opacity-0'"
        >
          {{ isKeywordQuery ? 'Searching jobs...' : 'Matching MOS codes...' }}
        </p>
      </div>
    </div>

    <!-- Featured content slot (hidden when searching, shown when idle) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showTryBlock" class="pt-8">
        <slot name="featured" />
      </div>
    </Transition>

    <!-- Results Section (inline on page) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out delay-75"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-opacity duration-100 ease-out"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="hasQuery" class="border-t border-border/40 pt-6">
        <!-- Results Header -->
        <div class="max-w-4xl mx-auto px-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {{ isKeywordQuery ? 'Companies' : 'MOS Codes' }}
              </h2>
              <span v-if="!isSearching && hasResults" class="text-xs text-muted-foreground/70 tabular-nums">
                {{ isKeywordQuery ? `${companyResults.length}${hasMoreCompanies ? '+' : ''} shown` : `${searchResults.length} found` }}
              </span>
            </div>
            <button 
              type="button"
              class="text-xs text-muted-foreground/70 hover:text-primary transition-colors cursor-pointer"
              @click="searchQuery = ''; searchInput?.$el?.focus()"
            >
              Clear
            </button>
          </div>

          <!-- Company Results List (keyword queries) -->
          <template v-if="isKeywordQuery && hasCompanyResults">
            <div class="grid gap-1" @mouseleave="selectedIndex = -1">
              <NuxtLink
                v-for="(company, index) in companyResults"
                :key="company.company_id"
                :to="`/companies/${company.slug}`"
                class="block px-4 py-3 text-left border border-transparent transition-all duration-150 group relative"
                :class="index === selectedIndex 
                  ? 'bg-primary/5 border-primary/40' 
                  : 'hover:bg-muted/40 hover:border-border/60'"
                @mouseenter="selectedIndex = index"
              >
                <!-- Active Indicator -->
                <div 
                  v-if="index === selectedIndex" 
                  class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary"
                />
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-muted/50 flex items-center justify-center shrink-0">
                    <Icon name="mdi:office-building" class="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {{ company.name }}
                    </div>
                    <div class="text-xs text-muted-foreground truncate">
                      {{ company.domains.slice(0, 3).join(' · ') }}
                    </div>
                  </div>
                  <Icon 
                    name="mdi:arrow-right" 
                    class="w-4 h-4 text-muted-foreground/0 group-hover:text-primary/70 shrink-0 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                    :class="index === selectedIndex ? 'text-primary/70 translate-x-0' : ''"
                  />
                </div>
              </NuxtLink>
            </div>
            
            <!-- View all companies footer -->
            <div v-if="hasMoreCompanies" class="mt-6 text-center">
              <Button 
                variant="link" 
                size="sm"
                class="text-sm gap-1"
                @click="navigateToSearch(searchQuery)"
              >
                <span class="text-muted-foreground font-normal">View all companies for</span> 
                <span class="font-mono font-semibold text-primary uppercase tracking-wide">{{ searchQuery }}</span>
                <span class="text-muted-foreground font-normal">({{ companyResultsTotal }})</span>
                <Icon name="mdi:arrow-right" class="size-4 text-muted-foreground" />
              </Button>
            </div>
          </template>

          <!-- MOS Results List (short alphanumeric queries) -->
          <div v-else-if="hasMosResults" class="grid gap-2">
            <button
              v-for="(result, index) in searchResults"
              :key="result.mos.id"
              type="button"
              class="w-full flex items-center gap-4 px-4 py-3.5 text-left border border-transparent transition-all duration-150 group relative"
              :class="index === selectedIndex 
                ? 'bg-primary/5 border-primary/40' 
                : 'hover:bg-muted/40 hover:border-border/60'"
              @click="selectMos(result)"
              @mouseenter="selectedIndex = index"
            >
              <!-- Active Indicator -->
              <div 
                v-if="index === selectedIndex" 
                class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary"
              />

              <!-- Branch Icon -->
              <div class="shrink-0">
                <div class="w-10 h-10 bg-muted/60 flex items-center justify-center border border-border/40">
                  <img 
                    v-if="branchLogos[result.mos.branch]"
                    :src="branchLogos[result.mos.branch]" 
                    :alt="result.mos.branch"
                    class="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <Icon v-else name="mdi:shield-outline" class="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2">
                  <span class="font-bold font-mono text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {{ result.mos.code }}
                  </span>
                  <span class="text-[11px] px-1.5 py-0.5 bg-muted/80 text-muted-foreground font-medium tracking-wide">
                    {{ result.mos.branch }}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground truncate mt-0.5">
                  {{ result.mos.title }}
                </p>
              </div>

              <!-- Arrow -->
              <Icon 
                name="mdi:arrow-right" 
                class="w-4 h-4 text-muted-foreground/0 group-hover:text-primary/70 self-center shrink-0 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                :class="index === selectedIndex ? 'text-primary/70 translate-x-0' : ''"
              />
            </button>
          </div>

          <!-- No Results -->
          <div v-else-if="showNoResults" class="py-12 text-center">
            <div class="w-14 h-14 mx-auto flex items-center justify-center bg-muted/50 border border-border/40 mb-4">
              <Icon name="mdi:magnify-close" class="w-7 h-7 text-muted-foreground/60" />
            </div>
            <p class="text-base font-medium text-foreground mb-1">No matches found</p>
            <p class="text-sm text-muted-foreground mb-4">
              No results for "<span class="font-medium text-foreground/80">{{ searchQuery }}</span>"
            </p>
            <p class="text-xs text-muted-foreground/70">
              Try a different code like 11B or a keyword like "security"
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
