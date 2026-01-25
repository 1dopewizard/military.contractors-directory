<!--
  @file Featured job card component
  @usage <FeaturedJobCard :context="{ mosCode: '25B' }" />
  @description Shows a featured job from the jobs table with fair rotation.
               Links to internal job page instead of external URL.
-->

<script setup lang="ts">
import type { AdContext } from '@/app/composables/useAds'

const props = defineProps<{
  /** Context for contextual job matching (MOS code, location type, clearance) */
  context?: AdContext
}>()

const logger = useLogger('FeaturedJobCard')

interface FeaturedJob {
  id: string
  slug: string
  title: string
  company: string
  location: string
  location_type: string | null
  clearance_required: string | null
  salary_min: number | null
  salary_max: number | null
  snippet: string | null
  description: string
  listingId?: string
}

const featuredJob = ref<FeaturedJob | null>(null)

onMounted(async () => {
  try {
    // Fetch featured jobs from API
    const response = await $fetch<{ jobs: any[] }>('/api/jobs/featured', {
      query: { limit: 1 },
    })

    if (response.jobs && response.jobs.length > 0) {
      const job = response.jobs[0]
      if (!job) return
      
      featuredJob.value = {
        id: job.id,
        slug: job.slug || job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        location_type: job.location_type || null,
        clearance_required: job.clearance_required || null,
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        snippet: job.snippet || null,
        description: job.description,
        listingId: job.listing_id,
      }
      logger.debug({ jobId: job.id }, 'Featured job loaded')
      
      // Record impression (non-blocking)
      if (featuredJob.value.listingId) {
        $fetch('/api/jobs/featured/track', {
          method: 'POST',
          body: { listingId: featuredJob.value.listingId, eventType: 'impression' },
        }).catch(() => {})
      }
    }
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error fetching featured job')
  }
})

const formatSalary = (min: number | null, max: number | null) => {
  if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  if (max) return `Up to $${(max / 1000).toFixed(0)}k`
  return null
}

const handleClick = async () => {
  if (!featuredJob.value) return
  logger.info({ jobId: featuredJob.value.id, company: featuredJob.value.company }, 'Featured job click')
  
  // Record click (non-blocking)
  if (featuredJob.value.listingId) {
    $fetch('/api/jobs/featured/track', {
      method: 'POST',
      body: { listingId: featuredJob.value.listingId, eventType: 'click' },
    }).catch(() => {})
  }
}
</script>

<template>
  <!-- Only render when we have a featured job to show -->
  <div v-if="featuredJob">
    <!-- Featured label -->
    <div class="flex items-center gap-1.5 mb-2">
      <span class="text-[10px] font-medium uppercase tracking-widest text-primary/80">Featured</span>
    </div>
    
    <Card class="border-primary/50 overflow-hidden">
      <!-- Job card link -->
      <NuxtLink
        :to="`/jobs/${featuredJob.slug}`"
        class="block p-4 hover:bg-primary/[0.02] transition-colors group"
        @click="handleClick"
      >
        <!-- Job title -->
        <h4 class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
          {{ featuredJob.title }}
        </h4>
        
        <!-- Company -->
        <p class="text-xs font-medium text-muted-foreground mb-2">
          {{ featuredJob.company }}
        </p>
        
        <!-- Snippet -->
        <p class="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {{ featuredJob.snippet || featuredJob.description?.slice(0, 120) }}...
        </p>
        
        <!-- Key details -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-3">
          <MetaBadges
            :location="featuredJob.location"
            :location-type="featuredJob.location_type"
            :clearance="featuredJob.clearance_required"
          />
        </div>
        
        <!-- Salary & CTA -->
        <div class="flex items-center justify-between">
          <span v-if="formatSalary(featuredJob.salary_min, featuredJob.salary_max)" 
                class="text-sm font-medium text-muted-foreground">
            {{ formatSalary(featuredJob.salary_min, featuredJob.salary_max) }}
          </span>
          <span v-else class="text-sm text-muted-foreground/60">Salary not listed</span>
          <span class="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
            View Job
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
          </span>
        </div>
      </NuxtLink>
    </Card>
  </div>
</template>
