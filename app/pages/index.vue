<!--
  @file Homepage
  @description Database homepage for DoD-awarded USAspending recipients
-->

<script setup lang="ts">
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

interface HomepageStatsResponse {
  recipients: number;
  totalObligated: number;
  totalAwards: number;
  topAgency: string | null;
  refreshedAt: string | null;
}

const { data: stats } = useFetch<HomepageStatsResponse>("/api/stats/homepage", {
  lazy: true,
  default: () => ({
    recipients: 0,
    totalObligated: 0,
    totalAwards: 0,
    topAgency: null,
    refreshedAt: null,
  }),
});

const snapshotDate = computed(() => {
  const value = stats.value?.refreshedAt;
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
});

const ribbonMetrics = computed(() => [
  {
    label: "Recipients",
    value: (stats.value?.recipients ?? 0).toLocaleString(),
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
  title: "Defense Contractor Database | military.contractors",
  description:
    "Search the database of companies and recipients receiving U.S. Department of Defense contract awards in the trailing 36 months.",
  ogTitle: "Defense Contractor Database",
  ogDescription:
    "A searchable database of DoD-awarded USAspending contract recipients with source-backed company profiles.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useWebSiteSchema({
  description:
    "Searchable database of companies and recipients receiving U.S. defense contract awards.",
});
useWebPageSchema({
  name: "Defense Contractor Database",
  description:
    "Database view of Department of Defense-awarded USAspending contract recipients active in the trailing 36 months.",
  type: "CollectionPage",
});
</script>

<template>
  <main class="min-h-full">
    <DirectoryBreadcrumb :freshness="snapshotDate" />

    <section
      class="border-border mx-auto max-w-7xl border-b px-4 py-6 sm:px-6 lg:px-8"
    >
      <h1
        class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        The Defense Contractor Database
      </h1>
      <p
        class="text-muted-foreground mt-3 max-w-3xl text-sm leading-relaxed sm:text-base"
      >
        Search every company and recipient that received U.S. Department of
        Defense contract obligations during the trailing 36 months, sourced
        directly from USAspending.gov. Each profile links back to the original
        federal award records.
      </p>
      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button as-child>
          <NuxtLink to="#verified-directory">Search database</NuxtLink>
        </Button>
        <Button as-child variant="outline">
          <NuxtLink to="/rankings/top-defense-contractors"
            >View rankings</NuxtLink
          >
        </Button>
      </div>
    </section>

    <DirectoryStatRibbon :metrics="ribbonMetrics" class="mx-auto max-w-7xl" />

    <section
      id="verified-directory"
      class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <ContractorSnapshotTable :page-size="25" sync-route />
    </section>

    <section
      class="border-border mx-auto max-w-7xl border-t px-4 py-6 sm:px-6 lg:px-8"
    >
      <p
        class="text-foreground/60 mb-3 text-[0.65rem] tracking-[0.18em] uppercase"
      >
        Database views
      </p>
      <ul class="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <li>
          <NuxtLink to="/rankings/top-defense-contractors" class="group block">
            <span
              class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
            >
              Rankings
            </span>
            <span
              class="text-muted-foreground mt-0.5 block text-xs leading-snug"
            >
              Curated leaderboards of top recipients by obligation.
            </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/agencies" class="group block">
            <span
              class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
            >
              Agencies
            </span>
            <span
              class="text-muted-foreground mt-0.5 block text-xs leading-snug"
            >
              Browse recipients grouped by awarding DoD subagency.
            </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/compare" class="group block">
            <span
              class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
            >
              Compare
            </span>
            <span
              class="text-muted-foreground mt-0.5 block text-xs leading-snug"
            >
              Verify side-by-side contractor differences with structured award
              evidence.
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>
