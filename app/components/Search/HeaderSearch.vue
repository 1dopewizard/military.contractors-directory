<!--
  @file Intelligent omnibar search with categorized results and context-aware actions
  @usage <HeaderSearch />
  @description Unified search that parses MOS codes, company names, clearance levels, and intent.
  - Categorized results: MOS Codes, Companies, Quick Actions
  - Sub-actions per result: View, Salaries, Interviews
  - "/" keyboard shortcut to focus
  - Intent detection: "25B salaries" → navigates to /salaries?mos=25B
-->

<script setup lang="ts">
import type {
  OmnibarResults,
  OmnibarMosResult,
  OmnibarCompanyResult,
  OmnibarActionResult,
  OmnibarAction,
} from '@/app/types/omnibar.types'

const logger = useLogger('HeaderSearch')
const router = useRouter()
const { getResults, parseQuery, getPrimaryNavigationUrl } = useOmnibar()

// Search state
const searchQuery = ref('')
const results = ref<OmnibarResults | null>(null)
const isSearching = ref(false)
const selectedIndex = ref(-1)
const hoveredActionIndex = ref<number | null>(null)
const searchInput = ref<{ $el: HTMLInputElement } | null>(null)
const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Branch logos for MOS results
const branchLogos: Record<string, string> = {
  'Army': '/logos/branches/army.svg',
  'Navy': '/logos/branches/navy.svg',
  'Air Force': '/logos/branches/air_force.svg',
  'Marine Corps': '/logos/branches/marines.svg',
  'Space Force': '/logos/branches/space_force.svg',
  'Coast Guard': '/logos/branches/coast_guard.svg',
}

// Computed states
const hasQuery = computed(() => searchQuery.value.trim().length > 0)
const hasMosResults = computed(() => (results.value?.mosResults.length ?? 0) > 0)
const hasCompanyResults = computed(() => (results.value?.companyResults.length ?? 0) > 0)
const hasActionResults = computed(() => (results.value?.actionResults.length ?? 0) > 0)
const hasResults = computed(() => hasMosResults.value || hasCompanyResults.value || hasActionResults.value)
const showNoResults = computed(() => hasQuery.value && !hasResults.value && !isSearching.value)

// Flatten all results for keyboard navigation
const flatResults = computed(() => {
  if (!results.value) return []
  return [
    ...results.value.mosResults.map((r, i) => ({ ...r, flatIndex: i, section: 'mos' as const })),
    ...results.value.companyResults.map((r, i) => ({
      ...r,
      flatIndex: results.value!.mosResults.length + i,
      section: 'company' as const,
    })),
    ...results.value.actionResults.map((r, i) => ({
      ...r,
      flatIndex: results.value!.mosResults.length + results.value!.companyResults.length + i,
      section: 'action' as const,
    })),
  ]
})

// Debounced search using omnibar
const performSearch = async () => {
  if (!hasQuery.value) {
    results.value = null
    isSearching.value = false
    return
  }

  isSearching.value = true
  const q = searchQuery.value.trim()

  try {
    logger.debug({ query: q }, 'Performing omnibar search')
    results.value = await getResults(q)
    selectedIndex.value = -1
    hoveredActionIndex.value = null
    logger.info(
      {
        query: q,
        mosCount: results.value.mosResults.length,
        companyCount: results.value.companyResults.length,
        actionCount: results.value.actionResults.length,
      },
      'Omnibar search completed'
    )
  } catch (error) {
    logger.error({ error, query: q }, 'Omnibar search failed')
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(performSearch, 250)

// Watch search query
watch(searchQuery, (newQuery) => {
  if (newQuery.trim().length > 0) {
    isSearching.value = true
    isOpen.value = true
  } else {
    isOpen.value = false
    results.value = null
  }
  debouncedSearch()
})

// Execute primary action for a result
const executePrimaryAction = (result: OmnibarMosResult | OmnibarCompanyResult | OmnibarActionResult) => {
  const primaryAction = result.actions.find(a => a.primary) || result.actions[0]
  if (primaryAction) {
    navigateTo(primaryAction.href)
  }
}

// Execute specific action
const executeAction = (action: OmnibarAction) => {
  navigateTo(action.href)
}

// Navigate and close
const navigateTo = (href: string) => {
  logger.info({ href }, 'Navigating from omnibar')
  searchQuery.value = ''
  isOpen.value = false
  selectedIndex.value = -1
  router.push(href)
}

// Handle Enter key - execute primary action based on context
const handleEnter = () => {
  const query = searchQuery.value.trim()

  if (!query) {
    router.push('/search')
    isOpen.value = false
    return
  }

  // If a result is selected, execute its primary action
  if (selectedIndex.value >= 0 && flatResults.value[selectedIndex.value]) {
    executePrimaryAction(flatResults.value[selectedIndex.value])
    return
  }

  // Otherwise, use smart navigation based on parsed query
  const parsed = parseQuery(query)
  const url = getPrimaryNavigationUrl(parsed)
  navigateTo(url)
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value || !hasResults.value) return

  const maxIndex = flatResults.value.length - 1

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex)
    hoveredActionIndex.value = null
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
    hoveredActionIndex.value = null
  } else if (event.key === 'Escape') {
    searchQuery.value = ''
    selectedIndex.value = -1
    hoveredActionIndex.value = null
    isOpen.value = false
    searchInput.value?.$el?.blur()
  } else if (event.key === 'Tab' && !event.shiftKey) {
    // Tab through actions when result is selected
    if (selectedIndex.value >= 0) {
      const currentResult = flatResults.value[selectedIndex.value]
      if (currentResult && currentResult.actions.length > 1) {
        event.preventDefault()
        const currentActionIdx = hoveredActionIndex.value ?? -1
        const nextIdx = (currentActionIdx + 1) % currentResult.actions.length
        hoveredActionIndex.value = nextIdx
      }
    }
  }
}

