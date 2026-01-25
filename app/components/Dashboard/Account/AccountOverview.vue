<!--
  @file AccountOverview.vue
  @description Account dashboard overview with stats, quick actions, and recent activity
-->
<script setup lang="ts">
interface Props {
  savedJobsCount: number
  jobAlertsCount: number
  mosInterestsCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setTab: [tabId: string]
}>()

const { profile, displayName, userId } = useUserProfile()

// Fetch recent activity via API
const { data: recentActivity, status: activityStatus } = useAsyncData(
  'account-recent-activity',
  async () => {
    if (!userId.value) return []
    return await $fetch<Array<{ id: string; activityType: string; metadata?: { title?: string }; createdAt: number }>>('/api/users/activity', {
      query: { limit: 5 },
    })
  },
  {
    watch: [userId],
    default: () => [],
  }
)

// Profile completion percentage
const profileCompletion = computed(() => {
  if (!profile.value) return 0
  const fields = [
    profile.value.branch,
    profile.value.mosCode,
    profile.value.clearanceLevel,
    profile.value.yearsExperience !== undefined,
  ]
  const completed = fields.filter(Boolean).length
  return Math.round((completed / fields.length) * 100)
})

// Format activity type
const formatActivityType = (type: string) => {
  const formats: Record<string, string> = {
    job_view: 'Viewed job',
    job_save: 'Saved job',
    job_unsave: 'Removed saved job',
    mos_view: 'Viewed MOS',
    company_view: 'Viewed company',
    search: 'Searched',
    alert_create: 'Created job alert',
    login: 'Signed in',
  }
  return formats[type] || type
}

// Time ago formatter
const getTimeAgo = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome & Profile Completion -->
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Welcome back, {{ displayName }}</h2>
        <p class="text-muted-foreground text-sm mt-1">
          Here's what's happening with your job search
        </p>
      </div>

      <!-- Profile Completion Bar -->
      <div 
        v-if="profileCompletion < 100"
        class="p-4 bg-primary/5 border border-primary/10"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-foreground">Profile completion</span>
          <span class="text-sm font-mono text-primary">{{ profileCompletion }}%</span>
        </div>
        <div class="h-2 bg-muted overflow-hidden">
          <div 
            class="h-full bg-primary transition-all duration-500"
            :style="{ width: `${profileCompletion}%` }"
          />
        </div>
        <Button 
          variant="link" 
          class="mt-2 p-0 h-auto text-xs"
          @click="emit('setTab', 'profile')"
        >
          Complete your profile to get better job matches →
        </Button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-6">
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-3 py-2 -mx-3 transition-colors"
        @click="emit('setTab', 'saved-jobs')"
      >
        <p class="text-2xl font-bold font-mono text-foreground">{{ savedJobsCount }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Saved Jobs</p>
      </button>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-3 py-2 -mx-3 transition-colors"
        @click="emit('setTab', 'job-alerts')"
      >
        <p class="text-2xl font-bold font-mono text-foreground">{{ jobAlertsCount }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Job Alerts</p>
      </button>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-3 py-2 -mx-3 transition-colors"
        @click="emit('setTab', 'mos-interests')"
      >
        <p class="text-2xl font-bold font-mono text-foreground">{{ mosInterestsCount }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">MOS Interests</p>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/jobs">
            <Icon name="mdi:briefcase-search-outline" class="w-4 h-4 mr-2" />
            Browse Jobs
          </NuxtLink>
        </Button>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/salaries">
            <Icon name="mdi:cash-multiple" class="w-4 h-4 mr-2" />
            Explore Salaries
          </NuxtLink>
        </Button>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/companies">
            <Icon name="mdi:domain" class="w-4 h-4 mr-2" />
            Research Companies
          </NuxtLink>
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'profile')">
          <Icon name="mdi:account-edit-outline" class="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Activity</h3>
      
      <!-- Loading -->
      <div v-if="activityStatus === 'pending'" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 bg-muted/30 animate-pulse" />
      </div>

      <!-- Empty -->
      <p v-else-if="!recentActivity?.length" class="text-sm text-muted-foreground py-4">
        No recent activity. Start by browsing jobs or exploring MOS codes.
      </p>

      <!-- Activity List -->
      <div v-else class="divide-y divide-border">
        <div 
          v-for="activity in recentActivity" 
          :key="activity.id"
          class="flex items-center gap-3 py-3 text-sm"
        >
          <div class="w-8 h-8 flex items-center justify-center shrink-0 text-muted-foreground">
            <Icon 
              :name="
                activity.activityType === 'job_view' ? 'mdi:briefcase-outline' :
                activity.activityType === 'job_save' ? 'mdi:bookmark' :
                activity.activityType === 'mos_view' ? 'mdi:badge-account-outline' :
                activity.activityType === 'company_view' ? 'mdi:domain' :
                activity.activityType === 'search' ? 'mdi:magnify' :
                'mdi:clock-outline'
              " 
              class="w-4 h-4" 
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-foreground truncate">
              {{ formatActivityType(activity.activityType) }}
              <span v-if="activity.metadata?.title" class="text-muted-foreground">
                — {{ activity.metadata.title }}
              </span>
            </p>
          </div>
          <span class="text-xs text-muted-foreground shrink-0">
            {{ getTimeAgo(activity.createdAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- CTA for Incomplete Profile -->
    <div v-if="!profile?.mosCode" class="p-4 border border-dashed border-muted-foreground/25">
      <div class="flex items-start gap-3">
        <Icon name="mdi:lightbulb-outline" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">Add your MOS code</p>
          <p class="text-xs text-muted-foreground mt-1">
            We'll show you jobs that match your military experience and skills.
          </p>
          <Button 
            variant="link" 
            class="p-0 h-auto mt-2 text-xs"
            @click="emit('setTab', 'profile')"
          >
            Add MOS code →
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
