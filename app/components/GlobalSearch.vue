<!--
  @file GlobalSearch.vue
  @description Command palette style search for contractors with live results
-->
<script setup lang="ts">
interface ContractorResult {
  id: string;
  slug: string;
  name: string;
  headquarters: string | null;
  defenseNewsRank: number | null;
  logoUrl: string | null;
}

interface SearchResponse {
  contractors: ContractorResult[];
  pagination: { total: number };
}

const router = useRouter();

// Search state
const open = defineModel<boolean>("open", { default: false });
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const isSearching = ref(false);
const searchResults = ref<ContractorResult[]>([]);
const totalResults = ref(0);

// Recent searches (persisted in localStorage)
const RECENT_SEARCHES_KEY = "mc-recent-searches";
const MAX_RECENT = 5;

const recentSearches = ref<string[]>([]);

onMounted(() => {
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  if (stored) {
    try {
      recentSearches.value = JSON.parse(stored);
    } catch {
      recentSearches.value = [];
    }
  }
});

const saveRecentSearch = (query: string) => {
  if (!query.trim()) return;
  const filtered = recentSearches.value.filter(
    (s) => s.toLowerCase() !== query.toLowerCase(),
  );
  recentSearches.value = [query, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recentSearches.value),
  );
};

const clearRecentSearches = () => {
  recentSearches.value = [];
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};

// Debounced search
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    totalResults.value = 0;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  try {
    const response = await $fetch<SearchResponse>(
      `/api/search?q=${encodeURIComponent(query)}&limit=6`,
    );
    searchResults.value = response.contractors;
    totalResults.value = response.pagination.total;
  } catch {
    searchResults.value = [];
    totalResults.value = 0;
  } finally {
    isSearching.value = false;
  }
}, 200);

watch(searchQuery, (query) => {
  if (query.trim()) {
    isSearching.value = true;
    debouncedSearch(query);
  } else {
    searchResults.value = [];
    totalResults.value = 0;
    isSearching.value = false;
  }
});

// Navigation handlers
const navigateToContractor = (slug: string) => {
  if (searchQuery.value.trim()) {
    saveRecentSearch(searchQuery.value.trim());
  }
  open.value = false;
  searchQuery.value = "";
  router.push(`/companies/${slug}`);
};

const navigateToSearch = (query?: string) => {
  const q = query || searchQuery.value.trim();
  if (q) {
    saveRecentSearch(q);
  }
  open.value = false;
  searchQuery.value = "";
  router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
};

const navigateToExplorer = (query?: string) => {
  const q = query || searchQuery.value.trim();
  if (q) {
    saveRecentSearch(q);
  }
  open.value = false;
  searchQuery.value = "";
  router.push(q ? `/explorer?q=${encodeURIComponent(q)}` : "/explorer");
};

const handleRecentSearch = (query: string) => {
  searchQuery.value = query;
};

// Global keyboard shortcut (Cmd+K / Ctrl+K)
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      open.value = !open.value;
    }
  };
  window.addEventListener("keydown", handleKeydown);
  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
});

// Reset search when closing, focus input when opening
watch(open, (isOpen) => {
  if (!isOpen) {
    searchQuery.value = "";
    searchResults.value = [];
  }
});

// Focus input when dialog opens (prevent default focus trap)
const handleOpenAutoFocus = (event: Event) => {
  event.preventDefault();
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

// Fallback: also try focusing after a delay when open changes
watch(open, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 50);
  }
});

// Specialties for quick browse
const specialtyLinks = [
  { slug: "aerospace-defense", name: "Aerospace", icon: "mdi:airplane" },
  { slug: "cybersecurity-it", name: "Cybersecurity", icon: "mdi:shield-lock" },
  { slug: "intelligence-analytics", name: "Intelligence", icon: "mdi:brain" },
  { slug: "space-systems", name: "Space", icon: "mdi:rocket-launch" },
];

const browseBySpecialty = (slug: string) => {
  open.value = false;
  searchQuery.value = "";
  router.push(`/companies/specialty/${slug}`);
};

const quickLinks = [
  {
    value: "ranking-top-defense",
    label: "Top defense contractors",
    icon: "mdi:format-list-numbered",
    to: "/rankings/top-defense-contractors",
  },
  {
    value: "agencies",
    label: "Browse agencies",
    icon: "mdi:bank-outline",
    to: "/agencies",
  },
  {
    value: "topic-cyber",
    label: "Cybersecurity topic",
    icon: "mdi:shield-lock-outline",
    to: "/topics/cybersecurity",
  },
];

const navigateToQuickLink = (to: string) => {
  open.value = false;
  searchQuery.value = "";
  router.push(to);
};
</script>

