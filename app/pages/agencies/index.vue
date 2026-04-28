<!--
  @file Agencies index - console-first
  @route /agencies
  @description Indexable agency directory with left-rail quick links and client-side name search
-->

<script setup lang="ts">
import type { SourceMetadata } from "@/app/types/intelligence.types";
import { emptySourceMetadata } from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

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

const searchQuery = ref("");
const browseOpen = ref(false);

const browseSections = [
  {
    title: "Rankings",
    icon: "mdi:trophy-outline",
    links: [
      { label: "Top Defense", to: "/rankings/top-defense-contractors" },
      { label: "Navy", to: "/rankings/navy-contractors" },
      { label: "Army", to: "/rankings/army-contractors" },
      { label: "Air Force", to: "/rankings/air-force-contractors" },
    ],
  },
  {
    title: "Topics",
    icon: "mdi:tag-outline",
    links: [
      { label: "Cybersecurity", to: "/topics/cybersecurity" },
      { label: "Missile Defense", to: "/topics/missile-defense" },
      { label: "Shipbuilding", to: "/topics/shipbuilding" },
      { label: "Space Systems", to: "/topics/space-systems" },
    ],
  },
  {
    title: "Categories",
    icon: "mdi:code-tags",
    links: [
      { label: "NAICS 541512", to: "/categories/naics/541512" },
      { label: "NAICS 336611", to: "/categories/naics/336611" },
      { label: "PSC 1410", to: "/categories/psc/1410" },
      { label: "Companies", to: "/companies" },
    ],
  },
];

const agencies = computed(() => data.value.agencies ?? []);

const filteredAgencies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return agencies.value;
  return agencies.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.abbreviation?.toLowerCase().includes(q) ?? false) ||
      a.code.toLowerCase().includes(q),
  );
});

