<!--
  @file Category intelligence detail
  @route /categories/[kind]/[code]
  @description NAICS and PSC category pages backed by USAspending records
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
const kind = computed(() => route.params.kind as string);
const code = computed(() => route.params.code as string);

const { data, pending, error } = useFetch<{
  category: { kind: string; code: string; title: string };
  fiscalYears: number[];
  contractors: RankingRow[];
  awards: AwardSummary[];
  sourceMetadata: SourceMetadata;
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
    sourceMetadata: emptySourceMetadata(),
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
      detail: `${data.value.category.kind.toUpperCase()} ${data.value.category.code}`,
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
      :eyebrow="`${data.category.kind.toUpperCase()} category`"
      :title="`${data.category.code} · ${data.category.title}`"
      :description="`Contractors and award evidence for ${data.category.kind.toUpperCase()} ${data.category.code}.`"
      :metadata="data.sourceMetadata"
      :fiscal-years="data.fiscalYears"
      max-width="max-w-6xl"
    />

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Category data unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading category intelligence" />
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
