<!--
  @file Explorer workbench
  @route /explorer
  @description Full research workbench for public defense contractor intelligence
-->

<script setup lang="ts">
import type {
  ExplorerResult,
  FollowUpMode,
  FollowUpResult,
} from "@/app/types/intelligence.types";
import { formatIntelligenceCell } from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const query = ref(
  (route.query.q as string) || "Top Department of the Navy contractors",
);
const followUp = ref("");
const followUpMode = ref<FollowUpMode>("refine");
const result = ref<ExplorerResult | null>(null);
const followUpResult = ref<FollowUpResult | null>(null);
const pending = ref(false);
const followUpPending = ref(false);
const error = ref<string | null>(null);
const mobilePanelOpen = ref(false);
const tableKeys = computed(() =>
  result.value?.table[0] ? Object.keys(result.value.table[0]) : [],
);

watch(pending, (newVal, oldVal) => {
  if (oldVal && !newVal && result.value) {
    mobilePanelOpen.value = false;
  }
});

useSeoMeta({
  title: "Defense Contractor Intelligence Explorer | military.contractors",
  description:
    "Research defense contractors, agencies, awards, NAICS and PSC categories, rankings, and public USAspending source records.",
  ogTitle: "Defense Contractor Intelligence Explorer",
  ogDescription:
    "Run source-backed defense contractor intelligence queries with USAspending data.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/explorer` }],
});

useJsonLd({
  "@type": "Dataset",
  name: "Defense Contractor Intelligence Explorer",
  description:
    "A query interface over normalized USAspending public award records.",
  creator: {
    "@type": "Organization",
    name: "military.contractors",
  },
  isBasedOn: "https://www.usaspending.gov",
});

const examples = [
  "Top Department of the Navy contractors",
  "Compare Lockheed Martin and RTX",
  "Top NAICS 541512 contractors",
  "Missile defense awards",
  "Cyber awards in Virginia",
];
const followUpModes: FollowUpMode[] = ["refine", "pivot", "answer"];

