<!--
  @file MOS statistics snapshot component
  @usage <MosSnapshot :mos-code="mosCode" />
  @description Displays aggregate statistics for a MOS (jobs, regions, clearances, pay)
-->

<script setup lang="ts">
import type { MosStats } from '@/app/types/mos.types'

const props = defineProps<{
  mosCode: string
}>()

const logger = useLogger('MosSnapshot')
const { getMosStats } = useMosData()

const stats = ref<MosStats | null>(null)
const isLoading = ref(true)

watchEffect(async () => {
  if (!props.mosCode) return
  
  isLoading.value = true
  try {
    stats.value = await getMosStats(props.mosCode)
  } catch (error) {
    logger.error({ error, mosCode: props.mosCode }, 'Failed to load MOS stats')
    stats.value = null
  } finally {
    isLoading.value = false
  }
})

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return 'N/A'
  return `$${(value / 1000).toFixed(0)}K`
}
</script>

<template>
  <Card v-if="stats" class="border-border/50 overflow-hidden">
    <CardContent class="p-0">
      <!-- Active Jobs Section -->
      <div class="p-4 border-b border-border/30">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="mdi:briefcase-outline" class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Market Stats</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold text-primary font-mono">{{ stats.active_jobs }}</div>
          <div class="text-sm text-muted-foreground">Active Listings</div>
        </div>
      </div>

      <!-- Top Regions Section -->
      <div v-if="stats.top_regions && stats.top_regions.length > 0" class="p-4 border-b border-border/30">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="mdi:map-marker-outline" class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Regions</span>
        </div>
        <div class="space-y-2">
          <div 
            v-for="region in stats.top_regions" 
            :key="region.region"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">{{ region.region }}</span>
            <span class="text-foreground font-medium font-mono">{{ region.count }}</span>
          </div>
        </div>
      </div>

      <!-- Top Theaters Section -->
      <div v-if="stats.top_theaters && stats.top_theaters.length > 0" class="p-4 border-b border-border/30">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="mdi:earth" class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Theaters</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <Badge 
            v-for="theater in stats.top_theaters" 
            :key="theater.theater"
            variant="secondary"
            class="text-xs"
          >
            {{ theater.theater }} ({{ theater.count }})
          </Badge>
        </div>
      </div>

      <!-- Clearance Distribution Section -->
      <div v-if="stats.clearance_distribution && stats.clearance_distribution.length > 0" class="p-4 border-b border-border/30">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="mdi:shield-lock-outline" class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clearance</span>
        </div>
        <div class="space-y-2">
          <div 
            v-for="clearance in stats.clearance_distribution" 
            :key="clearance.clearance"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">{{ clearance.clearance }}</span>
            <span class="text-foreground font-medium">{{ clearance.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Pay Band Section -->
      <div v-if="stats.pay_band && stats.pay_band.sample_size > 0" class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="mdi:currency-usd" class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compensation</span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Range</span>
            <span class="text-foreground font-medium font-mono">{{ formatCurrency(stats.pay_band.min) }} - {{ formatCurrency(stats.pay_band.max) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Median</span>
            <span class="text-primary font-medium font-mono">{{ formatCurrency(stats.pay_band.median) }}</span>
          </div>
          <p class="text-xs text-muted-foreground pt-1">Based on {{ stats.pay_band.sample_size }} listings</p>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Empty state -->
  <Card v-else-if="!isLoading" class="border-border/50">
    <CardContent class="py-6 text-center">
      <p class="text-sm text-muted-foreground">No statistics available</p>
    </CardContent>
  </Card>
</template>

