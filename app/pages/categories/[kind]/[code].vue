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
    <section class="border-border border-b">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div
          class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] uppercase tracking-[0.18em]"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span class="text-muted-foreground">USAspending.gov</span>
          <span class="text-muted-foreground/40">/</span>
          <span class="text-muted-foreground">DoD-awarded contracts</span>
          <span class="text-muted-foreground/40">/</span>
          <span class="text-muted-foreground">
            {{ data.category.kind.toUpperCase() }} category
          </span>
          <template v-if="data.sourceMetadata?.cacheStatus">
            <span class="text-muted-foreground/40 hidden sm:inline">/</span>
            <span class="text-muted-foreground">
              {{ data.sourceMetadata.cacheStatus }}
            </span>
          </template>
        </div>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <h1
              class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {{ data.category.code }} · {{ data.category.title }}
            </h1>
            <p class="text-muted-foreground mt-1 max-w-3xl text-sm">
              Contractors and award evidence for
              {{ data.category.kind.toUpperCase() }} {{ data.category.code }}.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="border-border border-b">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <dl
          class="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6"
        >
          <div
            v-for="metric in metrics"
            :key="metric.label"
            class="min-w-0"
          >
            <dt
              class="text-muted-foreground text-[0.65rem] tracking-[0.16em] uppercase"
            >
              {{ metric.label }}
            </dt>
            <dd
              class="text-foreground mt-1.5 truncate text-base font-semibold tabular-nums"
            >
              {{ metric.value }}
            </dd>
            <p
              v-if="metric.detail"
              class="text-muted-foreground mt-1 truncate text-xs"
            >
              {{ metric.detail }}
            </p>
          </div>
        </dl>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Category data unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="py-12">
        <LoadingText text="Loading category intelligence" />
      </div>

      <template v-else>
        <section>
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Ranked contractors
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Recipients with matched obligations under this category.
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
                    :to="`/companies/${row.slug}`"
                    class="text-foreground hover:text-primary text-sm font-medium"
                  >
                    {{ row.name }}
                  </NuxtLink>
                  <span
                    v-else
                    class="text-foreground text-sm font-medium"
                  >
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
            Source records illustrating activity under this category.
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
                    award.awardingSubAgency || award.awardingAgency || "Agency N/A"
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
          <IntelligenceSourceFooter :metadata="data.sourceMetadata" />
        </section>
      </template>
    </div>
  </main>
</template>
