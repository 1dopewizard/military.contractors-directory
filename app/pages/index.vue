<!--
  @file Homepage - Open contractor intelligence explorer
  @description Search-first landing page for public defense contractor intelligence
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

useHead({
  title: "Open Defense Contractor Intelligence | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Search U.S. defense contractors, public awards, agencies, NAICS/PSC categories, locations, and spending trends.",
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
  sourceMetadata: SourceMetadata;
  cached: boolean;
}

interface TopContractorsIntelligenceResponse {
  filters: {
    agency: string | null;
    naics: string | null;
    psc: string | null;
    keyword: string | null;
    fiscalYears: number[];
  };
  contractors: RankingRow[];
  sourceMetadata: SourceMetadata;
}

const explorerQuery = ref("");
const explorerResult = ref<ExplorerResult | null>(null);
const explorerPending = ref(false);
const explorerError = ref<string | null>(null);

const exampleQueries = [
  "Top Department of the Navy contractors",
  "Top NAICS 541512 contractors",
  "Compare Lockheed Martin and RTX",
  "Which contractors have missile awards?",
];

const rankingLinks = [
  { label: "Top Defense", to: "/rankings/top-defense-contractors" },
  { label: "Navy", to: "/rankings/navy-contractors" },
  { label: "Army", to: "/rankings/army-contractors" },
  { label: "Air Force", to: "/rankings/air-force-contractors" },
];

const topicLinks = [
  { label: "Cybersecurity", to: "/topics/cybersecurity" },
  { label: "Missile Defense", to: "/topics/missile-defense" },
  { label: "Shipbuilding", to: "/topics/shipbuilding" },
  { label: "Space Systems", to: "/topics/space-systems" },
];

const categoryLinks = [
  { label: "NAICS 541512", to: "/categories/naics/541512" },
  { label: "NAICS 336611", to: "/categories/naics/336611" },
  { label: "PSC 1410", to: "/categories/psc/1410" },
  { label: "Agencies", to: "/agencies" },
];

const { data: allContractorsData } = useFetch<ContractorResponse>(
  "/api/contractors?limit=50",
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  },
);

const { data: specialtiesData } = useFetch<{
  specialties: Specialty[];
}>("/api/specialties?includeCounts=true", {
  lazy: true,
  default: () => ({ specialties: [] }),
});

const { data: topIntelligenceData, pending: topIntelligencePending } =
  useFetch<TopContractorsIntelligenceResponse>(
    "/api/intelligence/top-contractors?limit=8",
    {
      lazy: true,
      default: () => ({
        filters: {
          agency: null,
          naics: null,
          psc: null,
          keyword: null,
          fiscalYears: [],
        },
        contractors: [],
        sourceMetadata: emptySourceMetadata(),
      }),
    },
  );

const totalContractors = computed(() => allContractorsData.value?.total ?? 0);
const specialties = computed(() => specialtiesData.value?.specialties ?? []);
const topIntelligence = computed(
  () => topIntelligenceData.value?.contractors ?? [],
);
const homepageFiscalYears = computed(
  () => topIntelligenceData.value?.filters.fiscalYears ?? [],
);
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
</script>

