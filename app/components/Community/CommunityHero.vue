<!--
  @file Community/CommunityHero.vue
  @description Hero section for homepage featuring value proposition, community stats, and CTAs
  @usage <CommunityHero />
-->

<script setup lang="ts">
import type { CommunityStats } from '@/app/types/community.types'

const { fetchStats } = useCommunityStats()

// Stats state
const stats = ref<CommunityStats | null>(null)
const loading = ref(true)

// Fetch stats on mount
onMounted(async () => {
  try {
    stats.value = await fetchStats()
  } finally {
    loading.value = false
  }
})

// Format number with K/M suffix for large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`
  }
  return num.toLocaleString()
}

// Stats configuration
const statItems = computed(() => {
  if (!stats.value) return []
  return [
    {
      value: stats.value.totalSalaryReports,
      label: 'Salaries',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: stats.value.totalInterviewExperiences,
      label: 'Interviews',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: stats.value.totalContributors,
      label: 'Contributors',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ]
})

// Animated counter for stats
const displayedStats = ref<Record<string, number>>({})

watch(stats, (newStats) => {
  if (!newStats) return
  
  // Initialize with 0
  displayedStats.value = {
    salaries: 0,
    interviews: 0,
    contributors: 0,
  }
  
  // Animate to final values
  const duration = 1500
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    
    displayedStats.value = {
      salaries: Math.round(newStats.totalSalaryReports * eased),
      interviews: Math.round(newStats.totalInterviewExperiences * eased),
      contributors: Math.round(newStats.totalContributors * eased),
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}, { immediate: true })

// Get animated value for a stat
const getAnimatedValue = (label: string): number => {
  const key = label.toLowerCase() as keyof typeof displayedStats.value
  return displayedStats.value[key] ?? 0
}
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Ambient background glow -->
    <div class="absolute inset-0 -z-10">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[100px] animate-pulse" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 blur-[80px] animate-pulse delay-700" />
    </div>

    <div class="text-center space-y-8 py-6 sm:py-8">
      <!-- Eyebrow badge -->
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75" />
          <span class="relative inline-flex h-2 w-2 bg-primary" />
        </span>
        COMMUNITY INTEL PLATFORM
      </div>

      <!-- Main headline -->
      <div class="space-y-4">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
          The Intel Cleared Professionals
          <br class="hidden sm:block" />
          <span class="relative">
            <span class="bg-gradient-to-r from-primary via-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Actually Need
            </span>
            <span class="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-emerald-500/40 to-blue-500/40 blur-sm" />
          </span>
        </h1>
        <p class="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Real salary data. Interview experiences. From veterans, for veterans.
        </p>
      </div>

      <!-- Stats strip -->
      <div class="flex items-center justify-center gap-8 sm:gap-12 pt-2">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div
            v-for="i in 3"
            :key="i"
            class="text-center animate-pulse"
          >
            <div class="h-8 w-12 bg-muted mx-auto mb-1" />
            <div class="h-4 w-16 bg-muted/50 mx-auto" />
          </div>
        </template>

        <!-- Actual stats -->
        <template v-else-if="stats">
          <div
            v-for="stat in statItems"
            :key="stat.label"
            class="text-center"
          >
            <div class="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" :class="stat.textColor">
              {{ formatNumber(getAnimatedValue(stat.label)) }}
            </div>
            <div class="text-sm text-muted-foreground mt-0.5">
              {{ stat.label }}
            </div>
          </div>
        </template>
      </div>

      <!-- CTA buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
        <Button size="lg" as-child class="w-full sm:w-auto">
          <NuxtLink to="/salaries" class="gap-2">
            <Icon name="mdi:chart-bar" class="w-5 h-5" />
            Browse Salaries
          </NuxtLink>
        </Button>
        <Button size="lg" variant="ghost" as-child class="w-full sm:w-auto">
          <NuxtLink to="/interviews" class="gap-2">
            <Icon name="mdi:message-text" class="w-5 h-5" />
            Browse Interviews
          </NuxtLink>
        </Button>
        <Button size="lg" variant="ghost" as-child class="w-full sm:w-auto text-primary hover:text-primary">
          <NuxtLink to="/salaries/submit" class="gap-2">
            <Icon name="mdi:plus-circle" class="w-5 h-5" />
            Contribute
          </NuxtLink>
        </Button>
      </div>

      <!-- Subtle trust indicator -->
      <p class="text-xs text-muted-foreground/60 pt-2">
        Anonymous submissions • Verified by community • 100% free
      </p>
    </div>
  </div>
</template>
