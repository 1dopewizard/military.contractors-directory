<!--
  @file Homepage - Defense Contractor Directory
  @description Primary landing page featuring contractor directory, search, top contractors, and specialty browsing
  @usage Landing page at /
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

useHead({
  title: "U.S. Defense Contractor Directory | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Comprehensive directory of U.S. defense contractors from the Defense News Top 100. Browse by specialty, search by name, and explore company profiles.",
    },
    {
      name: "keywords",
      content:
        "defense contractors, military contractors, defense industry, aerospace defense, defense companies, DoD contractors, top 100 defense contractors",
    },
  ],
});

// Schema.org structured data
useWebSiteSchema();
useWebPageSchema({
  name: "U.S. Defense Contractor Directory",
  description:
    "Comprehensive directory of U.S. defense contractors featuring company profiles, specialties, and revenue data.",
});

// Search state
const searchQuery = ref("");
const router = useRouter();
const searchInputRef = ref<HTMLInputElement | null>(null);
const showSuggestions = ref(false);
const highlightedIndex = ref(-1);

// Autocomplete results
interface AutocompleteContractor {
  id: string;
  slug: string;
  name: string;
  headquarters: string | null;
  defenseNewsRank: number | null;
}

const suggestions = ref<AutocompleteContractor[]>([]);
const isSearching = ref(false);

// Debounced autocomplete fetch
const debouncedFetch = useDebounceFn(async (query: string) => {
  if (!query.trim() || query.length < 2) {
    suggestions.value = [];
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  try {
    const response = await $fetch<{ contractors: AutocompleteContractor[] }>(
      `/api/contractors?q=${encodeURIComponent(query)}&limit=5`,
    );
    suggestions.value = response.contractors;
  } catch {
    suggestions.value = [];
  } finally {
    isSearching.value = false;
  }
}, 200);

watch(searchQuery, (query) => {
  highlightedIndex.value = -1;
  if (query.trim().length >= 2) {
    isSearching.value = true;
    showSuggestions.value = true;
    debouncedFetch(query);
  } else {
    suggestions.value = [];
    showSuggestions.value = false;
    isSearching.value = false;
  }
});

// Handle search submission
const handleSearch = () => {
  showSuggestions.value = false;
  const q = searchQuery.value.trim();
  if (q) {
    router.push({ path: "/companies", query: { q } });
  } else {
    router.push("/companies");
  }
};

// Navigate directly to contractor
const selectContractor = (slug: string) => {
  showSuggestions.value = false;
  searchQuery.value = "";
  router.push(`/companies/${slug}`);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        suggestions.value.length - 1,
      );
      break;
    case "ArrowUp":
      e.preventDefault();
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
      break;
    case "Tab":
      e.preventDefault();
      if (e.shiftKey) {
        highlightedIndex.value =
          highlightedIndex.value <= 0
            ? suggestions.value.length - 1
            : highlightedIndex.value - 1;
      } else {
        highlightedIndex.value =
          highlightedIndex.value >= suggestions.value.length - 1
            ? 0
            : highlightedIndex.value + 1;
      }
      break;
    case "Enter": {
      const selected = suggestions.value[highlightedIndex.value];
      if (highlightedIndex.value >= 0 && selected) {
        e.preventDefault();
        selectContractor(selected.slug);
      }
      break;
    }
    case "Escape":
      showSuggestions.value = false;
      highlightedIndex.value = -1;
      break;
  }
};

// Close suggestions on blur (with delay to allow click)
const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const handleFocus = () => {
  if (searchQuery.value.trim().length >= 2 && suggestions.value.length > 0) {
    showSuggestions.value = true;
  }
};

// Contractor response type
interface ContractorResponse {
  contractors: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    defenseNewsRank: number | null;
    headquarters: string | null;
    defenseRevenue: number | null;
    totalRevenue: number | null;
    primarySpecialty: {
      slug: string;
      name: string | null;
    } | null;
  }>;
  total: number;
}

interface Specialty {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  contractorCount?: number;
}

// Fetch top contractors
const { data: topContractorsData, pending: contractorsPending } =
  useFetch<ContractorResponse>("/api/contractors?sort=rank&limit=6", {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  });

// Fetch all contractors for stats
const { data: allContractorsData } = useFetch<ContractorResponse>(
  "/api/contractors?limit=50",
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  },
);

// Fetch specialties with counts
const { data: specialtiesData, pending: specialtiesPending } = useFetch<{
  specialties: Specialty[];
}>("/api/specialties?includeCounts=true", {
  lazy: true,
  default: () => ({ specialties: [] }),
});

