<!--
  @file Homepage - Console-first contractor intelligence
  @description Single-focus query console with ambient ranking; left rail for browse
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
const browseOpen = ref(false);

const exampleQueries = [
  {
    query: "Top Department of the Navy contractors",
    shape: "Ranking · agency lens",
    icon: "mdi:trophy-outline",
  },
  {
    query: "Top NAICS 541512 contractors",
    shape: "Ranking · NAICS lens",
    icon: "mdi:code-tags",
  },
  {
    query: "Compare Lockheed Martin and RTX",
    shape: "Comparison · 2 entities",
    icon: "mdi:compare-horizontal",
  },
  {
    query: "Which contractors have missile awards?",
    shape: "Filter · keyword scan",
    icon: "mdi:radar",
  },
];

const browseSections = [
  {
    title: "Rankings",
    icon: "mdi:trophy-outline",
    links: [
      { label: "Top Defense", to: "/rankings/top-defense-contractors" },
      { label: "Navy", to: "/rankings/navy-contractors" },
      { label: "Army", to: "/rankings/army-contractors" },
      { label: "Air Force", to: "/rankings/air-force-contractors" },
    ],
  },
  {
    title: "Topics",
    icon: "mdi:tag-outline",
    links: [
      { label: "Cybersecurity", to: "/topics/cybersecurity" },
      { label: "Missile Defense", to: "/topics/missile-defense" },
      { label: "Shipbuilding", to: "/topics/shipbuilding" },
      { label: "Space Systems", to: "/topics/space-systems" },
    ],
  },
  {
    title: "Categories",
    icon: "mdi:code-tags",
    links: [
      { label: "NAICS 541512", to: "/categories/naics/541512" },
      { label: "NAICS 336611", to: "/categories/naics/336611" },
      { label: "PSC 1410", to: "/categories/psc/1410" },
      { label: "Agencies", to: "/agencies" },
    ],
  },
];

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

const topIntelligence = computed(
  () => topIntelligenceData.value?.contractors ?? [],
);
const homepageFiscalYears = computed(
  () => topIntelligenceData.value?.filters.fiscalYears ?? [],
);
const tableKeys = computed(() =>
  explorerResult.value?.table[0]
    ? Object.keys(explorerResult.value.table[0])
    : [],
);

const hasConsoleOutput = computed(
  () =>
    explorerPending.value || !!explorerError.value || !!explorerResult.value,
);

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

const resetConsole = () => {
  explorerQuery.value = "";
  explorerResult.value = null;
  explorerError.value = null;
};
</script>

