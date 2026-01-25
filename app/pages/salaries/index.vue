<!--
  @file Salaries browse page
  @route /salaries
  @description Browse salary reports with filters. Anonymous users see aggregates,
               authenticated users see full salary report cards.
-->

<script setup lang="ts">
import type { EnrichedSalaryReport, SalaryAggregates, ClearanceLevel, SalaryReportSort, CommunityStats } from '@/app/types/community.types'
import type { Company } from '@/app/types/company.types'

const logger = useLogger('SalariesPage')
const route = useRoute()
const router = useRouter()
const { fetchSalaryReports, fetchSalaryAggregates, voteHelpful, removeVote, hasVoted } = useSalaryReports()
const { fetchStats } = useCommunityStats()
const { getAllCompanies, allCompanies, getCompanyBySlug } = useCompanies()
const { isAuthenticated } = useAuth()

// SEO
useHead({
  title: 'Salary Reports | Real Contractor Salaries | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse real salary data from veterans working at defense contractors. Filter by company, MOS, clearance level, and location. Anonymous and verified salary reports.'
    }
  ]
})

// State
const reports = ref<EnrichedSalaryReport[]>([])
const aggregates = ref<SalaryAggregates | null>(null)
const stats = ref<CommunityStats | null>(null)
const isLoading = ref(true)
const isLoadingAggregates = ref(false)
const totalReports = ref(0)

// Filter state
const searchQuery = ref('')
const selectedCompanyId = ref('')
const selectedClearance = ref('')
const selectedLocation = ref('')
const selectedMosCode = ref('')
const selectedSort = ref<SalaryReportSort>('recent')

// Track company slug for URL syncing (company param in URL is slug, not ID)
const selectedCompanySlug = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = 20

// ===========================================
// URL Parameter Syncing
// ===========================================

/**
 * Initialize filter state from URL query parameters
 * Called on mount to support deep linking
 */
const initFromUrlParams = async () => {
  const { mos, company, clearance, location, sort } = route.query
  
  // MOS code param
  if (mos && typeof mos === 'string') {
    selectedMosCode.value = mos.toUpperCase()
    logger.debug({ mos: selectedMosCode.value }, 'Initialized MOS from URL')
  }
  
  // Clearance param
  if (clearance && typeof clearance === 'string') {
    // Validate it's a valid clearance level
    const validClearances = ['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI', 'TS_SCI_POLY']
    if (validClearances.includes(clearance.toUpperCase())) {
      selectedClearance.value = clearance.toUpperCase() as ClearanceLevel
      logger.debug({ clearance: selectedClearance.value }, 'Initialized clearance from URL')
    }
  }
  
  // Location param
  if (location && typeof location === 'string') {
    selectedLocation.value = location
    logger.debug({ location: selectedLocation.value }, 'Initialized location from URL')
  }
  
  // Sort param
  if (sort && typeof sort === 'string') {
    const validSorts = ['recent', 'helpful', 'salary']
    if (validSorts.includes(sort)) {
      selectedSort.value = sort as SalaryReportSort
      logger.debug({ sort: selectedSort.value }, 'Initialized sort from URL')
    }
  }
  
  // Company param (slug) - requires lookup to get ID
  if (company && typeof company === 'string') {
    selectedCompanySlug.value = company.toLowerCase()
    logger.debug({ companySlug: company }, 'Company slug from URL, will resolve after companies load')
  }
}

/**
 * Resolve company slug to ID after companies are loaded
 */
const resolveCompanyFromSlug = () => {
  if (!selectedCompanySlug.value || allCompanies.value.length === 0) return
  
  const matchedCompany = allCompanies.value.find(
    c => c.slug?.toLowerCase() === selectedCompanySlug.value.toLowerCase()
  )
  
  if (matchedCompany) {
    selectedCompanyId.value = matchedCompany.id
    logger.debug({ 
      slug: selectedCompanySlug.value, 
      id: matchedCompany.id,
      name: matchedCompany.name 
    }, 'Resolved company slug to ID')
  } else {
    logger.warn({ slug: selectedCompanySlug.value }, 'Company slug not found in loaded companies')
  }
}

