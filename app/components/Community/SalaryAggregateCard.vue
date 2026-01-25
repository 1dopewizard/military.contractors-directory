<!--
  @file Community/SalaryAggregateCard.vue
  @description Display anonymous salary aggregate statistics for a MOS code or company
  @usage <SalaryAggregateCard :aggregates="salaryAggregates" title="35F at Leidos" />
-->

<script setup lang="ts">
import type { SalaryAggregates, ClearanceLevel } from '@/app/types/community.types'

interface Props {
  /** Aggregate salary statistics */
  aggregates: SalaryAggregates
  /** Optional title for the card */
  title?: string
  /** MOS code for context */
  mosCode?: string
  /** Company name for context */
  companyName?: string
  /** Show detailed breakdown (clearance, experience) */
  showDetails?: boolean
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  loading: false,
})

// Format currency values
const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`
  }
  return `$${value.toLocaleString()}`
}

// Clearance level display labels
const clearanceLabels: Record<string, string> = {
  NONE: 'No Clearance',
  PUBLIC_TRUST: 'Public Trust',
  SECRET: 'Secret',
  TOP_SECRET: 'Top Secret',
  TS_SCI: 'TS/SCI',
  TS_SCI_POLY: 'TS/SCI + Poly',
}

// Experience range labels
const experienceLabels: Record<string, string> = {
  '0-2': '0-2 years',
  '3-5': '3-5 years',
  '6-10': '6-10 years',
  '10+': '10+ years',
}

// Calculate clearance breakdown percentages
const clearanceBreakdown = computed(() => {
  if (!props.aggregates.clearanceBreakdown) return []
  
  const total = Object.values(props.aggregates.clearanceBreakdown).reduce((a, b) => a + b, 0)
  
  return Object.entries(props.aggregates.clearanceBreakdown)
    .map(([level, count]) => ({
      level,
      label: clearanceLabels[level] || level,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
})

// Calculate experience breakdown percentages
const experienceBreakdown = computed(() => {
  if (!props.aggregates.experienceRanges) return []
  
  const total = Object.values(props.aggregates.experienceRanges).reduce((a, b) => a + b, 0)
  
  return Object.entries(props.aggregates.experienceRanges)
    .map(([range, count]) => ({
      range,
      label: experienceLabels[range] || range,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .filter((item) => item.count > 0)
})

// Generate title if not provided
const displayTitle = computed(() => {
  if (props.title) return props.title
  if (props.mosCode && props.companyName) return `${props.mosCode} at ${props.companyName}`
  if (props.mosCode) return `${props.mosCode} Salaries`
  if (props.companyName) return `${props.companyName} Salaries`
  return 'Salary Overview'
})
</script>

<template>
  <Card class="overflow-hidden">
    <!-- Header -->
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-4">
        <div>
          <CardTitle class="text-lg">{{ displayTitle }}</CardTitle>
          <p class="text-sm text-muted-foreground mt-1">
            Based on {{ aggregates.reportCount }} {{ aggregates.reportCount === 1 ? 'report' : 'reports' }}
          </p>
        </div>
        <Icon name="mdi:chart-bar" class="w-6 h-6 text-muted-foreground/50" />
      </div>
    </CardHeader>
    
    <CardContent class="pt-0">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="h-16 bg-muted/50" />
        <div class="h-8 bg-muted/30" />
        <div class="h-8 bg-muted/30" />
      </div>
      
      <template v-else>
        <!-- Main salary stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <!-- Average -->
          <div class="text-center p-3 bg-primary/5 border border-primary/20">
            <div class="text-2xl font-bold text-primary">
              {{ formatCurrency(aggregates.salary.average) }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Average</div>
          </div>
          
          <!-- Median -->
          <div class="text-center p-3 bg-muted/30">
            <div class="text-2xl font-bold text-foreground">
              {{ formatCurrency(aggregates.salary.median) }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Median</div>
          </div>
          
          <!-- Min -->
          <div class="text-center p-3 bg-muted/30">
            <div class="text-xl font-semibold text-muted-foreground">
              {{ formatCurrency(aggregates.salary.min) }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Low</div>
          </div>
          
          <!-- Max -->
          <div class="text-center p-3 bg-muted/30">
            <div class="text-xl font-semibold text-muted-foreground">
              {{ formatCurrency(aggregates.salary.max) }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">High</div>
          </div>
        </div>
        
        <!-- Signing bonus (if available) -->
        <div v-if="aggregates.signingBonus" class="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="mdi:cash-plus" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span class="text-sm font-medium text-foreground">Signing Bonus</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(aggregates.signingBonus.average) }}
              </span>
              <span class="text-xs text-muted-foreground ml-2">
                avg ({{ aggregates.signingBonus.reportCount }} reports)
              </span>
            </div>
          </div>
        </div>
        
        <!-- Detailed breakdowns -->
        <template v-if="showDetails">
          <!-- Clearance breakdown -->
          <div v-if="clearanceBreakdown.length > 0" class="mb-6">
            <h4 class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              By Clearance Level
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in clearanceBreakdown"
                :key="item.level"
                class="flex items-center gap-3"
              >
                <span class="text-sm text-muted-foreground w-24 truncate">{{ item.label }}</span>
                <div class="flex-1 h-2 bg-muted/30 overflow-hidden">
                  <div
                    class="h-full bg-primary/60 transition-all"
                    :style="{ width: `${item.percent}%` }"
                  />
                </div>
                <span class="text-xs text-muted-foreground w-16 text-right">
                  {{ item.count }} ({{ item.percent }}%)
                </span>
              </div>
            </div>
          </div>
          
          <!-- Experience breakdown -->
          <div v-if="experienceBreakdown.length > 0">
            <h4 class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              By Years of Experience
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in experienceBreakdown"
                :key="item.range"
                class="flex items-center gap-3"
              >
                <span class="text-sm text-muted-foreground w-24">{{ item.label }}</span>
                <div class="flex-1 h-2 bg-muted/30 overflow-hidden">
                  <div
                    class="h-full bg-blue-500/60 transition-all"
                    :style="{ width: `${item.percent}%` }"
                  />
                </div>
                <span class="text-xs text-muted-foreground w-16 text-right">
                  {{ item.count }} ({{ item.percent }}%)
                </span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </CardContent>
  </Card>
</template>
