<!--
  @file Saved jobs list component
  @usage <SavedJobsList />
  @description Displays grid of user's saved/favorited jobs
-->

<script setup lang="ts">
import SavedJobSkeleton from '@/app/components/Jobs/SavedJobSkeleton.vue'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/app/components/ui/empty'

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    limit?: number
  }>(),
  {
    showHeader: true,
    limit: 0
  }
)

const logger = useLogger('SavedJobsList')
const { getFavoriteJobs } = useUserPreferences()

const savedJobs = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  logger.info('Loading saved jobs')
  const jobs = await getFavoriteJobs()
  savedJobs.value = jobs
  loading.value = false
  logger.info({ count: jobs.length }, 'Saved jobs loaded')
})

const displayedJobs = computed(() => {
  if (props.limit > 0) {
    return savedJobs.value.slice(0, props.limit)
  }
  return savedJobs.value
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="showHeader" class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">Saved Jobs</h2>
      <NuxtLink to="/jobs" class="text-sm text-primary hover:underline">
        Browse more
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <SavedJobSkeleton v-if="loading" :count="3" />

    <!-- Empty State -->
    <Empty v-else-if="savedJobs.length === 0">
      <EmptyMedia variant="icon">
        <Icon name="mdi:heart-outline" class="size-5" />
      </EmptyMedia>
      <EmptyContent>
        <EmptyTitle>No saved jobs yet</EmptyTitle>
        <EmptyDescription>Save jobs you're interested in to review later</EmptyDescription>
      </EmptyContent>
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/jobs">Browse Jobs</NuxtLink>
      </Button>
    </Empty>

    <!-- Jobs List -->
    <div v-else class="divide-y divide-border/30">
      <JobCard
        v-for="job in displayedJobs"
        :key="job.id"
        :job="job"
        class="py-3 first:pt-0"
      />
      <div v-if="limit > 0 && savedJobs.length > limit" class="pt-3 text-center">
        <NuxtLink to="/jobs" class="text-xs text-muted-foreground hover:text-foreground">
          View all {{ savedJobs.length }} saved jobs
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

