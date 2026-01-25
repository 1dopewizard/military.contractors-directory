<!--
  @file JobListingsSection.vue
  @description Homepage section for latest jobs — Card-based grid layout
  @usage <JobListingsSection :filters="filters" />
-->

<script setup lang="ts">
import type { JobWithMeta, JobFilters } from '@/app/types/app.types'
import JobCard from './JobCard.vue'

const props = defineProps<{
  filters?: JobFilters
}>()

const logger = useLogger('JobListingsSection')
const { fetchJobs } = useJobs()

const jobs = ref<JobWithMeta[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const totalCount = ref(0)

const pagination = reactive({
  page: 1,
  limit: 12
})

const totalResults = computed(() => {
  if (totalCount.value && totalCount.value > 0) {
    return totalCount.value
  }

  return jobs.value.length
})

const totalPages = computed(() => {
  if (totalResults.value === 0) {
    return 1
  }

  return Math.max(1, Math.ceil(totalResults.value / pagination.limit))
})

const hasPreviousPage = computed(() => pagination.page > 1)
const hasNextPage = computed(() => pagination.page < totalPages.value)

const startIndex = computed(() => {
  if (!jobs.value.length) {
    return 0
  }
  return (pagination.page - 1) * pagination.limit + 1
})

const endIndex = computed(() => {
  if (!jobs.value.length) {
    return 0
  }
  return Math.min(startIndex.value + jobs.value.length - 1, totalResults.value)
})

const loadJobs = async () => {
  loading.value = true
  error.value = null

  logger.info({ page: pagination.page, limit: pagination.limit, filters: props.filters }, 'JobListingsSection: Fetching latest jobs with pagination')

  const { data, error: fetchError, count } = await fetchJobs(
    {
      page: pagination.page,
      limit: pagination.limit
    },
    props.filters
  )

  if (fetchError) {
    error.value = fetchError
    jobs.value = []
    totalCount.value = 0
    logger.error({ error: fetchError }, 'JobListingsSection: Failed to fetch jobs')
  } else {
    jobs.value = data ?? []
    const resolvedCount = typeof count === 'number' ? count : jobs.value.length
    totalCount.value = resolvedCount
    logger.info({ count: jobs.value.length, total: totalCount.value }, 'JobListingsSection: Jobs fetched successfully')
  }

  loading.value = false
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value || page === pagination.page) {
    return
  }

  pagination.page = page
  await loadJobs()
}

// Watch for filter changes
watch(() => props.filters, () => {
  // Reset to page 1 when filters change
  pagination.page = 1
  loadJobs()
}, { deep: true })

onMounted(async () => {
  await loadJobs()
})
</script>

<template>
  <section
    aria-labelledby="latest-jobs-heading"
    :aria-busy="loading"
    aria-live="polite"
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 id="latest-jobs-heading" class="text-xl font-semibold tracking-tight flex items-center gap-2">
        <Icon name="mdi:briefcase-clock-outline" class="w-5 h-5 text-primary" />
        Latest Opportunities
      </h2>
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/jobs" class="flex items-center gap-1 text-sm">
          View All
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner class="size-6 text-primary" />
      <p class="text-sm text-muted-foreground">Loading jobs...</p>
    </div>

    <!-- Error -->
    <Alert v-else-if="error" variant="destructive" class="my-4">
      <AlertTitle>Error Loading Jobs</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Empty -->
    <div v-else-if="!jobs.length" class="text-center py-12 border border-dashed border-primary/20 rounded-lg">
      <Icon name="mdi:briefcase-off-outline" class="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p class="text-sm font-medium text-foreground">No jobs available</p>
      <p class="text-xs mt-1 text-muted-foreground">Check back later for new opportunities.</p>
    </div>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <JobCard
        v-for="job in jobs"
        :key="job.id"
        :job="job"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="jobs.length && totalResults > pagination.limit"
      class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50"
    >
      <p class="text-xs text-muted-foreground">
        Showing {{ startIndex }}-{{ endIndex }} of {{ totalResults }} jobs
      </p>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!hasPreviousPage || loading"
          @click="goToPage(pagination.page - 1)"
        >
          <Icon name="mdi:chevron-left" class="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span class="text-xs text-muted-foreground font-medium px-2">
          Page {{ pagination.page }} of {{ totalPages }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          :disabled="!hasNextPage || loading"
          @click="goToPage(pagination.page + 1)"
        >
          Next
          <Icon name="mdi:chevron-right" class="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="jobs.length" class="pt-4 space-y-4">
      <div class="text-center">
        <NuxtLink to="/jobs">
          <Button variant="ghost" size="lg" class="w-full sm:w-auto shadow-sm">
            View All Jobs
            <Icon name="mdi:arrow-right" class="w-4 h-4 ml-2" />
          </Button>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
