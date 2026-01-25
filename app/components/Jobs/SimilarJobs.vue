<!--
  @file Similar Jobs component
  @description Shows semantically similar jobs based on vector similarity
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'
import { getJobUrl } from '@/app/lib/utils'

interface SimilarJob {
  id: string
  slug: string | null
  title: string
  company: string
  location: string
  location_type: string | null
  clearance_required: string | null
  salary_min: number | null
  salary_max: number | null
  posted_at: string
  similarity: number
}

const props = defineProps<{
  jobId: string
}>()

const { formatSalary } = useJobs()

const { data, pending, error } = useLazyFetch<{ similar: SimilarJob[]; total: number }>(
  () => `/api/jobs/${props.jobId}/similar`,
  {
    query: { limit: 5 },
    watch: [() => props.jobId],
    default: () => ({ similar: [], total: 0 }),
  }
)

const similarJobs = computed(() => data.value?.similar || [])
const hasSimilarJobs = computed(() => similarJobs.value.length > 0)

const formatLocationBadge = (job: SimilarJob) => {
  if (job.location_type === 'Remote') return 'Remote'
  if (job.location_type === 'OCONUS') return 'OCONUS'
  return null
}
</script>

<template>
  <Card v-if="hasSimilarJobs || pending" class="border-none bg-sidebar overflow-hidden">
    <CardHeader class="px-4 py-3 border-b border-border/30">
      <CardTitle class="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Similar Jobs
      </CardTitle>
    </CardHeader>
    <CardContent class="p-4">
      <!-- Loading -->
      <div v-if="pending" class="space-y-3">
        <div v-for="i in 3" :key="i" class="p-2 -mx-2">
          <Skeleton class="h-3.5 w-3/4 mb-1.5" />
          <Skeleton class="h-3 w-1/2 mb-1.5" />
          <div class="flex items-center gap-2 mt-1">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-4 w-14" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <p v-else-if="error" class="text-xs text-muted-foreground">
        Unable to load similar jobs
      </p>

      <!-- Results -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="job in similarJobs"
          :key="job.id"
          :to="getJobUrl(job.slug || job.id)"
          class="block group"
        >
          <div class="p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors">
            <p class="text-xs font-medium text-foreground group-hover:text-primary line-clamp-1">
              {{ job.title }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ job.company }}
            </p>
            <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span v-if="job.salary_min || job.salary_max">
                {{ formatSalary(job.salary_min, job.salary_max) }}
              </span>
              <Badge 
                v-if="formatLocationBadge(job)" 
                :variant="job.location_type === 'OCONUS' ? 'oconus' : 'soft'"
                :class="job.location_type === 'Remote' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : ''"
              >
                {{ formatLocationBadge(job) }}
              </Badge>
            </div>
          </div>
        </NuxtLink>
      </div>
    </CardContent>
  </Card>
</template>
