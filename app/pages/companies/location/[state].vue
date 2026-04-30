<!--
  @file Location browse page
  @route /companies/location/[state]
  @description Lists contractors with offices in a specific state
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

interface LocationResponse {
  state: string;
  contractorCount: number;
  contractors: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    defenseNewsRank: number | null;
    headquarters: string | null;
    employeeCount: number | null;
    logoUrl: string | null;
    city: string | null;
    isHeadquarters: boolean;
  }>;
}

const route = useRoute();

const state = computed(() => route.params.state as string);

const {
  data: locationData,
  pending: isLoading,
  error,
} = useFetch<LocationResponse | null>(
  () => `/api/contractors/by-location/${state.value}`,
  {
    lazy: true,
    watch: [state],
  },
);

useHead(() => {
  if (!locationData.value) return {};
  return {
    title: `Defense Contractors in ${locationData.value.state} | military.contractors`,
    meta: [
      {
        name: "description",
        content: `Browse ${locationData.value.contractorCount} defense contractors with offices in ${locationData.value.state}. Explore company profiles and public contractor intelligence.`,
      },
    ],
  };
});
</script>

<template>
  <main class="min-h-full">
    <div v-if="isLoading">
      <section class="border-border border-b">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] uppercase tracking-[0.18em]"
          >
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span class="text-muted-foreground">Contractor directory</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-muted-foreground">Location filter</span>
          </div>
        </div>
      </section>
      <div class="flex justify-center py-12">
        <LoadingText text="Loading contractors" />
      </div>
    </div>

    <div v-else-if="error || !locationData">
      <div
        class="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <Empty>
          <EmptyMedia variant="icon">
            <Icon name="mdi:map-marker-off" class="size-5" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>Location Not Found</EmptyTitle>
            <EmptyDescription>
              No contractors found in "{{ state }}".
            </EmptyDescription>
          </EmptyContent>
          <Button as-child variant="default">
            <NuxtLink to="/companies">Browse All Contractors</NuxtLink>
          </Button>
        </Empty>
      </div>
    </div>

    <div v-else>
      <section class="border-border border-b">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] uppercase tracking-[0.18em]"
          >
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span class="text-muted-foreground">Contractor directory</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-muted-foreground">Location filter</span>
            <span class="text-muted-foreground/40 hidden sm:inline">/</span>
            <span class="text-foreground tabular-nums">
              {{ locationData.contractorCount.toLocaleString() }}
              {{
                locationData.contractorCount === 1
                  ? "contractor"
                  : "contractors"
              }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h1
                class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Contractors in {{ locationData.state }}
              </h1>
              <p class="text-muted-foreground mt-1 max-w-3xl text-sm">
                Defense contractors with offices and operations in
                {{ locationData.state }}.
              </p>
            </div>
            <NuxtLink to="/companies">
              <Button variant="outline" size="sm">All contractors</Button>
            </NuxtLink>
          </div>
        </div>
      </section>

      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Recipients
          </h2>
          <div v-if="locationData.contractors?.length" class="mt-5 space-y-2">
            <ContractorResultItem
              v-for="contractor in locationData.contractors"
              :key="contractor.id"
              :contractor="contractor"
            />
          </div>
          <div v-else class="text-muted-foreground mt-5 text-sm">
            No contractors found with offices in {{ locationData.state }}.
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
