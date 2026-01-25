<!--
  @file AdminOverview.vue
  @description Admin dashboard overview tab with stats, system health, and activity log
-->
<script setup lang="ts">
interface Props {
  systemHealth: {
    database: {
      status: 'connected' | 'error'
      latencyMs: number | null
    }
    contractors: {
      total: number
      withLogos: number
    }
    claims: {
      pending: number
      approved: number
    }
    content: {
      pendingReview: number
    }
  } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setTab: [tabId: string]
}>()

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

onMounted(() => {
  loadActivityLog()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Grid -->
    <div v-if="systemHealth" class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ systemHealth.contractors.total }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Contractors</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-green-600 dark:text-green-400">{{ systemHealth.claims.approved }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Claimed Profiles</p>
      </div>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-2 -mx-2 rounded transition-colors" 
        @click="emit('setTab', 'claims')"
      >
        <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{{ systemHealth.claims.pending }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Pending Claims</p>
      </button>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-2 -mx-2 rounded transition-colors" 
        @click="emit('setTab', 'content')"
      >
        <p class="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{{ systemHealth.content.pendingReview }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Content to Review</p>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" @click="emit('setTab', 'claims')">
          <Icon name="mdi:shield-check-outline" class="w-4 h-4 mr-2" />
          Review Claims ({{ systemHealth?.claims.pending || 0 }})
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'content')">
          <Icon name="mdi:text-box-check-outline" class="w-4 h-4 mr-2" />
          Review Content ({{ systemHealth?.content.pendingReview || 0 }})
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'contractors')">
          <Icon name="mdi:office-building-outline" class="w-4 h-4 mr-2" />
          Manage Contractors
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'users')">
          <Icon name="mdi:account-group-outline" class="w-4 h-4 mr-2" />
          Manage Users
        </Button>
      </div>
    </div>

    <!-- System Health -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">System Health</h3>
      
      <div v-if="systemHealth" class="grid grid-cols-2 md:grid-cols-3 gap-6">
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

        <!-- Contractors with Logos -->
        <div class="space-y-1">
          <p class="text-2xl font-bold font-mono text-foreground">
            {{ systemHealth.contractors.withLogos }}/{{ systemHealth.contractors.total }}
          </p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">With Logos</p>
        </div>

        <!-- Claim Rate -->
        <div class="space-y-1">
          <p class="text-2xl font-bold font-mono text-foreground">
            {{ systemHealth.contractors.total > 0 ? Math.round((systemHealth.claims.approved / systemHealth.contractors.total) * 100) : 0 }}%
          </p>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Claim Rate</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Activity</h3>

      <div v-if="activityLoading" class="space-y-2">
        <Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
      </div>

      <div v-else-if="activityLog.length === 0" class="text-sm text-muted-foreground py-4">
        No recent activity
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="entry in activityLog"
          :key="entry.id"
          class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
        >
          <div class="flex items-center gap-3 min-w-0">
            <Icon 
              :name="entry.action === 'approve' ? 'mdi:check-circle' : entry.action === 'reject' ? 'mdi:close-circle' : 'mdi:pencil'"
              class="w-4 h-4 shrink-0"
              :class="entry.action === 'approve' ? 'text-green-500' : entry.action === 'reject' ? 'text-red-500' : 'text-muted-foreground'"
            />
            <div class="min-w-0">
              <p class="text-sm truncate">
                <span class="font-medium">{{ formatAction(entry.action) }}</span>
                <span class="text-muted-foreground"> {{ formatEntityType(entry.entity_type) }}</span>
              </p>
              <p class="text-xs text-muted-foreground truncate">
                {{ entry.admin_email || 'System' }}
              </p>
            </div>
          </div>
          <span class="text-xs text-muted-foreground shrink-0">
            {{ getTimeAgo(entry.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
