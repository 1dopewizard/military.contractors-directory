<!--
  @file Company quick links for sidebar navigation
  @usage <CompanyQuickLinks />
  @description Compact company links for search/browse pages
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'

const { allCompanies, getAllCompanies } = useCompanies()

// Fetch on mount if not already loaded
onMounted(() => {
    if (allCompanies.value.length === 0) {
        getAllCompanies()
    }
})

// Top companies by job count
const topCompanies = computed(() => {
    return [...allCompanies.value]
        .sort((a, b) => (b.stats?.totalJobs || 0) - (a.stats?.totalJobs || 0))
        .slice(0, 6)
})
</script>

<template>
  <Card class="border-none bg-sidebar">
    <CardContent class="p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-foreground">Top Employers</h3>
        <NuxtLink to="/companies" class="text-xs text-muted-foreground hover:text-primary transition-colors">
          View all
        </NuxtLink>
      </div>
      
      <!-- Loading State -->
      <div v-if="allCompanies.length === 0" class="space-y-1.5">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between py-1.5 px-2 -mx-2">
          <Skeleton class="h-4 w-2/3" />
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-4 w-4" />
          </div>
        </div>
      </div>
      
      <!-- Companies List -->
      <div v-else class="space-y-1.5">
        <NuxtLink
          v-for="company in topCompanies"
          :key="company.id"
          :to="`/companies/${company.slug}`"
          class="flex items-center justify-between py-1.5 px-2 -mx-2 hover:bg-muted/50 transition-colors group"
        >
          <span class="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {{ company.name }}
          </span>
          <div class="flex items-center gap-2 shrink-0">
            <span v-if="company.stats?.totalJobs" class="text-xs text-muted-foreground/70">
              {{ company.stats.totalJobs }} jobs
            </span>
            <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </NuxtLink>
      </div>
    </CardContent>
  </Card>
</template>
