<!--
  @file Community/CommunityStatsBar.vue
  @description Display community statistics as pills/badges (salary reports, interviews, contributors)
  @usage <CommunityStatsBar :stats="communityStats" />
-->

<script setup lang="ts">
import type { CommunityStats } from '@/app/types/community.types'

interface Props {
  /** Community statistics object */
  stats: CommunityStats | null
  /** Show loading state */
  loading?: boolean
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show all stats or just highlights */
  showAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  size: 'md',
  showAll: false,
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

// Size-based classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        wrapper: 'gap-2 sm:gap-3',
        stat: 'px-2.5 py-1.5',
        number: 'text-base font-bold',
        label: 'text-[10px]',
        icon: 'w-3.5 h-3.5',
      }
    case 'lg':
      return {
        wrapper: 'gap-4 sm:gap-6',
        stat: 'px-5 py-4',
        number: 'text-2xl sm:text-3xl font-bold',
        label: 'text-sm',
        icon: 'w-6 h-6',
      }
    default: // md
      return {
        wrapper: 'gap-3 sm:gap-4',
        stat: 'px-4 py-3',
        number: 'text-xl font-bold',
        label: 'text-xs',
        icon: 'w-5 h-5',
      }
  }
})

// Stats to display
const displayStats = computed(() => {
  if (!props.stats) return []

  const base = [
    {
      icon: 'mdi:chart-bar',
      value: props.stats.totalSalaryReports,
      label: 'Salaries',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: 'mdi:message-text',
      value: props.stats.totalInterviewExperiences,
      label: 'Interviews',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: 'mdi:account-group',
      value: props.stats.totalContributors,
      label: 'Contributors',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ]

  if (props.showAll) {
    base.push({
      icon: 'mdi:thumb-up',
      value: props.stats.totalHelpfulVotes,
      label: 'Helpful Votes',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    })
  }

  return base
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-center" :class="sizeClasses.wrapper">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-2 bg-muted/50 animate-pulse"
        :class="sizeClasses.stat"
      >
        <div class="bg-muted-foreground/20" :class="[sizeClasses.icon, 'rounded']" />
        <div class="space-y-1">
          <div class="h-5 w-12 bg-muted-foreground/20 rounded" />
          <div class="h-3 w-16 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </template>

    <!-- Actual stats -->
    <template v-else-if="stats">
      <div
        v-for="stat in displayStats"
        :key="stat.label"
        class="flex items-center gap-2.5 border border-border/50 bg-card/50"
        :class="sizeClasses.stat"
      >
        <div class="flex items-center justify-center" :class="[stat.bgColor, 'p-1.5 rounded-sm']">
          <Icon :name="stat.icon" :class="[sizeClasses.icon, stat.color]" />
        </div>
        <div class="text-left">
          <div :class="[sizeClasses.number, 'text-foreground tabular-nums leading-none']">
            {{ formatNumber(stat.value) }}
          </div>
          <div :class="[sizeClasses.label, 'text-muted-foreground mt-0.5']">
            {{ stat.label }}
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else>
      <p class="text-sm text-muted-foreground">No statistics available</p>
    </template>
  </div>
</template>
