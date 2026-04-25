<!--
  @file Agencies index
  @route /agencies
  @description Indexable agency directory for source-backed contractor intelligence
-->

<script setup lang="ts">
const config = useRuntimeConfig();

const { data, pending, error } = useFetch<{
  agencies: Array<{
    code: string;
    name: string;
    abbreviation: string | null;
    slug: string;
  }>;
  sourceMetadata: { structuredRecords: number; freshness: string };
}>("/api/intelligence/agencies", {
  lazy: true,
  default: () => ({
    agencies: [],
    sourceMetadata: { structuredRecords: 0, freshness: "" },
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
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p class="text-muted-foreground text-sm">Agency intelligence</p>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          Defense Agencies
        </h1>
      </div>
    </section>

    <section class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Agency data unavailable</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading agencies" />
      </div>

      <div v-else class="border-border grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="agency in data.agencies"
          :key="agency.slug"
          :to="`/agencies/${agency.slug}`"
          class="border-border hover:bg-muted/50 border-r border-b p-5 transition-colors"
        >
          <p class="text-foreground font-semibold">{{ agency.name }}</p>
          <p class="text-muted-foreground mt-2 text-sm">
            {{ agency.abbreviation || agency.code }}
          </p>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
