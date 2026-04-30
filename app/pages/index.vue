<!--
  @file Homepage
  @description Directory-first entry point for DoD-awarded USAspending recipients
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

interface DirectoryResponse {
  total: number;
  sourceMetadata: {
    refreshedAt: string | null;
    freshness: string;
    structuredRecords: number;
    cacheStatus: string;
  };
}

const { data: directoryData } = useFetch<DirectoryResponse>(
  "/api/contractors?limit=1",
  {
    lazy: true,
    default: () => ({
      total: 0,
      sourceMetadata: {
        refreshedAt: null,
        freshness: "",
        structuredRecords: 0,
        cacheStatus: "stale",
      },
    }),
  },
);

const snapshotDate = computed(() => {
  const value = directoryData.value?.sourceMetadata.refreshedAt;
  if (!value) return "Not refreshed";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
});

useSeoMeta({
  title: "Defense Contractor Directory | military.contractors",
  description:
    "Search the directory of companies and recipients receiving U.S. Department of Defense contract awards in the trailing 36 months.",
  ogTitle: "Defense Contractor Directory",
  ogDescription:
    "A searchable directory of DoD-awarded USAspending contract recipients with source-backed company profiles.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useWebSiteSchema({
  description:
    "Searchable directory of companies and recipients receiving U.S. defense contract awards.",
});
useWebPageSchema({
  name: "Defense Contractor Directory",
  description:
    "Directory-first view of Department of Defense-awarded USAspending contract recipients active in the trailing 36 months.",
  type: "CollectionPage",
});
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] sm:px-6 lg:px-8"
      >
        <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
        <span class="text-muted-foreground">USAspending.gov</span>
        <span class="text-muted-foreground/40">/</span>
        <span class="text-muted-foreground">DoD-awarded contracts</span>
        <span class="text-muted-foreground/40">/</span>
        <span class="text-muted-foreground">Trailing 36 months</span>
        <span class="text-muted-foreground/40 hidden sm:inline">/</span>
        <span class="text-foreground tabular-nums">
          {{ directoryData.total.toLocaleString() }} recipients
        </span>
        <span class="text-muted-foreground/40 hidden sm:inline">/</span>
        <span class="text-muted-foreground">
          Refreshed {{ snapshotDate }}
        </span>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ContractorSnapshotTable :page-size="25" sync-route />
    </section>

    <section class="border-border mx-auto max-w-7xl border-t px-4 py-3 sm:px-6 lg:px-8">
      <nav
        class="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
      >
        <span class="text-foreground/60 tracking-[0.16em] uppercase">
          More views
        </span>
        <NuxtLink to="/explorer" class="hover:text-primary transition-colors">
          Explorer
        </NuxtLink>
        <NuxtLink
          to="/rankings/top-defense-contractors"
          class="hover:text-primary transition-colors"
        >
          Rankings
        </NuxtLink>
        <NuxtLink to="/agencies" class="hover:text-primary transition-colors">
          Agencies
        </NuxtLink>
        <NuxtLink to="/compare" class="hover:text-primary transition-colors">
          Compare
        </NuxtLink>
      </nav>
    </section>
  </main>
</template>
