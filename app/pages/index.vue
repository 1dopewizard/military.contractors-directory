<!--
  @file Homepage - Open contractor intelligence explorer
  @description Primary landing page for public defense contractor intelligence, award exploration, and directory browsing
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

useHead({
  title: "Open Defense Contractor Intelligence | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Ask questions about U.S. defense contractors, public awards, agencies, NAICS/PSC categories, locations, and spending trends.",
    },
    {
      name: "keywords",
      content:
        "defense contractors, USAspending, federal awards, defense contracts, NAICS, PSC, contractor intelligence",
    },
  ],
});

useWebSiteSchema({
  description:
    "Open intelligence on U.S. defense contractors, public awards, agencies, categories, and spending trends.",
});
useWebPageSchema({
  name: "Open Defense Contractor Intelligence",
  description:
    "Explore U.S. defense contractors with structured public award data and source-backed summaries.",
});

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

interface ExplorerResult {
  id: string;
  query: string;
  summary: string;
  resultType: string;
  filtersUsed: Array<{ label: string; value: string }>;
  table: Array<Record<string, string | number | null>>;
  cards: Array<{ label: string; value: string; detail: string }>;
  chart: Array<{
    key: string;
    label: string;
    obligation: number;
    awardCount: number;
  }>;
  sourceLinks: Array<{ label: string; url: string }>;
  sourceMetadata: {
    freshness: string;
    structuredRecords: number;
  };
  cached: boolean;
}

const explorerQuery = ref("Top Department of the Navy contractors");
const explorerResult = ref<ExplorerResult | null>(null);
const explorerPending = ref(false);
const explorerError = ref<string | null>(null);

const exampleQueries = [
  "Compare Lockheed Martin and RTX",
  "Show cyber awards in Virginia",
  "Top NAICS 541512 contractors",
  "Which contractors have missile awards?",
];

const { data: topContractorsData, pending: contractorsPending } =
  useFetch<ContractorResponse>("/api/contractors?sort=rank&limit=6", {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  });

const { data: allContractorsData } = useFetch<ContractorResponse>(
  "/api/contractors?limit=50",
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  },
);

const { data: specialtiesData, pending: specialtiesPending } = useFetch<{
  specialties: Specialty[];
}>("/api/specialties?includeCounts=true", {
  lazy: true,
  default: () => ({ specialties: [] }),
});

const topContractors = computed(
  () => topContractorsData.value?.contractors ?? [],
);
const totalContractors = computed(() => allContractorsData.value?.total ?? 0);
const specialties = computed(() => specialtiesData.value?.specialties ?? []);
const tableKeys = computed(() =>
  explorerResult.value?.table[0] ? Object.keys(explorerResult.value.table[0]) : [],
);

const totalDefenseRevenue = computed(() => {
  const contractors = allContractorsData.value?.contractors ?? [];
  return contractors.reduce((sum, c) => sum + (c.defenseRevenue ?? 0), 0);
});

const maxChartValue = computed(() => {
  const chart = explorerResult.value?.chart ?? [];
  return chart.reduce((max, item) => Math.max(max, item.obligation), 0);
});

const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return "N/A";
  if (revenue >= 1) return `$${revenue.toFixed(1)}B`;
  return `$${(revenue * 1000).toFixed(0)}M`;
};

const formatObligation = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
};

const formatTotalRevenue = (revenue: number): string => {
  if (revenue >= 1000) return `$${(revenue / 1000).toFixed(1)}T`;
  return `$${revenue.toFixed(0)}B`;
};

const formatCell = (value: string | number | null): string => {
  if (value === null) return "N/A";
  if (typeof value === "number") {
    return value > 100000 ? formatObligation(value) : value.toString();
  }
  return value;
};

const chartWidth = (value: number): string => {
  if (!maxChartValue.value) return "0%";
  return `${Math.max(6, Math.round((value / maxChartValue.value) * 100))}%`;
};