const metrics = computed(() => [
  {
    label: "Agencies",
    value: agencies.value.length.toLocaleString(),
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
  <div class="flex min-h-full flex-col lg:flex-row">
    <!-- Browse rail (desktop) -->
    <aside
      class="border-border hidden shrink-0 border-r lg:flex lg:w-72 lg:flex-col xl:w-80"
    >
      <div class="flex flex-col gap-7 p-6">
        <div
          class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
        >
          Browse
        </div>
        <div
          v-for="section in browseSections"
          :key="section.title"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <h2
              class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            >
              {{ section.title }}
            </h2>
            <Icon
              :name="section.icon"
              class="text-muted-foreground h-3.5 w-3.5"
            />
          </div>
          <div class="border-border border-t">
            <NuxtLink
              v-for="link in section.links"
              :key="link.to"
              :to="link.to"
              class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2 text-sm transition-colors"
            >
              <span
                class="text-foreground/90 group-hover:text-primary transition-colors"
              >
                {{ link.label }}
              </span>
              <Icon
                name="mdi:arrow-top-right"
                class="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </NuxtLink>
          </div>
        </div>
      </div>
    </aside>

    <!-- Console -->
    <div class="min-w-0 flex-1">
      <div
        class="mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
      >
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>Agency intelligence</span>
          <span class="text-muted-foreground/40">/</span>
          <span>USAspending.gov</span>
          <span class="text-muted-foreground/40">/</span>
          <span class="text-foreground/80">
            {{ data.sourceMetadata.cacheStatus }}
          </span>
        </div>

        <h1
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          Defense
          <span class="text-primary">agencies</span>.
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
          Browse source-backed contractor rankings by awarding agency.
        </p>

        <div
          class="bg-card ring-primary/30 ring-offset-background mt-7 flex max-w-3xl items-center p-2 ring-1 ring-offset-2"
        >
          <Icon
            name="mdi:magnify"
            class="text-muted-foreground ml-2 hidden h-5 w-5 shrink-0 sm:block"
          />
          <Input
            v-model="searchQuery"
            class="h-12 flex-1 border-0 bg-transparent px-3 text-base focus-visible:ring-0"
            placeholder="Search by agency name, abbreviation, or code..."
          />
          <button
            v-if="searchQuery"
            type="button"
            class="text-muted-foreground hover:text-foreground inline-flex h-12 w-10 items-center justify-center transition-colors"
            @click="searchQuery = ''"
          >
            <Icon name="mdi:close" class="h-4 w-4" />
            <span class="sr-only">Clear search</span>
          </button>
        </div>

        <!-- Mobile browse trigger -->
        <div class="mt-4 lg:hidden">
          <button
            type="button"
            class="border-border text-muted-foreground hover:text-foreground hover:border-primary flex w-full items-center justify-between border px-3 py-2 text-[0.7rem] tracking-[0.14em] uppercase transition-colors"
            @click="browseOpen = true"
          >
            <span>Browse rankings, topics, categories</span>
            <Icon name="mdi:chevron-up" class="h-4 w-4" />
          </button>
          <Sheet v-model:open="browseOpen">
            <SheetContent side="bottom" class="flex max-h-[80vh] flex-col">
              <SheetHeader class="text-left">
                <SheetTitle class="text-left">Browse</SheetTitle>
              </SheetHeader>
              <ScrollArea class="-mx-6 flex-1 px-6">
                <div class="space-y-6 py-2">
                  <div
                    v-for="section in browseSections"
                    :key="section.title"
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <h3
                        class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                      >
                        {{ section.title }}
                      </h3>
                      <Icon
                        :name="section.icon"
                        class="text-muted-foreground h-3.5 w-3.5"
                      />
                    </div>
                    <div class="border-border border-t">
                      <NuxtLink
                        v-for="link in section.links"
                        :key="link.to"
                        :to="link.to"
                        class="border-border flex items-center justify-between border-b py-2 text-sm"
                      >
                        <span class="text-foreground">{{ link.label }}</span>
                        <Icon
                          name="mdi:arrow-top-right"
                          class="text-muted-foreground h-3 w-3"
                        />
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <IntelligenceErrorState
          v-if="error"
          class="mt-8"
          title="Agency data unavailable"
          :message="error.message"
        />

        <div v-if="pending" class="border-border mt-8 border p-8">
          <LoadingText text="Loading agencies" />
        </div>

        <div v-else class="mt-8 space-y-8">
          <IntelligenceMetricStrip :metrics="metrics" />

          <div>
            <div
              class="text-muted-foreground mb-3 flex items-center justify-between text-[0.7rem] tracking-[0.18em] uppercase"
            >
              <span>
                {{ filteredAgencies.length }}
                {{ filteredAgencies.length === 1 ? "agency" : "agencies" }}
                <span v-if="searchQuery" class="text-muted-foreground/60">
                  · filtered
                </span>
              </span>
              <NuxtLink to="/explorer" class="text-primary hover:underline">
                Open explorer →
              </NuxtLink>
            </div>

            <div
              v-if="filteredAgencies.length"
              class="border-border bg-card grid border-t border-l sm:grid-cols-2 lg:grid-cols-3"
            >
              <NuxtLink
                v-for="agency in filteredAgencies"
                :key="agency.slug"
                :to="`/agencies/${agency.slug}`"
                class="border-border group hover:bg-muted/40 border-r border-b p-4 transition-colors"
              >
                <p
                  class="text-foreground group-hover:text-primary text-sm font-semibold transition-colors"
                >
                  {{ agency.name }}
                </p>
                <p class="text-muted-foreground mt-2 font-mono text-xs">
                  {{ agency.abbreviation || agency.code }}
                </p>
              </NuxtLink>
            </div>

            <div
              v-else
              class="border-border text-muted-foreground border p-8 text-center text-sm"
            >
              No agencies match "{{ searchQuery }}".
            </div>
          </div>

          <IntelligenceSourceFooter :metadata="data.sourceMetadata" />
        </div>
      </div>
    </div>
  </div>
</template>
