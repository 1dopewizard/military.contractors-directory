<!--
  @file Companies directory home page
  @route /
  @description Canonical contractor directory over grouped USAspending recipient snapshots
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

interface HomepageFreshnessResponse {
  refreshedAt: string | null;
}

const config = useRuntimeConfig();

const { data: freshness } = useFetch<HomepageFreshnessResponse>(
  "/api/stats/homepage",
  {
    lazy: true,
    default: () => ({
      refreshedAt: null,
    }),
  },
);

const snapshotDate = computed(() => {
  const value = freshness.value?.refreshedAt;
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
});

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
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/` }],
});

useWebSiteSchema({
  description:
    "Searchable directory of companies receiving U.S. defense contract awards.",
});
useWebPageSchema({
  name: "Defense Contractor Directory",
  description:
    "Directory view of Department of Defense-awarded USAspending contractors active in the trailing 36 months.",
  type: "CollectionPage",
});
</script>

<template>
  <main class="min-h-full">
    <DirectoryBreadcrumb :freshness="snapshotDate" />

    <DirectoryPageHeader
      eyebrow="Directory"
      title="Defense Contractor Directory"
      description="Search one canonical profile per active DoD contractor. Raw USAspending recipient names remain preserved as alternate names on each contractor profile."
    />

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ContractorSnapshotTable :page-size="25" sync-route />
    </section>
  </main>
</template>