/**
 * Sync current filter state to URL query parameters
 * Uses router.replace to avoid adding to history stack on every filter change
 */
const syncToUrl = () => {
  const query: Record<string, string> = {}
  
  if (selectedMosCode.value) {
    query.mos = selectedMosCode.value
  }
  
  if (selectedCompanyId.value) {
    // Store slug in URL, not ID
    const company = allCompanies.value.find(c => c.id === selectedCompanyId.value)
    if (company?.slug) {
      query.company = company.slug
    }
  }
  
  if (selectedClearance.value) {
    query.clearance = selectedClearance.value
  }
  
  if (selectedLocation.value) {
    query.location = selectedLocation.value
  }
  
  if (selectedSort.value && selectedSort.value !== 'recent') {
    query.sort = selectedSort.value
  }
  
  // Replace URL without navigating (preserves scroll position, doesn't add to history)
  router.replace({ query })
}

// Vote tracking
const votedReportIds = ref<Set<string>>(new Set())
const votingReportIds = ref<Set<string>>(new Set())

// Clearance options
const clearanceOptions: { value: ClearanceLevel | ''; label: string }[] = [
  { value: '', label: 'Any Clearance' },
  { value: 'NONE', label: 'No Clearance' },
  { value: 'PUBLIC_TRUST', label: 'Public Trust' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'TOP_SECRET', label: 'Top Secret' },
  { value: 'TS_SCI', label: 'TS/SCI' },
  { value: 'TS_SCI_POLY', label: 'TS/SCI + Poly' },
]

// Sort options
const sortOptions: { value: SalaryReportSort; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'salary', label: 'Highest Salary' },
]

// Location options (common locations)
const locationOptions = [
  { value: '', label: 'Any Location' },
  { value: 'Northern Virginia', label: 'Northern Virginia' },
  { value: 'Washington DC', label: 'Washington DC' },
  { value: 'San Diego', label: 'San Diego' },
  { value: 'Tampa', label: 'Tampa' },
  { value: 'Colorado Springs', label: 'Colorado Springs' },
  { value: 'Huntsville', label: 'Huntsville' },
  { value: 'Remote', label: 'Remote' },
]

// Load salary reports (for authenticated users)
const loadReports = async () => {
  isLoading.value = true
  try {
    const result = await fetchSalaryReports({
      companyId: selectedCompanyId.value || undefined,
      mosCode: selectedMosCode.value || undefined,
      location: selectedLocation.value || undefined,
      clearanceLevel: (selectedClearance.value as ClearanceLevel) || undefined,
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
      sort: selectedSort.value,
    })
    reports.value = result.reports
    totalReports.value = result.total

    // Check vote status for each report
    if (isAuthenticated.value) {
      await checkVoteStatuses(result.reports)
    }
  } catch (error) {
    logger.error({ error }, 'Failed to load salary reports')
    reports.value = []
    totalReports.value = 0
  } finally {
    isLoading.value = false
  }
}

// Load aggregates (for anonymous users or as overview)
const loadAggregates = async () => {
  isLoadingAggregates.value = true
  try {
    const result = await fetchSalaryAggregates(
      selectedMosCode.value || undefined,
      selectedCompanyId.value || undefined
    )
    aggregates.value = result
  } catch (error) {
    logger.error({ error }, 'Failed to load salary aggregates')
    aggregates.value = null
  } finally {
    isLoadingAggregates.value = false
  }
}

// Check vote statuses for reports
const checkVoteStatuses = async (salaryReports: EnrichedSalaryReport[]) => {
  const newVotedIds = new Set<string>()
  await Promise.all(
    salaryReports
      .filter((report) => report._id) // Only check reports with valid IDs
      .map(async (report) => {
        const voted = await hasVoted(report._id)
        if (voted) newVotedIds.add(report._id)
      })
  )
  votedReportIds.value = newVotedIds
}

