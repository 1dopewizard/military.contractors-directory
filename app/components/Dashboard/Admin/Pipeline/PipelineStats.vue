<!--
  @file Stats.vue
  @description Pipeline execution statistics dashboard with metrics and visualizations
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface JobStats {
  totalJobs: number
  successRate: number
  avgDurationMs: number
  byScript: Record<string, { count: number, successRate: number, avgDurationMs: number }>
  byDay: { date: string, count: number, success: number, failed: number }[]
}

// State
const stats = ref<JobStats | null>(null)
const isLoading = ref(false)

// Fetch stats
const fetchStats = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<JobStats>('/api/admin/pipeline/stats')
    stats.value = data
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load statistics')
  } finally {
    isLoading.value = false
  }
}

// Format duration
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

// Get success rate color
const getSuccessRateColor = (rate: number): string => {
  if (rate >= 90) return 'text-green-500'
  if (rate >= 70) return 'text-amber-500'
  return 'text-red-500'
}

// Get bar height for chart
const getBarHeight = (value: number, max: number): string => {
  if (max === 0) return '0%'
  return `${Math.max(4, (value / max) * 100)}%`
}

// Get max value for chart scaling
const maxDayCount = computed(() => {
  if (!stats.value?.byDay?.length) return 1
  return Math.max(...stats.value.byDay.map(d => d.count))
})

// Sort scripts by count
const sortedScripts = computed(() => {
  if (!stats.value?.byScript) return []
  return Object.entries(stats.value.byScript)
    .sort(([, a], [, b]) => b.count - a.count)
})

// Initialize
onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-medium text-foreground uppercase tracking-wide">Execution Statistics</h3>
        <p class="text-xs text-muted-foreground">Pipeline performance metrics and trends</p>
      </div>
      <Button variant="ghost" size="sm" @click="fetchStats">
        <Icon name="mdi:refresh" class="w-4 h-4" />
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner class="w-6 h-6 text-muted-foreground" />
    </div>

    <template v-else-if="stats">
      <!-- Summary metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Jobs -->
        <div class="space-y-1">
          <p class="text-2xl font-bold text-foreground">{{ stats.totalJobs }}</p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Total Runs</p>
        </div>

        <!-- Success Rate -->
        <div class="space-y-1">
          <p class="text-2xl font-bold" :class="getSuccessRateColor(stats.successRate)">
            {{ stats.successRate.toFixed(1) }}%
          </p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Success Rate</p>
        </div>

        <!-- Average Duration -->
        <div class="space-y-1">
          <p class="text-2xl font-bold text-foreground">{{ formatDuration(stats.avgDurationMs) }}</p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Avg Duration</p>
        </div>

        <!-- Scripts -->
        <div class="space-y-1">
          <p class="text-2xl font-bold text-foreground">{{ Object.keys(stats.byScript).length }}</p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Scripts Used</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Activity Chart (Last 30 Days) -->
        <div class="bg-card/50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-foreground mb-4">Activity (Last 30 Days)</h4>

          <div v-if="stats.byDay.length > 0" class="space-y-4">
            <!-- Chart -->
            <div class="flex items-end gap-1 h-32">
              <div
                v-for="day in stats.byDay"
                :key="day.date"
                class="flex-1 flex flex-col items-center gap-0.5"
                :title="`${day.date}: ${day.success} success, ${day.failed} failed`"
              >
                <!-- Failed bar -->
                <div
                  v-if="day.failed > 0"
                  class="w-full bg-red-500/70 min-h-[2px]"
                  :style="{ height: getBarHeight(day.failed, maxDayCount) }"
                />
                <!-- Success bar -->
                <div
                  v-if="day.success > 0"
                  class="w-full bg-green-500/70 min-h-[2px]"
                  :style="{ height: getBarHeight(day.success, maxDayCount) }"
                />
              </div>
            </div>

            <!-- Date labels -->
            <div class="flex justify-between text-[10px] text-muted-foreground">
              <span>{{ stats.byDay[0]?.date?.slice(5) }}</span>
              <span>{{ stats.byDay[stats.byDay.length - 1]?.date?.slice(5) }}</span>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500/70" />
                <span>Success</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500/70" />
                <span>Failed</span>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-32 text-muted-foreground">
            <p class="text-sm">No activity data</p>
          </div>
        </div>

        <!-- Per-Script Stats -->
        <div class="bg-card/50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-foreground mb-4">Script Performance</h4>

          <div v-if="sortedScripts.length > 0" class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="[scriptId, scriptStats] in sortedScripts"
              :key="scriptId"
              class="flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm text-foreground truncate">{{ scriptId }}</span>
                  <span class="text-xs text-muted-foreground shrink-0">{{ scriptStats.count }} runs</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <!-- Success rate bar -->
                  <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-300"
                      :class="scriptStats.successRate >= 90 ? 'bg-green-500' : scriptStats.successRate >= 70 ? 'bg-amber-500' : 'bg-red-500'"
                      :style="{ width: `${scriptStats.successRate}%` }"
                    />
                  </div>
                  <span class="text-[10px] text-muted-foreground w-10 text-right">
                    {{ scriptStats.successRate.toFixed(0) }}%
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>Avg: {{ formatDuration(scriptStats.avgDurationMs) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-32 text-muted-foreground">
            <p class="text-sm">No script data</p>
          </div>
        </div>
      </div>

      <!-- Empty state when no data -->
      <Empty v-if="stats.totalJobs === 0">
        <EmptyMedia variant="icon">
          <Icon name="mdi:chart-line" class="w-6 h-6" />
        </EmptyMedia>
        <EmptyTitle>No execution data yet</EmptyTitle>
        <EmptyDescription>Run some pipeline scripts to see statistics here</EmptyDescription>
      </Empty>
    </template>

    <!-- Error state -->
    <Empty v-else>
      <EmptyMedia variant="icon">
        <Icon name="mdi:chart-line" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle>Failed to load statistics</EmptyTitle>
      <EmptyDescription>
        <Button variant="ghost" size="sm" @click="fetchStats">Try Again</Button>
      </EmptyDescription>
    </Empty>
  </div>
</template>

