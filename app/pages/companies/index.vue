<!--
  @file Companies directory page
  @route /companies
  @description Primary server-backed table of DoD-awarded USAspending recipients
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

useSeoMeta({
  title: "Defense Contractor Directory | military.contractors",
  description:
    "Search, filter, sort, and page through Department of Defense-awarded USAspending contract recipients active in the trailing 36 months.",
  ogTitle: "Defense Contractor Directory",
  ogDescription:
    "Server-backed table of DoD-awarded USAspending recipients with source-backed profiles.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useCollectionPageSchema({
  name: "Defense Contractor Directory",
  description:
    "Searchable directory of Department of Defense-awarded contract recipients from USAspending.gov.",
});
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase">
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>Contractor directory</span>
          <span class="text-muted-foreground/40">/</span>
          <span>USAspending recipient snapshot</span>
        </div>
        <div class="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              DoD contract recipients
            </h1>
            <p class="text-muted-foreground mt-3 max-w-3xl text-sm leading-relaxed sm:text-base">
              Server-side search, filtering, sorting, and pagination across the
              active trailing 36-month Department of Defense contract recipient
              snapshot.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button as-child variant="outline" size="sm">
              <NuxtLink to="/explorer">
                Explorer
                <Icon name="mdi:database-search" class="ml-2 h-4 w-4" />
              </NuxtLink>
            </Button>
            <Button as-child variant="outline" size="sm">
              <NuxtLink to="/rankings/top-defense-contractors">
                Rankings
                <Icon name="mdi:format-list-numbered" class="ml-2 h-4 w-4" />
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ContractorSnapshotTable :page-size="25" sync-route />
    </section>
  </main>
</template>
