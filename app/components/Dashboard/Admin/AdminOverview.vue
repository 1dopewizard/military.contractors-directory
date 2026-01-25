<!--
  @file AdminOverview.vue
  @description Admin dashboard overview tab with stats, system health, and activity log
-->
<script setup lang="ts">
import type { FeaturedAd, FeaturedJob } from '@/app/types/ad.types'
import AdReviewCard from './AdReviewCard.vue'

interface Props {
  stats: {
    totalAds: number
    active: number
    pendingReview: number
    totalImpressions: number
    totalClicks: number
  }
  pendingItems: Array<{ type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }>
}

interface SystemHealth {
  database: {
    status: 'connected' | 'error'
    latencyMs: number | null
  }
  jobs: {
    total: number
    active: number
    addedToday: number
    expiringIn7Days: number
  }
  pipeline: {
    lastRun: string | null
    status: 'idle' | 'running' | 'error'
  }
  featuredListings: {
    active: number
    pending: number
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setTab: [tabId: string]
  approve: [id: string, type: 'ad' | 'job']
  reject: [id: string, type: 'ad' | 'job', reason: string]
}>()

// System health data
const { data: systemHealthData, status: healthStatusRef, refresh: refreshHealth } = useFetch<SystemHealth>('/api/admin/system-health', {
  lazy: true
})

// Unwrapped values for template
const systemHealth = computed(() => systemHealthData.value)
const healthStatus = computed(() => healthStatusRef.value)

// Activity log
const { fetchActivityLog, formatAction, formatEntityType, getTimeAgo } = useAdminActivity()

interface ActivityLogEntry {
  id: string
  admin_id: string
  admin_email?: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

const activityLog = ref<ActivityLogEntry[]>([])
const activityLoading = ref(true)

const loadActivityLog = async () => {
  activityLoading.value = true
  const { data } = await fetchActivityLog(10)
  activityLog.value = data
  activityLoading.value = false
}

// Handlers to re-emit from AdReviewCard's object format to separate args
const onApprove = (payload: { id: string; type: 'ad' | 'job' }) => {
  emit('approve', payload.id, payload.type)
}

const onReject = (payload: { id: string; type: 'ad' | 'job'; reason: string }) => {
  emit('reject', payload.id, payload.type, payload.reason)
}

// Auto-refresh health every 30 seconds
let healthInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  loadActivityLog()
  healthInterval = setInterval(() => {
    refreshHealth()
    loadActivityLog()
  }, 30000)
})
onUnmounted(() => {
  if (healthInterval) clearInterval(healthInterval)
})
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalAds }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Featured</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-green-600 dark:text-green-400">{{ stats.active }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
      </div>
      <button class="space-y-1 text-left hover:bg-muted/30 px-2 -mx-2 rounded transition-colors" @click="emit('setTab', 'featured-listings')">
        <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{{ stats.pendingReview }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Pending Review</p>
      </button>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalImpressions.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Impressions</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalClicks.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Clicks</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" @click="emit('setTab', 'featured-listings')">
          <Icon name="mdi:clock-alert-outline" class="w-4 h-4 mr-2" />
          Review Pending ({{ stats.pendingReview }})
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'featured-listings')">
          <Icon name="mdi:star-outline" class="w-4 h-4 mr-2" />
          Featured Listings
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'users')">
          <Icon name="mdi:account-group-outline" class="w-4 h-4 mr-2" />
          Manage Users
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'pipeline')">
          <Icon name="mdi:pipe" class="w-4 h-4 mr-2" />
          Run Pipeline
        </Button>
      </div>
    </div>

    <!-- Recent Pending -->
    <div v-if="pendingItems.length > 0">
      <h3 class="font-semibold text-foreground mb-3">Needs Attention</h3>
      <div class="space-y-3">
        <AdReviewCard 
          v-for="item in pendingItems.slice(0, 3)" 
          :key="`${item.type}-${item.data.id}`"
          :item="item"
          @approve="onApprove"
          @reject="onReject"
        />
      </div>
      <Button 
        v-if="pendingItems.length > 3"
        variant="link" 
        class="mt-2"
        @click="emit('setTab', 'featured-listings')"
      >
        View all {{ pendingItems.length }} pending
      </Button>
    </div>

    <!-- Empty State -->
    <Empty v-else>
      <EmptyMedia variant="icon" class="bg-green-500/10 text-green-500">
        <Icon name="mdi:check-circle-outline" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle>All caught up!</EmptyTitle>
      <EmptyDescription>No featured listings waiting for review.</EmptyDescription>
    </Empty>

    <!-- System Health -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">System Health</h3>
      
      <!-- Loading State -->
      <div v-if="healthStatus === 'pending'" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="space-y-1">
          <div class="h-7 w-16 bg-muted/30 animate-pulse" />
          <div class="h-3 w-20 bg-muted/20 animate-pulse" />
        </div>
      </div>
      
      <!-- Health Stats -->
      <div v-else-if="systemHealth" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <!-- Database Status -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span 
              class="w-2 h-2 rounded-full" 
              :class="systemHealth.database.status === 'connected' ? 'bg-green-500' : 'bg-red-500'"
            />
            <p class="text-2xl font-bold font-mono" :class="systemHealth.database.status === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ systemHealth.database.latencyMs || '—' }}<span class="text-sm font-normal">ms</span>
            </p>
          </div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Database</p>
        </div>

        <!-- Jobs Today -->
        <div class="space-y-1">
          <p class="text-2xl font-bold font-mono text-foreground">{{ systemHealth.jobs.addedToday }}</p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Jobs Today</p>
        </div>

        <!-- Expiring Soon -->
        <div class="space-y-1">
          <p class="text-2xl font-bold font-mono" :class="systemHealth.jobs.expiringIn7Days > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">
            {{ systemHealth.jobs.expiringIn7Days }}
          </p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Expiring (7d)</p>
        </div>

        <!-- Pipeline Status -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span 
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': systemHealth.pipeline.status === 'idle',
                'bg-blue-500 animate-pulse': systemHealth.pipeline.status === 'running',
                'bg-red-500': systemHealth.pipeline.status === 'error'
              }"
            />
            <p class="text-2xl font-bold font-mono text-foreground capitalize">{{ systemHealth.pipeline.status }}</p>
          </div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Pipeline</p>
        </div>
      </div>
      
      <!-- Error State -->
      <Alert v-else-if="healthStatus === 'error'" variant="destructive">
        <AlertDescription>Failed to load system health data</AlertDescription>
      </Alert>
    </div>

    <!-- Activity Log -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Activity</h3>
      
      <!-- Loading State -->
      <div v-if="activityLoading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 bg-muted/30 animate-pulse" />
      </div>
      
      <!-- Empty State -->
      <p v-else-if="activityLog.length === 0" class="text-sm text-muted-foreground py-4">
        No recent activity recorded yet.
      </p>
      
      <!-- Activity Items -->
      <div v-else class="divide-y divide-border">
        <div 
          v-for="entry in activityLog" 
          :key="entry.id"
          class="flex items-center gap-3 py-3 text-sm"
        >
          <!-- Action Icon -->
          <div 
            class="w-8 h-8 flex items-center justify-center shrink-0"
            :class="{
              'text-green-500': entry.action === 'approve' || entry.action === 'create',
              'text-red-500': entry.action === 'reject' || entry.action === 'delete',
              'text-primary': entry.action === 'pin',
              'text-muted-foreground': entry.action === 'unpin' || entry.action === 'update'
            }"
          >
            <Icon 
              :name="
                entry.action === 'approve' ? 'mdi:check-circle' :
                entry.action === 'reject' ? 'mdi:close-circle' :
                entry.action === 'create' ? 'mdi:plus-circle' :
                entry.action === 'delete' ? 'mdi:delete' :
                entry.action === 'pin' ? 'mdi:pin' :
                entry.action === 'unpin' ? 'mdi:pin-off' :
                'mdi:pencil'
              " 
              class="w-4 h-4" 
            />
          </div>
          
          <!-- Details -->
          <div class="flex-1 min-w-0">
            <p class="text-foreground truncate">
              <span class="font-medium">{{ formatAction(entry.action) }}</span>
              {{ formatEntityType(entry.entity_type) }}
              <span v-if="entry.details?.job_title" class="text-muted-foreground">
                — {{ entry.details.job_title }}
              </span>
            </p>
            <p v-if="entry.details?.company" class="text-xs text-muted-foreground truncate">
              {{ entry.details.company }}
            </p>
          </div>
          
          <!-- Time -->
          <span class="text-xs text-muted-foreground shrink-0">
            {{ getTimeAgo(entry.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