<template>
  <div class="flex min-h-full flex-col lg:flex-row">
    <!-- Browse rail (desktop) -->
    <aside
      class="border-border hidden shrink-0 border-r lg:flex lg:w-72 lg:flex-col xl:w-80"
    >
      <div class="flex flex-col gap-7 p-6">
        <div
          class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
        >
          Browse
        </div>
        <div
          v-for="section in browseSections"
          :key="section.title"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <h2
              class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            >
              {{ section.title }}
            </h2>
            <Icon
              :name="section.icon"
              class="text-muted-foreground h-3.5 w-3.5"
            />
          </div>
          <div class="border-border border-t">
            <NuxtLink
              v-for="link in section.links"
              :key="link.to"
              :to="link.to"
              class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2 text-sm transition-colors"
            >
              <span
                class="text-foreground/90 group-hover:text-primary transition-colors"
              >
                {{ link.label }}
              </span>
              <Icon
                name="mdi:arrow-top-right"
                class="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </NuxtLink>
          </div>
        </div>
      </div>
    </aside>

    <!-- Console -->
    <div class="min-w-0 flex-1">
      <div
        class="mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
      >
        <!-- Meta row -->
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
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          Ask anything about defense
          <span class="text-primary">contractors</span>.
        </h1>

        <form
          class="bg-card ring-primary/30 ring-offset-background mt-7 flex max-w-3xl flex-col p-2 ring-1 ring-offset-2 sm:flex-row sm:items-center"
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

        <!-- Mobile browse trigger -->
        <div class="mt-4 lg:hidden">
          <button
            type="button"
            class="border-border text-muted-foreground hover:text-foreground hover:border-primary flex w-full items-center justify-between border px-3 py-2 text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            @click="browseOpen = true"
          >
            <span>Browse rankings, topics, categories</span>
            <Icon name="mdi:chevron-up" class="h-4 w-4" />
          </button>
          <Sheet v-model:open="browseOpen">
            <SheetContent side="bottom" class="flex max-h-[80vh] flex-col">
              <SheetHeader class="text-left">
                <SheetTitle class="text-left">Browse</SheetTitle>
              </SheetHeader>
              <ScrollArea class="-mx-6 flex-1 px-6">
                <div class="space-y-6 py-2">
                  <div
                    v-for="section in browseSections"
                    :key="section.title"
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <h3
                        class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                      >
                        {{ section.title }}
                      </h3>
                      <Icon
                        :name="section.icon"
                        class="text-muted-foreground h-3.5 w-3.5"
                      />
                    </div>
                    <div class="border-border border-t">
                      <NuxtLink
                        v-for="link in section.links"
                        :key="link.to"
                        :to="link.to"
                        class="border-border flex items-center justify-between border-b py-2 text-sm"
                      >
                        <span class="text-foreground">{{ link.label }}</span>
                        <Icon
                          name="mdi:arrow-top-right"
                          class="text-muted-foreground h-3 w-3"
                        />
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <!-- Idle: example query cards -->
        <div v-if="!hasConsoleOutput" class="mt-8">
          <div
            class="text-muted-foreground mb-3 flex items-center justify-between text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span>Sample queries</span>
            <NuxtLink to="/explorer" class="text-primary hover:underline">
              Open full explorer →
            </NuxtLink>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="example in exampleQueries"
              :key="example.query"
              type="button"
              class="border-border bg-card hover:border-primary group flex flex-col gap-2 border p-4 text-left transition-colors"
              @click="useExample(example.query)"
            >
              <div class="flex items-start justify-between gap-3">
                <span class="text-foreground text-sm font-medium leading-snug">
                  {{ example.query }}
                </span>
                <Icon
                  :name="example.icon"
                  class="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors"
                />
              </div>
              <span
                class="text-muted-foreground text-[0.65rem] tracking-[0.16em] uppercase"
              >
                {{ example.shape }}
              </span>
            </button>
          </div>
        </div>

        <!-- Result panel (replaces examples + ambient when active) -->
        <div v-if="hasConsoleOutput" class="mt-8">
          <div class="border-primary/40 bg-card border-l-2">
            <div
              class="border-border bg-background flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="bg-primary inline-block h-2 w-2 animate-pulse rounded-full"
                />
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
                  <Badge
                    v-if="explorerResult.cached"
                    variant="outline"
                    class="text-xs"
                  >
                    Cached
                  </Badge>
                </template>
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground inline-flex items-center text-xs transition-colors"
                  @click="resetConsole"
                >
                  <Icon name="mdi:close" class="mr-1 h-3.5 w-3.5" />
                  Reset
                </button>
                <NuxtLink
                  v-if="explorerResult"
                  to="/explorer"
                  class="text-muted-foreground hover:text-foreground inline-flex items-center text-xs transition-colors"
                >
                  Continue in Explorer
                  <Icon name="mdi:arrow-right" class="ml-1 h-3.5 w-3.5" />
                </NuxtLink>
              </div>
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
                <p class="text-foreground text-base leading-relaxed">
                  {{ explorerResult.summary }}
                </p>

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
                    <p class="text-muted-foreground text-xs">
                      {{ card.label }}
                    </p>
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
                      <span class="text-muted-foreground">
                        {{ item.label }}
                      </span>
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
                    structured records.
                    {{ explorerResult.sourceMetadata.freshness }}
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
                      <Icon
                        name="mdi:open-in-new"
                        class="ml-1 inline h-3 w-3"
                      />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Idle: ambient ranking as default "result" -->
        <div v-if="!hasConsoleOutput" class="mt-10">
          <div class="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <div
                class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
              >
                Default view
              </div>
              <h2 class="text-foreground mt-1 text-lg font-semibold">
                Public obligation leaders
              </h2>
            </div>
            <NuxtLink
              to="/rankings/top-defense-contractors"
              class="text-muted-foreground hover:text-foreground shrink-0 text-sm transition-colors"
            >
              Full ranking →
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
            class="mt-4"
            :metadata="topIntelligenceData.sourceMetadata"
            :source-links="topIntelligenceData.sourceMetadata.sources"
          />
        </div>
      </div>
    </div>
  </div>
</template>
