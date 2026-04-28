<!--
  @file Agency intelligence detail
  @route /agencies/[agencySlug]
  @description Source-backed agency contractor rankings and award examples
-->

<script setup lang="ts">
import type {
  AwardSummary,
  RankingRow,
  SourceMetadata,
} from "@/app/types/intelligence.types";
import {
  emptySourceMetadata,
  formatIntelligenceMoney,
} from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

const config = useRuntimeConfig();
const route = useRoute();
const agencySlug = computed(() => route.params.agencySlug as string);

const { data, pending, error } = useFetch<{
  agency: { slug: string; name: string; abbreviation: string | null };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: SourceMetadata;
}>(() => `/api/intelligence/agencies/${agencySlug.value}`, {
  lazy: true,
  watch: [agencySlug],
  default: () => ({
    agency: { slug: agencySlug.value, name: "Agency", abbreviation: null },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: emptySourceMetadata(),
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

const metrics = computed(() => {
  const obligations = data.value.contractors.reduce(
    (sum, row) => sum + row.obligations,
    0,
  );
  const awards = data.value.contractors.reduce(
    (sum, row) => sum + (row.awardCount || 0),
    0,
  );
  const leader = data.value.contractors[0];

  return [
    {
      label: "Obligations",
      value: formatIntelligenceMoney(obligations),
      detail: `FY${data.value.fiscalYears.join(", FY")}`,
    },
    {
      label: "Award records",
      value: awards.toLocaleString(),
      detail: `${data.value.sourceMetadata.structuredRecords.toLocaleString()} structured records`,
    },
    {
      label: "Top contractor",
      value: leader?.name || "N/A",
      detail: leader ? formatIntelligenceMoney(leader.obligations) : null,
    },
    {
      label: "Freshness",
      value: data.value.sourceMetadata.cacheStatus,
      detail: data.value.sourceMetadata.freshness || "Source metadata pending",
    },
  ];
});
</script>

<template>
  <main class="min-h-full">
    <IntelligencePageHeader
      eyebrow="Agency dossier"
      :title="data.agency.name"
      :description="`Contractor obligations and recent public awards for ${data.agency.name}.`"
      :metadata="data.sourceMetadata"
      :fiscal-years="data.fiscalYears"
      max-width="max-w-6xl"
    >
      <template #actions>
        <NuxtLink to="/agencies">
          <Button variant="outline" size="sm">All agencies</Button>
        </NuxtLink>
      </template>
    </IntelligencePageHeader>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Agency intelligence unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading agency intelligence" />
      </div>

      <div v-else class="space-y-8">
        <IntelligenceMetricStrip :metrics="metrics" />

        <IntelligenceSection title="Ranked Contractors" flush>
          <IntelligenceRankingList :rows="data.contractors" />
        </IntelligenceSection>

        <IntelligenceSection title="Recent Awards" flush>
          <IntelligenceAwardList :awards="data.awards" />
        </IntelligenceSection>

        <IntelligenceSourceFooter :metadata="data.sourceMetadata" />
      </div>
    </section>
  </main>
</template>