// Handle vote
const handleVote = async (reportId: string) => {
  if (!isAuthenticated.value || votingReportIds.value.has(reportId)) return
  
  votingReportIds.value.add(reportId)
  try {
    const result = await voteHelpful(reportId)
    if (result.success) {
      votedReportIds.value.add(reportId)
      // Optimistically update the count
      const report = reports.value.find(r => r._id === reportId)
      if (report) report.helpfulCount++
    }
  } finally {
    votingReportIds.value.delete(reportId)
  }
}

// Handle remove vote
const handleRemoveVote = async (reportId: string) => {
  if (!isAuthenticated.value || votingReportIds.value.has(reportId)) return
  
  votingReportIds.value.add(reportId)
  try {
    const result = await removeVote(reportId)
    if (result.success) {
      votedReportIds.value.delete(reportId)
      // Optimistically update the count
      const report = reports.value.find(r => r._id === reportId)
      if (report && report.helpfulCount > 0) report.helpfulCount--
    }
  } finally {
    votingReportIds.value.delete(reportId)
  }
}

// Apply filter
const applyFilter = (filter: string, value: string) => {
  if (filter === 'company') {
    selectedCompanyId.value = value === 'ANY' ? '' : value
  } else if (filter === 'clearance') {
    selectedClearance.value = value === 'ANY' ? '' : value
  } else if (filter === 'location') {
    selectedLocation.value = value === 'ANY' ? '' : value
  } else if (filter === 'sort') {
    selectedSort.value = value as SalaryReportSort
  }
  currentPage.value = 1
  syncToUrl()
  loadReports()
  loadAggregates()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedCompanyId.value = ''
  selectedCompanySlug.value = ''
  selectedClearance.value = ''
  selectedLocation.value = ''
  selectedMosCode.value = ''
  selectedSort.value = 'recent'
  currentPage.value = 1
  // Clear URL params
  router.replace({ query: {} })
  loadReports()
  loadAggregates()
}

// Computed
const hasResults = computed(() => reports.value.length > 0)
const hasActiveFilters = computed(() => 
  !!selectedCompanyId.value || 
  !!selectedClearance.value || 
  !!selectedLocation.value || 
  !!selectedMosCode.value ||
  selectedSort.value !== 'recent'
)

const totalPages = computed(() => Math.ceil(totalReports.value / pageSize))

const selectedCompanyName = computed(() => {
  if (!selectedCompanyId.value) return null
  const company = allCompanies.value.find(c => c.id === selectedCompanyId.value)
  return company?.name || null
})

const aggregateTitle = computed(() => {
  const parts: string[] = []
  if (selectedMosCode.value) parts.push(selectedMosCode.value)
  if (selectedCompanyName.value) parts.push(`at ${selectedCompanyName.value}`)
  if (parts.length === 0) return 'Overall Salary Statistics'
  return `${parts.join(' ')} Salaries`
})

// Active filter chips for display
const activeFilterChips = computed(() => {
  const chips: { key: string; label: string; value: string }[] = []
  
  if (selectedMosCode.value) {
    chips.push({ key: 'mos', label: 'MOS', value: selectedMosCode.value })
  }
  
  if (selectedCompanyName.value) {
    chips.push({ key: 'company', label: 'Company', value: selectedCompanyName.value })
  }
  
  if (selectedClearance.value) {
    const clearanceOption = clearanceOptions.find(o => o.value === selectedClearance.value)
    chips.push({ 
      key: 'clearance', 
      label: 'Clearance', 
      value: clearanceOption?.label || selectedClearance.value 
    })
  }
  
  if (selectedLocation.value) {
    chips.push({ key: 'location', label: 'Location', value: selectedLocation.value })
  }
  
  return chips
})