<template>
  <CommandDialog v-model:open="open" @open-auto-focus="handleOpenAutoFocus">
    <div class="flex items-center border-b px-3">
      <Icon name="mdi:magnify" class="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        placeholder="Search contractor directory..."
        class="placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
        @keydown.enter="navigateToSearch()"
      />
      <Kbd v-if="!searchQuery" class="ml-2 hidden sm:inline-flex">ESC</Kbd>
    </div>

    <CommandList class="h-[320px] max-h-[320px]">
      <!-- Loading state -->
      <div
        v-if="isSearching"
        class="text-muted-foreground py-6 text-center text-sm"
      >
        <LoadingText text="Searching" />
      </div>

      <!-- Search results -->
      <template v-else-if="searchQuery.trim()">
        <CommandEmpty v-if="searchResults.length === 0">
          No contractors found for "{{ searchQuery }}".
          <button
            type="button"
            class="text-primary ml-1 hover:underline"
            @click="navigateToExplorer()"
          >
            Run in Explorer
          </button>
        </CommandEmpty>

        <CommandGroup v-if="searchResults.length > 0" heading="Contractors">
          <CommandItem
            v-for="contractor in searchResults"
            :key="contractor.id"
            :value="contractor.slug"
            class="cursor-pointer"
            @select="navigateToContractor(contractor.slug)"
          >
            <div class="flex w-full items-center gap-3">
              <div
                class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded"
              >
                <img
                  v-if="contractor.logoUrl"
                  :src="contractor.logoUrl"
                  :alt="contractor.name"
                  class="h-6 w-6 object-contain"
                />
                <Icon
                  v-else
                  name="mdi:domain"
                  class="text-muted-foreground h-4 w-4"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium">{{ contractor.name }}</div>
                <div
                  v-if="contractor.headquarters"
                  class="text-muted-foreground truncate text-xs"
                >
                  {{ contractor.headquarters }}
                </div>
              </div>
              <Badge
                v-if="contractor.defenseNewsRank"
                variant="secondary"
                class="shrink-0"
              >
                #{{ contractor.defenseNewsRank }}
              </Badge>
            </div>
          </CommandItem>
        </CommandGroup>

        <!-- View all results -->
        <div v-if="totalResults > searchResults.length" class="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground w-full justify-center"
            @click="navigateToSearch()"
          >
            View all {{ totalResults }} results
            <Icon name="mdi:arrow-right" class="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground w-full justify-center"
            @click="navigateToExplorer()"
          >
            Run query in Explorer
            <Icon name="mdi:database-search" class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </template>

      <!-- Default state: recent searches + browse -->
      <template v-else>
        <!-- Recent searches -->
        <CommandGroup
          v-if="recentSearches.length > 0"
          heading="Recent Searches"
        >
          <CommandItem
            v-for="query in recentSearches"
            :key="query"
            :value="`recent-${query}`"
            class="cursor-pointer"
            @select="handleRecentSearch(query)"
          >
            <Icon
              name="mdi:history"
              class="text-muted-foreground mr-2 h-4 w-4"
            />
            <span>{{ query }}</span>
          </CommandItem>
          <div class="px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-foreground h-6 text-xs"
              @click="clearRecentSearches"
            >
              Clear recent
            </Button>
          </div>
        </CommandGroup>

        <CommandSeparator v-if="recentSearches.length > 0" />

        <!-- Quick browse -->
        <CommandGroup heading="Browse by Category">
          <CommandItem
            v-for="specialty in specialtyLinks"
            :key="specialty.slug"
            :value="`specialty-${specialty.slug}`"
            class="cursor-pointer"
            @select="browseBySpecialty(specialty.slug)"
          >
            <Icon
              :name="specialty.icon"
              class="text-muted-foreground mr-2 h-4 w-4"
            />
            <span>{{ specialty.name }}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <!-- Quick actions -->
        <CommandGroup heading="Quick Actions">
          <CommandItem
            v-for="link in quickLinks"
            :key="link.value"
            :value="link.value"
            class="cursor-pointer"
            @select="navigateToQuickLink(link.to)"
          >
            <Icon
              :name="link.icon"
              class="text-muted-foreground mr-2 h-4 w-4"
            />
            <span>{{ link.label }}</span>
          </CommandItem>
          <CommandItem
            value="browse-all"
            class="cursor-pointer"
            @select="navigateToSearch('')"
          >
            <Icon
              name="mdi:view-list"
              class="text-muted-foreground mr-2 h-4 w-4"
            />
            <span>Browse all contractors</span>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
  </CommandDialog>
</template>