// Computed values
const topContractors = computed(
  () => topContractorsData.value?.contractors ?? [],
);
const totalContractors = computed(() => allContractorsData.value?.total ?? 0);
const specialties = computed(() => specialtiesData.value?.specialties ?? []);

// Calculate total defense revenue from all contractors
const totalDefenseRevenue = computed(() => {
  const contractors = allContractorsData.value?.contractors ?? [];
  const total = contractors.reduce(
    (sum, c) => sum + (c.defenseRevenue ?? 0),
    0,
  );
  return total;
});

// Format revenue for display (in billions)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return "N/A";
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`;
  }
  const millions = revenue * 1000;
  return `$${millions.toFixed(0)}M`;
};

// Format total revenue (sum of all defense revenue)
const formatTotalRevenue = (revenue: number): string => {
  if (revenue >= 1000) {
    return `$${(revenue / 1000).toFixed(1)}T`;
  }
  return `$${revenue.toFixed(0)}B`;
};

// Specialty icon mapping
const specialtyIcons: Record<string, string> = {
  "aerospace-defense": "mdi:airplane",
  "cybersecurity-it": "mdi:shield-lock",
  "intelligence-analytics": "mdi:brain",
  "land-systems": "mdi:tank",
  "naval-maritime": "mdi:anchor",
  "space-systems": "mdi:rocket-launch",
  "professional-services": "mdi:briefcase",
  "logistics-support": "mdi:truck-delivery",
  "electronics-sensors": "mdi:radar",
  "research-development": "mdi:flask",
};

// Get icon for specialty
const getSpecialtyIcon = (slug: string): string => {
  return specialtyIcons[slug] || "mdi:domain";
};
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section - Search Centric -->
    <section class="relative">
      <div
        class="container mx-auto px-4 pt-[clamp(4rem,12vh,8rem)] pb-12 sm:px-6 lg:px-8"
      >
        <div class="mx-auto max-w-3xl text-center">
          <!-- Primary headline - Large and commanding -->
          <h1
            class="text-foreground text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Find Defense
            <br />
            Contractors
          </h1>

          <!-- Subheadline -->
          <p class="text-muted-foreground mt-6 text-lg sm:text-xl">
            Search {{ totalContractors }} U.S. defense contractors by name,
            specialty, or location.
          </p>

          <!-- Search Bar - Hero Element -->
          <div class="relative mx-auto mt-10 max-w-2xl">
            <form @submit.prevent="handleSearch">
              <InputGroup class="h-14 rounded-none shadow-none sm:h-16">
                <InputGroupAddon align="inline-start" class="pl-5 sm:pl-6">
                  <Icon
                    name="mdi:magnify"
                    class="text-muted-foreground h-5 w-5 sm:h-6 sm:w-6"
                  />
                </InputGroupAddon>
                <InputGroupInput
                  ref="searchInputRef"
                  v-model="searchQuery"
                  placeholder="Search contractors..."
                  class="text-base sm:text-lg"
                  autocomplete="off"
                  @keydown="handleKeydown"
                  @blur="handleBlur"
                  @focus="handleFocus"
                />
                <InputGroupButton
                  variant="ghost"
                  type="submit"
                  class="h-full px-5 sm:px-6"
                >
                  <Icon name="mdi:arrow-right" class="h-5 w-5 sm:h-6 sm:w-6" />
                </InputGroupButton>
              </InputGroup>
            </form>

            <!-- Autocomplete Dropdown -->
            <div
              v-if="showSuggestions && (suggestions.length > 0 || isSearching)"
              class="bg-card border-border absolute top-full right-0 left-0 z-50 mt-1 border shadow-lg"
            >
              <!-- Loading state -->
              <div
                v-if="isSearching && suggestions.length === 0"
                class="text-muted-foreground px-4 py-3 text-sm"
              >
                Searching...
              </div>

              <!-- Results -->
              <template v-else>
                <button
                  v-for="(contractor, index) in suggestions"
                  :key="contractor.id"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                  :class="
                    index === highlightedIndex
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  "
                  @mousedown.prevent="selectContractor(contractor.slug)"
                  @mouseenter="highlightedIndex = index"
                >
                  <Icon
                    name="mdi:domain"
                    class="text-muted-foreground h-4 w-4 shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-foreground truncate font-medium">
                      {{ contractor.name }}
                    </div>
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
                </button>

                <!-- View all results hint -->
                <div
                  class="border-border text-muted-foreground border-t px-4 py-2 text-xs"
                >
                  Press Enter to search all results
                </div>
              </template>
            </div>
          </div>

          <!-- Quick filters -->
          <div class="mt-6 flex flex-wrap justify-center gap-2">
            <NuxtLink
              v-for="specialty in specialties.slice(0, 5)"
              :key="specialty.id"
              :to="{
                path: '/companies',
                query: { specialty: specialty.slug },
              }"
              class="hover:border-border text-muted-foreground hover:text-foreground border border-transparent px-3 py-1.5 text-sm transition-colors"
            >
              {{ specialty.name }}
            </NuxtLink>
            <NuxtLink
              to="/companies"
              class="text-primary hover:text-primary/80 px-3 py-1.5 text-sm transition-colors"
            >
              View all
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="">
      <div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <div class="divide-border grid grid-cols-3 divide-x">
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl md:text-4xl"
              >
                {{ totalContractors }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                U.S. Contractors
              </div>
            </div>
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl md:text-4xl"
              >
                {{ specialties.length }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                Specialties
              </div>
            </div>
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl md:text-4xl"
              >
                {{ formatTotalRevenue(totalDefenseRevenue) }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                Defense Revenue
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Contractors Section -->
    <section class="">
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="mb-8 flex items-baseline justify-between">
            <h2 class="text-foreground text-xl font-bold sm:text-2xl">
              Featured Contractors
            </h2>
            <NuxtLink
              to="/companies"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              View all
            </NuxtLink>
          </div>

          <!-- Loading State -->
          <div
            v-if="contractorsPending"
            class="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="i in 6"
              :key="i"
              class="bg-background animate-pulse p-6"
            >
              <div class="space-y-3">
                <div class="flex justify-between">
                  <div class="bg-muted h-5 w-2/3" />
                  <div class="bg-muted h-5 w-8" />
                </div>
                <div class="bg-muted/50 h-4 w-1/2" />
                <div class="bg-muted/50 h-4 w-1/3" />
              </div>
            </div>
          </div>

          <!-- Contractors Grid -->
          <div
            v-else
            class="border-border grid grid-cols-1 border-t border-l bg-transparent sm:grid-cols-2 lg:grid-cols-3"
          >
            <NuxtLink
              v-for="contractor in topContractors"
              :key="contractor.id"
              :to="`/companies/${contractor.slug}`"
              class="group hover:bg-muted/50 border-border border-r border-b p-5 transition-colors sm:p-6"
            >
              <div class="space-y-3">
                <h3
                  class="text-foreground group-hover:text-primary text-base leading-tight font-semibold transition-colors"
                >
                  {{ contractor.name }}
                </h3>
                <div class="text-muted-foreground space-y-1 text-sm">
                  <div
                    v-if="contractor.defenseRevenue != null"
                    class="text-foreground font-medium"
                  >
                    {{ formatRevenue(contractor.defenseRevenue) }} defense
                    revenue
                  </div>
                  <div v-if="contractor.headquarters" class="truncate">
                    {{ contractor.headquarters }}
                  </div>
                  <div v-if="contractor.primarySpecialty" class="text-xs">
                    {{ contractor.primarySpecialty.name }}
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Browse by Specialty Section -->
    <section class="">
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-foreground mb-8 text-xl font-bold sm:text-2xl">
            Browse by Specialty
          </h2>

          <!-- Loading State -->
          <div
            v-if="specialtiesPending"
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
          >
            <div v-for="i in 10" :key="i" class="animate-pulse p-4">
              <div class="space-y-2">
                <div class="bg-muted h-6 w-6" />
                <div class="bg-muted h-4 w-3/4" />
                <div class="bg-muted/50 h-3 w-1/2" />
              </div>
            </div>
          </div>

          <!-- Specialty Grid -->
          <div
            v-else
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
          >
            <NuxtLink
              v-for="specialty in specialties"
              :key="specialty.id"
              :to="{
                path: '/companies',
                query: { specialty: specialty.slug },
              }"
              class="group hover:border-border border border-transparent p-4 transition-colors"
            >
              <div class="text-primary mb-2">
                <Icon
                  :name="getSpecialtyIcon(specialty.slug)"
                  class="h-5 w-5"
                />
              </div>
              <div
                class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
              >
                {{ specialty.name }}
              </div>
              <div
                v-if="specialty.contractorCount"
                class="text-muted-foreground mt-1 text-xs"
              >
                {{ specialty.contractorCount }} contractors
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="">
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-foreground text-lg font-semibold sm:text-xl">
            Are you a defense contractor?
          </h2>
          <p class="text-muted-foreground mt-2 text-sm sm:text-base">
            Claim your company profile to manage your presence and reach job
            seekers.
          </p>
          <div class="mt-6">
            <Button variant="outline" as-child>
              <NuxtLink to="/for-companies"> Learn more </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
