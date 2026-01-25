<!--
  @file Location browse page
  @route /contractors/location/[state]
  @description Lists contractors with offices in a specific state
-->

<script setup lang="ts">
interface LocationResponse {
  state: string
  contractorCount: number
  contractors: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    defenseNewsRank: number | null
    headquarters: string | null
    employeeCount: number | null
    logoUrl: string | null
    city: string | null
    isHeadquarters: boolean
  }>
}

const route = useRoute()

const state = computed(() => route.params.state as string)

const { data: locationData, pending: isLoading, error } = useFetch<LocationResponse | null>(() => `/api/contractors/by-location/${state.value}`, {
  lazy: true,
  watch: [state],
})

// SEO
useHead(() => {
  if (!locationData.value) return {}
  return {
    title: `Defense Contractors in ${locationData.value.state} | military.contractors`,
    meta: [
      {
        name: 'description',
        content: `Browse ${locationData.value.contractorCount} defense contractors with offices in ${locationData.value.state}. Find jobs and opportunities in the defense industry.`,
      },
    ],
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="min-h-full">
    <SearchablePageHeader>
      <template #filters>
        <div class="h-7" />
      </template>
    </SearchablePageHeader>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>
  </div>

  <!-- Error/Not Found State -->
  <div v-else-if="error || !locationData" class="min-h-full">
    <SearchablePageHeader />
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
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
        <div class="flex gap-3 justify-center">
          <Button as-child variant="default">
            <NuxtLink to="/contractors">Browse All Contractors</NuxtLink>
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
          <NuxtLink to="/contractors" class="text-muted-foreground hover:text-primary transition-colors">
            Contractors
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium truncate">{{ locationData.state }}</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <!-- Hero Section -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center justify-center">
            <Icon name="mdi:map-marker" class="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-foreground">
              Defense Contractors in {{ locationData.state }}
            </h1>
            <p class="text-muted-foreground">
              {{ locationData.contractorCount }} companies with offices in this state
            </p>
          </div>
        </div>
      </div>

      <!-- Contractors Grid -->
      <div v-if="locationData.contractors?.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          v-for="contractor in locationData.contractors" 
          :key="contractor.id"
          class="p-4 hover:border-primary/30 transition-colors"
        >
          <NuxtLink :to="`/contractors/${contractor.slug}`" class="block">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                <img 
                  v-if="contractor.logoUrl" 
                  :src="contractor.logoUrl" 
                  :alt="contractor.name"
                  class="w-full h-full object-contain rounded"
                />
                <span v-else class="text-sm font-bold text-muted-foreground">
                  {{ contractor.name?.charAt(0) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="font-semibold truncate">{{ contractor.name }}</h2>
                  <Badge v-if="contractor.defenseNewsRank" variant="outline" class="shrink-0">
                    #{{ contractor.defenseNewsRank }}
                  </Badge>
                </div>
                <p v-if="contractor.city" class="text-sm text-muted-foreground">
                  {{ contractor.city }}, {{ locationData.state }}
                </p>
                <Badge v-if="contractor.isHeadquarters" variant="default" class="mt-2 text-xs">
                  Headquarters
                </Badge>
              </div>
            </div>
          </NuxtLink>
        </Card>
      </div>

      <!-- Empty State -->
      <Card v-else class="p-8 text-center">
        <Icon name="mdi:office-building-outline" class="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p class="text-muted-foreground">No contractors found with offices in {{ locationData.state }}</p>
      </Card>
    </div>
  </div>
</template>