const runExplorer = async () => {
  const query = explorerQuery.value.trim();
  if (!query) return;

  explorerPending.value = true;
  explorerError.value = null;

  try {
    explorerResult.value = await $fetch<ExplorerResult>("/api/explorer/query", {
      method: "POST",
      body: { query },
    });
  } catch (error) {
    explorerError.value =
      error instanceof Error ? error.message : "Explorer query failed";
  } finally {
    explorerPending.value = false;
  }
};

const useExample = (query: string) => {
  explorerQuery.value = query;
  runExplorer();
};

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

const getSpecialtyIcon = (slug: string): string => {
  return specialtyIcons[slug] || "mdi:domain";
};

onMounted(() => {
  runExplorer();
});
</script>

<template>
  <div class="min-h-full">
    <section>
      <div
        class="container mx-auto px-4 pt-[clamp(3rem,9vh,6rem)] pb-10 sm:px-6 lg:px-8"
      >
        <div class="mx-auto max-w-5xl">
          <div class="max-w-3xl">
            <Badge variant="outline" class="mb-5">Public award intelligence</Badge>
            <h1
              class="text-foreground text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              Open Defense Contractor Intelligence
            </h1>
            <p class="text-muted-foreground mt-5 max-w-2xl text-lg sm:text-xl">
              Ask questions about contractors, awards, agencies, locations,
              NAICS/PSC categories, and spending trends.
            </p>
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_0.95fr]">
            <div class="border-border bg-background border p-4 sm:p-5">
              <form class="space-y-4" @submit.prevent="runExplorer">
                <Label for="explorer-query">Explorer query</Label>
                <Textarea
                  id="explorer-query"
                  v-model="explorerQuery"
                  class="min-h-28 resize-none rounded-none"
                  placeholder="Ask about contractors, agencies, locations, NAICS/PSC, or award keywords..."
                />
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" :disabled="explorerPending">
                    <Icon
                      v-if="explorerPending"
                      name="mdi:loading"
                      class="mr-2 h-4 w-4 animate-spin"
                    />
                    <Icon v-else name="mdi:database-search" class="mr-2 h-4 w-4" />
                    Run query
                  </Button>
                  <p class="text-muted-foreground text-xs">
                    Summaries are generated only from structured matched records.
                  </p>
                </div>
              </form>

              <div class="mt-5 flex flex-wrap gap-2">
                <button
                  v-for="query in exampleQueries"
                  :key="query"
                  type="button"
                  class="border-border text-muted-foreground hover:text-foreground border px-3 py-1.5 text-left text-xs transition-colors"
                  @click="useExample(query)"
                >
                  {{ query }}
                </button>
              </div>
            </div>

            <div class="border-border bg-background border p-4 sm:p-5">
              <div v-if="explorerPending" class="flex min-h-64 items-center">
                <LoadingText text="Querying structured award data" />
              </div>

              <div v-else-if="explorerError" class="min-h-64">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Icon name="mdi:alert-circle-outline" class="size-5" />
                  </EmptyMedia>
                  <EmptyContent>
                    <EmptyTitle>Explorer Error</EmptyTitle>
                    <EmptyDescription>{{ explorerError }}</EmptyDescription>
                  </EmptyContent>
                </Empty>
              </div>

              <div v-else-if="explorerResult" class="space-y-5">
                <div>
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{{ explorerResult.resultType }}</Badge>
                    <Badge v-if="explorerResult.cached" variant="outline">
                      Cached
                    </Badge>
                  </div>
                  <p class="text-foreground text-sm leading-relaxed">
                    {{ explorerResult.summary }}
                  </p>
                </div>

                <div
                  v-if="explorerResult.filtersUsed.length"
                  class="flex flex-wrap gap-2"
                >
                  <Badge
                    v-for="filter in explorerResult.filtersUsed"
                    :key="`${filter.label}-${filter.value}`"
                    variant="outline"
                  >
                    {{ filter.label }}: {{ filter.value }}
                  </Badge>
                </div>

                <div class="grid gap-3 sm:grid-cols-3">
                  <div
                    v-for="card in explorerResult.cards"
                    :key="card.label"
                    class="border-border border p-3"
                  >
                    <p class="text-muted-foreground text-xs">{{ card.label }}</p>
                    <p class="text-foreground mt-1 text-lg font-semibold">
                      {{ card.value }}
                    </p>
                    <p class="text-muted-foreground mt-1 text-xs">
                      {{ card.detail }}
                    </p>
                  </div>
                </div>

                <div v-if="explorerResult.chart.length" class="space-y-2">
                  <div
                    v-for="item in explorerResult.chart"
                    :key="item.key"
                    class="grid grid-cols-[4rem_1fr_5rem] items-center gap-3 text-xs"
                  >
                    <span class="text-muted-foreground">{{ item.label }}</span>
                    <div class="bg-muted h-2">
                      <div
                        class="bg-primary h-2"
                        :style="{ width: chartWidth(item.obligation) }"
                      />
                    </div>
                    <span class="text-right tabular-nums">
                      {{ formatObligation(item.obligation) }}
                    </span>
                  </div>
                </div>

                <div
                  v-if="explorerResult.table.length"
                  class="border-border overflow-x-auto border"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          v-for="key in tableKeys"
                          :key="key"
                          class="whitespace-nowrap capitalize"
                        >
                          {{ key.replace(/([A-Z])/g, " $1") }}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        v-for="(row, index) in explorerResult.table.slice(0, 5)"
                        :key="index"
                      >
                        <TableCell
                          v-for="key in tableKeys"
                          :key="key"
                          class="max-w-72 align-top text-xs"
                        >
                          {{ formatCell(row[key]) }}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div class="border-border border-t pt-4">
                  <p class="text-muted-foreground mb-2 text-xs">
                    {{ explorerResult.sourceMetadata.structuredRecords }}
                    structured records. {{ explorerResult.sourceMetadata.freshness }}
                  </p>
                  <div class="flex flex-wrap gap-3">
                    <NuxtLink
                      v-for="source in explorerResult.sourceLinks.slice(0, 4)"
                      :key="source.url"
                      :to="source.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary text-xs hover:underline"
                    >
                      {{ source.label }}
                      <Icon name="mdi:open-in-new" class="ml-1 inline h-3 w-3" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="divide-border grid grid-cols-3 divide-x">
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl"
              >
                {{ totalContractors }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                Contractors
              </div>
            </div>
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl"
              >
                {{ specialties.length }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                Categories
              </div>
            </div>
            <div class="px-4 text-center sm:px-8">
              <div
                class="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl"
              >
                {{ formatTotalRevenue(totalDefenseRevenue) }}
              </div>
              <div class="text-muted-foreground mt-1 text-xs sm:text-sm">
                Defense Revenue Context
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="mb-8 flex items-baseline justify-between">
            <h2 class="text-foreground text-xl font-bold sm:text-2xl">
              Major Contractors
            </h2>
            <NuxtLink
              to="/companies"
              class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              View all
            </NuxtLink>
          </div>

          <div
            v-if="contractorsPending"
            class="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          >
            <div v-for="i in 6" :key="i" class="bg-background animate-pulse p-6">
              <div class="space-y-3">
                <div class="bg-muted h-5 w-2/3" />
                <div class="bg-muted/50 h-4 w-1/2" />
                <div class="bg-muted/50 h-4 w-1/3" />
              </div>
            </div>
          </div>

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
                    revenue context
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

    <section>
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <h2 class="text-foreground mb-8 text-xl font-bold sm:text-2xl">
            Browse by Category
          </h2>

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

          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <NuxtLink
              v-for="specialty in specialties"
              :key="specialty.id"
              :to="{ path: '/companies', query: { specialty: specialty.slug } }"
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
  </div>
</template>
