<!--
  @file Ranking preset detail
  @route /rankings/[presetSlug]
  @description Indexable USAspending-backed contractor ranking pages
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
const presetSlug = computed(() => route.params.presetSlug as string);

const { data, pending, error } = useFetch<{
  preset: { slug: string; title: string; description: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: SourceMetadata;
}>(() => `/api/intelligence/rankings/${presetSlug.value}`, {
  lazy: true,
  watch: [presetSlug],
  default: () => ({
    preset: { slug: presetSlug.value, title: "Ranking", description: "" },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: emptySourceMetadata(),
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
      label: "Matched obligations",
      value: formatIntelligenceMoney(obligations),
      detail: `${data.value.fiscalYears.length} fiscal-year window`,
    },
    {
      label: "Award records",
      value: awards.toLocaleString(),
      detail: `${data.value.sourceMetadata.structuredRecords.toLocaleString()} structured records`,
    },
    {
      label: "Leading recipient",
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
      eyebrow="Ranking"
      :title="data.preset.title"
      :description="data.preset.description"
      :metadata="data.sourceMetadata"
      :fiscal-years="data.fiscalYears"
      max-width="max-w-6xl"
    />

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Ranking unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading ranking" />
      </div>

      <template v-else>
        <div class="space-y-8">
          <IntelligenceMetricStrip :metrics="metrics" />

          <IntelligenceSection title="Ranked Contractors" flush>
            <IntelligenceRankingList :rows="data.contractors" :show-share="true" />
          </IntelligenceSection>

          <IntelligenceSection
            v-if="data.awards.length"
            title="Award Evidence"
            description="Recent source records supporting this ranking."
            flush
          >
            <IntelligenceAwardList :awards="data.awards" />
          </IntelligenceSection>

          <IntelligenceSourceFooter
            :metadata="data.sourceMetadata"
            :source-links="data.sourceMetadata.sources"
          />
        </div>
      </template>
    </section>
  </main>
</template>
