<!--
  @file Companies browse page - console-first
  @route /companies
  @description Browse defense contractors with left-rail filters, central search, and active-chip filter row
  @urlparams q, specialty, location, sort
-->

<script setup lang="ts">
import type {
  RankingRow,
  SourceMetadata,
} from "@/app/types/intelligence.types";
import { emptySourceMetadata } from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

const logger = useLogger("ContractorsBrowsePage");
const route = useRoute();
const router = useRouter();

useHead({
  title: "Defense Contractors | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Browse U.S. defense contractors. Filter by specialty, location, and explore company profiles.",
    },
  ],
});

const searchQuery = ref((route.query.q as string) || "");
const selectedSpecialty = ref((route.query.specialty as string) || "");
const selectedLocation = ref((route.query.location as string) || "");
const sortBy = ref((route.query.sort as string) || "revenue");
const filtersOpen = ref(false);

interface ContractorResponse {
  contractors: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    defenseNewsRank: number | null;
    country: string | null;
    headquarters: string | null;
    founded: string | null;
    employeeCount: string | null;
    website: string | null;
    careersUrl: string | null;
    linkedinUrl: string | null;
    wikipediaUrl: string | null;
    stockTicker: string | null;
    isPublic: boolean | null;
    totalRevenue: number | null;
    defenseRevenue: number | null;
    defenseRevenuePercent: number | null;
    logoUrl: string | null;
    primarySpecialty: {
      slug: string;
      name: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

interface Specialty {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  contractorCount?: number;
}

interface TopContractorsIntelligenceResponse {
  filters: {
    fiscalYears: number[];
  };
  contractors: RankingRow[];
  sourceMetadata: SourceMetadata;
}

const contractorsUrl = computed(() => {
  const params = new URLSearchParams();
  if (searchQuery.value) params.set("q", searchQuery.value);
  if (selectedSpecialty.value) params.set("specialty", selectedSpecialty.value);
  if (selectedLocation.value) params.set("location", selectedLocation.value);
  if (sortBy.value) params.set("sort", sortBy.value);
  params.set("limit", "100");
  return `/api/contractors?${params.toString()}`;
});

const {
  data: contractorsData,
  pending: contractorsPending,
  error: contractorsError,
  refresh: refreshContractors,
} = useFetch<ContractorResponse>(contractorsUrl, {
  lazy: true,
  default: () => ({ contractors: [], total: 0, limit: 100, offset: 0 }),
});

const { data: specialtiesData } = useFetch<{ specialties: Specialty[] }>(
  "/api/specialties?includeCounts=true",
  {
    lazy: true,
    default: () => ({ specialties: [] }),
  },
);

const { data: intelligenceContext } =
  useFetch<TopContractorsIntelligenceResponse>(
    "/api/intelligence/top-contractors?limit=1",
    {
      lazy: true,
      default: () => ({
        filters: { fiscalYears: [] },
        contractors: [],
        sourceMetadata: emptySourceMetadata(),
      }),
    },
  );

const contractors = computed(() => contractorsData.value?.contractors ?? []);
const totalCount = computed(() => contractorsData.value?.total ?? 0);
const hasResults = computed(() => contractors.value.length > 0);
const specialties = computed(() => specialtiesData.value?.specialties ?? []);

const sortedSpecialties = computed(() =>
  [...specialties.value].sort(
    (a, b) => (b.contractorCount ?? 0) - (a.contractorCount ?? 0),
  ),
);

const locationOptions = [
  { name: "Virginia", slug: "virginia" },
  { name: "California", slug: "california" },
  { name: "Texas", slug: "texas" },
  { name: "Maryland", slug: "maryland" },
  { name: "Florida", slug: "florida" },
  { name: "Arizona", slug: "arizona" },
  { name: "Colorado", slug: "colorado" },
  { name: "Massachusetts", slug: "massachusetts" },
  { name: "Connecticut", slug: "connecticut" },
  { name: "Alabama", slug: "alabama" },
  { name: "Georgia", slug: "georgia" },
  { name: "Ohio", slug: "ohio" },
  { name: "Pennsylvania", slug: "pennsylvania" },
  { name: "New York", slug: "new-york" },
  { name: "Washington", slug: "washington" },
  { name: "District of Columbia", slug: "district-of-columbia" },
];

const sortOptions = [
  { value: "revenue", label: "Revenue" },
  { value: "name", label: "Name" },
];

const hasActiveFilters = computed(
  () =>
    !!searchQuery.value ||
    !!selectedSpecialty.value ||
    !!selectedLocation.value ||
    sortBy.value !== "revenue",
);

const syncFiltersToUrl = () => {
  const query: Record<string, string> = {};
  if (searchQuery.value) query.q = searchQuery.value;
  if (selectedSpecialty.value) query.specialty = selectedSpecialty.value;
  if (selectedLocation.value) query.location = selectedLocation.value;
  if (sortBy.value && sortBy.value !== "revenue") query.sort = sortBy.value;
  router.replace({ query });
};

const handleSearch = (e: Event) => {
  e.preventDefault();
  syncFiltersToUrl();
};

const clearSearch = () => {
  searchQuery.value = "";
  syncFiltersToUrl();
};

const toggleSpecialty = (slug: string) => {
  selectedSpecialty.value = selectedSpecialty.value === slug ? "" : slug;
  syncFiltersToUrl();
};

const toggleLocation = (slug: string) => {
  selectedLocation.value = selectedLocation.value === slug ? "" : slug;
  syncFiltersToUrl();
};

const applySort = (value: string) => {
  sortBy.value = value;
  syncFiltersToUrl();
};

const resetFilters = () => {
  searchQuery.value = "";
  selectedSpecialty.value = "";
  selectedLocation.value = "";
  sortBy.value = "revenue";
  syncFiltersToUrl();
};

const selectedSpecialtyName = computed(() => {
  if (!selectedSpecialty.value) return null;
  const specialty = specialties.value.find(
    (s) => s.slug === selectedSpecialty.value,
  );
  return specialty?.name || null;
});

const selectedLocationName = computed(() => {
  if (!selectedLocation.value) return null;
  const location = locationOptions.find(
    (l) => l.slug === selectedLocation.value,
  );
  return location?.name || null;
});

const fiscalYearLabel = computed(() => {
  const years = intelligenceContext.value?.filters.fiscalYears ?? [];
  if (!years.length) return "Latest FY";
  return years.map((y) => `FY${y}`).join(", ");
});

watch(
  () => route.query,
  (newQuery) => {
    const newQ = (newQuery.q as string) || "";
    const newSpecialty = (newQuery.specialty as string) || "";
    const newLocation = (newQuery.location as string) || "";
    const newSort = (newQuery.sort as string) || "revenue";

    if (
      newQ !== searchQuery.value ||
      newSpecialty !== selectedSpecialty.value ||
      newLocation !== selectedLocation.value ||
      newSort !== sortBy.value
    ) {
      searchQuery.value = newQ;
      selectedSpecialty.value = newSpecialty;
      selectedLocation.value = newLocation;
      sortBy.value = newSort;
    }
  },
);

watchEffect(() => {
  if (contractors.value.length > 0) {
    logger.info({ count: contractors.value.length }, "Contractors loaded");
  }
});
</script>

<template>
  <div class="flex min-h-full flex-col lg:flex-row">
    <!-- Filter rail (desktop) -->
    <aside
      class="border-border hidden shrink-0 border-r lg:flex lg:w-72 lg:flex-col xl:w-80"
    >
      <div class="flex flex-col gap-7 p-6">
        <div
          class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
        >
          Filter
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            >
              Specialty
            </h2>
            <Icon
              name="mdi:tag-outline"
              class="text-muted-foreground h-3.5 w-3.5"
            />
          </div>
          <ScrollArea class="border-border h-72 border-t">
            <button
              v-for="specialty in sortedSpecialties"
              :key="specialty.slug"
              type="button"
              class="border-border group hover:bg-muted/40 flex w-full items-center justify-between border-b py-2 pr-3 text-left text-sm transition-colors"
              :class="
                selectedSpecialty === specialty.slug
                  ? 'text-primary'
                  : 'text-foreground/90'
              "
              @click="toggleSpecialty(specialty.slug)"
            >
              <span class="truncate pr-2">{{ specialty.name }}</span>
              <span
                v-if="specialty.contractorCount"
                class="text-muted-foreground text-[10px] tabular-nums"
              >
                {{ specialty.contractorCount }}
              </span>
            </button>
          </ScrollArea>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            >
              Location
            </h2>
            <Icon
              name="mdi:map-marker-outline"
              class="text-muted-foreground h-3.5 w-3.5"
            />
          </div>
          <ScrollArea class="border-border h-64 border-t">
            <button
              v-for="location in locationOptions"
              :key="location.slug"
              type="button"
              class="border-border hover:bg-muted/40 flex w-full items-center justify-between border-b py-2 pr-3 text-left text-sm transition-colors"
              :class="
                selectedLocation === location.slug
                  ? 'text-primary'
                  : 'text-foreground/90'
              "
              @click="toggleLocation(location.slug)"
            >
              {{ location.name }}
            </button>
          </ScrollArea>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            >
              Sort
            </h2>
            <Icon
              name="mdi:sort"
              class="text-muted-foreground h-3.5 w-3.5"
            />
          </div>
          <div class="border-border border-t">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="border-border hover:bg-muted/40 flex w-full items-center justify-between border-b py-2 text-left text-sm transition-colors"
              :class="
                sortBy === option.value
                  ? 'text-primary'
                  : 'text-foreground/90'
              "
              @click="applySort(option.value)"
            >
              <span>{{ option.label }}</span>
              <Icon
                v-if="sortBy === option.value"
                name="mdi:check"
                class="h-3.5 w-3.5"
              />
            </button>
          </div>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="border-border text-muted-foreground hover:text-foreground inline-flex items-center justify-center border px-3 py-2 text-xs uppercase tracking-[0.14em] transition-colors"
          @click="resetFilters"
        >
          <Icon name="mdi:close" class="mr-1 h-3.5 w-3.5" />
          Reset filters
        </button>
      </div>
    </aside>

    <!-- Console -->
    <div class="min-w-0 flex-1">
      <div
        class="mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
      >
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>Contractor directory</span>
          <span class="text-muted-foreground/40">/</span>
          <span>USAspending.gov</span>
          <span class="text-muted-foreground/40">/</span>
          <span>{{ fiscalYearLabel }}</span>
          <span class="text-muted-foreground/40">/</span>
          <span class="text-foreground/80">
            {{ intelligenceContext.sourceMetadata.cacheStatus }}
          </span>
        </div>

        <h1
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          Defense
          <span class="text-primary">contractors</span>.
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
          Browse contractor profiles and open source-backed award dossiers.
        </p>

        <form
          class="bg-card ring-primary/30 ring-offset-background mt-7 flex max-w-3xl flex-col p-2 ring-1 ring-offset-2 sm:flex-row sm:items-center"
          @submit="handleSearch"
        >
          <Icon
            name="mdi:magnify"
            class="text-muted-foreground ml-2 hidden h-5 w-5 shrink-0 sm:block"
          />
          <Input
            v-model="searchQuery"
            class="h-12 flex-1 border-0 bg-transparent px-3 text-base focus-visible:ring-0"
            placeholder="Search contractors by name..."
          />
          <button
            v-if="searchQuery"
            type="button"
            class="text-muted-foreground hover:text-foreground inline-flex h-12 w-10 items-center justify-center transition-colors"
            @click="clearSearch"
          >
            <Icon name="mdi:close" class="h-4 w-4" />
            <span class="sr-only">Clear search</span>
          </button>
          <Button type="submit" class="mt-2 h-12 shrink-0 sm:mt-0">
            <span>Search</span>
            <Icon name="mdi:arrow-right" class="ml-2 h-4 w-4" />
          </Button>
        </form>

        <!-- Mobile filter trigger -->
        <div class="mt-4 lg:hidden">
          <button
            type="button"
            class="border-border text-muted-foreground hover:text-foreground hover:border-primary flex w-full items-center justify-between border px-3 py-2 text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            @click="filtersOpen = true"
          >
            <span>Filter & sort</span>
            <Icon name="mdi:tune-vertical" class="h-4 w-4" />
          </button>
          <Sheet v-model:open="filtersOpen">
            <SheetContent side="bottom" class="flex max-h-[85vh] flex-col">
              <SheetHeader class="text-left">
                <SheetTitle class="text-left">Filter & sort</SheetTitle>
              </SheetHeader>
              <ScrollArea class="-mx-6 flex-1 px-6">
                <div class="space-y-6 py-2">
                  <div class="space-y-2">
                    <h3
                      class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                    >
                      Specialty
                    </h3>
                    <div class="border-border border-t">
                      <button
                        v-for="specialty in sortedSpecialties"
                        :key="specialty.slug"
                        type="button"
                        class="border-border flex w-full items-center justify-between border-b py-2 text-left text-sm"
                        :class="
                          selectedSpecialty === specialty.slug
                            ? 'text-primary'
                            : 'text-foreground'
                        "
                        @click="toggleSpecialty(specialty.slug)"
                      >
                        <span class="truncate pr-2">{{ specialty.name }}</span>
                        <span
                          v-if="specialty.contractorCount"
                          class="text-muted-foreground text-[10px] tabular-nums"
                        >
                          {{ specialty.contractorCount }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3
                      class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                    >
                      Location
                    </h3>
                    <div class="border-border border-t">
                      <button
                        v-for="location in locationOptions"
                        :key="location.slug"
                        type="button"
                        class="border-border flex w-full items-center justify-between border-b py-2 text-left text-sm"
                        :class="
                          selectedLocation === location.slug
                            ? 'text-primary'
                            : 'text-foreground'
                        "
                        @click="toggleLocation(location.slug)"
                      >
                        {{ location.name }}
                      </button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3
                      class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                    >
                      Sort
                    </h3>
                    <div class="border-border border-t">
                      <button
                        v-for="option in sortOptions"
                        :key="option.value"
                        type="button"
                        class="border-border flex w-full items-center justify-between border-b py-2 text-left text-sm"
                        :class="
                          sortBy === option.value
                            ? 'text-primary'
                            : 'text-foreground'
                        "
                        @click="applySort(option.value)"
                      >
                        <span>{{ option.label }}</span>
                        <Icon
                          v-if="sortBy === option.value"
                          name="mdi:check"
                          class="h-3.5 w-3.5"
                        />
                      </button>
                    </div>
                  </div>

                  <Button
                    v-if="hasActiveFilters"
                    variant="outline"
                    class="w-full"
                    @click="resetFilters"
                  >
                    <Icon name="mdi:close" class="mr-2 h-4 w-4" />
                    Reset filters
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <!-- Active filter chips -->
        <div
          v-if="hasActiveFilters"
          class="mt-6 flex flex-wrap items-center gap-2"
        >
          <span
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Active
          </span>
          <Badge
            v-if="searchQuery"
            variant="secondary"
            class="flex items-center gap-1"
          >
            "{{ searchQuery }}"
            <button
              type="button"
              class="hover:text-destructive ml-1 transition-colors"
              @click="clearSearch"
            >
              <Icon name="mdi:close" class="h-3 w-3" />
            </button>
          </Badge>
          <Badge
            v-if="selectedSpecialtyName"
            variant="secondary"
            class="flex items-center gap-1"
          >
            {{ selectedSpecialtyName }}
            <button
              type="button"
              class="hover:text-destructive ml-1 transition-colors"
              @click="toggleSpecialty(selectedSpecialty)"
            >
              <Icon name="mdi:close" class="h-3 w-3" />
            </button>
          </Badge>
          <Badge
            v-if="selectedLocationName"
            variant="secondary"
            class="flex items-center gap-1"
          >
            {{ selectedLocationName }}
            <button
              type="button"
              class="hover:text-destructive ml-1 transition-colors"
              @click="toggleLocation(selectedLocation)"
            >
              <Icon name="mdi:close" class="h-3 w-3" />
            </button>
          </Badge>
          <Badge
            v-if="sortBy !== 'revenue'"
            variant="outline"
            class="text-muted-foreground"
          >
            Sort: {{ sortOptions.find((o) => o.value === sortBy)?.label }}
          </Badge>
        </div>

        <!-- Results -->
        <div class="mt-8">
          <div
            class="text-muted-foreground mb-3 flex items-center justify-between text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span>
              {{ totalCount }}
              {{ totalCount === 1 ? "contractor" : "contractors" }}
            </span>
            <NuxtLink to="/explorer" class="text-primary hover:underline">
              Open explorer →
            </NuxtLink>
          </div>

          <div v-if="contractorsPending" class="border-border border p-8">
            <LoadingText text="Loading contractors" />
          </div>

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
              <Icon name="mdi:refresh" class="mr-2 h-4 w-4" />
              Retry
            </Button>
          </Empty>

          <Empty v-else-if="!hasResults">
            <EmptyMedia variant="icon">
              <Icon name="mdi:domain-off" class="size-5" />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle>No contractors found</EmptyTitle>
              <EmptyDescription>
                {{
                  hasActiveFilters
                    ? "No contractors match the active filters."
                    : "Try adjusting your search."
                }}
              </EmptyDescription>
            </EmptyContent>
            <Button
              v-if="hasActiveFilters"
              variant="ghost"
              size="sm"
              @click="resetFilters"
            >
              Clear filters
            </Button>
          </Empty>

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
