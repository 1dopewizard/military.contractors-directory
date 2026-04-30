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

const searchQuery = ref("");
const router = useRouter();

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

const submitSearch = () => {
  const q = searchQuery.value.trim();
  router.push(q ? `/companies?q=${encodeURIComponent(q)}` : "/companies");
};

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
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8">
        <div class="min-w-0">
          <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase">
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span>USAspending.gov</span>
            <span class="text-muted-foreground/40">/</span>
            <span>DoD-awarded contracts</span>
            <span class="text-muted-foreground/40">/</span>
            <span>Trailing 36 months</span>
          </div>

          <h1 class="text-foreground mt-6 max-w-4xl text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            The searchable directory of companies receiving U.S. defense contract awards.
          </h1>
          <p class="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Search every Department of Defense-awarded contract recipient in the active
            36-month USAspending window, then open source-backed recipient profiles.
          </p>

          <form
            class="bg-card ring-primary/30 ring-offset-background mt-7 flex max-w-3xl flex-col p-2 ring-1 ring-offset-2 sm:flex-row sm:items-center"
            @submit.prevent="submitSearch"
          >
            <Icon
              name="mdi:magnify"
              class="text-muted-foreground ml-2 hidden h-5 w-5 shrink-0 sm:block"
            />
            <Input
              v-model="searchQuery"
              class="h-12 flex-1 border-0 bg-transparent px-3 text-base focus-visible:ring-0"
              placeholder="Search by recipient name, UEI, agency, NAICS, or PSC"
            />
            <Button type="submit" class="mt-2 h-12 shrink-0 sm:mt-0">
              Search directory
              <Icon name="mdi:arrow-right" class="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>

        <aside class="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div class="border-border bg-card border p-4">
            <p class="text-muted-foreground text-xs uppercase tracking-[0.14em]">
              Recipients
            </p>
            <p class="text-foreground mt-2 text-2xl font-semibold tabular-nums">
              {{ directoryData.total.toLocaleString() }}
            </p>
          </div>
          <div class="border-border bg-card border p-4">
            <p class="text-muted-foreground text-xs uppercase tracking-[0.14em]">
              Snapshot
            </p>
            <p class="text-foreground mt-2 text-lg font-semibold">
              {{ snapshotDate }}
            </p>
          </div>
          <div class="border-border bg-card border p-4">
            <p class="text-muted-foreground text-xs uppercase tracking-[0.14em]">
              Scope
            </p>
            <p class="text-foreground mt-2 text-lg font-semibold">
              DoD awards A-D
            </p>
          </div>
        </aside>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase">
            Directory Preview
          </p>
          <h2 class="text-foreground mt-1 text-xl font-semibold">
            Largest active DoD recipients
          </h2>
        </div>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/companies">
            Open full table
            <Icon name="mdi:arrow-right" class="ml-2 h-4 w-4" />
          </NuxtLink>
        </Button>
      </div>

      <ContractorSnapshotTable preview :page-size="8" :show-filters="false" />
    </section>

    <section class="border-border mx-auto max-w-7xl border-t px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid gap-4 md:grid-cols-4">
        <NuxtLink
          to="/explorer"
          class="border-border hover:border-primary bg-card border p-4 transition-colors"
        >
          <p class="text-foreground font-medium">Explorer</p>
          <p class="text-muted-foreground mt-1 text-sm">
            Ask structured questions across awards and categories.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/rankings/top-defense-contractors"
          class="border-border hover:border-primary bg-card border p-4 transition-colors"
        >
          <p class="text-foreground font-medium">Rankings</p>
          <p class="text-muted-foreground mt-1 text-sm">
            View saved DoD, service, and topic ranking lenses.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/agencies"
          class="border-border hover:border-primary bg-card border p-4 transition-colors"
        >
          <p class="text-foreground font-medium">Agencies</p>
          <p class="text-muted-foreground mt-1 text-sm">
            Browse agency-focused recipient breakdowns.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/compare"
          class="border-border hover:border-primary bg-card border p-4 transition-colors"
        >
          <p class="text-foreground font-medium">Compare</p>
          <p class="text-muted-foreground mt-1 text-sm">
            Compare known contractor award profiles.
          </p>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
