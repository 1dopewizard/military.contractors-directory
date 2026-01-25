<!--
  @file Recommended jobs list component
  @usage <RecommendedJobsList />
  @description Displays recommended jobs based on user's viewed MOS history
-->

<script setup lang="ts">
import type { JobWithMeta } from '@/app/types/app.types'
import JobCardSkeleton from '@/app/components/Jobs/JobCardSkeleton.vue'
import { getJobUrl } from '@/app/lib/utils'

const { isAuthenticated, isAuthReady } = useAuth()
const { userId } = useUserProfile()
const { formatSalary, formatDate } = useJobs()

const recommendedJobs = ref<JobWithMeta[]>([])
const loading = ref(true)

const loadRecommendedJobs = async () => {
  try {
    // Fetch recommended jobs via API
    const response = await $fetch<{ jobs: any[]; source: string }>('/api/jobs/recommended', {
      query: {
        limit: 6,
      },
    })
    
    recommendedJobs.value = transformJobs(response.jobs || [])
  } catch (error) {
    console.error('Failed to load recommended jobs:', error)
    // Fallback to recent jobs
    try {
      const fallbackResponse = await $fetch<{ jobs: any[] }>('/api/jobs/search', {
        query: { limit: 6, sort: 'date' },
      })
      recommendedJobs.value = transformJobs(fallbackResponse.jobs || [])
    } catch {
      recommendedJobs.value = []
    }
  } finally {
    loading.value = false
  }
}

const transformJobs = (jobs: any[]): JobWithMeta[] => {
  return jobs.map((job: any) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    company_id: job.company_id,
    location: job.location,
    location_type: job.location_type,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    currency: job.currency || 'USD',
    formatted_salary: formatSalary(job.salary_min, job.salary_max, job.currency || 'USD'),
    clearance_required: job.clearance_required,
    description: job.match_reason || job.snippet || '',
    snippet: job.snippet,
    requirements: job.requirements || [],
    posted_at: job.posted_at,
    created_at: job.created_at,
    updated_at: job.updated_at,
    expires_at: job.expires_at,
    formatted_date: formatDate(job.posted_at || job.created_at),
    featured: job.featured || false,
    slug: job.slug,
    is_oconus: job.is_oconus
  }))
}

// Watch for auth state changes and reload recommendations
watch(
  [isAuthReady, userId],
  ([ready]) => {
    if (ready) {
      loadRecommendedJobs()
    }
  },
  { immediate: true }
)
</script>

<template>
  <section
    aria-labelledby="recommended-jobs-heading"
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 id="recommended-jobs-heading" class="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Icon name="mdi:star-face" class="w-5 h-5 text-primary" />
          Recommended for You
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          Based on your profile and activity
        </p>
      </div>
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/jobs" class="flex items-center gap-1 text-sm">
          View All
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading state -->
    <JobCardSkeleton v-if="loading" :count="4" />

    <!-- Empty state -->
    <Empty v-else-if="!recommendedJobs.length">
      <EmptyMedia variant="icon">
        <Icon name="mdi:briefcase-outline" class="size-5" />
      </EmptyMedia>
      <EmptyContent>
        <EmptyTitle>No recommended jobs available</EmptyTitle>
        <EmptyDescription>Complete your profile to get better matches</EmptyDescription>
      </EmptyContent>
    </Empty>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink
        v-for="job in recommendedJobs"
        :key="job.id"
        :to="getJobUrl(job.slug || job.id)"
        class="block group"
      >
        <Card 
          class="h-full hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card overflow-hidden flex flex-col border-border/50"
        >
          <CardContent class="p-5 flex flex-col h-full gap-4">
            <!-- Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 min-w-0 w-full">
                <div class="flex items-center justify-between gap-2 w-full">
                  <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate pr-2">
                    {{ job.title }}
                  </h3>
                </div>
                
                <!-- Metadata Row: Company • Location [Spacer] Salary -->
                <div class="flex items-center justify-between gap-2 text-sm text-muted-foreground w-full">
                  <div class="flex items-center gap-2 truncate">
                    <span class="flex items-center gap-1.5 font-medium text-foreground shrink-0">
                      <Icon name="mdi:domain" class="w-3.5 h-3.5 opacity-70" />
                      {{ job.company }}
                    </span>
                    <span class="text-border">•</span>
                    <span class="flex items-center gap-1.5 truncate">
                      {{ job.location || 'Location Not Specified' }}
                    </span>
                  </div>

                   <span class="font-mono font-medium text-foreground shrink-0">
                     {{ job.formatted_salary }}
                   </span>
                </div>
              </div>
            </div>

            <!-- Match Explanation -->
            <div v-if="job.description" class="text-xs text-muted-foreground/90 bg-muted/30 p-2.5 rounded-md border-l-2 border-primary/30 italic">
              <span class="font-semibold not-italic text-[10px] text-primary block mb-0.5 uppercase tracking-wider">Recommendation</span>
              {{ job.description }}
            </div>

            <!-- Footer: Badges (Left) & Date (Right) -->
            <div class="flex items-end justify-between pt-3 border-t border-border/50 mt-auto gap-2">
              <div class="flex flex-wrap gap-2">
                <Badge 
                  v-if="job.location_type" 
                  :variant="job.is_oconus || job.location_type === 'OCONUS' ? 'oconus' : 'soft'" 
                  :class="job.location_type === 'Remote' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : ''"
                >
                  {{ job.location_type }}
                </Badge>
                <Badge v-if="job.clearance_required" variant="soft" class="">
                  {{ job.clearance_required }}
                </Badge>
              </div>

              <span v-if="job.formatted_date" class="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap shrink-0">
                {{ job.formatted_date }}
              </span>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>

    <!-- Footer -->
    <div v-if="recommendedJobs.length" class="pt-4 space-y-4">
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