const runQuery = async (refresh = false) => {
  const trimmed = query.value.trim();
  if (!trimmed) return;

  pending.value = true;
  error.value = null;
  followUpResult.value = null;

  try {
    result.value = await $fetch<ExplorerResult>("/api/explorer/query", {
      method: "POST",
      body: { query: trimmed, refresh },
    });
    router.replace({ query: { q: trimmed } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Explorer query failed.";
  } finally {
    pending.value = false;
  }
};

const runFollowUp = async () => {
  if (!result.value || !followUp.value.trim()) return;

  followUpPending.value = true;
  error.value = null;

  try {
    followUpResult.value = await $fetch<FollowUpResult>(
      "/api/explorer/follow-up",
      {
        method: "POST",
        body: {
          cacheId: result.value.id,
          query: followUp.value,
          mode: followUpMode.value,
        },
      },
    );
    if (followUpResult.value.result) {
      result.value = followUpResult.value.result;
      query.value = result.value.query;
    }
    followUp.value = "";
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Follow-up query failed.";
  } finally {
    followUpPending.value = false;
  }
};

const useExample = (example: string) => {
  query.value = example;
  runQuery();
};

const setFollowUpMode = (mode: FollowUpMode) => {
  followUpMode.value = mode;
};

onMounted(() => {
  runQuery();
});
</script>

<template>
  <main class="min-h-full">
    <DirectoryBreadcrumb
      window="Explorer"
      :freshness="result?.sourceMetadata?.cacheStatus || null"
    />

    <DirectoryPageHeader
      eyebrow="Ask the directory"
      title="Explore the directory"
      description="Run source-backed public award queries across recipients, agencies, categories, topics, and recent awards."
      :metadata="result?.sourceMetadata"
      :filters="result?.filtersUsed || []"
    >
      <template #actions>
        <NuxtLink to="/rankings/top-defense-contractors">
          <Button variant="outline" size="sm">Rankings</Button>
        </NuxtLink>
        <NuxtLink to="/agencies">
          <Button variant="outline" size="sm">Agencies</Button>
        </NuxtLink>
      </template>
    </DirectoryPageHeader>

    <section class="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-4 lg:hidden">
        <Button
          type="button"
          variant="outline"
          class="w-full justify-between"
          @click="mobilePanelOpen = !mobilePanelOpen"
        >
          <span class="inline-flex items-center">
            <Icon name="mdi:tune-vertical" class="mr-2 h-4 w-4" />
            {{ mobilePanelOpen ? "Hide refine panel" : "Refine query" }}
          </span>
          <Icon
            :name="mobilePanelOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            class="h-4 w-4"
          />
        </Button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside
          :class="[mobilePanelOpen ? 'block' : 'hidden lg:block', 'space-y-5']"
        >
          <div
            class="bg-card ring-primary/30 ring-offset-background p-4 ring-1 ring-offset-2"
          >
            <form class="space-y-3" @submit.prevent="runQuery(false)">
              <div class="flex items-center gap-2">
                <Icon name="mdi:database-search" class="text-primary h-4 w-4" />
                <Label
                  for="explorer-query"
                  class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
                >
                  Query
                </Label>
              </div>
              <Textarea
                id="explorer-query"
                v-model="query"
                class="min-h-32 resize-none rounded-none border-0 bg-transparent px-0 focus-visible:ring-0"
                placeholder="Ask about a contractor, agency, category, ranking, or keyword"
              />
              <div class="grid grid-cols-[1fr_auto] gap-2">
                <Button type="submit" :disabled="pending">
                  <Icon
                    v-if="pending"
                    name="mdi:loading"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  Run query
                  <Icon
                    v-if="!pending"
                    name="mdi:arrow-right"
                    class="ml-2 h-4 w-4"
                  />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  :disabled="pending"
                  title="Bypass cache"
                  @click="runQuery(true)"
                >
                  <Icon name="mdi:refresh" class="h-4 w-4" />
                  <span class="sr-only">Refresh</span>
                </Button>
              </div>
            </form>
          </div>

          <div class="border-border bg-background border p-4">
            <div class="mb-3 flex items-center justify-between">
              <p
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                Presets
              </p>
              <Icon
                name="mdi:lightning-bolt-outline"
                class="text-muted-foreground h-3.5 w-3.5"
              />
            </div>
            <div class="space-y-2">
              <button
                v-for="example in examples"
                :key="example"
                type="button"
                class="border-border text-muted-foreground hover:border-primary hover:text-foreground w-full border px-3 py-2 text-left text-sm transition-colors"
                @click="useExample(example)"
              >
                {{ example }}
              </button>
            </div>
          </div>

          <div v-if="result" class="border-border bg-background border p-4">
            <form class="space-y-3" @submit.prevent="runFollowUp">
              <div class="flex items-center justify-between">
                <Label
                  for="follow-up"
                  class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
                >
                  Follow-up
                </Label>
                <Icon
                  name="mdi:reply-outline"
                  class="text-muted-foreground h-3.5 w-3.5"
                />
              </div>
              <Textarea
                id="follow-up"
                v-model="followUp"
                class="min-h-24 resize-none rounded-none"
                placeholder="Refine, pivot, or ask about this result"
              />
              <div class="bg-muted/60 inline-flex w-full p-0.5">
                <button
                  v-for="mode in followUpModes"
                  :key="mode"
                  type="button"
                  class="flex-1 px-2 py-1 text-xs capitalize transition-colors"
                  :class="
                    followUpMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  "
                  @click="setFollowUpMode(mode)"
                >
                  {{ mode }}
                </button>
              </div>
              <Button type="submit" class="w-full" :disabled="followUpPending">
                <Icon
                  v-if="followUpPending"
                  name="mdi:loading"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                Run follow-up
              </Button>
            </form>
          </div>
        </aside>

        <div class="min-w-0 space-y-6">
          <IntelligenceErrorState
            v-if="error"
            title="Explorer error"
            :message="error"
          />

          <div v-if="pending" class="border-primary/40 bg-card border-l-2 p-8">
            <LoadingText text="Querying USAspending data" />
          </div>

          <template v-else-if="result">
            <section class="border-primary/40 bg-card border-l-2">
              <div
                class="border-border bg-background flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3"
              >
                <div class="flex items-center gap-2">
                  <span class="bg-primary inline-block h-2 w-2 rounded-full" />
                  <span
                    class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
                  >
                    Result
                  </span>
                  <span class="text-muted-foreground/50">·</span>
                  <Badge variant="secondary" class="text-xs">
                    {{ result.resultType }}
                  </Badge>
                  <Badge v-if="result.cached" variant="outline" class="text-xs">
                    Cached
                  </Badge>
                </div>
                <Badge variant="outline" class="text-xs tabular-nums">
                  {{ result.sourceMetadata.structuredRecords }} records
                </Badge>
              </div>
              <div class="p-5">
                <p class="text-foreground max-w-4xl leading-relaxed">
                  {{ result.summary }}
                </p>
                <p
                  v-if="followUpResult?.answer"
                  class="border-border text-muted-foreground mt-4 border-t pt-4 text-sm"
                >
                  {{ followUpResult.answer }}
                </p>
              </div>
            </section>

            <IntelligenceMetricStrip :metrics="result.cards" />

            <section
              v-if="result.filtersUsed.length"
              class="flex flex-wrap gap-2"
            >
              <Badge
                v-for="filter in result.filtersUsed"
                :key="`${filter.label}-${filter.value}`"
                variant="outline"
              >
                {{ filter.label }}: {{ filter.value }}
              </Badge>
            </section>

            <IntelligenceSection
              v-if="result.chart.length"
              title="Fiscal-Year Trend"
            >
              <IntelligenceTrendBars :rows="result.chart" />
            </IntelligenceSection>

            <IntelligenceSection
              v-if="result.table.length"
              title="Query Table"
              flush
            >
              <div class="border-border overflow-x-auto border">
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
                    <TableRow v-for="(row, index) in result.table" :key="index">
                      <TableCell
                        v-for="key in tableKeys"
                        :key="key"
                        class="max-w-96 align-top text-xs"
                      >
                        {{ formatIntelligenceCell(row[key]) }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </IntelligenceSection>

            <IntelligenceSection
              v-if="result.awards.length"
              title="Award Drill-Down"
              flush
            >
              <IntelligenceAwardList :awards="result.awards" />
            </IntelligenceSection>

            <IntelligenceSourceFooter
              :metadata="result.sourceMetadata"
              :source-links="result.sourceLinks"
            />
          </template>
        </div>
      </div>
    </section>
  </main>
</template>
