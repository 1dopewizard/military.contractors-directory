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
const tableKeys = computed(() =>
  result.value?.table[0] ? Object.keys(result.value.table[0]) : [],
);
const maxTrendValue = computed(() =>
  Math.max(...(result.value?.chart.map((point) => point.obligation) ?? [0])),
);

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
    error.value =
      err instanceof Error ? err.message : "Explorer query failed.";
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

const formatMoney = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};

const formatCell = (value: string | number | null): string => {
  if (value === null) return "N/A";
  if (typeof value === "number") return value > 100000 ? formatMoney(value) : String(value);
  return value;
};

const trendWidth = (value: number): string => {
  if (!maxTrendValue.value) return "0%";
  return `${Math.max(4, Math.round((value / maxTrendValue.value) * 100))}%`;
};

onMounted(() => {
  runQuery();
});
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-muted-foreground text-sm">USAspending workbench</p>
            <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
              Contractor Intelligence Explorer
            </h1>
          </div>
          <div class="flex flex-wrap gap-2">
            <NuxtLink to="/rankings/top-defense-contractors">
              <Button variant="outline">Rankings</Button>
            </NuxtLink>
            <NuxtLink to="/agencies">
              <Button variant="outline">Agencies</Button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside class="space-y-4">
          <div class="border-border bg-background border p-4">
            <form class="space-y-4" @submit.prevent="runQuery(false)">
              <div class="space-y-2">
                <Label for="explorer-query">Query</Label>
                <Textarea
                  id="explorer-query"
                  v-model="query"
                  class="min-h-32 resize-none rounded-none"
                  placeholder="Ask about a contractor, agency, category, ranking, or keyword"
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <Button type="submit" :disabled="pending">
                  <Icon
                    v-if="pending"
                    name="mdi:loading"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  Run
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  :disabled="pending"
                  @click="runQuery(true)"
                >
                  Refresh
                </Button>
              </div>
            </form>
          </div>

          <div class="border-border bg-background border p-4">
            <p class="text-foreground mb-3 text-sm font-medium">Presets</p>
            <div class="space-y-2">
              <button
                v-for="example in examples"
                :key="example"
                type="button"
                class="border-border text-muted-foreground hover:text-foreground w-full border px-3 py-2 text-left text-sm transition-colors"
                @click="useExample(example)"
              >
                {{ example }}
              </button>
            </div>
          </div>

          <div v-if="result" class="border-border bg-background border p-4">
            <form class="space-y-3" @submit.prevent="runFollowUp">
              <Label for="follow-up">Follow-up</Label>
              <Textarea
                id="follow-up"
                v-model="followUp"
                class="min-h-24 resize-none rounded-none"
                placeholder="Refine, pivot, or ask about this result"
              />
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="mode in followUpModes"
                  :key="mode"
                  type="button"
                  class="border-border border px-2 py-1.5 text-xs capitalize"
                  :class="
                    followUpMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
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
          <Alert v-if="error" variant="destructive">
            <AlertTitle>Explorer error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div v-if="pending" class="border-border border p-8">
            <LoadingText text="Querying USAspending data" />
          </div>

          <template v-else-if="result">
            <section class="border-border bg-background border p-5">
              <div class="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{{ result.resultType }}</Badge>
                <Badge v-if="result.cached" variant="outline">Cached</Badge>
                <Badge variant="outline">
                  {{ result.sourceMetadata.structuredRecords }} records
                </Badge>
              </div>
              <p class="text-foreground max-w-4xl leading-relaxed">
                {{ result.summary }}
              </p>
              <p
                v-if="followUpResult?.answer"
                class="border-border text-muted-foreground mt-4 border-t pt-4 text-sm"
              >
                {{ followUpResult.answer }}
              </p>
            </section>

            <section class="grid gap-3 sm:grid-cols-3">
              <div
                v-for="card in result.cards"
                :key="card.label"
                class="border-border bg-background border p-4"
              >
                <p class="text-muted-foreground text-xs">{{ card.label }}</p>
                <p class="text-foreground mt-1 text-2xl font-semibold">
                  {{ card.value }}
                </p>
                <p class="text-muted-foreground mt-1 text-xs">{{ card.detail }}</p>
              </div>
            </section>

            <section v-if="result.filtersUsed.length" class="flex flex-wrap gap-2">
              <Badge
                v-for="filter in result.filtersUsed"
                :key="`${filter.label}-${filter.value}`"
                variant="outline"
              >
                {{ filter.label }}: {{ filter.value }}
              </Badge>
            </section>

            <section v-if="result.chart.length" class="border-border border">
              <div class="border-border border-b px-4 py-3">
                <h2 class="text-sm font-semibold">Fiscal-Year Trend</h2>
              </div>
              <div class="space-y-3 p-4">
                <div
                  v-for="point in result.chart"
                  :key="point.key"
                  class="grid grid-cols-[5rem_1fr_6rem] items-center gap-3 text-sm"
                >
                  <span class="text-muted-foreground">{{ point.label }}</span>
                  <div class="bg-muted h-2">
                    <div
                      class="bg-primary h-2"
                      :style="{ width: trendWidth(point.obligation) }"
                    />
                  </div>
                  <span class="text-right tabular-nums">
                    {{ formatMoney(point.obligation) }}
                  </span>
                </div>
              </div>
            </section>

            <section v-if="result.table.length" class="border-border overflow-x-auto border">
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
                      {{ formatCell(row[key]) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            <section v-if="result.awards.length" class="border-border border">
              <div class="border-border border-b px-4 py-3">
                <h2 class="text-sm font-semibold">Award Drill-Down</h2>
              </div>
              <div class="divide-border divide-y">
                <article v-for="award in result.awards" :key="award.key" class="p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <div>
                      <p class="text-foreground text-sm font-medium">
                        {{ award.recipientName }}
                      </p>
                      <p class="text-muted-foreground mt-1 text-sm">
                        {{ award.description || "No description provided." }}
                      </p>
                    </div>
                    <p class="text-foreground shrink-0 text-sm font-semibold">
                      {{ formatMoney(award.obligation) }}
                    </p>
                  </div>
                  <div class="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs">
                    <span>{{ award.awardingSubAgency || award.awardingAgency }}</span>
                    <span v-if="award.naicsCode">NAICS {{ award.naicsCode }}</span>
                    <span v-if="award.pscCode">PSC {{ award.pscCode }}</span>
                    <NuxtLink
                      :to="award.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      Source
                    </NuxtLink>
                  </div>
                </article>
              </div>
            </section>

            <section class="border-border border-t pt-4">
              <p class="text-muted-foreground text-xs">
                {{ result.sourceMetadata.freshness }}
              </p>
              <div class="mt-2 flex flex-wrap gap-3">
                <NuxtLink
                  v-for="source in result.sourceLinks"
                  :key="source.url"
                  :to="source.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-xs hover:underline"
                >
                  {{ source.label }}
                </NuxtLink>
              </div>
            </section>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>
