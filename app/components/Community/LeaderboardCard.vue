<!--
  @file Community/LeaderboardCard.vue
  @description Displays top contributors leaderboard with ranking, contribution counts, and helpful votes
  @usage <LeaderboardCard :limit="10" /> or <LeaderboardCard :limit="10" flat />
-->

<script setup lang="ts">
import type { TopContributor } from '@/app/types/community.types'

interface Props {
  /** Maximum number of contributors to show */
  limit?: number
  /** Pre-loaded contributors (skip fetching) */
  contributors?: TopContributor[]
  /** Show loading state */
  loading?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Show view all link */
  showViewAll?: boolean
  /** Flat mode - no card wrapper, matches RecentActivityFeed style */
  flat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
  loading: false,
  compact: false,
  showViewAll: true,
  flat: false,
})

const { getTopContributors } = useCommunityAccess()

// Local state
const leaderboardData = ref<TopContributor[]>([])
const isLoading = ref(props.loading)
const error = ref<string | null>(null)

// Rank styling
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
        text: 'text-white',
        glow: 'shadow-amber-500/30',
        icon: 'mdi:trophy',
      }
    case 2:
      return {
        bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
        text: 'text-white',
        glow: 'shadow-slate-500/30',
        icon: 'mdi:medal',
      }
    case 3:
      return {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-white',
        glow: 'shadow-orange-500/30',
        icon: 'mdi:medal-outline',
      }
    default:
      return {
        bg: 'bg-muted/50',
        text: 'text-muted-foreground',
        glow: '',
        icon: null,
      }
  }
}

// Format contribution text
const formatContributions = (contributor: TopContributor): string => {
  const parts: string[] = []
  if (contributor.salaryReportsCount > 0) {
    parts.push(`${contributor.salaryReportsCount} ${contributor.salaryReportsCount === 1 ? 'salary' : 'salaries'}`)
  }
  if (contributor.interviewExperiencesCount > 0) {
    parts.push(`${contributor.interviewExperiencesCount} ${contributor.interviewExperiencesCount === 1 ? 'interview' : 'interviews'}`)
  }
  return parts.join(' • ')
}

