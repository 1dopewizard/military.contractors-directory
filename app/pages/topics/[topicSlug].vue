<!--
  @file Topic intelligence detail
  @route /topics/[topicSlug]
  @description Source-backed topic pages for defense contractor intelligence
-->

<script setup lang="ts">
import type { AwardSummary, RankingRow } from "@/app/types/intelligence.types";

const config = useRuntimeConfig();
const route = useRoute();
const topicSlug = computed(() => route.params.topicSlug as string);

const { data, pending, error } = useFetch<{
  topic: { slug: string; title: string; description: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: { structuredRecords: number; freshness: string };
}>(() => `/api/intelligence/topics/${topicSlug.value}`, {
  lazy: true,
  watch: [topicSlug],
  default: () => ({
    topic: { slug: topicSlug.value, title: "Topic", description: "" },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: { structuredRecords: 0, freshness: "" },
  }),
});

useSeoMeta({
  title: () => `${data.value.topic.title} Contractors | military.contractors`,
  description: () => data.value.topic.description,
  ogTitle: () => `${data.value.topic.title} Contractors`,
  ogDescription: () => data.value.topic.description,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () => `${config.public.siteUrl}/topics/${topicSlug.value}`,
    },
  ],
  meta: [
    {
      name: "robots",
      content: () =>
        data.value.sourceMetadata.structuredRecords > 0 ? "index, follow" : "noindex",
    },
  ],
});

useJsonLd(() => ({
  "@type": "CollectionPage",
  name: data.value.topic.title,
  description: data.value.topic.description,
  isBasedOn: "https://www.usaspending.gov",
}));

const formatMoney = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p class="text-muted-foreground text-sm">Topic intelligence</p>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          {{ data.topic.title }}
        </h1>
        <p class="text-muted-foreground mt-2 max-w-3xl">
          {{ data.topic.description }}
        </p>
      </div>
    </section>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Topic data unavailable</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading topic intelligence" />
      </div>

      <template v-else>
        <section class="border-border mb-8 overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Obligations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in data.contractors" :key="row.rank">
                <TableCell>{{ row.rank }}</TableCell>
                <TableCell>{{ row.name }}</TableCell>
                <TableCell>{{ formatMoney(row.obligations) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section class="border-border border">
          <div class="border-border border-b px-4 py-3">
            <h2 class="text-sm font-semibold">Award Evidence</h2>
          </div>
          <div class="divide-border divide-y">
            <article v-for="award in data.awards" :key="award.key" class="p-4">
              <p class="text-foreground text-sm font-medium">
                {{ award.recipientName }}
              </p>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ award.description || "No description provided." }}
              </p>
              <p class="text-foreground mt-3 text-sm font-semibold">
                {{ formatMoney(award.obligation) }}
              </p>
            </article>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
