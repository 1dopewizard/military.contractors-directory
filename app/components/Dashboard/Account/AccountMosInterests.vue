<!--
  @file AccountMosInterests.vue
  @description MOS codes the user has viewed/shown interest in
-->
<script setup lang="ts">
const { userId } = useUserProfile()

// Fetch viewed MOS history via API
const { data: viewedMos, status } = useAsyncData(
  'viewed-mos',
  async () => {
    if (!userId.value) return []
    return await $fetch<Array<{
      id: string
      code: string
      title: string
      branch: string
      viewedAt: number
      viewCount: number
    }>>('/api/users/viewed-mos', {
      query: { limit: 20 },
    })
  },
  {
    watch: [userId],
    default: () => [],
  }
)

const isLoading = computed(() => status.value === 'pending')

// Format branch name
const formatBranch = (branch: string) => {
  const branches: Record<string, string> = {
    army: 'Army',
    navy: 'Navy',
    air_force: 'Air Force',
    marine_corps: 'Marine Corps',
    coast_guard: 'Coast Guard',
    space_force: 'Space Force',
  }
  return branches[branch] || branch
}

// Get branch color
const getBranchColor = (branch: string) => {
  const colors: Record<string, string> = {
    army: 'text-green-600 dark:text-green-400',
    navy: 'text-blue-600 dark:text-blue-400',
    air_force: 'text-sky-600 dark:text-sky-400',
    marine_corps: 'text-red-600 dark:text-red-400',
    coast_guard: 'text-orange-600 dark:text-orange-400',
    space_force: 'text-indigo-600 dark:text-indigo-400',
  }
  return colors[branch] || 'text-muted-foreground'
}

// Format last viewed
const formatLastViewed = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'recently'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-foreground">MOS Interests</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Military occupations you've explored
        </p>
      </div>
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/search">
          <Icon name="mdi:magnify" class="w-4 h-4 mr-2" />
          Explore More
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="p-4 border border-border">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <Skeleton class="h-10 w-10" />
            <div class="space-y-1">
              <Skeleton class="h-5 w-48" />
              <Skeleton class="h-4 w-24" />
            </div>
          </div>
          <Skeleton class="h-6 w-12" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!viewedMos?.length" class="py-12 text-center">
      <Empty>
        <EmptyMedia>
          <Icon name="mdi:badge-account-outline" class="size-12 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle>No MOS history yet</EmptyTitle>
        <EmptyDescription>
          As you explore MOS codes and career paths, they'll appear here to help track your interests.
        </EmptyDescription>
      </Empty>
      <Button class="mt-6" as-child>
        <NuxtLink to="/search">Explore MOS Codes</NuxtLink>
      </Button>
    </div>

    <!-- MOS list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="mos in viewedMos" 
        :key="mos.id"
        :to="`/search?mos=${mos.code}`"
        class="block p-4 border border-border hover:border-muted-foreground/25 transition-colors group"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <!-- MOS Code Badge -->
            <div class="shrink-0 w-12 h-12 flex items-center justify-center bg-muted font-mono text-sm font-medium text-foreground">
              {{ mos.code }}
            </div>
            
            <div class="min-w-0">
              <p class="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {{ mos.title }}
              </p>
              <div class="flex items-center gap-3 text-sm">
                <span :class="getBranchColor(mos.branch)">
                  {{ formatBranch(mos.branch) }}
                </span>
                <span class="text-muted-foreground">
                  {{ formatLastViewed(mos.viewedAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- View Count -->
          <div class="shrink-0 flex items-center gap-1.5 text-muted-foreground">
            <Icon name="mdi:eye-outline" class="size-4" />
            <span class="text-sm font-mono">{{ mos.viewCount }}</span>
          </div>
        </div>
      </NuxtLink>

      <!-- Help text -->
      <div class="flex items-start gap-2 p-3 bg-muted/30 text-sm text-muted-foreground">
        <Icon name="mdi:lightbulb-outline" class="size-4 shrink-0 mt-0.5" />
        <p>
          We use your MOS interests to recommend relevant jobs and salary data. 
          The more you explore, the better your recommendations become.
        </p>
      </div>

      <!-- Count -->
      <p class="text-xs text-muted-foreground text-center pt-2">
        {{ viewedMos.length }} MOS code{{ viewedMos.length === 1 ? '' : 's' }} explored
      </p>
    </div>
  </div>
</template>
