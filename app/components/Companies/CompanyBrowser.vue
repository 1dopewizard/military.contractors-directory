<!--
  @file Company browser component
  @usage <CompanyBrowser />
  @description Browse all defense contractors with tab-based theater navigation, domain filtering, and grid/list views
-->

<script setup lang="ts">
import { useLogger } from '@/app/composables/useLogger'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useBrowserFilters } from '@/app/composables/useBrowserFilters'
import type { Company } from '@/app/types/company.types'

const logger = useLogger('CompanyBrowser')
const { allCompanies, getAllCompanies, filterCompanies } = useCompanies()

const {
  searchQuery,
  primaryFilter: selectedTheater,
  secondaryFilter: selectedDomain,
  viewMode,
  isReady,
  setPrimaryFilter,
  setSecondaryFilter,
  clearSecondaryFilter,
  setViewMode,
  resetFilters: resetBrowserFilters
} = useBrowserFilters({
  defaultPrimary: '',
  defaultSecondary: ''
})

// Data computations
const availableTheaters = computed(() => {
  const theaters = new Set<string>()
  allCompanies.value.forEach((company) => {
    company.theaters.forEach((theater) => theaters.add(theater))
  })
  return Array.from(theaters).sort()
})

const availableDomains = computed(() => {
  const domains = new Set<string>()
  allCompanies.value.forEach((company) => {
    company.domains.forEach((domain) => domains.add(domain))
  })
  return Array.from(domains).sort()
})

// Filtered results
const filteredCompanies = ref<Company[]>([])
const isLoadingCompanies = ref(true)
const isInitialLoad = ref(true)

// Watch filters and fetch companies
watchEffect(async () => {
  isLoadingCompanies.value = true
  try {
    const companies = await filterCompanies({
      searchQuery: searchQuery.value,
      theater: selectedTheater.value,
      domain: selectedDomain.value
    })
    filteredCompanies.value = companies
  } catch (error) {
    logger.error({ error }, 'Failed to filter companies')
    filteredCompanies.value = []
  } finally {
    isLoadingCompanies.value = false
    isInitialLoad.value = false
  }
})

