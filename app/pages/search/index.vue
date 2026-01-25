<!--
  @file Search results page (SERP)
  @route /search
  @description MOS-aware search page - discover companies that hire your military specialty
-->

<script setup lang="ts">
// Components are auto-imported by Nuxt from app/components/

const logger = useLogger('SearchPage')

const {
  query,
  queryType,
  resultType,
  resolvedMos,
  mosVariants,
  companyResults,
  total,
  hasMore,
  message,
  isLoading,
  error,
  theater,
  domain,
  sort,
  currentPage,
  totalPages,
  hasResults,
  isEmpty,
  isBrowseMode,
  hasActiveFilters,
  initFromUrl,
  search,
  goToPage,
  resetFilters,
  applyFilter,
  selectBranch,
} = useSearch()

const route = useRoute()

// Initialize from URL on mount - always search (empty query = browse mode)
onMounted(async () => {
  initFromUrl()
  await search()
})

// Watch for route query changes (e.g., clicking Similar Specialties, browser back/forward)
// Only trigger search if the URL query differs from our current state (avoids double-fire from updateUrl)
watch(() => route.query.q, async (newQ) => {
  const urlQuery = (newQ as string) || ''
  if (urlQuery !== query.value) {
    initFromUrl()
    await search()
  }
})

// Computed to control sidebar visibility (avoids deep type instantiation in template)
const showSidebar = computed(() => Boolean(resolvedMos.value) || hasResults.value || isBrowseMode.value)

// SEO
useHead(() => ({
  title: query.value 
    ? `${query.value} - Companies | military.contractors` 
    : isBrowseMode.value 
      ? 'Browse Defense Contractors | military.contractors'
      : 'Find Contractors | military.contractors',
  meta: [
    {
      name: 'description',
      content: query.value 
        ? `Companies hiring ${query.value} - ${total.value} defense contractors found`
        : 'Discover defense contractors that hire your military specialty. Search by MOS code.',
    },
  ],
}))
</script>