// Focus handler
const handleFocus = () => {
  if (hasQuery.value) {
    isOpen.value = true
  }
}

// Click outside handler
onClickOutside(containerRef, () => {
  isOpen.value = false
})

// "/" keyboard shortcut
onMounted(() => {
  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      e.preventDefault()
      searchInput.value?.$el?.focus()
    }
  })
})

// Get flat index for a result in a specific section
const getFlatIndex = (section: 'mos' | 'company' | 'action', index: number): number => {
  if (!results.value) return -1
  switch (section) {
    case 'mos':
      return index
    case 'company':
      return results.value.mosResults.length + index
    case 'action':
      return results.value.mosResults.length + results.value.companyResults.length + index
  }
}
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- Search Input -->
    <div class="relative group">
      <InputGroup
        class="h-9 w-48 lg:w-64 border-border/60 bg-muted/30 hover:bg-muted/50 transition-all duration-200 focus-within:border-primary/60 focus-within:bg-background focus-within:w-80"
      >
        <InputGroupAddon class="pl-2.5">
          <Icon
            name="mdi:magnify"
            class="size-4 text-muted-foreground/70 transition-colors duration-200 group-focus-within:text-primary"
          />
        </InputGroupAddon>
        <InputGroupInput
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search MOS, company, salaries..."
          class="h-full text-sm placeholder:text-muted-foreground/50"
          autocomplete="off"
          @keydown.enter="handleEnter"
          @keydown="handleKeydown"
          @focus="handleFocus"
        />
        <InputGroupAddon align="inline-end" class="pr-2">
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90"
          >
            <InputGroupButton
              v-if="searchQuery"
              variant="ghost"
              size="icon-xs"
              class="text-muted-foreground hover:text-primary hover:bg-transparent h-5 w-5"
              @click="
                searchQuery = '';
                searchInput?.$el?.focus()
              "
            >
              <Icon name="mdi:close-circle" class="size-4" />
            </InputGroupButton>
            <Kbd v-else class="hidden sm:inline-flex opacity-50 text-[10px] h-5">/</Kbd>
          </Transition>
        </InputGroupAddon>
      </InputGroup>
    </div>

    <!-- Results Dropdown -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="isOpen && hasQuery"
        class="absolute top-full mt-1.5 right-0 w-96 max-h-[75vh] overflow-hidden bg-popover border border-border shadow-lg z-50"
      >
        <!-- Results Header with detected context -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"> Results </span>
            <Spinner v-if="isSearching" class="size-3" />
          </div>
          <!-- Show detected context -->
          <div class="flex items-center gap-1.5">
            <Badge
              v-if="results?.query.mosCode"
              variant="secondary"
              class="text-[10px] px-1.5 py-0 h-5 font-mono"
            >
              <Icon name="mdi:shield-outline" class="size-3 mr-0.5" />
              {{ results.query.mosCode }}
            </Badge>
            <Badge
              v-if="results?.query.clearance"
              variant="secondary"
              class="text-[10px] px-1.5 py-0 h-5"
            >
              <Icon name="mdi:badge-account-outline" class="size-3 mr-0.5" />
              {{ results.query.clearance.replace(/_/g, '/') }}
            </Badge>
            <Badge
              v-if="results?.query.intent && results.query.intent !== 'search'"
              variant="outline"
              class="text-[10px] px-1.5 py-0 h-5 capitalize"
            >
              {{ results.query.intent }}
            </Badge>
          </div>
        </div>

        <!-- Scrollable Results -->
        <div class="overflow-y-auto max-h-[calc(75vh-4rem)]">
          <!-- MOS Results Section -->
          <template v-if="hasMosResults">
            <div class="px-3 py-1.5 bg-muted/20 border-b border-border/30">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                MOS Codes
              </span>
            </div>
            <div
              v-for="(result, index) in results?.mosResults"
              :key="result.id"
              class="group border-b border-border/20 last:border-b-0"
              :class="getFlatIndex('mos', index) === selectedIndex ? 'bg-primary/5' : ''"
              @mouseenter="selectedIndex = getFlatIndex('mos', index)"
            >
              <div class="flex items-start gap-2.5 px-3 py-2">
                <!-- MOS Icon/Logo -->
                <div class="w-8 h-8 bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
                  <img
                    v-if="branchLogos[result.mos.branch]"
                    :src="branchLogos[result.mos.branch]"
                    :alt="result.mos.branch"
                    class="w-5 h-5 object-contain opacity-70"
                  />
                  <Icon v-else name="mdi:shield-outline" class="w-4 h-4 text-muted-foreground" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="font-bold font-mono text-sm text-foreground">
                      {{ result.mos.code }}
                    </span>
                    <span class="text-[9px] px-1 py-0.5 bg-muted/80 text-muted-foreground font-medium tracking-wide">
                      {{ result.mos.branch }}
                    </span>
                  </div>
                  <p class="text-[11px] text-muted-foreground truncate mb-1.5">
                    {{ result.mos.title }}
                  </p>

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-1.5">
                    <NuxtLink
                      v-for="(action, actionIdx) in result.actions"
                      :key="action.href"
                      :to="action.href"
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all"
                      :class="[
                        action.primary
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-foreground hover:bg-muted/80 border border-border/50',
                        getFlatIndex('mos', index) === selectedIndex && hoveredActionIndex === actionIdx
                          ? 'ring-2 ring-primary ring-offset-1'
                          : '',
                      ]"
                      @click="
                        isOpen = false;
                        searchQuery = ''
                      "
                    >
                      <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
                      {{ action.label }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Company Results Section -->
          <template v-if="hasCompanyResults">
            <div class="px-3 py-1.5 bg-muted/20 border-b border-border/30">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Companies
              </span>
            </div>
            <div
              v-for="(result, index) in results?.companyResults"
              :key="result.id"
              class="group border-b border-border/20 last:border-b-0"
              :class="getFlatIndex('company', index) === selectedIndex ? 'bg-primary/5' : ''"
              @mouseenter="selectedIndex = getFlatIndex('company', index)"
            >
              <div class="flex items-start gap-2.5 px-3 py-2">
                <!-- Company Icon -->
                <div class="w-8 h-8 bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="mdi:office-building" class="w-4 h-4 text-muted-foreground" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm text-foreground truncate mb-1.5">
                    {{ result.company.name }}
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-1.5">
                    <NuxtLink
                      v-for="(action, actionIdx) in result.actions"
                      :key="action.href"
                      :to="action.href"
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all"
                      :class="[
                        action.primary
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-foreground hover:bg-muted/80 border border-border/50',
                        getFlatIndex('company', index) === selectedIndex && hoveredActionIndex === actionIdx
                          ? 'ring-2 ring-primary ring-offset-1'
                          : '',
                      ]"
                      @click="
                        isOpen = false;
                        searchQuery = ''
                      "
                    >
                      <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
                      {{ action.label }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Quick Actions Section -->
          <template v-if="hasActionResults">
            <div class="px-3 py-1.5 bg-muted/20 border-b border-border/30">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </span>
            </div>
            <NuxtLink
              v-for="(result, index) in results?.actionResults"
              :key="result.id"
              :to="result.actions[0]?.href || '/search'"
              class="flex items-center gap-2.5 px-3 py-2.5 transition-colors border-b border-border/20 last:border-b-0"
              :class="getFlatIndex('action', index) === selectedIndex ? 'bg-primary/5' : 'hover:bg-muted/30'"
              @mouseenter="selectedIndex = getFlatIndex('action', index)"
              @click="
                isOpen = false;
                searchQuery = ''
              "
            >
              <div class="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                <Icon v-if="result.icon" :name="result.icon" class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-foreground">
                  {{ result.label }}
                </div>
                <p v-if="result.sublabel" class="text-[11px] text-muted-foreground truncate">
                  {{ result.sublabel }}
                </p>
              </div>
              <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50 shrink-0" />
            </NuxtLink>
          </template>

          <!-- No Results -->
          <div v-if="showNoResults" class="py-8 text-center">
            <Icon name="mdi:magnify-close" class="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground mb-1">
              No results for "<span class="font-medium">{{ searchQuery }}</span>"
            </p>
            <p class="text-xs text-muted-foreground/70">
              Try a MOS code (e.g., 25B), company name, or add keywords like "salaries"
            </p>
          </div>

          <!-- Loading State -->
          <div v-else-if="isSearching && !hasResults" class="py-8 text-center">
            <Spinner class="size-6 mx-auto mb-3" />
            <p class="text-xs text-muted-foreground">Searching...</p>
          </div>
        </div>

        <!-- Footer with keyboard hints -->
        <div
          class="px-3 py-1.5 border-t border-border/30 bg-muted/20 text-[10px] text-muted-foreground/60 flex items-center justify-between"
        >
          <span>
            <Kbd class="mx-0.5">↑</Kbd><Kbd class="mx-0.5">↓</Kbd> navigate
            <span class="mx-1.5">·</span>
            <Kbd class="mx-0.5">Enter</Kbd> select
          </span>
          <span v-if="results?.query.intent" class="text-primary/70">
            <Icon name="mdi:lightning-bolt" class="size-3 inline" />
            Smart: {{ results.query.intent }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>
