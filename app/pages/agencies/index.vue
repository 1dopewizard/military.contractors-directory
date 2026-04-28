<!--
  @file Agencies index
  @route /agencies
  @description Indexable agency directory for source-backed contractor intelligence
-->

<script setup lang="ts">
import type { SourceMetadata } from "@/app/types/intelligence.types";
import { emptySourceMetadata } from "@/app/lib/intelligence-ui";

const config = useRuntimeConfig();

const { data, pending, error } = useFetch<{
  agencies: Array<{
    code: string;
    name: string;
    abbreviation: string | null;
    slug: string;
  }>;
  sourceMetadata: SourceMetadata;
}>("/api/intelligence/agencies", {
  lazy: true,
  default: () => ({
    agencies: [],
    sourceMetadata: emptySourceMetadata(),
  }),
});

useSeoMeta({
  title: "Defense Agencies | military.contractors",
  description:
    "Browse agency-backed defense contractor rankings and USAspending award intelligence.",
  ogTitle: "Defense Agencies",
  ogDescription:
    "Index of agency intelligence pages for public defense contractor research.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/agencies` }],
});

useCollectionPageSchema({
  name: "Defense Agencies",
  description: "Agency pages backed by public USAspending award data.",
});

const metrics = computed(() => [
  {
    label: "Agencies",
    value: data.value.agencies.length.toLocaleString(),
    detail: "Indexed public agency pages",
  },
  {
    label: "Structured records",
    value: data.value.sourceMetadata.structuredRecords.toLocaleString(),
    detail: "USAspending award rows",
  },
  {
    label: "Source",
    value: "USAspending",
    detail: data.value.sourceMetadata.cacheStatus,
  },
  {
    label: "Freshness",
    value: data.value.sourceMetadata.cacheStatus,
    detail: data.value.sourceMetadata.freshness || "Source metadata pending",
  },
]);
</script>

<template>
  <main class="min-h-full">
    <IntelligencePageHeader
      eyebrow="Agency intelligence"
      title="Defense Agencies"
      description="Browse source-backed contractor rankings by awarding agency."
      :metadata="data.sourceMetadata"
      max-width="max-w-6xl"
    />

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <IntelligenceErrorState
        v-if="error"
        class="mb-6"
        title="Agency data unavailable"
        :message="error.message"
      />

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading agencies" />
      </div>

      <div v-else class="space-y-8">
        <IntelligenceMetricStrip :metrics="metrics" />

        <IntelligenceSection title="Agency Index" flush>
          <div class="border-border grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="agency in data.agencies"
              :key="agency.slug"
              :to="`/agencies/${agency.slug}`"
              class="border-border hover:bg-muted/50 border-r border-b p-4 transition-colors"
            >
              <p class="text-foreground text-sm font-semibold">{{ agency.name }}</p>
              <p class="text-muted-foreground mt-2 font-mono text-xs">
                {{ agency.abbreviation || agency.code }}
              </p>
            </NuxtLink>
          </div>
        </IntelligenceSection>

        <IntelligenceSourceFooter :metadata="data.sourceMetadata" />
      </div>
    </section>
  </main>
</template>
