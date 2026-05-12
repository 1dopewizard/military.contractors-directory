<!--
  @file Companies directory page
  @route /companies
  @description Canonical contractor directory over grouped USAspending recipient snapshots
-->

<script setup lang="ts">
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

interface CompaniesStatsResponse {
  contractors: number;
  recipients: number;
  totalObligated: number;
  totalAwards: number;
  topAgency: string | null;
  refreshedAt: string | null;
}

const config = useRuntimeConfig();

const { data: stats } = useFetch<CompaniesStatsResponse>(
  "/api/stats/homepage",
  {
    lazy: true,
    default: () => ({
      contractors: 0,
      recipients: 0,
      totalObligated: 0,
      totalAwards: 0,
      topAgency: null,
      refreshedAt: null,
    }),
  },
);

const snapshotDate = computed(() => {
  const value = stats.value?.refreshedAt;
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
});

const metrics = computed(() => [
  {
    label: "Contractors",
    value: (
      stats.value?.contractors ??
      stats.value?.recipients ??
      0
    ).toLocaleString(),
  },
  {
    label: "Obligated (36mo)",
    value: formatIntelligenceMoney(stats.value?.totalObligated ?? 0),
  },
  {
    label: "Awards",
    value: (stats.value?.totalAwards ?? 0).toLocaleString(),
  },
  {
    label: "Top Awarder",
    value: stats.value?.topAgency ?? "—",
  },
]);

useSeoMeta({
  title: "Defense Contractor Directory | military.contractors",
  description:
    "Search canonical DoD contractor profiles with USAspending-backed obligations, awards, identifiers, agencies, NAICS, PSC, and alternate recipient names.",
  ogTitle: "Defense Contractor Directory",
  ogDescription:
    "Canonical directory of Department of Defense contractors active in the trailing 36 months, sourced from USAspending.gov.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/companies` }],
});
</script>

<template>
  <main class="min-h-full">
    <DirectoryBreadcrumb :freshness="snapshotDate" />

    <DirectoryPageHeader
      eyebrow="Directory"
      title="Defense contractor directory"
      description="Search one canonical profile per active DoD contractor. Raw USAspending recipient names remain preserved as alternate names on each contractor profile."
    />

    <DirectoryStatRibbon :metrics="metrics" class="mx-auto max-w-7xl" />

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ContractorSnapshotTable :page-size="25" sync-route />
    </section>
  </main>
</template>
