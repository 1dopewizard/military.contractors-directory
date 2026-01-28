<!--
  @file Companies browse page
  @route /companies
  @description Browse defense contractors with search, specialty filter, and sorting
  @urlparams q - Search query, specialty - Specialty filter, sort - Sort order
-->

<script setup lang="ts">
const logger = useLogger('ContractorsBrowsePage')
const route = useRoute()
const router = useRouter()

useHead({
  title: 'Defense Contractors | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse U.S. defense contractors. Filter by specialty, location, and explore company profiles.',
    },
  ],
})

const searchQuery = ref((route.query.q as string) || '')
const selectedSpecialty = ref((route.query.specialty as string) || '')
const selectedLocation = ref((route.query.location as string) || '')
const sortBy = ref((route.query.sort as string) || 'revenue')

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

const contractorsUrl = computed(() => {
  const params = new URLSearchParams()
  if (searchQuery.value) params.set('q', searchQuery.value)
  if (selectedSpecialty.value) params.set('specialty', selectedSpecialty.value)
  if (selectedLocation.value) params.set('location', selectedLocation.value)
  if (sortBy.value) params.set('sort', sortBy.value)
  params.set('limit', '100')
  return `/api/contractors?${params.toString()}`
})

const { data: contractorsData, pending: contractorsPending, error: contractorsError, refresh: refreshContractors } = useFetch<ContractorResponse>(
  contractorsUrl,
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0, limit: 100, offset: 0 }),
  }
)

const { data: specialtiesData } = useFetch<{ specialties: Specialty[] }>('/api/specialties?includeCounts=true', {
  lazy: true,
  default: () => ({ specialties: [] }),
})

const contractors = computed(() => contractorsData.value?.contractors ?? [])
const totalCount = computed(() => contractorsData.value?.total ?? 0)
const hasResults = computed(() => contractors.value.length > 0)
const specialties = computed(() => specialtiesData.value?.specialties ?? [])

const locationOptions = [
  { name: 'Virginia', slug: 'virginia' },
  { name: 'California', slug: 'california' },
  { name: 'Texas', slug: 'texas' },
  { name: 'Maryland', slug: 'maryland' },
  { name: 'Florida', slug: 'florida' },
  { name: 'Arizona', slug: 'arizona' },
  { name: 'Colorado', slug: 'colorado' },
  { name: 'Massachusetts', slug: 'massachusetts' },
  { name: 'Connecticut', slug: 'connecticut' },
  { name: 'Alabama', slug: 'alabama' },
  { name: 'Georgia', slug: 'georgia' },
  { name: 'Ohio', slug: 'ohio' },
  { name: 'Pennsylvania', slug: 'pennsylvania' },
  { name: 'New York', slug: 'new-york' },
  { name: 'Washington', slug: 'washington' },
  { name: 'District of Columbia', slug: 'district-of-columbia' },
]

const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!selectedSpecialty.value || !!selectedLocation.value || sortBy.value !== 'revenue'
)

const sortOptions = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'name', label: 'Name' },
]

const syncFiltersToUrl = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedSpecialty.value) query.specialty = selectedSpecialty.value
  if (selectedLocation.value) query.location = selectedLocation.value
  if (sortBy.value && sortBy.value !== 'revenue') query.sort = sortBy.value
  router.replace({ query })
}

const handleSearch = (e: Event) => {
  e.preventDefault()
  syncFiltersToUrl()
}

const clearSearch = () => {
  searchQuery.value = ''
  syncFiltersToUrl()
}

const applySpecialtyFilter = (value: string) => {
  selectedSpecialty.value = value === 'ANY' ? '' : value
  syncFiltersToUrl()
}

const applyLocationFilter = (value: string) => {
  selectedLocation.value = value === 'ANY' ? '' : value
  syncFiltersToUrl()
}

const applySort = (value: string) => {
  sortBy.value = value
  syncFiltersToUrl()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedSpecialty.value = ''
  selectedLocation.value = ''
  sortBy.value = 'revenue'
  syncFiltersToUrl()
}

const selectedSpecialtyName = computed(() => {
  if (!selectedSpecialty.value) return null
  const specialty = specialties.value.find((s) => s.slug === selectedSpecialty.value)
  return specialty?.name || null
})

const selectedLocationName = computed(() => {
  if (!selectedLocation.value) return null
  const location = locationOptions.find((l) => l.slug === selectedLocation.value)
  return location?.name || null
})