// Remove a specific filter
const removeFilter = (key: string) => {
  if (key === 'mos') {
    selectedMosCode.value = ''
  } else if (key === 'company') {
    selectedCompanyId.value = ''
    selectedCompanySlug.value = ''
  } else if (key === 'clearance') {
    selectedClearance.value = ''
  } else if (key === 'location') {
    selectedLocation.value = ''
  }
  currentPage.value = 1
  syncToUrl()
  loadReports()
  loadAggregates()
}

// Pagination handlers
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadReports()
  }
}

// Load on mount
onMounted(async () => {
  // Initialize filters from URL params first
  await initFromUrlParams()
  
  // Load companies for filter dropdown
  if (allCompanies.value.length === 0) {
    await getAllCompanies()
  }
  
  // Resolve company slug to ID after companies are loaded
  resolveCompanyFromSlug()
  
  // Load community stats
  stats.value = await fetchStats()
  
  // Load data with initialized filters
  await Promise.all([loadReports(), loadAggregates()])
})

// Watch for route query changes (browser back/forward navigation)
watch(() => route.query, async (newQuery, oldQuery) => {
  // Skip if queries are the same (prevents double-fire from syncToUrl)
  if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) return
  
  // Re-initialize from new URL params
  await initFromUrlParams()
  resolveCompanyFromSlug()
  currentPage.value = 1
  await Promise.all([loadReports(), loadAggregates()])
}, { deep: true })
</script>

