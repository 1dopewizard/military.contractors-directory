<!--
  @file Top employers grid component for homepage
  @usage <TopEmployersGrid />
  @description Grid of top hiring defense contractors
-->

<script setup lang="ts">
interface CompanyWithStats {
  id: string
  name: string
  slug: string
  summary: string | null
  stats: {
    totalJobs: number
  }
}

// Fetch top 5 companies sorted by job count
const { data: topCompanies, status } = await useFetch<CompanyWithStats[]>('/api/companies', {
  query: { limit: 5, sort: 'jobs' },
  default: (): CompanyWithStats[] => []
})

const loading = computed(() => status.value === 'pending')

const companies = computed<CompanyWithStats[]>(() => topCompanies.value || [])

const totalJobs = computed(() => 
    companies.value.reduce((sum: number, c: CompanyWithStats) => sum + (c.stats?.totalJobs || 0), 0)
)

// Rotating accent colors for company cards
const companyColors = [
  'from-primary/15 to-primary/5 border-primary/25 hover:border-primary/50',
  'from-cyan-500/15 to-cyan-600/5 border-cyan-500/25 hover:border-cyan-500/50',
  'from-violet-500/15 to-violet-600/5 border-violet-500/25 hover:border-violet-500/50',
  'from-emerald-500/15 to-emerald-600/5 border-emerald-500/25 hover:border-emerald-500/50',
  'from-rose-500/15 to-rose-600/5 border-rose-500/25 hover:border-rose-500/50'
]

const getColorClass = (index: number) => companyColors[index % companyColors.length]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Top Employers</h2>
      <NuxtLink 
        to="/companies" 
        class="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        View all companies
        <Icon name="mdi:arrow-right" class="size-4" />
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div v-for="i in 5" :key="i" class="h-20 bg-muted/30 animate-pulse" />
    </div>

    <!-- Companies Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <NuxtLink
        v-for="(company, index) in companies"
        :key="company.id"
        :to="`/companies/${company.slug}`"
        class="group block border bg-gradient-to-br transition-all duration-200 p-4"
        :class="getColorClass(index)"
      >
        <p class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {{ company.name }}
        </p>
        <div v-if="company.stats?.totalJobs" class="flex items-baseline gap-1">
          <span class="text-xl font-bold text-primary">{{ company.stats.totalJobs }}</span>
          <span class="text-xs text-muted-foreground">jobs</span>
        </div>
      </NuxtLink>
    </div>

    <p v-if="totalJobs > 0" class="text-center text-sm text-muted-foreground">
      <span class="text-foreground font-medium">{{ totalJobs }}</span> open positions from leading defense contractors
    </p>
  </div>
</template>
