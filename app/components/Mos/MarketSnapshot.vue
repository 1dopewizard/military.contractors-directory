<!--
  @file Market Snapshot component
  @description Displays aggregated market stats for MOS search results (no AI, pure data)
-->

<script setup lang="ts">
import type { MarketSnapshotResponse } from '@/server/api/market-snapshot.get'

interface Props {
  mosCode: string
  location?: string
  clearance?: string
}

const props = defineProps<Props>()

const isOpen = ref(true)

// Fetch market snapshot data
const { data: snapshotData, pending, error } = await useLazyFetch<MarketSnapshotResponse>(
  () => `/api/market-snapshot?mos_code=${props.mosCode}&location=${props.location || 'ANY'}&clearance=${props.clearance || 'ANY'}`,
  {
    watch: [() => props.mosCode, () => props.location, () => props.clearance],
  }
)

// Unwrap for template usage
const snapshot = computed(() => snapshotData.value)
const stats = computed(() => snapshot.value?.stats)

// Format salary for display
const formatSalary = (amount: number): string => {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}k`
  }
  return `$${amount.toLocaleString()}`
}

// Format salary range
const salaryRangeText = computed(() => {
  if (!stats.value?.salaryRange) return null
  const { min, max } = stats.value.salaryRange
  return `${formatSalary(min)} - ${formatSalary(max)}`
})

// Location breakdown text
const locationBreakdown = computed(() => {
  if (!stats.value) return []
  const { CONUS, OCONUS, Remote } = stats.value.locationDistribution
  const parts: string[] = []
  if (CONUS > 0) parts.push(`CONUS (${CONUS})`)
  if (OCONUS > 0) parts.push(`OCONUS (${OCONUS})`)
  if (Remote > 0) parts.push(`Remote (${Remote})`)
  return parts
})
</script>

<template>
  <Collapsible
    v-if="!error && (pending || stats?.jobCount)"
    v-model:open="isOpen"
    as-child
  >
    <Card class="border-none bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader class="px-4 py-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-sm font-medium flex items-center gap-2">
            <Icon name="mdi:chart-box-outline" class="w-4 h-4 text-primary" />
            Market Snapshot
            <Badge v-if="snapshot" variant="soft">
              {{ mosCode }}
            </Badge>
          </CardTitle>
          <CollapsibleTrigger as-child>
            <Button 
              variant="ghost" 
              size="sm" 
              class="h-6 px-2 text-xs text-muted-foreground"
            >
              <Icon :name="isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </CardHeader>
      
      <CollapsibleContent class="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <CardContent class="px-4 pt-0 pb-4">
          <!-- Loading skeleton -->
          <div v-if="pending" class="space-y-3 animate-pulse">
            <div class="flex gap-4">
              <div class="h-8 w-20 bg-muted rounded" />
              <div class="h-8 w-32 bg-muted rounded" />
              <div class="h-8 w-24 bg-muted rounded" />
            </div>
            <div class="h-4 w-48 bg-muted rounded" />
          </div>

          <!-- Stats display -->
          <div v-else-if="snapshot" class="space-y-4">
            <!-- Primary stats row -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <!-- Job count -->
              <div class="flex items-center gap-1.5">
                <Icon name="mdi:briefcase-outline" class="w-4 h-4 text-muted-foreground" />
                <span class="font-semibold text-foreground">{{ stats?.jobCount }}</span>
                <span class="text-muted-foreground">jobs</span>
              </div>
              
              <!-- Salary range -->
              <div v-if="salaryRangeText" class="flex items-center gap-1.5">
                <Icon name="mdi:currency-usd" class="w-4 h-4 text-muted-foreground" />
                <span class="font-semibold text-foreground">{{ salaryRangeText }}</span>
                <span class="text-muted-foreground">typical</span>
              </div>
              
              <!-- Median (if different from range) -->
              <div v-if="stats?.medianSalary" class="flex items-center gap-1.5">
                <span class="text-muted-foreground">median</span>
                <span class="font-medium text-foreground">{{ formatSalary(stats.medianSalary) }}</span>
              </div>
            </div>

            <!-- Location distribution -->
            <div v-if="locationBreakdown.length > 0" class="flex items-center gap-2 text-xs">
              <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5 text-muted-foreground" />
              <span class="text-muted-foreground">{{ locationBreakdown.join(' · ') }}</span>
            </div>

            <!-- Top companies -->
            <div v-if="stats?.topCompanies?.length" class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="mdi:domain" class="w-3.5 h-3.5" />
                <span>Top hiring</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <Badge 
                  v-for="company in stats.topCompanies.slice(0, 4)" 
                  :key="company.name" 
                  variant="soft"
                >
                  {{ company.name }}
                  <span class="ml-1 opacity-60">({{ company.count }})</span>
                </Badge>
              </div>
            </div>

            <!-- Top certs -->
            <div v-if="stats?.topCerts?.length" class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="mdi:certificate-outline" class="w-3.5 h-3.5" />
                <span>Common certs</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <Badge 
                  v-for="cert in stats?.topCerts" 
                  :key="cert" 
                  variant="soft"
                >
                  {{ cert }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>

