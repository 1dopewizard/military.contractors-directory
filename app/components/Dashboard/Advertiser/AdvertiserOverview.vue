<!--
  @file AdvertiserOverview.vue
  @description Advertiser dashboard overview with stats, quick actions, and recent ads
-->
<script setup lang="ts">
import type { FeaturedAd, FeaturedJob, AdStatus } from '@/app/types/ad.types'

interface AdItem {
  type: 'ad' | 'job'
  data: FeaturedAd | FeaturedJob
  title: string
  subtitle: string
}

interface Stats {
  total: number
  active: number
  pending: number
  draft: number
  totalImpressions: number
  totalClicks: number
}

interface Props {
  stats: Stats
  ctr: string
  recentAds: AdItem[]
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setTab: [tabId: string]
}>()

const getStatusBadge = (status: AdStatus) => {
  switch (status) {
    case 'active': return { label: 'Active', class: 'bg-green-500/10 text-green-600 dark:text-green-400' }
    case 'draft': return { label: 'Draft', class: 'bg-muted text-muted-foreground' }
    case 'pending_review': return { label: 'Pending', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    case 'pending_payment': return { label: 'Payment', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    case 'paused': return { label: 'Paused', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    case 'expired': return { label: 'Expired', class: 'bg-red-500/10 text-red-600 dark:text-red-400' }
    case 'cancelled': return { label: 'Cancelled', class: 'bg-muted text-muted-foreground' }
    default: return { label: status, class: 'bg-muted text-muted-foreground' }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.total }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Total Ads</p>
      </div>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-2 -mx-2 transition-colors"
        @click="emit('setTab', 'my-ads')"
      >
        <p class="text-2xl font-bold font-mono text-green-600 dark:text-green-400">{{ stats.active }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
      </button>
      <button 
        class="space-y-1 text-left hover:bg-muted/30 px-2 -mx-2 transition-colors"
        @click="emit('setTab', 'my-ads')"
      >
        <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{{ stats.pending }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
      </button>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-muted-foreground">{{ stats.draft }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Drafts</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalImpressions.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Impressions</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-primary">{{ ctr }}%</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">CTR</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" @click="emit('setTab', 'create')">
          <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
          Create New Ad
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'my-ads')">
          <Icon name="mdi:view-list-outline" class="w-4 h-4 mr-2" />
          View All Ads
        </Button>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/advertise">
            <Icon name="mdi:information-outline" class="w-4 h-4 mr-2" />
            Advertising Info
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Performance Summary -->
    <div v-if="stats.totalImpressions > 0" class="p-4 bg-primary/5 border border-primary/10">
      <div class="flex items-start gap-3">
        <Icon name="mdi:chart-line" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">Performance Summary</p>
          <p class="text-xs text-muted-foreground mt-1">
            Your ads have received {{ stats.totalImpressions.toLocaleString() }} impressions 
            and {{ stats.totalClicks.toLocaleString() }} clicks with a {{ ctr }}% click-through rate.
          </p>
        </div>
      </div>
    </div>

    <!-- Recent Ads -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Ads</h3>
      
      <!-- Loading -->
      <div v-if="isLoading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-16 bg-muted/30 animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="recentAds.length === 0" class="py-8 text-center">
        <Empty>
          <EmptyMedia>
            <Icon name="mdi:bullhorn-outline" class="size-12 text-muted-foreground/50" />
          </EmptyMedia>
          <EmptyTitle>No ads yet</EmptyTitle>
          <EmptyDescription>
            Create your first featured ad to reach thousands of cleared veterans.
          </EmptyDescription>
        </Empty>
        <Button class="mt-6" @click="emit('setTab', 'create')">
          <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
          Create Your First Ad
        </Button>
      </div>

      <!-- Recent Ads List -->
      <div v-else class="divide-y divide-border">
        <div 
          v-for="item in recentAds.slice(0, 5)" 
          :key="`${item.type}-${item.data.id}`"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span 
                class="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider" 
                :class="item.type === 'job' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
              >
                {{ item.type === 'job' ? 'Job' : 'Spotlight' }}
              </span>
              <span 
                class="px-1.5 py-0.5 text-[10px] font-medium" 
                :class="getStatusBadge(item.data.status).class"
              >
                {{ getStatusBadge(item.data.status).label }}
              </span>
            </div>
            <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ item.subtitle }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-mono text-foreground">{{ item.data.impressions.toLocaleString() }}</p>
            <p class="text-[10px] text-muted-foreground">impressions</p>
          </div>
        </div>
      </div>

      <Button 
        v-if="recentAds.length > 5"
        variant="link" 
        class="p-0 h-auto"
        @click="emit('setTab', 'my-ads')"
      >
        View all {{ recentAds.length }} ads →
      </Button>
    </div>

    <!-- CTA for new advertisers -->
    <div v-if="stats.total === 0" class="p-4 border border-dashed border-muted-foreground/25">
      <div class="flex items-start gap-3">
        <Icon name="mdi:rocket-launch-outline" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">Ready to grow your reach?</p>
          <p class="text-xs text-muted-foreground mt-1">
            Featured ads get 10x more visibility than standard listings. Start with a featured job posting or company spotlight.
          </p>
          <Button 
            variant="link" 
            class="p-0 h-auto mt-2 text-xs"
            @click="emit('setTab', 'create')"
          >
            Create your first ad →
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
