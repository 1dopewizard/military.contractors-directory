<!--
  @file Legacy featured job card component (deprecated)
  @deprecated Self-service ads replaced by employer intake flow
  @usage <LegacyFeaturedJobCard /> or <LegacyFeaturedJobCard :job="jobData" :is-preview="true" />
  @description DEPRECATED - Single featured job advertisement.
               The self-service featured jobs system has been replaced by
               the employer job intake flow with FeaturedJobCard pulling
               from the jobs table.
-->

<script setup lang="ts">
import type { FeaturedJob } from '@/app/types/ad.types'
import type { AdContext } from '@/app/composables/useAds'

const props = defineProps<{
  /** Optional job data for preview mode - skips fetch if provided */
  job?: Partial<FeaturedJob>
  /** Preview mode - disables tracking and link navigation */
  isPreview?: boolean
  /** Context for contextual ad matching (MOS code, location type, clearance) */
  context?: AdContext
}>()

const logger = useLogger('LegacyFeaturedJobCard')
const { fetchRandomFeaturedJob, recordJobImpression, recordJobClick } = useAds()

// Fetch job from Supabase (only if not in preview mode)
const fetchedJob = ref<FeaturedJob | null>(null)
const isLoading = ref(!props.job)

// Use provided job or fetched job
const currentJob = computed(() => props.job || fetchedJob.value)

onMounted(async () => {
  // Skip fetch if job is provided (preview mode)
  if (props.job) return

  const { data, error } = await fetchRandomFeaturedJob(props.context)
  
  if (error) {
    logger.error({ error }, 'Failed to fetch featured job')
  }
  
  if (data) {
    fetchedJob.value = data
    logger.debug({ jobId: data.id }, 'Featured job impression')
    // Record impression (non-blocking)
    recordJobImpression(data.id)
  }
  
  isLoading.value = false
})

// Track click (skip in preview mode)
const handleClick = (e: Event) => {
  if (props.isPreview) {
    e.preventDefault()
    return
  }
  if (!currentJob.value?.id) return
  logger.info({ jobId: currentJob.value.id, company: currentJob.value.company }, 'Featured job click')
  recordJobClick(currentJob.value.id)
}
</script>

<template>
  <div v-if="isPreview || currentJob">
    <!-- Featured label -->
    <div class="flex items-center gap-1.5 mb-2">
      <span class="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Featured</span>
    </div>
    
    <Card class="border-primary/80 overflow-hidden">
      <!-- Job card link -->
      <a 
        v-if="currentJob"
        :href="currentJob.apply_url"
        target="_blank"
        rel="noopener"
        class="block p-4 hover:bg-primary/[0.02] transition-colors group"
        @click="handleClick"
      >
        <!-- Job title -->
        <h4 class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
          {{ currentJob.title }}
        </h4>
        
        <!-- Company -->
        <p class="text-xs font-medium text-muted-foreground mb-2">
          {{ currentJob.company }}
        </p>
        
        <!-- Pitch / selling point -->
        <p class="text-xs text-muted-foreground leading-relaxed mb-3">
          {{ currentJob.pitch }}
        </p>
        
        <!-- Key details: Location, Type Badge, Clearance Badge -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-3">
          <MetaBadges
            :location="currentJob.location"
            :location-type="currentJob.location_type"
            :clearance="currentJob.clearance"
          />
        </div>
        
        <!-- Salary & CTA -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">{{ currentJob.salary }}</span>
          <span class="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
            Apply
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
          </span>
        </div>
      </a>
    </Card>
    
    <!-- Fine print -->
    <p class="text-[9px] text-muted-foreground/50 text-center mt-2">
      <NuxtLink to="/advertise" class="underline hover:text-muted-foreground">Promote a position</NuxtLink>
    </p>
  </div>
</template>

