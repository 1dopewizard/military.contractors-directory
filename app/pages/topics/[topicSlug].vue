<!--
  @file Topic intelligence detail
  @route /topics/[topicSlug]
  @description Source-backed topic pages for defense contractor intelligence
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

const config = useRuntimeConfig();
const route = useRoute();
const topicSlug = computed(() => route.params.topicSlug as string);

const { data, pending, error } = useFetch<{
  topic: { slug: string; title: string; description: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: SourceMetadata;
}>(() => `/api/intelligence/topics/${topicSlug.value}`, {
  lazy: true,
  watch: [topicSlug],
  default: () => ({
    topic: { slug: topicSlug.value, title: "Topic", description: "" },
    fiscalYears: [],
    contractors: [],
    awards: [],
    sourceMetadata: emptySourceMetadata(),
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
      detail: data.value.topic.title,
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
      eyebrow="Topic intelligence"
      :title="data.topic.title"
      :description="data.topic.description"
      :metadata="data.sourceMetadata"
      :fiscal-years="data.fiscalYears"
      max-width="max-w-6xl"
    />

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Topic data unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading topic intelligence" />
      </div>

      <div v-else class="space-y-8">
        <IntelligenceMetricStrip :metrics="metrics" />

        <IntelligenceSection title="Ranked Contractors" flush>
          <IntelligenceRankingTable :rows="data.contractors" />
        </IntelligenceSection>

        <IntelligenceSection title="Award Evidence" flush>
          <IntelligenceAwardList :awards="data.awards" />
        </IntelligenceSection>

        <IntelligenceSourceFooter :metadata="data.sourceMetadata" />
      </div>
    </section>
  </main>
</template>