// Get initials from name
const getInitials = (name: string): string => {
  const words = name.split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

// Fetch on mount if not provided
onMounted(async () => {
  if (props.contributors) {
    leaderboardData.value = props.contributors.slice(0, props.limit)
    return
  }

  isLoading.value = true
  try {
    const data = await getTopContributors(props.limit)
    leaderboardData.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load leaderboard'
  } finally {
    isLoading.value = false
  }
})

// Watch for prop changes
watch(
  () => props.contributors,
  (newContributors) => {
    if (newContributors) {
      leaderboardData.value = newContributors.slice(0, props.limit)
    }
  }
)
</script>

<template>
  <!-- Flat mode (matches RecentActivityFeed style) -->
  <div v-if="flat" class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Top Contributors
      </h3>
      <NuxtLink
        v-if="showViewAll && leaderboardData.length >= limit"
        to="/community"
        class="text-xs text-primary hover:underline"
      >
        View all
      </NuxtLink>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-2">
      <div
        v-for="i in Math.min(limit, 5)"
        :key="i"
        class="flex items-center gap-3 p-3 border border-border/30 bg-card/30 animate-pulse"
      >
        <div class="w-7 h-7 bg-muted shrink-0" />
        <div class="w-8 h-8 bg-muted shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-4 w-24 bg-muted" />
          <div class="h-3 w-32 bg-muted" />
        </div>
        <div class="h-4 w-12 bg-muted" />
      </div>
    </div>

    <!-- Error state -->
    <Empty v-else-if="error">
      <EmptyMedia>
        <Icon name="mdi:alert-circle" class="w-10 h-10 text-destructive/50" />
      </EmptyMedia>
      <EmptyTitle>Failed to load</EmptyTitle>
      <EmptyDescription>{{ error }}</EmptyDescription>
    </Empty>

    <!-- Empty state -->
    <Empty v-else-if="leaderboardData.length === 0">
      <EmptyMedia>
        <Icon name="mdi:account-group-outline" class="w-10 h-10 text-muted-foreground/50" />
      </EmptyMedia>
      <EmptyTitle>No contributors yet</EmptyTitle>
      <EmptyDescription>
        Be the first to share your experience!
      </EmptyDescription>
    </Empty>

    <!-- Leaderboard list (flat style matching RecentActivityFeed) -->
    <div v-else class="space-y-2">
      <div
        v-for="(contributor, index) in leaderboardData"
        :key="contributor.userId"
        class="group flex items-center gap-3 p-3 border border-border/30 bg-card/30 hover:border-primary/30 hover:bg-card/50 transition-colors"
      >
        <!-- Rank badge -->
        <div
          class="flex items-center justify-center w-7 h-7 text-xs font-bold shrink-0 transition-shadow"
          :class="[getRankStyle(index + 1).bg, getRankStyle(index + 1).text, getRankStyle(index + 1).glow && 'shadow-lg']"
        >
          <Icon
            v-if="getRankStyle(index + 1).icon"
            :name="getRankStyle(index + 1).icon!"
            class="w-4 h-4"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>

        <!-- Avatar -->
        <div class="shrink-0">
          <Avatar class="w-8 h-8">
            <AvatarImage
              v-if="contributor.image"
              :src="contributor.image"
              :alt="contributor.name"
            />
            <AvatarFallback class="text-xs bg-primary/10 text-primary">
              {{ getInitials(contributor.name) }}
            </AvatarFallback>
          </Avatar>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm text-foreground truncate">
            {{ contributor.name }}
          </div>
          <div class="text-xs text-muted-foreground truncate">
            {{ formatContributions(contributor) }}
          </div>
        </div>

        <!-- Score/helpful votes -->
        <div class="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Icon name="mdi:thumb-up" class="w-3.5 h-3.5 text-primary/60" />
          <span class="tabular-nums">{{ contributor.totalHelpfulVotes }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom CTA -->
    <div v-if="!compact && leaderboardData.length > 0" class="pt-2">
      <Button variant="ghost" as-child class="w-full">
        <NuxtLink to="/salaries/submit" class="flex items-center justify-center gap-2">
          <span>Join the leaderboard</span>
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </Button>
    </div>
  </div>

  <!-- Card mode (original) -->
  <Card v-else class="overflow-hidden">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-base font-semibold">
          <Icon name="mdi:trophy-variant" class="w-5 h-5 text-amber-500" />
          Top Contributors
        </CardTitle>
        <NuxtLink
          v-if="showViewAll && leaderboardData.length >= limit"
          to="/community"
          class="text-xs text-primary hover:underline"
        >
          View all
        </NuxtLink>
      </div>
      <CardDescription v-if="!compact" class="text-xs">
        Recognizing those who share their intel with the community
      </CardDescription>
    </CardHeader>

    <CardContent class="pt-0">
      <!-- Loading state -->
      <div v-if="isLoading" class="space-y-2">
        <div
          v-for="i in Math.min(limit, 5)"
          :key="i"
          class="flex items-center gap-3 py-2 animate-pulse"
        >
          <div class="w-7 h-7 bg-muted shrink-0" />
          <div class="w-8 h-8 bg-muted shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-4 w-24 bg-muted" />
            <div class="h-3 w-32 bg-muted" />
          </div>
          <div class="h-4 w-12 bg-muted" />
        </div>
      </div>

      <!-- Error state -->
      <Empty v-else-if="error">
        <EmptyMedia>
          <Icon name="mdi:alert-circle" class="w-8 h-8 text-destructive/50" />
        </EmptyMedia>
        <EmptyTitle class="text-sm">Failed to load</EmptyTitle>
        <EmptyDescription class="text-xs">{{ error }}</EmptyDescription>
      </Empty>

      <!-- Empty state -->
      <Empty v-else-if="leaderboardData.length === 0">
        <EmptyMedia>
          <Icon name="mdi:account-group-outline" class="w-8 h-8 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle class="text-sm">No contributors yet</EmptyTitle>
        <EmptyDescription class="text-xs">
          Be the first to share your experience!
        </EmptyDescription>
      </Empty>

      <!-- Leaderboard list -->
      <div v-else class="space-y-1">
        <div
          v-for="(contributor, index) in leaderboardData"
          :key="contributor.userId"
          class="group flex items-center gap-3 py-2.5 px-2 -mx-2 hover:bg-muted/30 transition-colors"
          :class="{ 'border-b border-border/30': index < leaderboardData.length - 1 }"
        >
          <!-- Rank badge -->
          <div
            class="flex items-center justify-center w-7 h-7 text-xs font-bold shrink-0 transition-shadow"
            :class="[getRankStyle(index + 1).bg, getRankStyle(index + 1).text, getRankStyle(index + 1).glow && 'shadow-lg']"
          >
            <Icon
              v-if="getRankStyle(index + 1).icon"
              :name="getRankStyle(index + 1).icon!"
              class="w-4 h-4"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Avatar -->
          <div class="shrink-0">
            <Avatar class="w-8 h-8">
              <AvatarImage
                v-if="contributor.image"
                :src="contributor.image"
                :alt="contributor.name"
              />
              <AvatarFallback class="text-xs bg-primary/10 text-primary">
                {{ getInitials(contributor.name) }}
              </AvatarFallback>
            </Avatar>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-foreground truncate">
              {{ contributor.name }}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {{ formatContributions(contributor) }}
            </div>
          </div>

          <!-- Score/helpful votes -->
          <div class="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Icon name="mdi:thumb-up" class="w-3.5 h-3.5 text-primary/60" />
            <span class="tabular-nums">{{ contributor.totalHelpfulVotes }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom CTA for compact mode -->
      <div v-if="!compact && leaderboardData.length > 0" class="pt-4 border-t border-border/30 mt-2">
        <Button variant="ghost" as-child class="w-full text-xs h-8">
          <NuxtLink to="/salaries/submit" class="flex items-center justify-center gap-2">
            <Icon name="mdi:plus" class="w-4 h-4" />
            Join the leaderboard
          </NuxtLink>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
