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
  <div class="min-h-full">
    <div
      class="container mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
    >
      <div v-if="isLoading" class="flex justify-center py-12">
        <LoadingText text="Loading contractors" />
      </div>

      <div v-else-if="error || !locationData">
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

      <div v-else>
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>Contractor directory</span>
          <span class="text-muted-foreground/40">/</span>
          <span>Location filter</span>
        </div>

        <h1
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          Contractors in
          <span class="text-primary">{{ locationData.state }}</span>.
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
          Defense contractors with offices and operations in
          {{ locationData.state }}.
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <span
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Active
          </span>
          <Badge variant="secondary" class="flex items-center gap-1">
            <Icon name="mdi:map-marker-outline" class="h-3 w-3" />
            Location: {{ locationData.state }}
            <NuxtLink
              to="/companies"
              class="hover:text-destructive ml-1 transition-colors"
            >
              <Icon name="mdi:close" class="h-3 w-3" />
            </NuxtLink>
          </Badge>
        </div>

        <div class="mt-8">
          <div
            class="text-muted-foreground mb-3 flex items-center justify-between text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span>
              {{ locationData.contractorCount }}
              {{
                locationData.contractorCount === 1
                  ? "contractor"
                  : "contractors"
              }}
            </span>
            <NuxtLink to="/companies" class="text-primary hover:underline">
              All contractors →
            </NuxtLink>
          </div>

          <div v-if="locationData.contractors?.length" class="space-y-2">
            <ContractorResultItem
              v-for="contractor in locationData.contractors"
              :key="contractor.id"
              :contractor="contractor"
            />
          </div>

          <div
            v-else
            class="border-border text-muted-foreground border p-8 text-center text-sm"
          >
            No contractors found with offices in {{ locationData.state }}.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
