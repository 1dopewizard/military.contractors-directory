<!--
  @file Community/RecentActivityFeed.vue
  @description Display a feed of recent community contributions (salaries and interviews)
  @usage <RecentActivityFeed :limit="5" />
-->

<script setup lang="ts">
import type { RecentActivity, RecentSalaryActivity, RecentInterviewActivity } from '@/app/types/community.types'

interface Props {
  /** Maximum number of items to show */
  limit?: number
  /** Show compact cards */
  compact?: boolean
  /** Show loading state */
  loading?: boolean
  /** Pre-loaded activity data (skip fetching) */
  activity?: RecentActivity[]
  /** Show view all link */
  showViewAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
  compact: false,
  loading: false,
  showViewAll: true,
})

const { fetchRecentActivity } = useCommunityStats()

// Local state
const activityItems = ref<RecentActivity[]>([])
const isLoading = ref(props.loading)
const error = ref<string | null>(null)

// Format salary to display string
const formatSalary = (salary: number): string => {
  if (salary >= 1000) {
    return `$${Math.round(salary / 1000)}K`
  }
  return `$${salary.toLocaleString()}`
}

// Format time ago
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// Clearance level display
const getClearanceLabel = (level: string): string => {
  const labels: Record<string, string> = {
    NONE: 'No Clearance',
    PUBLIC_TRUST: 'Public Trust',
    SECRET: 'Secret',
    TOP_SECRET: 'Top Secret',
    TS_SCI: 'TS/SCI',
    TS_SCI_POLY: 'TS/SCI + Poly',
  }
  return labels[level] || level
}

// Outcome badge config
const outcomeBadgeConfigs = {
  OFFER: { label: 'Offer', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', class: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  GHOSTED: { label: 'Ghosted', class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  WITHDREW: { label: 'Withdrew', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
} as const

const getOutcomeBadge = (outcome: string): { label: string; class: string } => {
  const key = outcome as keyof typeof outcomeBadgeConfigs
  return outcomeBadgeConfigs[key] ?? outcomeBadgeConfigs.REJECTED
}

// Type guard for salary activity
const isSalaryActivity = (item: RecentActivity): item is RecentSalaryActivity => {
  return item.type === 'salary'
}

// Type guard for interview activity
const isInterviewActivity = (item: RecentActivity): item is RecentInterviewActivity => {
  return item.type === 'interview'
}

// Fetch activity on mount if not provided
onMounted(async () => {
  if (props.activity) {
    activityItems.value = props.activity.slice(0, props.limit)
    return
  }

  isLoading.value = true
  try {
    const data = await fetchRecentActivity(props.limit)
    activityItems.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load activity'
  } finally {
    isLoading.value = false
  }
})

// Watch for prop changes
watch(
  () => props.activity,
  (newActivity) => {
    if (newActivity) {
      activityItems.value = newActivity.slice(0, props.limit)
    }
  }
)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div v-if="!compact" class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Recently Shared
      </h3>
      <NuxtLink
        v-if="showViewAll"
        to="/community"
        class="text-xs text-primary hover:underline"
      >
        View all
      </NuxtLink>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in limit"
        :key="i"
        class="flex items-start gap-3 p-3 border border-border/50 bg-card/50 animate-pulse"
      >
        <div class="w-8 h-8 bg-muted rounded-sm shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 bg-muted rounded" />
          <div class="h-3 w-1/2 bg-muted rounded" />
        </div>
        <div class="h-3 w-12 bg-muted rounded" />
      </div>
    </div>

    <!-- Error state -->
    <Empty v-else-if="error">
      <EmptyMedia>
        <Icon name="mdi:alert-circle" class="w-10 h-10 text-destructive/50" />
      </EmptyMedia>
      <EmptyTitle>Failed to load activity</EmptyTitle>
      <EmptyDescription>{{ error }}</EmptyDescription>
    </Empty>

    <!-- Empty state -->
    <Empty v-else-if="activityItems.length === 0">
      <EmptyMedia>
        <Icon name="mdi:message-text-outline" class="w-10 h-10 text-muted-foreground/50" />
      </EmptyMedia>
      <EmptyTitle>No activity yet</EmptyTitle>
      <EmptyDescription>
        Be the first to share your salary or interview experience!
      </EmptyDescription>
    </Empty>

    <!-- Activity list -->
    <div v-else class="space-y-2">
      <div
        v-for="item in activityItems"
        :key="item.id"
        class="flex items-start gap-3 p-3 border border-border/30 bg-card/30 hover:border-primary/30 hover:bg-card/50 transition-colors"
      >
        <!-- Icon -->
        <div
          class="flex items-center justify-center w-8 h-8 shrink-0"
          :class="[
            isSalaryActivity(item)
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          ]"
        >
          <Icon
            :name="isSalaryActivity(item) ? 'mdi:currency-usd' : 'mdi:message-text'"
            class="w-4 h-4"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Salary activity -->
          <template v-if="isSalaryActivity(item)">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5">
                {{ item.mosCode }}
              </span>
              <span class="text-muted-foreground/60">→</span>
              <NuxtLink
                v-if="item.companySlug"
                :to="`/companies/${item.companySlug}`"
                class="text-sm font-medium text-foreground hover:text-primary hover:underline truncate"
              >
                {{ item.companyName }}
              </NuxtLink>
              <span v-else class="text-sm font-medium text-foreground truncate">
                {{ item.companyName }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span class="font-semibold text-foreground">{{ formatSalary(item.baseSalary) }}</span>
              <span v-if="item.signingBonus" class="text-emerald-600 dark:text-emerald-400">
                +{{ formatSalary(item.signingBonus) }} signing
              </span>
              <span class="text-border">•</span>
              <span>{{ getClearanceLabel(item.clearanceLevel) }}</span>
              <span class="text-border">•</span>
              <span>{{ item.location }}</span>
            </div>
          </template>

          <!-- Interview activity -->
          <template v-else-if="isInterviewActivity(item)">
            <div class="flex items-center gap-2 flex-wrap">
              <NuxtLink
                v-if="item.companySlug"
                :to="`/companies/${item.companySlug}`"
                class="text-sm font-medium text-foreground hover:text-primary hover:underline truncate"
              >
                {{ item.companyName }}
              </NuxtLink>
              <span v-else class="text-sm font-medium text-foreground truncate">
                {{ item.companyName }}
              </span>
              <Badge variant="soft" :class="getOutcomeBadge((item as RecentInterviewActivity).outcome).class" class="text-[10px]">
                {{ getOutcomeBadge((item as RecentInterviewActivity).outcome).label }}
              </Badge>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span class="font-mono bg-primary/10 text-primary px-1 py-0.5">
                {{ item.mosCode }}
              </span>
              <span class="truncate">{{ (item as RecentInterviewActivity).roleTitle }}</span>
              <span class="text-border">•</span>
              <span>{{ (item as RecentInterviewActivity).timelineWeeks }}w process</span>
            </div>
          </template>
        </div>

        <!-- Timestamp & helpful -->
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span class="text-[10px] text-muted-foreground/70">
            {{ formatTimeAgo(item.createdAt) }}
          </span>
          <div v-if="item.helpfulCount > 0" class="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Icon name="mdi:thumb-up-outline" class="w-3 h-3" />
            <span>{{ item.helpfulCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- View all CTA (bottom) -->
    <div v-if="showViewAll && activityItems.length > 0 && !compact" class="pt-2">
      <Button variant="ghost" as-child class="w-full">
        <NuxtLink to="/community" class="flex items-center justify-center gap-2">
          <span>See all community activity</span>
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