const resetFilters = () => {
  resetBrowserFilters()
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Total count for display
const totalCount = computed(() => allCompanies.value.length)
const filteredCount = computed(() => filteredCompanies.value.length)

// Active filter indicator
const hasActiveFilters = computed(() => 
  !!searchQuery.value || !!selectedTheater.value || !!selectedDomain.value
)

// Log mount and fetch initial data for filters
onMounted(async () => {
  logger.info('CompanyBrowser loaded')
  if (allCompanies.value.length === 0) {
    await getAllCompanies()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Control Panel -->
    <div class="sticky top-4 z-30">
      <div class="bg-background/95 backdrop-blur-md border border-border/40 overflow-hidden supports-[backdrop-filter]:bg-background/80">
        <div class="p-4">
          <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <!-- Search Input -->
            <div class="relative flex-1 lg:max-w-md group">
              <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name or domain..."
                class="pl-10 h-10 bg-muted/20 border-border/40 focus:bg-background focus:border-primary/50 transition-all"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                @click="clearSearch"
              >
                <Icon name="mdi:close" class="w-4 h-4" />
              </button>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Theater Select -->
              <Select 
                :model-value="selectedTheater || 'all'" 
                @update:model-value="(v) => { setPrimaryFilter(v === 'all' ? '' : (v as string)); clearSecondaryFilter() }"
              >
                <SelectTrigger class="w-[160px] h-10 bg-muted/20 border-border/40 text-sm">
                  <div class="flex items-center gap-2">
                    <Icon name="mdi:earth" class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Theater" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Theaters</SelectItem>
                  <SelectSeparator />
                  <SelectItem
                    v-for="theater in availableTheaters"
                    :key="theater"
                    :value="theater"
                  >
                    {{ theater }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Domain Select -->
              <Select 
                :model-value="selectedDomain || 'all'"
                @update:model-value="(v) => setSecondaryFilter(v === 'all' ? '' : (v as string))"
              >
                <SelectTrigger class="w-[160px] h-10 bg-muted/20 border-border/40 text-sm">
                  <div class="flex items-center gap-2 truncate">
                    <Icon name="mdi:briefcase-variant-outline" class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Domain" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectSeparator />
                  <SelectItem
                    v-for="domain in availableDomains"
                    :key="domain"
                    :value="domain"
                  >
                    {{ domain }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Divider -->
              <div class="h-6 w-px bg-border/50 hidden md:block"></div>

              <!-- View Toggle -->
              <div class="flex items-center bg-muted/30 p-0.5 border border-border/40">
                <button
                  class="p-1.5 transition-all"
                  :class="viewMode === 'grid' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'"
                  @click="setViewMode('grid')"
                  title="Grid View"
                >
                  <Icon name="mdi:view-grid-outline" class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 transition-all"
                  :class="viewMode === 'list' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'"
                  @click="setViewMode('list')"
                  title="List View"
                >
                  <Icon name="mdi:view-list-outline" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="px-4 py-2 bg-muted/20 border-t border-border/30 flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <span class="text-muted-foreground font-mono">
              <span class="text-foreground font-semibold">{{ filteredCount }}</span><span v-if="hasActiveFilters"> of {{ totalCount }}</span>&nbsp;{{ filteredCount === 1 ? 'company' : 'companies' }}
            </span>
            <Button
              v-if="hasActiveFilters"
              variant="ghost"
              size="sm"
              class="h-5 px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
              @click="resetFilters"
            >
              Clear filters
            </Button>
          </div>
          <div v-if="searchQuery" class="text-muted-foreground">
            Results for "<span class="text-foreground">{{ searchQuery }}</span>"
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="min-h-[400px]">
      <!-- Loading State -->
      <div v-if="isInitialLoad || (isLoadingCompanies && filteredCompanies.length === 0)">
        <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'">
          <div 
            v-for="n in 6" 
            :key="n"
            class="bg-card border border-border/40 overflow-hidden animate-pulse"
            :class="viewMode === 'list' ? '' : 'h-[180px]'"
          >
            <div class="p-5 space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-2 flex-1">
                  <div class="h-5 bg-muted/60 w-3/4"></div>
                  <div class="h-3 bg-muted/40 w-1/3"></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="h-3 bg-muted/40 w-full"></div>
                <div class="h-3 bg-muted/40 w-5/6"></div>
              </div>
              <div class="flex gap-2 pt-1">
                <div class="h-5 bg-muted/30 w-16"></div>
                <div class="h-5 bg-muted/30 w-20"></div>
                <div class="h-5 bg-muted/30 w-14"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="filteredCompanies.length > 0">
        <TransitionGroup
          v-if="isReady"
          appear
          tag="div"
          :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'"
          enter-active-class="transition-opacity duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150 ease-in absolute"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
          move-class="transition-transform duration-200 ease-out"
        >
          <NuxtLink
            v-for="company in filteredCompanies"
            :key="company.id"
            :to="`/companies/${company.slug}`"
            class="block group"
          >
            <!-- Grid View Card -->
            <Card
              v-if="viewMode === 'grid'"
              class="h-full bg-card border-border/40 hover:border-primary/40 transition-all duration-200 overflow-hidden"
            >
              <CardContent class="p-5 flex flex-col h-full gap-4">
                <!-- Header -->
                <div class="space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                      {{ company.name }}
                    </h3>
                    <Icon 
                      name="mdi:arrow-top-right" 
                      class="w-4 h-4 text-muted-foreground/0 group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
                    />
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    <Icon name="mdi:check-decagram" class="w-3 h-3 text-primary/70" />
                    Verified Contractor
                  </div>
                </div>

                <!-- Summary -->
                <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {{ company.summary }}
                </p>

                <!-- Footer -->
                <div class="space-y-3 pt-2 border-t border-border/30">
                  <!-- Domains -->
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Badge
                      v-for="domain in company.domains.slice(0, 3)"
                      :key="domain"
                      variant="secondary"
                      class="text-[10px] px-2 py-0.5 h-5 bg-muted/40 text-muted-foreground border-0 font-medium"
                    >
                      {{ domain }}
                    </Badge>
                    <span v-if="company.domains.length > 3" class="text-[10px] text-muted-foreground/70">
                      +{{ company.domains.length - 3 }}
                    </span>
                  </div>
                  <!-- Theaters -->
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">{{ company.theaters.join(' · ') }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- List View Card -->
            <Card
              v-else
              class="bg-card border-border/40 hover:border-primary/40 transition-all duration-200 overflow-hidden"
            >
              <CardContent class="p-4 flex items-center gap-6">
                <!-- Company Info -->
                <div class="w-56 shrink-0 space-y-1">
                  <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                    {{ company.name }}
                  </h3>
                  <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    <Icon name="mdi:check-decagram" class="w-3 h-3 text-primary/70" />
                    Verified
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 border-l border-border/30 pl-6">
                  <p class="text-sm text-muted-foreground line-clamp-1 leading-relaxed mb-2">
                    {{ company.summary }}
                  </p>
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge
                      v-for="domain in company.domains.slice(0, 3)"
                      :key="domain"
                      variant="secondary"
                      class="text-[10px] px-2 py-0.5 h-5 bg-muted/40 text-muted-foreground border-0 font-medium"
                    >
                      {{ domain }}
                    </Badge>
                    <span v-if="company.domains.length > 3" class="text-[10px] text-muted-foreground/70">
                      +{{ company.domains.length - 3 }}
                    </span>
                    <span class="text-muted-foreground/30 mx-1">·</span>
                    <div class="flex items-center gap-1 text-xs text-muted-foreground/80">
                      <Icon name="mdi:map-marker-outline" class="w-3 h-3" />
                      <span>{{ company.theaters.join(' · ') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Arrow -->
                <div class="shrink-0 text-muted-foreground/20 group-hover:text-primary transition-colors">
                  <Icon name="mdi:chevron-right" class="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </NuxtLink>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div v-else class="py-12 text-center border border-dashed border-primary/20 rounded-lg">
        <Icon 
          :name="searchQuery ? 'mdi:magnify-close' : 'mdi:office-building-outline'" 
          class="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" 
        />
        <p class="text-foreground font-medium mb-2">
          {{ searchQuery ? 'No matches found' : 'No companies found' }}
        </p>
        <p class="text-sm text-muted-foreground mb-4">
          <template v-if="searchQuery">
            Try a different search term.
          </template>
          <template v-else>
            No companies match the selected filters.
          </template>
        </p>
        <Button variant="ghost" size="sm" @click="searchQuery ? clearSearch() : resetFilters()">
          {{ searchQuery ? 'Clear Search' : 'Reset Filters' }}
        </Button>
      </div>
    </div>
  </div>
</template>