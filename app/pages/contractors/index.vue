<!--
  @file Contractors browse page
  @route /contractors
  @description Browse defense contractors with search, specialty filter, and sorting
  @urlparams q - Search query, specialty - Specialty filter, sort - Sort order
-->

<script setup lang="ts">
const logger = useLogger('ContractorsBrowsePage')
const route = useRoute()
const router = useRouter()

// SEO
useHead({
  title: 'Browse Defense Contractors | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse U.S. defense contractors from the Defense News Top 100. Filter by specialty, search by name, and explore company profiles.',
    },
  ],
})

// State - initialize from URL params
const searchQuery = ref((route.query.q as string) || '')
const selectedSpecialty = ref((route.query.specialty as string) || '')
const sortBy = ref((route.query.sort as string) || 'rank')
const isLoading = ref(true)

// Contractor response type
interface ContractorResponse {
  contractors: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    defenseNewsRank: number | null
    country: string | null
    headquarters: string | null
    founded: string | null
    employeeCount: string | null
    website: string | null
    careersUrl: string | null
    linkedinUrl: string | null
    wikipediaUrl: string | null
    stockTicker: string | null
    isPublic: boolean | null
    totalRevenue: number | null
    defenseRevenue: number | null
    defenseRevenuePercent: number | null
    logoUrl: string | null
    primarySpecialty: {
      slug: string
      name: string | null
    } | null
    createdAt: string
    updatedAt: string
  }>
  total: number
  limit: number
  offset: number
}

interface Specialty {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  contractorCount?: number
}

// Fetch contractors with reactive query params
const contractorsUrl = computed(() => {
  const params = new URLSearchParams()
  if (searchQuery.value) params.set('q', searchQuery.value)
  if (selectedSpecialty.value) params.set('specialty', selectedSpecialty.value)
  if (sortBy.value) params.set('sort', sortBy.value)
  params.set('limit', '50') // Show all contractors
  return `/api/contractors?${params.toString()}`
})

const { data: contractorsData, pending: contractorsPending, error: contractorsError, refresh: refreshContractors } = useFetch<ContractorResponse>(
  contractorsUrl,
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0, limit: 50, offset: 0 }),
  }
)

// Fetch specialties for filter dropdown
const { data: specialtiesData } = useFetch<{ specialties: Specialty[] }>('/api/specialties?includeCounts=true', {
  lazy: true,
  default: () => ({ specialties: [] }),
})

// Computed values
const contractors = computed(() => contractorsData.value?.contractors ?? [])
const totalCount = computed(() => contractorsData.value?.total ?? 0)
const hasResults = computed(() => contractors.value.length > 0)
const specialties = computed(() => specialtiesData.value?.specialties ?? [])

const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!selectedSpecialty.value || sortBy.value !== 'rank'
)

// Update loading state
watchEffect(() => {
  isLoading.value = contractorsPending.value
})

// Sort options
const sortOptions = [
  { value: 'rank', label: 'Rank' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'name', label: 'Name' },
]

// Sync current filter state to URL query params
const syncFiltersToUrl = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedSpecialty.value) query.specialty = selectedSpecialty.value
  if (sortBy.value && sortBy.value !== 'rank') query.sort = sortBy.value

  router.replace({ query })
}

// Apply specialty filter
const applySpecialtyFilter = (value: string) => {
  selectedSpecialty.value = value === 'ANY' ? '' : value
  syncFiltersToUrl()
}

// Apply sort
const applySort = (value: string) => {
  sortBy.value = value
  syncFiltersToUrl()
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedSpecialty.value = ''
  sortBy.value = 'rank'
  syncFiltersToUrl()
}

// Get selected specialty name for display
const selectedSpecialtyName = computed(() => {
  if (!selectedSpecialty.value) return null
  const specialty = specialties.value.find((s) => s.slug === selectedSpecialty.value)
  return specialty?.name || null
})

// Watch for URL query changes (back/forward navigation)
watch(
  () => route.query,
  (newQuery) => {
    const newQ = (newQuery.q as string) || ''
    const newSpecialty = (newQuery.specialty as string) || ''
    const newSort = (newQuery.sort as string) || 'rank'

    // Only update if values actually changed
    if (
      newQ !== searchQuery.value ||
      newSpecialty !== selectedSpecialty.value ||
      newSort !== sortBy.value
    ) {
      searchQuery.value = newQ
      selectedSpecialty.value = newSpecialty
      sortBy.value = newSort
    }
  }
)

// Log page load
watchEffect(() => {
  if (contractors.value.length > 0) {
    logger.info({ count: contractors.value.length }, 'Contractors loaded')
  }
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
              {{ totalCount }} {{ totalCount === 1 ? 'contractor' : 'contractors' }}
            </span>

            <!-- Specialty Filter -->
            <Select :model-value="selectedSpecialty || 'ANY'" @update:model-value="(v) => applySpecialtyFilter(String(v))">
              <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any Specialty</SelectItem>
                <SelectItem v-for="specialty in specialties" :key="specialty.slug" :value="specialty.slug">
                  {{ specialty.name }}
                  <span v-if="specialty.contractorCount" class="text-muted-foreground ml-1">
                    ({{ specialty.contractorCount }})
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Sort -->
            <Select :model-value="sortBy" @update:model-value="(v) => applySort(String(v))">
              <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
                <span class="text-muted-foreground mr-1">Sort:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
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
          <!-- Active Filter Badge -->
          <div v-if="selectedSpecialtyName" class="mb-4">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">Filtered by:</span>
              <Badge variant="secondary" class="flex items-center gap-1">
                {{ selectedSpecialtyName }}
                <button
                  class="ml-1 hover:text-destructive transition-colors"
                  @click="applySpecialtyFilter('ANY')"
                >
                  <Icon name="mdi:close" class="w-3 h-3" />
                </button>
              </Badge>
            </div>
          </div>

          <!-- Loading State -->
          <ContractorResultSkeleton v-if="isLoading" :count="6" />

          <!-- Error State -->
          <Empty v-else-if="contractorsError">
            <EmptyMedia variant="icon">
              <Icon name="mdi:alert-circle-outline" class="size-5" />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle>Failed to load contractors</EmptyTitle>
              <EmptyDescription>
                There was an error loading the contractors. Please try again.
              </EmptyDescription>
            </EmptyContent>
            <Button variant="outline" size="sm" @click="refreshContractors">
              <Icon name="mdi:refresh" class="w-4 h-4 mr-2" />
              Retry
            </Button>
          </Empty>

          <!-- Empty State -->
          <Empty v-else-if="!hasResults">
            <EmptyMedia variant="icon">
              <Icon name="mdi:domain-off" class="size-5" />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle>No contractors found</EmptyTitle>
              <EmptyDescription>
                {{ selectedSpecialty ? 'No contractors match the selected specialty.' : 'Try adjusting your search or filters.' }}
              </EmptyDescription>
            </EmptyContent>
            <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
              Clear Filters
            </Button>
          </Empty>

          <!-- Results List -->
          <div v-else class="space-y-2">
            <ContractorResultItem
              v-for="contractor in contractors"
              :key="contractor.id"
              :contractor="contractor"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
