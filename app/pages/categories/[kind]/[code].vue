<!--
  @file Category intelligence detail
  @route /categories/[kind]/[code]
  @description NAICS and PSC category pages backed by USAspending records
-->

<script setup lang="ts">
import type { AwardSummary, RankingRow } from "@/app/types/intelligence.types";

const config = useRuntimeConfig();
const route = useRoute();
const kind = computed(() => route.params.kind as string);
const code = computed(() => route.params.code as string);

const { data, pending, error } = useFetch<{
  category: { kind: string; code: string; title: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: { structuredRecords: number; freshness: string };
}>(() => `/api/intelligence/categories/${kind.value}/${code.value}`, {
  lazy: true,
  watch: [kind, code],
  default: () => ({
    category: {
      kind: kind.value,
      code: code.value,
      title: `${kind.value.toUpperCase()} ${code.value}`,
    },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: { structuredRecords: 0, freshness: "" },
  }),
});

useSeoMeta({
  title: () =>
    `${data.value.category.kind.toUpperCase()} ${data.value.category.code} Contractors | military.contractors`,
  description: () =>
    `Top contractors and awards for ${data.value.category.kind.toUpperCase()} ${data.value.category.code}: ${data.value.category.title}.`,
  ogTitle: () =>
    `${data.value.category.kind.toUpperCase()} ${data.value.category.code} Contractors`,
  ogDescription: () =>
    `Source-backed category intelligence for ${data.value.category.title}.`,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () =>
        `${config.public.siteUrl}/categories/${kind.value}/${code.value}`,
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
  "@type": "Dataset",
  name: `${data.value.category.kind.toUpperCase()} ${data.value.category.code}`,
  description: data.value.category.title,
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
        <p class="text-muted-foreground text-sm uppercase">
          {{ data.category.kind }} category
        </p>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          {{ data.category.code }} · {{ data.category.title }}
        </h1>
      </div>
    </section>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Category data unavailable</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading category intelligence" />
      </div>

      <template v-else>
        <section class="border-border mb-8 overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Obligations</TableHead>
                <TableHead>Awards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in data.contractors" :key="row.rank">
                <TableCell>{{ row.rank }}</TableCell>
                <TableCell>{{ row.name }}</TableCell>
                <TableCell>{{ formatMoney(row.obligations) }}</TableCell>
                <TableCell>{{ row.awardCount || "N/A" }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <article
            v-for="award in data.awards"
            :key="award.key"
            class="border-border border p-4"
          >
            <p class="text-foreground text-sm font-medium">
              {{ award.recipientName }}
            </p>
            <p class="text-muted-foreground mt-2 text-sm">
              {{ award.description || "No description provided." }}
            </p>
            <p class="text-foreground mt-3 text-sm font-semibold">
              {{ formatMoney(award.obligation) }}
            </p>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>