watch(
  () => route.query,
  (newQuery) => {
    const newQ = (newQuery.q as string) || ''
    const newSpecialty = (newQuery.specialty as string) || ''
    const newLocation = (newQuery.location as string) || ''
    const newSort = (newQuery.sort as string) || 'revenue'

    if (
      newQ !== searchQuery.value ||
      newSpecialty !== selectedSpecialty.value ||
      newLocation !== selectedLocation.value ||
      newSort !== sortBy.value
    ) {
      searchQuery.value = newQ
      selectedSpecialty.value = newSpecialty
      selectedLocation.value = newLocation
      sortBy.value = newSort
    }
  }
)

watchEffect(() => {
  if (contractors.value.length > 0) {
    logger.info({ count: contractors.value.length }, 'Contractors loaded')
  }
})
</script>

<template>
  <div class="min-h-full">
    <!-- Search and Filter Header -->
    <div class="top-0 z-40 sticky bg-background/95 backdrop-blur-sm border-border/50 border-b">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl container">
        <!-- Search Bar -->
        <div class="py-4">
          <form @submit="handleSearch" class="max-w-2xl">
            <InputGroup class="shadow-none rounded-none h-10">
              <InputGroupAddon align="inline-start" class="pl-3">
                <Icon name="mdi:magnify" class="w-4 h-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                v-model="searchQuery"
                placeholder="Search contractors..."
                class="text-sm"
              />
              <InputGroupButton
                v-if="searchQuery"
                variant="ghost"
                type="button"
                class="px-2"
                @click="clearSearch"
              >
                <Icon name="mdi:close" class="w-4 h-4" />
              </InputGroupButton>
              <InputGroupButton variant="ghost" type="submit" class="px-3 h-full">
                <Icon name="mdi:arrow-right" class="w-4 h-4" />
              </InputGroupButton>
            </InputGroup>
          </form>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-2 pb-3">
          <!-- Result count -->
          <span v-if="totalCount > 0" class="mr-2 text-muted-foreground text-sm">
            {{ totalCount }} {{ totalCount === 1 ? 'contractor' : 'contractors' }}
          </span>

          <!-- Specialty Filter -->
          <Select :model-value="selectedSpecialty || 'ANY'" @update:model-value="(v) => applySpecialtyFilter(String(v))">
            <SelectTrigger class="gap-1 bg-background/50 px-2 border-border/50 w-auto h-7 text-xs">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Specialty</SelectItem>
              <SelectItem v-for="specialty in specialties" :key="specialty.slug" :value="specialty.slug">
                {{ specialty.name }}
                <span v-if="specialty.contractorCount" class="ml-1 text-muted-foreground">
                  ({{ specialty.contractorCount }})
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Location Filter -->
          <Select :model-value="selectedLocation || 'ANY'" @update:model-value="(v) => applyLocationFilter(String(v))">
            <SelectTrigger class="gap-1 bg-background/50 px-2 border-border/50 w-auto h-7 text-xs">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Location</SelectItem>
              <SelectItem v-for="location in locationOptions" :key="location.slug" :value="location.slug">
                {{ location.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Sort -->
          <Select :model-value="sortBy" @update:model-value="(v) => applySort(String(v))">
            <SelectTrigger class="gap-1 bg-background/50 px-2 border-border/50 w-auto h-7 text-xs">
              <span class="mr-1 text-muted-foreground">Sort:</span>
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
            class="px-2 h-7 text-muted-foreground hover:text-foreground text-xs"
            @click="resetFilters"
          >
            <Icon name="mdi:close" class="mr-1 w-3 h-3" />
            Clear
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl container">
      <div class="flex lg:flex-row flex-col gap-6">
        <!-- Left Column: Results -->
        <div class="flex-1 lg:pr-24 min-w-0 max-w-3xl">
          <!-- Active Filter Badges -->
          <div v-if="selectedSpecialtyName || selectedLocationName" class="mb-4">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="text-muted-foreground">Filtered by:</span>
              <Badge v-if="selectedSpecialtyName" variant="secondary" class="flex items-center gap-1">
                {{ selectedSpecialtyName }}
                <button
                  class="ml-1 hover:text-destructive transition-colors"
                  @click="applySpecialtyFilter('ANY')"
                >
                  <Icon name="mdi:close" class="w-3 h-3" />
                </button>
              </Badge>
              <Badge v-if="selectedLocationName" variant="secondary" class="flex items-center gap-1">
                {{ selectedLocationName }}
                <button
                  class="ml-1 hover:text-destructive transition-colors"
                  @click="applyLocationFilter('ANY')"
                >
                  <Icon name="mdi:close" class="w-3 h-3" />
                </button>
              </Badge>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="contractorsPending" class="flex justify-center py-12">
            <LoadingText text="Loading contractors" />
          </div>

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
              <Icon name="mdi:refresh" class="mr-2 w-4 h-4" />
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
                {{ selectedSpecialty ? 'No contractors match the selected filters.' : 'Try adjusting your search or filters.' }}
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