<template>
  <div class="min-h-full">
    <section class="border-border border-b">
      <div
        class="container mx-auto px-4 pt-[clamp(3rem,9vh,5.5rem)] pb-12 sm:px-6 lg:px-8"
      >
        <div class="mx-auto max-w-5xl">
          <div
            class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span>Public award intelligence</span>
            <span class="text-muted-foreground/40">/</span>
            <span>USAspending.gov</span>
            <span class="text-muted-foreground/40">/</span>
            <span>
              {{
                homepageFiscalYears.length
                  ? homepageFiscalYears.map((y) => `FY${y}`).join(", ")
                  : "Latest FY"
              }}
            </span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-foreground/80">
              {{ topIntelligenceData.sourceMetadata.cacheStatus }}
            </span>
          </div>

          <h1
            class="text-foreground mt-6 max-w-4xl text-4xl leading-[1.02] font-bold tracking-tight sm:text-6xl"
          >
            Open defense contractor
            <span class="text-primary">intelligence</span>.
          </h1>
          <p class="text-muted-foreground mt-5 max-w-2xl text-lg sm:text-xl">
            Search companies, agencies, NAICS/PSC codes, awards, and spending
            trends from structured public records.
          </p>

          <form
            class="bg-card ring-primary/30 ring-offset-background mt-8 flex max-w-3xl flex-col p-2 ring-1 ring-offset-2 sm:flex-row sm:items-center"
            @submit.prevent="runExplorer"
          >
            <Icon
              name="mdi:database-search"
              class="text-muted-foreground ml-2 hidden h-5 w-5 shrink-0 sm:block"
            />
            <Input
              v-model="explorerQuery"
              class="h-12 flex-1 border-0 bg-transparent px-3 text-base focus-visible:ring-0"
              placeholder="Ask about Navy contractors, NAICS 541512, Lockheed vs RTX..."
            />
            <Button
              type="submit"
              class="mt-2 h-12 shrink-0 sm:mt-0"
              :disabled="explorerPending"
            >
              <Icon
                v-if="explorerPending"
                name="mdi:loading"
                class="mr-2 h-4 w-4 animate-spin"
              />
              <span>Run query</span>
              <Icon
                v-if="!explorerPending"
                name="mdi:arrow-right"
                class="ml-2 h-4 w-4"
              />
            </Button>
          </form>

          <div class="mt-5 flex max-w-3xl flex-wrap items-center gap-2">
            <span
              class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
            >
              Try
            </span>
            <button
              v-for="query in exampleQueries"
              :key="query"
              type="button"
              class="border-border text-muted-foreground hover:border-primary hover:text-foreground bg-background/70 border px-3 py-1.5 text-xs transition-colors"
              @click="useExample(query)"
            >
              {{ query }}
            </button>
            <NuxtLink
              to="/explorer"
              class="text-primary ml-auto text-xs hover:underline"
            >
              Open full explorer →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section v-if="explorerPending || explorerError || explorerResult" class="border-border border-b">
      <div class="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="border-primary/40 bg-card border-l-2">
            <div
              class="border-border bg-background flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3"
            >
              <div class="flex items-center gap-2">
                <span class="bg-primary inline-block h-2 w-2 animate-pulse rounded-full" />
                <span
                  class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
                >
                  Result
                </span>
                <template v-if="explorerResult">
                  <span class="text-muted-foreground/50">·</span>
                  <Badge variant="secondary" class="text-xs">
                    {{ explorerResult.resultType }}
                  </Badge>
                  <Badge v-if="explorerResult.cached" variant="outline" class="text-xs">
                    Cached
                  </Badge>
                </template>
              </div>
              <NuxtLink
                v-if="explorerResult"
                to="/explorer"
                class="text-muted-foreground hover:text-foreground inline-flex items-center text-xs transition-colors"
              >
                Continue in Explorer
                <Icon name="mdi:arrow-right" class="ml-1 h-3.5 w-3.5" />
              </NuxtLink>
            </div>

          <div class="p-5 sm:p-6">
            <div v-if="explorerPending" class="flex min-h-40 items-center">
              <LoadingText text="Querying structured award data" />
            </div>

            <div v-else-if="explorerError" class="min-h-40">
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
                <p class="text-foreground text-base leading-relaxed">
                  {{ explorerResult.summary }}
                </p>
              </div>

              <div v-if="explorerResult.filtersUsed.length" class="flex flex-wrap gap-2">
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

              <div class="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
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

    <section class="border-border border-b">
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div>
              <div
                class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
              >
                Contractors
              </div>
              <div
                class="text-foreground mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
              >
                {{ totalContractors }}
              </div>
              <div class="text-muted-foreground mt-2 text-xs">
                Indexed in directory
              </div>
            </div>
            <div>
              <div
                class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
              >
                Categories
              </div>
              <div
                class="text-foreground mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
              >
                {{ specialties.length }}
              </div>
              <div class="text-muted-foreground mt-2 text-xs">
                NAICS / PSC / specialty groups
              </div>
            </div>
            <div>
              <div
                class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
              >
                Defense revenue
              </div>
              <div
                class="text-foreground mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
              >
                {{ formatTotalRevenue(totalDefenseRevenue) }}
              </div>
              <div class="text-muted-foreground mt-2 text-xs">
                Aggregated context, top 50
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-border border-b">
      <div class="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="bg-border grid gap-px lg:grid-cols-3">
            <div class="bg-background p-6">
              <div class="flex items-baseline justify-between">
                <h2
                  class="text-foreground text-sm font-semibold tracking-[0.14em] uppercase"
                >
                  Rankings
                </h2>
                <Icon
                  name="mdi:trophy-outline"
                  class="text-muted-foreground h-4 w-4"
                />
              </div>
              <p class="text-muted-foreground mt-1 text-xs">
                Source-backed contractor leaderboards.
              </p>
              <div class="border-border mt-5 border-t">
                <NuxtLink
                  v-for="link in rankingLinks"
                  :key="link.to"
                  :to="link.to"
                  class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2.5 text-sm transition-colors"
                >
                  <span class="group-hover:text-primary transition-colors">
                    {{ link.label }}
                  </span>
                  <Icon
                    name="mdi:arrow-top-right"
                    class="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>
            </div>

            <div class="bg-background p-6">
              <div class="flex items-baseline justify-between">
                <h2
                  class="text-foreground text-sm font-semibold tracking-[0.14em] uppercase"
                >
                  Topics
                </h2>
                <Icon
                  name="mdi:tag-outline"
                  class="text-muted-foreground h-4 w-4"
                />
              </div>
              <p class="text-muted-foreground mt-1 text-xs">
                Curated mission and capability lenses.
              </p>
              <div class="border-border mt-5 border-t">
                <NuxtLink
                  v-for="link in topicLinks"
                  :key="link.to"
                  :to="link.to"
                  class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2.5 text-sm transition-colors"
                >
                  <span class="group-hover:text-primary transition-colors">
                    {{ link.label }}
                  </span>
                  <Icon
                    name="mdi:arrow-top-right"
                    class="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>
            </div>

            <div class="bg-background p-6">
              <div class="flex items-baseline justify-between">
                <h2
                  class="text-foreground text-sm font-semibold tracking-[0.14em] uppercase"
                >
                  Categories
                </h2>
                <Icon
                  name="mdi:code-tags"
                  class="text-muted-foreground h-4 w-4"
                />
              </div>
              <p class="text-muted-foreground mt-1 text-xs">
                Browse by NAICS, PSC, or agency code.
              </p>
              <div class="border-border mt-5 border-t">
                <NuxtLink
                  v-for="link in categoryLinks"
                  :key="link.to"
                  :to="link.to"
                  class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2.5 text-sm transition-colors"
                >
                  <span class="group-hover:text-primary transition-colors">
                    {{ link.label }}
                  </span>
                  <Icon
                    name="mdi:arrow-top-right"
                    class="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-5xl">
          <div class="mb-6 flex items-baseline justify-between gap-4">
            <div>
              <h2 class="text-foreground text-xl font-bold sm:text-2xl">
                Public Obligation Leaders
              </h2>
              <p class="text-muted-foreground mt-1 text-sm">
                Source-backed contractor ranking for the active award window.
              </p>
            </div>
            <NuxtLink
              to="/rankings/top-defense-contractors"
              class="text-muted-foreground hover:text-foreground shrink-0 text-sm transition-colors"
            >
              Full ranking
            </NuxtLink>
          </div>

          <div v-if="topIntelligencePending" class="border-border border p-8">
            <LoadingText text="Loading public ranking" />
          </div>
          <IntelligenceRankingList
            v-else
            :rows="topIntelligence"
            empty-text="No public ranking records available."
          />
          <IntelligenceSourceFooter
            class="mt-6"
            :metadata="topIntelligenceData.sourceMetadata"
            :source-links="topIntelligenceData.sourceMetadata.sources"
          />
        </div>
      </div>
    </section>

  </div>
</template>
