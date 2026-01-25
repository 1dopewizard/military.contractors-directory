<!--
  @file Company index page
  @route /companies
  @description Browse defense contractors (search-style layout)
  @urlparams q - Search query, theater - Operating theater filter, domain - Domain filter
-->

<script setup lang="ts">
import CompanyResultItem from '@/app/components/Companies/CompanyResultItem.vue'
import CompanyResultSkeleton from '@/app/components/Companies/CompanyResultSkeleton.vue'
import type { Company } from '@/app/types/company.types'

const logger = useLogger('CompaniesIndexPage')
const route = useRoute()
const router = useRouter()
const { allCompanies, getAllCompanies, filterCompanies } = useCompanies()

// SEO
useHead({
  title: 'Browse Defense Contractors | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse defense contractors that hire veterans. Filter by operating region and domain to find companies matching your military specialty.'
    }
  ]
})

// State - initialize from URL params
const companies = ref<Company[]>([])
const isLoading = ref(true)
const searchQuery = ref((route.query.q as string) || '')
const selectedTheater = ref((route.query.theater as string) || '')
const selectedDomain = ref((route.query.domain as string) || '')

// Available filters
const availableTheaters = computed(() => {
  const theaters = new Set<string>()
  allCompanies.value.forEach((company) => {
    company.theaters?.forEach((theater) => theaters.add(theater))
  })
  return Array.from(theaters).sort()
})

const availableDomains = computed(() => {
  const domains = new Set<string>()
  allCompanies.value.forEach((company) => {
    company.domains?.forEach((domain) => domains.add(domain))
  })
  return Array.from(domains).sort()
})

// Sync current filter state to URL query params
const syncFiltersToUrl = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedTheater.value) query.theater = selectedTheater.value
  if (selectedDomain.value) query.domain = selectedDomain.value
  
  router.replace({ query })
}

// Load companies
const loadCompanies = async () => {
  isLoading.value = true
  try {
    const result = await filterCompanies({
      searchQuery: searchQuery.value,
      theater: selectedTheater.value,
      domain: selectedDomain.value
    })
    companies.value = result
  } catch (error) {
    logger.error({ error }, 'Failed to load companies')
    companies.value = []
  } finally {
    isLoading.value = false
  }
}

// Apply filter
const applyFilter = (filter: string, value: string) => {
  if (filter === 'theater') {
    selectedTheater.value = value === 'ANY' ? '' : value
  } else if (filter === 'domain') {
    selectedDomain.value = value === 'ANY' ? '' : value
  }
  syncFiltersToUrl()
  loadCompanies()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedTheater.value = ''
  selectedDomain.value = ''
  syncFiltersToUrl()
  loadCompanies()
}

// Computed
const totalCount = computed(() => companies.value.length)
const hasResults = computed(() => companies.value.length > 0)
const hasActiveFilters = computed(() => 
  !!searchQuery.value || !!selectedTheater.value || !!selectedDomain.value
)

// Watch for URL query changes (back/forward navigation)
watch(
  () => route.query,
  (newQuery) => {
    const newQ = (newQuery.q as string) || ''
    const newTheater = (newQuery.theater as string) || ''
    const newDomain = (newQuery.domain as string) || ''
    
    // Only update if values actually changed
    if (
      newQ !== searchQuery.value ||
      newTheater !== selectedTheater.value ||
      newDomain !== selectedDomain.value
    ) {
      searchQuery.value = newQ
      selectedTheater.value = newTheater
      selectedDomain.value = newDomain
      loadCompanies()
    }
  }
)

// Load on mount
onMounted(async () => {
  if (allCompanies.value.length === 0) {
    await getAllCompanies()
  }
  loadCompanies()
})
</script>

<template>
  <div class="min-h-full">
    <!-- Search Header with Filters -->
    <div class="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <SearchablePageHeader>
      <template #filters>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Result count -->
          <span v-if="totalCount > 0" class="text-sm text-muted-foreground mr-2">
            {{ totalCount }} {{ totalCount === 1 ? 'company' : 'companies' }}
          </span>
          
          <!-- Theater -->
          <Select :model-value="selectedTheater || 'ANY'" @update:model-value="(v) => applyFilter('theater', String(v))">
            <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
              <SelectValue placeholder="Theater" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Theater</SelectItem>
              <SelectItem v-for="theater in availableTheaters" :key="theater" :value="theater">
                {{ theater }}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Domain -->
          <Select :model-value="selectedDomain || 'ANY'" @update:model-value="(v) => applyFilter('domain', String(v))">
            <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Domain</SelectItem>
              <SelectItem v-for="domain in availableDomains" :key="domain" :value="domain">
                {{ domain }}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Clear Filters -->
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            @click="resetFilters"
          >
            <Icon name="mdi:close" class="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </template>
      </SearchablePageHeader>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Results -->
        <div class="flex-1 min-w-0 max-w-3xl lg:pr-24">
          <!-- Loading State -->
          <CompanyResultSkeleton v-if="isLoading" :count="6" />

          <!-- Empty State -->
          <Empty v-else-if="!hasResults">
            <EmptyMedia variant="icon">
              <Icon name="mdi:office-building-off-outline" class="size-5" />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle>No companies found</EmptyTitle>
              <EmptyDescription>Try adjusting your filters or search terms</EmptyDescription>
            </EmptyContent>
            <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
              Clear Filters
            </Button>
          </Empty>

          <!-- Results List -->
          <div v-else class="space-y-2">
            <CompanyResultItem
              v-for="company in companies"
              :key="company.id"
              :company="company"
            />
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <SearchSidebar />
      </div>
    </div>
  </div>
</template>
