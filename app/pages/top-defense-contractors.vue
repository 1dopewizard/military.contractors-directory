<!--
  @file Top Defense Contractors page
  @route /top-defense-contractors
  @description SEO list page showing top defense contractors by Defense News rank
-->

<script setup lang="ts">
interface ContractorsResponse {
  contractors: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    defenseNewsRank: number | null
    headquarters: string | null
    employeeCount: number | null
    defenseRevenue: number | null
    totalRevenue: number | null
    logoUrl: string | null
    country: string | null
  }>
  total: number
  limit: number
  offset: number
}

const { data, pending: isLoading, error } = useFetch<ContractorsResponse>('/api/contractors', {
  params: {
    limit: 100,
    sortBy: 'rank',
  },
})

// SEO
useHead({
  title: 'Top Defense Contractors 2025 | Complete Ranked List | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Comprehensive list of the top 100 defense contractors ranked by defense revenue. Find detailed profiles, specialties, and career opportunities at leading aerospace and defense companies.',
    },
  ],
})
</script>

<template>
  <div class="min-h-full">
    <!-- Page Header -->
    <SearchablePageHeader>
      <template #filters>
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink to="/contractors" class="text-muted-foreground hover:text-primary transition-colors">
            Contractors
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium">Top 100</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <!-- Hero Section -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Top Defense Contractors 2025
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl">
          The definitive ranking of aerospace and defense companies by defense revenue, based on Defense News Top 100.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <LoadingText text="Loading contractors" />
      </div>

      <!-- Error State -->
      <Card v-else-if="error" class="p-6 text-center border-destructive/30">
        <Icon name="mdi:alert-circle-outline" class="w-8 h-8 text-destructive mx-auto mb-2" />
        <p class="text-sm text-destructive">Failed to load contractors</p>
      </Card>

      <!-- Contractors List -->
      <div v-else-if="data?.contractors?.length" class="space-y-2">
        <ContractorResultItem
          v-for="contractor in data.contractors.filter((c: any) => c.defenseNewsRank)"
          :key="contractor.id"
          :contractor="contractor"
        />
      </div>

      <!-- Key Stats Section -->
      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <Card class="p-6 text-center">
          <Icon name="mdi:office-building" class="w-8 h-8 text-primary mx-auto mb-3" />
          <p class="text-3xl font-bold mb-1">{{ data?.contractors?.length || 0 }}</p>
          <p class="text-sm text-muted-foreground">Defense Contractors Listed</p>
        </Card>
        <Card class="p-6 text-center">
          <Icon name="mdi:currency-usd" class="w-8 h-8 text-primary mx-auto mb-3" />
          <p class="text-3xl font-bold mb-1">$500B+</p>
          <p class="text-sm text-muted-foreground">Total Defense Revenue</p>
        </Card>
        <Card class="p-6 text-center">
          <Icon name="mdi:account-group" class="w-8 h-8 text-primary mx-auto mb-3" />
          <p class="text-3xl font-bold mb-1">2M+</p>
          <p class="text-sm text-muted-foreground">Industry Employees</p>
        </Card>
      </div>

      <!-- About Section -->
      <Card class="mt-12 p-6">
        <h2 class="text-xl font-semibold mb-4">About the Defense News Top 100</h2>
        <div class="prose prose-sm max-w-none text-muted-foreground">
          <p>
            The Defense News Top 100 is an annual ranking of the world's largest defense contractors 
            based on defense revenue. Companies are ranked by their defense-specific revenue from the 
            previous fiscal year, providing a clear picture of the industry's major players.
          </p>
          <p class="mt-4">
            This list includes both U.S. and international companies across aerospace, land systems, 
            naval, cybersecurity, and professional services sectors. Rankings help job seekers, 
            investors, and industry professionals understand the scale and focus of each contractor.
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>