<template>
  <div class="min-h-full">
    <!-- Filter Bar -->
    <div class="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <SearchablePageHeader>
      <template #filters>
        <!-- Filters -->
        <div v-if="hasResults || hasActiveFilters || isBrowseMode" class="flex flex-wrap items-center gap-2">
          <!-- Result count -->
          <span v-if="total > 0" class="text-sm text-muted-foreground mr-2">
            {{ total }} compan{{ total !== 1 ? 'ies' : 'y' }}
          </span>
          
          <!-- Theater -->
          <Select :model-value="theater" @update:model-value="(v) => applyFilter('theater', String(v))">
            <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
              <SelectValue placeholder="Theater" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Theater</SelectItem>
              <SelectItem value="CENTCOM">CENTCOM</SelectItem>
              <SelectItem value="EUCOM">EUCOM</SelectItem>
              <SelectItem value="INDOPACOM">INDOPACOM</SelectItem>
              <SelectItem value="AFRICOM">AFRICOM</SelectItem>
              <SelectItem value="SOUTHCOM">SOUTHCOM</SelectItem>
            </SelectContent>
          </Select>

          <!-- Domain -->
          <Select :model-value="domain" @update:model-value="(v) => applyFilter('domain', String(v))">
            <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Domain</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Intelligence">Intelligence</SelectItem>
              <SelectItem value="Cyber">Cyber</SelectItem>
              <SelectItem value="Logistics">Logistics</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Medical">Medical</SelectItem>
              <SelectItem value="Aviation">Aviation</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Base Operations">Base Operations</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Sort -->
          <Select :model-value="sort" @update:model-value="(v) => applyFilter('sort', String(v))">
            <SelectTrigger class="w-auto h-7 px-2 bg-background/50 border-border/50 text-xs gap-1">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best Match</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
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
          <div v-if="isLoading">
            <CompanyResultSkeleton :count="5" />
          </div>

          <!-- Error State -->
          <Card v-else-if="error" class="border-none bg-destructive/5">
            <CardContent class="py-12 text-center">
              <!-- Network Error -->
              <template v-if="error.type === 'network'">
                <Icon name="mdi:wifi-off" class="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p class="text-foreground font-medium mb-2">No internet connection</p>
                <p class="text-sm text-muted-foreground mb-4">
                  Check your connection and try again
                </p>
              </template>
              
              <!-- Timeout Error -->
              <template v-else-if="error.type === 'timeout'">
                <Icon name="mdi:timer-sand-empty" class="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p class="text-foreground font-medium mb-2">Request timed out</p>
                <p class="text-sm text-muted-foreground mb-4">
                  The search is taking too long. Please try again.
                </p>
              </template>
              
              <!-- Server Error -->
              <template v-else-if="error.type === 'server'">
                <Icon name="mdi:server-off" class="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p class="text-foreground font-medium mb-2">Something went wrong</p>
                <p class="text-sm text-muted-foreground mb-4">
                  Our servers are having trouble. Please try again in a moment.
                </p>
              </template>
              
              <!-- Unknown/Generic Error -->
              <template v-else>
                <Icon name="mdi:alert-circle-outline" class="w-10 h-10 text-destructive mx-auto mb-4" />
                <p class="text-foreground font-medium mb-2">Search failed</p>
                <p class="text-sm text-muted-foreground mb-4">
                  An unexpected error occurred. Please try again.
                </p>
              </template>
              
              <Button variant="ghost" size="sm" @click="search()">
                <Icon name="mdi:refresh" class="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>

          <!-- Empty State (no search yet) -->
          <Empty v-else-if="!queryType">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="mdi:magnify" />
              </EmptyMedia>
              <EmptyTitle>Discover who hires your MOS</EmptyTitle>
              <EmptyDescription>
                Enter a MOS code like <span class="font-mono font-medium">25B</span> to find defense contractors that hire your specialty, or press Enter to browse all companies
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <!-- No Results State -->
          <Empty v-else-if="isEmpty">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="mdi:office-building-outline" />
              </EmptyMedia>
              <EmptyTitle>No companies found</EmptyTitle>
              <EmptyDescription>
                {{ message || 'Try different keywords or adjust your filters' }}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div class="flex items-center gap-2">
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
                  Clear Filters
                </Button>
                <Button as-child variant="ghost" size="sm">
                  <NuxtLink to="/">Back to Home</NuxtLink>
                </Button>
              </div>
            </EmptyContent>
          </Empty>

          <!-- Results List -->
          <div v-else-if="hasResults">
            <div v-if="message && companyResults.length > 0" class="p-3 mb-4 bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
              <Icon name="mdi:information-outline" class="w-4 h-4 inline-block mr-2" />
              {{ message }}
            </div>

            <CompanySearchResultCard
              v-for="company in companyResults"
              :key="company.company_id"
              :company="company"
              :mos-code="resolvedMos?.code"
            />
          </div>

          <!-- Pagination -->
          <div v-if="hasResults && totalPages > 1" class="mt-6 pt-6 border-t border-border/50">
            <div class="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
                class="h-8"
              >
                <Icon name="mdi:chevron-left" class="w-4 h-4" />
                <span class="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <span class="font-medium text-foreground">{{ currentPage }}</span>
                <span>/</span>
                <span>{{ totalPages }}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
                class="h-8"
              >
                <span class="hidden sm:inline mr-1">Next</span>
                <Icon name="mdi:chevron-right" class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <SearchSidebar 
          v-if="showSidebar" 
          :sticky="!resolvedMos"
          :ad-context="{
            mosCode: resolvedMos?.code,
          }"
        >
          <template #top>
            <MosProfile 
              v-if="resolvedMos"
              :mos="resolvedMos"
              :variants="mosVariants"
              result-label="companies"
              @select-branch="selectBranch"
            />
          </template>
          
          <template #bottom>
            <!-- Job Alert Signup (when MOS search) -->
            <MosAlertSignup 
              v-if="resolvedMos"
              :mos-code="resolvedMos.code" 
              :mos-title="resolvedMos.title"
              :branch="resolvedMos.branch"
            />
            
            <!-- Company Quick Links -->
            <CompanyQuickLinks />
          </template>
        </SearchSidebar>
      </div>
    </div>
  </div>
</template>
