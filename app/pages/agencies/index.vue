<!--
  @file Agencies index - console-first
  @route /agencies
  @description Indexable agency directory with left-rail quick links and client-side name search
-->

<script setup lang="ts">
import type { SourceMetadata } from "@/app/types/intelligence.types";
import {
  emptySourceMetadata,
  formatIntelligenceMoney,
} from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

const config = useRuntimeConfig();

interface AgencyAggregates {
  totalAgencies: number;
  totalObligated: number;
  topSubagency: string | null;
}

const { data, pending, error } = useFetch<{
  agencies: Array<{
    code: string;
    name: string;
    abbreviation: string | null;
    slug: string;
  }>;
  aggregates: AgencyAggregates;
  sourceMetadata: SourceMetadata;
}>("/api/intelligence/agencies", {
  lazy: true,
  default: () => ({
    agencies: [],
    aggregates: {
      totalAgencies: 0,
      totalObligated: 0,
      topSubagency: null,
    },
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
      { label: "Companies", to: "/" },
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

const ribbonMetrics = computed(() => {
  const aggregates = data.value?.aggregates;
  return [
    {
      label: "Subagencies",
      value: (aggregates?.totalAgencies ?? 0).toLocaleString(),
    },
    {
      label: "Obligated (36mo)",
      value: formatIntelligenceMoney(aggregates?.totalObligated ?? 0),
    },
    {
      label: "Top Subagency",
      value: aggregates?.topSubagency ?? "—",
    },
    {
      label: "References",
      value: agencies.value.length.toLocaleString(),
      detail: "USAspending toptier agencies",
    },
  ];
});
</script>

<template>
  <main class="min-h-full">
    <DirectoryBreadcrumb
      window="Agency directory"
      :extra="[{ label: `${agencies.length.toLocaleString()} agencies` }]"
    />

    <DirectoryStatRibbon :metrics="ribbonMetrics" class="mx-auto max-w-7xl" />

    <div class="flex min-h-full flex-col lg:flex-row">
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

      <div class="min-w-0 flex-1">
        <div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section>
            <h2
              class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
            >
              Search agencies
            </h2>
            <div
              class="bg-card ring-primary/30 ring-offset-background mt-5 flex max-w-3xl items-center p-2 ring-1 ring-offset-2"
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
                            <span class="text-foreground">{{
                              link.label
                            }}</span>
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
          </section>

          <IntelligenceErrorState
            v-if="error"
            class="mt-12"
            title="Agency data unavailable"
            :message="error.message"
          />

          <div v-if="pending" class="py-12">
            <LoadingText text="Loading agencies" />
          </div>

          <template v-else>
            <section class="border-border mt-12 border-t pt-10">
              <div class="flex items-center justify-between">
                <h2
                  class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
                >
                  {{ filteredAgencies.length }}
                  {{ filteredAgencies.length === 1 ? "agency" : "agencies" }}
                  <span v-if="searchQuery" class="text-muted-foreground/60">
                    · filtered
                  </span>
                </h2>
                <NuxtLink
                  to="/explorer"
                  class="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                >
                  Open explorer
                  <Icon name="mdi:open-in-new" class="h-3 w-3" />
                </NuxtLink>
              </div>

              <ul
                v-if="filteredAgencies.length"
                class="divide-border/50 mt-5 grid gap-x-8 divide-y sm:grid-cols-2 lg:grid-cols-3"
              >
                <li
                  v-for="agency in filteredAgencies"
                  :key="agency.slug"
                  class="py-3 first:pt-0"
                >
                  <NuxtLink
                    :to="`/agencies/${agency.slug}`"
                    class="group block"
                  >
                    <p
                      class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
                    >
                      {{ agency.name }}
                    </p>
                    <p class="text-muted-foreground mt-0.5 font-mono text-xs">
                      {{ agency.abbreviation || agency.code }}
                    </p>
                  </NuxtLink>
                </li>
              </ul>

              <div v-else class="text-muted-foreground mt-5 text-sm">
                No agencies match "{{ searchQuery }}".
              </div>
            </section>

            <section class="border-border mt-12 border-t pt-10">
              <DirectorySourceFooter :metadata="data.sourceMetadata" />
            </section>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>
