<!--
  @file AccountSavedJobs.vue
  @description User's saved jobs list with management
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

const { getFavoriteJobs, removeFavorite } = useUserPreferences()

// Fetch saved jobs from localStorage + API
const { data: savedJobs, status, refresh } = useAsyncData(
  'saved-jobs',
  async () => {
    return await getFavoriteJobs()
  },
  {
    default: () => [],
  }
)

const isLoading = computed(() => status.value === 'pending')

// Unsave job
const unsaveJob = async (jobId: string) => {
  try {
    await removeFavorite(jobId)
    toast.success('Job removed from saved')
    refresh()
  } catch (error) {
    toast.error('Failed to remove job')
  }
}

// Format date
const formatSavedDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Saved Jobs</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Jobs you've saved for later review
        </p>
      </div>
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/jobs">
          <Icon name="mdi:magnify" class="w-4 h-4 mr-2" />
          Find More Jobs
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="p-4 border border-border">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 space-y-2">
            <Skeleton class="h-5 w-3/4" />
            <Skeleton class="h-4 w-1/3" />
            <div class="flex gap-4 mt-3">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-20" />
            </div>
          </div>
          <Skeleton class="h-9 w-16" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!savedJobs?.length" class="py-12 text-center">
      <Empty>
        <EmptyMedia>
          <Icon name="mdi:bookmark-outline" class="size-12 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle>No saved jobs yet</EmptyTitle>
        <EmptyDescription>
          When you find jobs you're interested in, save them here for easy access.
        </EmptyDescription>
      </Empty>
      <Button class="mt-6" as-child>
        <NuxtLink to="/jobs">Browse Jobs</NuxtLink>
      </Button>
    </div>

    <!-- Saved jobs list -->
    <div v-else class="space-y-3">
      <div 
        v-for="job in savedJobs" 
        :key="job.id"
        class="p-4 border border-border hover:border-muted-foreground/25 transition-colors group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <NuxtLink 
              :to="`/jobs/${job.slug || job.id}`" 
              class="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {{ job.title }}
            </NuxtLink>
            <p class="text-muted-foreground mt-0.5">{{ job.company }}</p>
            
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <span class="flex items-center gap-1.5">
                <Icon name="mdi:map-marker-outline" class="size-4" />
                {{ job.location }}
              </span>
              <span v-if="job.clearance_required" class="flex items-center gap-1.5">
                <Icon name="mdi:shield-outline" class="size-4" />
                {{ job.clearance_required }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink :to="`/jobs/${job.slug || job.id}`">
                View
              </NuxtLink>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              class="text-muted-foreground hover:text-destructive"
              @click="unsaveJob(job.id)"
              title="Remove from saved"
            >
              <Icon name="mdi:bookmark-remove" class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Count -->
      <p class="text-xs text-muted-foreground text-center pt-4">
        {{ savedJobs.length }} saved {{ savedJobs.length === 1 ? 'job' : 'jobs' }}
      </p>
    </div>
  </div>
</template>
