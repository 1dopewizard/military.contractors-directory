<!--
  @file Location browse page
  @route /companies/location/[state]
  @description Lists contractors with offices in a specific state
-->

<script setup lang="ts">
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

// SEO
useHead(() => {
  if (!locationData.value) return {};
  return {
    title: `Defense Contractors in ${locationData.value.state} | military.contractors`,
    meta: [
      {
        name: "description",
        content: `Browse ${locationData.value.contractorCount} defense contractors with offices in ${locationData.value.state}. Find jobs and opportunities in the defense industry.`,
      },
    ],
  };
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="min-h-full">
      <SearchablePageHeader>
        <template #filters>
          <div class="h-7" />
        </template>
      </SearchablePageHeader>
      <div
        class="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <LoadingText text="Loading contractors" />
      </div>
    </div>

    <!-- Error/Not Found State -->
    <div v-else-if="error || !locationData" class="min-h-full">
      <SearchablePageHeader />
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
          <div class="flex justify-center gap-3">
            <Button as-child variant="default">
              <NuxtLink to="/companies">Browse All Contractors</NuxtLink>
            </Button>
          </div>
        </Empty>
      </div>
    </div>

    <!-- Location Page -->
    <div v-else class="min-h-full">
      <!-- Page Header -->
      <SearchablePageHeader>
        <template #filters>
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-sm">
            <NuxtLink
              to="/companies"
              class="text-muted-foreground hover:text-primary transition-colors"
            >
              Companies
            </NuxtLink>
            <Icon
              name="mdi:chevron-right"
              class="text-muted-foreground/50 h-4 w-4"
            />
            <span class="text-foreground truncate font-medium">{{
              locationData.state
            }}</span>
          </div>
        </template>
      </SearchablePageHeader>

      <!-- Main Content -->
      <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Hero Section -->
        <div class="mb-8">
          <h1 class="text-foreground mb-1 text-2xl font-bold md:text-3xl">
            Defense Contractors in {{ locationData.state }}
          </h1>
          <p class="text-muted-foreground mb-4">
            {{ locationData.contractorCount }} companies with offices in this
            state
          </p>
          <div class="flex items-start gap-3">
            <Icon
              name="mdi:map-marker"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <p class="text-muted-foreground max-w-2xl">
              Browse defense contractors with offices and operations in
              {{ locationData.state }}.
            </p>
          </div>
        </div>

        <!-- Contractors List -->
        <div v-if="locationData.contractors?.length" class="space-y-2">
          <ContractorResultItem
            v-for="contractor in locationData.contractors"
            :key="contractor.id"
            :contractor="contractor"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="border-border/30 bg-card/30 border p-8 text-center">
          <Icon
            name="mdi:office-building-outline"
            class="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50"
          />
          <p class="text-muted-foreground">
            No contractors found with offices in {{ locationData.state }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