<template>
  <div class="min-h-full">
    <!-- Search Header with Filters -->
    <div class="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <SearchablePageHeader>
        <template #filters>
          <div class="space-y-3">
            <!-- Row 1: Status & Active Filters -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Result count -->
              <span v-if="totalReports > 0" class="text-sm text-muted-foreground">
                {{ totalReports }} {{ totalReports === 1 ? 'report' : 'reports' }}
              </span>
              <span v-else class="text-sm text-muted-foreground">No reports</span>
              
              <!-- Active filter chips (from URL params) -->
              <template v-if="activeFilterChips.length > 0">
                <span class="text-sm text-muted-foreground">matching:</span>
                <Badge
                  v-for="chip in activeFilterChips"
                  :key="chip.key"
                  variant="secondary"
                  class="h-6 gap-1 pl-2 pr-1 text-xs font-medium"
                >
                  {{ chip.value }}
                  <button
                    type="button"
                    class="ml-0.5 h-4 w-4 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    :aria-label="`Remove ${chip.label} filter`"
                    @click.stop="removeFilter(chip.key)"
                  >
                    <Icon name="mdi:close" class="w-3 h-3" />
                  </button>
                </Badge>
                
                <!-- Clear all -->
                <span class="text-muted-foreground/50">·</span>
                <Button
                  variant="link"
                  size="sm"
                  class="h-auto p-0 text-xs text-muted-foreground"
                  @click="resetFilters"
                >
                  Clear all
                </Button>
              </template>
            </div>
            
            <!-- Row 2: Filter Controls -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Company filter -->
              <Select 
                :model-value="selectedCompanyId || 'ANY'" 
                @update:model-value="(v) => applyFilter('company', String(v))"
              >
                <SelectTrigger class="w-auto max-w-[160px] h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent class="max-h-[300px]">
                  <SelectItem value="ANY">Any Company</SelectItem>
                  <SelectItem 
                    v-for="company in allCompanies" 
                    :key="company.id" 
                    :value="company.id"
                  >
                    {{ company.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <!-- Clearance filter -->
              <Select 
                :model-value="selectedClearance || 'ANY'" 
                @update:model-value="(v) => applyFilter('clearance', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Clearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="option in clearanceOptions" 
                    :key="option.value || 'any'" 
                    :value="option.value || 'ANY'"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <!-- Location filter -->
              <Select 
                :model-value="selectedLocation || 'ANY'" 
                @update:model-value="(v) => applyFilter('location', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="option in locationOptions" 
                    :key="option.value || 'any'" 
                    :value="option.value || 'ANY'"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <!-- Sort -->
              <Select 
                :model-value="selectedSort" 
                @update:model-value="(v) => applyFilter('sort', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="option in sortOptions" 
                    :key="option.value" 
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </template>
      </SearchablePageHeader>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Main Content -->
        <div class="flex-1 min-w-0 space-y-6">
          
          <!-- Aggregates Card (show when we have data or loading) -->
          <SalaryAggregateCard
            v-if="aggregates"
            :aggregates="aggregates"
            :title="aggregateTitle"
            :mos-code="selectedMosCode || undefined"
            :company-name="selectedCompanyName || undefined"
            :show-details="true"
            :loading="false"
          />
          
          <!-- Loading state for aggregates -->
          <Card v-else-if="isLoadingAggregates" class="overflow-hidden">
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="h-5 w-40 bg-muted animate-pulse" />
                  <div class="h-4 w-24 bg-muted/50 animate-pulse mt-2" />
                </div>
                <div class="w-6 h-6 bg-muted animate-pulse" />
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div v-for="i in 4" :key="i" class="text-center p-3 bg-muted/30">
                  <div class="h-7 w-16 bg-muted animate-pulse mx-auto" />
                  <div class="h-3 w-12 bg-muted/50 animate-pulse mx-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Access Control: Show different content based on auth status -->
          <template v-if="!isAuthenticated">
            <!-- Anonymous User: Show CTA to sign up for full access -->
            <Card class="border-primary/30 bg-primary/5">
              <CardContent class="p-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <Icon name="mdi:lock-outline" class="w-5 h-5 text-primary" />
                      <h3 class="font-semibold text-foreground">
                        Sign in to view individual salary reports
                      </h3>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      Create a free account to access {{ totalReports }} detailed salary reports, 
                      including specific company names, signing bonuses, and experience levels.
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    <Button as-child>
                      <NuxtLink to="/auth/login">
                        <Icon name="mdi:login" class="w-4 h-4 mr-1.5" />
                        Sign In
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" as-child>
                      <NuxtLink to="/salaries/submit">
                        <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
                        Contribute
                      </NuxtLink>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <!-- Show blurred preview of reports -->
            <div class="relative">
              <div class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/80 to-background flex items-end justify-center pb-8">
                <p class="text-sm text-muted-foreground text-center">
                  <Icon name="mdi:eye-off" class="w-4 h-4 inline mr-1" />
                  Sign in to view full salary details
                </p>
              </div>
              <div class="grid gap-4 blur-sm pointer-events-none" aria-hidden="true">
                <!-- Placeholder cards -->
                <div v-for="i in 3" :key="i" class="bg-card border border-border p-5 opacity-50">
                  <div class="flex justify-between mb-3">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <div class="bg-primary/20 h-5 w-12" />
                        <div class="bg-muted h-4 w-24" />
                      </div>
                      <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <div class="bg-muted h-3 w-32" />
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="bg-muted h-6 w-16" />
                    </div>
                  </div>
                  <div class="flex gap-2 mb-4">
                    <div class="bg-muted h-5 w-20" />
                    <div class="bg-muted h-5 w-16" />
                    <div class="bg-muted h-5 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Authenticated User: Show full salary report cards -->
            
            <!-- Loading State -->
            <div v-if="isLoading" class="grid gap-4">
              <Card v-for="i in 5" :key="i" class="overflow-hidden animate-pulse">
                <CardContent class="p-5">
                  <div class="flex justify-between mb-3">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <div class="bg-muted h-5 w-12" />
                        <div class="bg-muted h-4 w-24" />
                      </div>
                      <div class="flex items-center gap-1.5 text-sm">
                        <div class="bg-muted h-3 w-32" />
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="bg-muted h-6 w-16" />
                    </div>
                  </div>
                  <div class="flex gap-2 mb-4">
                    <div class="bg-muted h-5 w-20" />
                    <div class="bg-muted h-5 w-16" />
                    <div class="bg-muted h-5 w-24" />
                  </div>
                  <div class="flex justify-between pt-3 border-t border-border/30">
                    <div class="bg-muted h-4 w-20" />
                    <div class="bg-muted h-3 w-16" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Empty State -->
            <Empty v-else-if="!hasResults">
              <EmptyMedia variant="icon">
                <Icon name="mdi:currency-usd-off" class="size-5" />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>No salary reports found</EmptyTitle>
                <EmptyDescription>
                  {{ hasActiveFilters 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Be the first to share salary intel for the community' 
                  }}
                </EmptyDescription>
              </EmptyContent>
              <div class="flex gap-2">
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
                  Clear Filters
                </Button>
                <Button as-child size="sm">
                  <NuxtLink to="/salaries/submit">
                    <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
                    Share Salary
                  </NuxtLink>
                </Button>
              </div>
            </Empty>

            <!-- Results List -->
            <div v-else class="space-y-2">
              <SalaryReportCard
                v-for="report in reports"
                :key="report._id"
                :report="report"
                :has-voted="votedReportIds.has(report._id)"
                :is-voting="votingReportIds.has(report._id)"
                @vote="handleVote"
                @remove-vote="handleRemoveVote"
              />
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                <Icon name="mdi:chevron-left" class="w-4 h-4" />
                Previous
              </Button>
              
              <div class="flex items-center gap-1">
                <Button
                  v-for="page in Math.min(totalPages, 5)"
                  :key="page"
                  :variant="currentPage === page ? 'default' : 'ghost'"
                  size="sm"
                  class="w-8 h-8 p-0"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </Button>
                <span v-if="totalPages > 5" class="text-sm text-muted-foreground px-2">...</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Next
                <Icon name="mdi:chevron-right" class="w-4 h-4" />
              </Button>
            </div>
          </template>
        </div>

        <!-- Right Column: Sidebar -->
        <div class="lg:w-80 shrink-0">
          <div class="lg:sticky lg:top-[148px] space-y-6">
            <!-- Community Stats -->
            <CommunityStatsBar
              v-if="stats && (stats.totalSalaryReports > 0 || stats.totalInterviewExperiences > 0)"
              :stats="stats"
              :loading="false"
              size="sm"
              class="flex-col items-stretch"
            />
            
            <!-- Contribute CTA -->
            <ContributeCta variant="card" :compact="true" />
            
            <!-- Featured Job (contextual) -->
            <FeaturedJobCard :context="{ mosCode: selectedMosCode || undefined }" />
            
            <!-- Quick Links -->
            <Card>
              <CardHeader class="pb-3">
                <CardTitle class="text-sm font-semibold flex items-center gap-2">
                  <Icon name="mdi:lightning-bolt" class="w-4 h-4 text-primary" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="flex flex-wrap gap-2">
                  <Button
                    v-for="clearance in ['TS_SCI', 'TOP_SECRET', 'SECRET']"
                    :key="clearance"
                    variant="outline"
                    size="sm"
                    class="text-xs h-7"
                    :class="{ 'bg-primary/10 border-primary': selectedClearance === clearance }"
                    @click="applyFilter('clearance', selectedClearance === clearance ? 'ANY' : clearance)"
                  >
                    {{ clearance === 'TS_SCI' ? 'TS/SCI' : clearance === 'TOP_SECRET' ? 'Top Secret' : 'Secret' }}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <!-- About Salaries Section -->
            <Card class="bg-muted/30">
              <CardContent class="p-4 text-sm text-muted-foreground space-y-2">
                <h4 class="font-semibold text-foreground flex items-center gap-2">
                  <Icon name="mdi:information-outline" class="w-4 h-4" />
                  About Salary Data
                </h4>
                <p>
                  All salary reports are submitted anonymously by veterans and cleared professionals 
                  working in the defense contracting industry.
                </p>
                <p>
                  Reports are reviewed for accuracy. Verified reports are marked with a badge.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
