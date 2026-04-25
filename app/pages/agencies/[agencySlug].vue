<!--
  @file Agency intelligence detail
  @route /agencies/[agencySlug]
  @description Source-backed agency contractor rankings and award examples
-->

<script setup lang="ts">
import type { AwardSummary, RankingRow } from "@/app/types/intelligence.types";

const config = useRuntimeConfig();
const route = useRoute();
const agencySlug = computed(() => route.params.agencySlug as string);

const { data, pending, error } = useFetch<{
  agency: { slug: string; name: string; abbreviation: string | null };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: { structuredRecords: number; freshness: string };
}>(() => `/api/intelligence/agencies/${agencySlug.value}`, {
  lazy: true,
  watch: [agencySlug],
  default: () => ({
    agency: { slug: agencySlug.value, name: "Agency", abbreviation: null },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: { structuredRecords: 0, freshness: "" },
  }),
});

useSeoMeta({
  title: () => `${data.value.agency.name} Contractors | military.contractors`,
  description: () =>
    `Top contractors and recent USAspending awards for ${data.value.agency.name}.`,
  ogTitle: () => `${data.value.agency.name} Contractors`,
  ogDescription: () =>
    `Source-backed defense contractor ranking for ${data.value.agency.name}.`,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () => `${config.public.siteUrl}/agencies/${agencySlug.value}`,
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
  name: `${data.value.agency.name} contractor intelligence`,
  description: `USAspending-backed contractor rankings and awards for ${data.value.agency.name}.`,
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
        <NuxtLink to="/agencies" class="text-muted-foreground hover:text-foreground text-sm">
          Agencies
        </NuxtLink>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          {{ data.agency.name }}
        </h1>
        <p class="text-muted-foreground mt-2 text-sm">
          FY{{ data.fiscalYears.join(", FY") }} contractor obligations from USAspending.
        </p>
      </div>
    </section>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Agency intelligence unavailable</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading agency intelligence" />
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

        <section class="border-border border">
          <div class="border-border border-b px-4 py-3">
            <h2 class="text-sm font-semibold">Recent Awards</h2>
          </div>
          <div class="divide-border divide-y">
            <article v-for="award in data.awards" :key="award.key" class="p-4">
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
            </article>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
