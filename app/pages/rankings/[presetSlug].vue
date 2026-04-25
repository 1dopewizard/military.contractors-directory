<!--
  @file Ranking preset detail
  @route /rankings/[presetSlug]
  @description Indexable USAspending-backed contractor ranking pages
-->

<script setup lang="ts">
import type { AwardSummary, RankingRow } from "@/app/types/intelligence.types";

const config = useRuntimeConfig();
const route = useRoute();
const presetSlug = computed(() => route.params.presetSlug as string);

const { data, pending, error } = useFetch<{
  preset: { slug: string; title: string; description: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: { structuredRecords: number; freshness: string };
}>(() => `/api/intelligence/rankings/${presetSlug.value}`, {
  lazy: true,
  watch: [presetSlug],
  default: () => ({
    preset: { slug: presetSlug.value, title: "Ranking", description: "" },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: { structuredRecords: 0, freshness: "" },
  }),
});

useSeoMeta({
  title: () => `${data.value.preset.title} | military.contractors`,
  description: () => data.value.preset.description,
  ogTitle: () => data.value.preset.title,
  ogDescription: () => data.value.preset.description,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () => `${config.public.siteUrl}/rankings/${presetSlug.value}`,
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
  name: data.value.preset.title,
  description: data.value.preset.description,
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
        <p class="text-muted-foreground text-sm">Ranking</p>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          {{ data.preset.title }}
        </h1>
        <p class="text-muted-foreground mt-2 max-w-3xl">
          {{ data.preset.description }}
        </p>
      </div>
    </section>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Ranking unavailable</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading ranking" />
      </div>

      <template v-else>
        <section class="border-border overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Obligations</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in data.contractors" :key="row.rank">
                <TableCell>{{ row.rank }}</TableCell>
                <TableCell>{{ row.name }}</TableCell>
                <TableCell>{{ formatMoney(row.obligations) }}</TableCell>
                <TableCell>
                  {{ row.share ? `${Math.round(row.share * 100)}%` : "N/A" }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <p class="text-muted-foreground mt-4 text-xs">
          {{ data.sourceMetadata.freshness }}
        </p>
      </template>
    </section>
  </main>
</template>
