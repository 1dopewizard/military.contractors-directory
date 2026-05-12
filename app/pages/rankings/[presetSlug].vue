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
  formatIntelligencePercent,
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
        data.value.sourceMetadata.structuredRecords > 0
          ? "index, follow"
          : "noindex",
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
    <DirectoryBreadcrumb
      :extra="[{ label: data.preset.title }]"
      :freshness="data.sourceMetadata?.cacheStatus || null"
    />

    <DirectoryPageHeader
      eyebrow="Ranking"
      :title="data.preset.title"
      :description="data.preset.description || null"
    />

    <DirectoryStatRibbon :metrics="metrics" class="mx-auto max-w-7xl" />

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Ranking unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="py-12">
        <LoadingText text="Loading ranking" />
      </div>

      <template v-else>
        <section>
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Ranked contractors
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Recipients ranked by matched USAspending obligations.
          </p>
          <div
            v-if="!data.contractors.length"
            class="text-muted-foreground mt-5 text-sm"
          >
            No ranked contractor records.
          </div>
          <table v-else class="mt-5 w-full text-sm">
            <tbody>
              <tr
                v-for="row in data.contractors"
                :key="`${row.rank}-${row.name}`"
                class="border-border/40 border-b last:border-b-0"
              >
                <td
                  class="text-muted-foreground py-3 pr-4 align-top font-mono text-xs tabular-nums"
                >
                  #{{ row.rank }}
                </td>
                <td class="py-3 pr-4 align-top">
                  <NuxtLink
                    v-if="row.slug"
                    :to="`/${row.slug}`"
                    class="text-foreground hover:text-primary text-sm font-medium"
                  >
                    {{ row.name }}
                  </NuxtLink>
                  <span v-else class="text-foreground text-sm font-medium">
                    {{ row.name }}
                  </span>
                  <p
                    v-if="row.uei"
                    class="text-muted-foreground mt-0.5 font-mono text-[11px]"
                  >
                    UEI {{ row.uei }}
                  </p>
                </td>
                <td
                  class="text-muted-foreground py-3 pr-4 text-right align-top text-xs tabular-nums"
                >
                  {{ row.awardCount?.toLocaleString?.() || "—" }} awards
                </td>
                <td
                  class="text-muted-foreground py-3 pr-4 text-right align-top text-xs tabular-nums"
                >
                  {{ formatIntelligencePercent(row.share) }}
                </td>
                <td
                  class="text-foreground py-3 text-right align-top text-sm font-semibold tabular-nums"
                >
                  {{ formatIntelligenceMoney(row.obligations) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section
          v-if="data.awards.length"
          class="border-border mt-12 border-t pt-10"
        >
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Award evidence
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Recent source records supporting this ranking.
          </p>
          <ul class="divide-border/50 mt-5 divide-y">
            <li
              v-for="award in data.awards"
              :key="award.key"
              class="py-4 first:pt-0"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <div class="min-w-0">
                  <p
                    class="text-foreground text-sm font-medium [overflow-wrap:anywhere]"
                  >
                    {{ award.recipientName }}
                  </p>
                  <p
                    class="text-muted-foreground mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]"
                  >
                    {{ award.description || "No description provided." }}
                  </p>
                </div>
                <p
                  class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
                >
                  {{ formatIntelligenceMoney(award.obligation) }}
                </p>
              </div>
              <div
                class="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
              >
                <span v-if="award.fiscalYear">FY{{ award.fiscalYear }}</span>
                <span>
                  {{
                    award.awardingSubAgency ||
                    award.awardingAgency ||
                    "Agency N/A"
                  }}
                </span>
                <span v-if="award.naicsCode">NAICS {{ award.naicsCode }}</span>
                <span v-if="award.pscCode">PSC {{ award.pscCode }}</span>
                <span
                  v-if="award.piid"
                  class="font-mono [overflow-wrap:anywhere]"
                >
                  PIID {{ award.piid }}
                </span>
                <NuxtLink
                  v-if="award.sourceUrl"
                  :to="award.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  Source
                </NuxtLink>
              </div>
            </li>
          </ul>
        </section>

        <section class="border-border mt-12 border-t pt-10">
          <DirectorySourceFooter
            :metadata="data.sourceMetadata"
            :source-links="data.sourceMetadata.sources"
          />
        </section>
      </template>
    </div>
  </main>
</template>
