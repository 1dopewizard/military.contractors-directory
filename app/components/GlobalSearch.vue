<!--
  @file GlobalSearch.vue
  @description Command palette style search for contractors with live results
-->
<script setup lang="ts">
interface ContractorResult {
  id: string
  slug: string
  name: string
  headquarters: string | null
  defenseNewsRank: number | null
  logoUrl: string | null
}

interface SearchResponse {
  contractors: ContractorResult[]
  pagination: { total: number }
}

const router = useRouter()

// Search state
const open = defineModel<boolean>('open', { default: false })
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<ContractorResult[]>([])
const totalResults = ref(0)

// Recent searches (persisted in localStorage)
const RECENT_SEARCHES_KEY = 'mc-recent-searches'
const MAX_RECENT = 5

const recentSearches = ref<string[]>([])

onMounted(() => {
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
  if (stored) {
    try {
      recentSearches.value = JSON.parse(stored)
    } catch {
      recentSearches.value = []
    }
  }
})

const saveRecentSearch = (query: string) => {
  if (!query.trim()) return
  const filtered = recentSearches.value.filter(s => s.toLowerCase() !== query.toLowerCase())
  recentSearches.value = [query, ...filtered].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.value))
}

const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

// Debounced search
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (!query.trim()) {
    searchResults.value = []
    totalResults.value = 0
    isSearching.value = false
    return
  }

  isSearching.value = true
  try {
    const response = await $fetch<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}&limit=6`)
    searchResults.value = response.contractors
    totalResults.value = response.pagination.total
  } catch {
    searchResults.value = []
    totalResults.value = 0
  } finally {
    isSearching.value = false
  }
}, 200)

watch(searchQuery, (query) => {
  if (query.trim()) {
    isSearching.value = true
    debouncedSearch(query)
  } else {
    searchResults.value = []
    totalResults.value = 0
    isSearching.value = false
  }
})

// Navigation handlers
const navigateToContractor = (slug: string) => {
  if (searchQuery.value.trim()) {
    saveRecentSearch(searchQuery.value.trim())
  }
  open.value = false
  searchQuery.value = ''
  router.push(`/contractors/${slug}`)
}

const navigateToSearch = (query?: string) => {
  const q = query || searchQuery.value.trim()
  if (q) {
    saveRecentSearch(q)
  }
  open.value = false
  searchQuery.value = ''
  router.push(q ? `/contractors?q=${encodeURIComponent(q)}` : '/contractors')
}

const handleRecentSearch = (query: string) => {
  searchQuery.value = query
}

// Global keyboard shortcut (Cmd+K / Ctrl+K)
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      open.value = !open.value
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Reset search when closing
watch(open, (isOpen) => {
  if (!isOpen) {
    searchQuery.value = ''
    searchResults.value = []
  }
})

// Specialties for quick browse
const specialtyLinks = [
  { slug: 'aerospace-defense', name: 'Aerospace', icon: 'mdi:airplane' },
  { slug: 'cybersecurity-it', name: 'Cybersecurity', icon: 'mdi:shield-lock' },
  { slug: 'intelligence-analytics', name: 'Intelligence', icon: 'mdi:brain' },
  { slug: 'space-systems', name: 'Space', icon: 'mdi:rocket-launch' },
]

const browseBySpecialty = (slug: string) => {
  open.value = false
  searchQuery.value = ''
  router.push(`/contractors?specialty=${slug}`)
}
</script>

<template>
  <CommandDialog v-model:open="open">
    <div class="flex items-center px-3 border-b">
      <Icon name="mdi:magnify" class="opacity-50 mr-2 w-4 h-4 shrink-0" />
      <input
        v-model="searchQuery"
        placeholder="Search contractors..."
        class="flex bg-transparent disabled:opacity-50 py-3 rounded-md outline-none w-full h-11 placeholder:text-muted-foreground text-sm disabled:cursor-not-allowed"
        @keydown.enter="navigateToSearch()"
      />
      <Kbd v-if="!searchQuery" class="hidden sm:inline-flex ml-2">ESC</Kbd>
    </div>
    
    <CommandList class="h-[320px] max-h-[320px]">
      <!-- Loading state -->
      <div v-if="isSearching" class="py-6 text-muted-foreground text-sm text-center">
        <Icon name="mdi:loading" class="inline mr-2 w-4 h-4 animate-spin" />
        Searching...
      </div>

      <!-- Search results -->
      <template v-else-if="searchQuery.trim()">
        <CommandEmpty v-if="searchResults.length === 0">
          No contractors found for "{{ searchQuery }}"
        </CommandEmpty>
        
        <CommandGroup v-if="searchResults.length > 0" heading="Contractors">
          <CommandItem
            v-for="contractor in searchResults"
            :key="contractor.id"
            :value="contractor.slug"
            class="cursor-pointer"
            @select="navigateToContractor(contractor.slug)"
          >
            <div class="flex items-center gap-3 w-full">
              <div class="flex justify-center items-center bg-muted rounded w-8 h-8 shrink-0">
                <img
                  v-if="contractor.logoUrl"
                  :src="contractor.logoUrl"
                  :alt="contractor.name"
                  class="w-6 h-6 object-contain"
                />
                <Icon v-else name="mdi:domain" class="w-4 h-4 text-muted-foreground" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ contractor.name }}</div>
                <div v-if="contractor.headquarters" class="text-muted-foreground text-xs truncate">
                  {{ contractor.headquarters }}
                </div>
              </div>
              <Badge v-if="contractor.defenseNewsRank" variant="secondary" class="shrink-0">
                #{{ contractor.defenseNewsRank }}
              </Badge>
            </div>
          </CommandItem>
        </CommandGroup>

        <!-- View all results -->
        <div v-if="totalResults > searchResults.length" class="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            class="justify-center w-full text-muted-foreground"
            @click="navigateToSearch()"
          >
            View all {{ totalResults }} results
            <Icon name="mdi:arrow-right" class="ml-2 w-4 h-4" />
          </Button>
        </div>
      </template>

      <!-- Default state: recent searches + browse -->
      <template v-else>
        <!-- Recent searches -->
        <CommandGroup v-if="recentSearches.length > 0" heading="Recent Searches">
          <CommandItem
            v-for="query in recentSearches"
            :key="query"
            :value="`recent-${query}`"
            class="cursor-pointer"
            @select="handleRecentSearch(query)"
          >
            <Icon name="mdi:history" class="mr-2 w-4 h-4 text-muted-foreground" />
            <span>{{ query }}</span>
          </CommandItem>
          <div class="px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              class="h-6 text-muted-foreground hover:text-foreground text-xs"
              @click="clearRecentSearches"
            >
              Clear recent
            </Button>
          </div>
        </CommandGroup>

        <CommandSeparator v-if="recentSearches.length > 0" />

        <!-- Quick browse -->
        <CommandGroup heading="Browse by Specialty">
          <CommandItem
            v-for="specialty in specialtyLinks"
            :key="specialty.slug"
            :value="`specialty-${specialty.slug}`"
            class="cursor-pointer"
            @select="browseBySpecialty(specialty.slug)"
          >
            <Icon :name="specialty.icon" class="mr-2 w-4 h-4 text-muted-foreground" />
            <span>{{ specialty.name }}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <!-- Quick actions -->
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="browse-all"
            class="cursor-pointer"
            @select="navigateToSearch('')"
          >
            <Icon name="mdi:view-list" class="mr-2 w-4 h-4 text-muted-foreground" />
            <span>Browse all contractors</span>
          </CommandItem>
          <CommandItem
            value="top-100"
            class="cursor-pointer"
            @select="() => { open = false; router.push('/top-defense-contractors') }"
          >
            <Icon name="mdi:trophy-outline" class="mr-2 w-4 h-4 text-muted-foreground" />
            <span>View Top 100</span>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
  </CommandDialog>
</template>
