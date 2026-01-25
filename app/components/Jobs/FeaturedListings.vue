<!--
  @file FeaturedListings.vue
  @description Sidebar featured listings — Card-based layout consistent with MosJobCard
  @usage <FeaturedListings />
-->

<script setup lang="ts">
import type { JobWithMeta } from '@/app/types/app.types'
import { getJobUrl } from '@/app/lib/utils'

const logger = useLogger('FeaturedListings')
const { fetchFeaturedListings, incrementListingImpression, incrementListingClick } = useJobs()

const jobs = ref<JobWithMeta[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  logger.info('FeaturedListings: Loading featured listings')
  try {
    const { data, error: fetchError } = await fetchFeaturedListings(12)

    if (fetchError) {
      error.value = fetchError
      logger.error({ error: fetchError }, 'FeaturedListings: Failed to load featured listings')
    } else if (data) {
      jobs.value = data
      logger.info({ count: data.length }, 'FeaturedListings: Featured listings loaded successfully')
      
      // Track impressions for all visible listings (non-blocking)
      data.forEach(job => {
        if (job.listing_id) {
          incrementListingImpression(job.listing_id)
        }
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    error.value = msg
    logger.error({ error: msg }, 'FeaturedListings: Exception during load')
  } finally {
    loading.value = false
  }
})

// Track click when user navigates to job
const handleClick = (job: JobWithMeta) => {
  if (job.listing_id) {
    logger.info({ listing_id: job.listing_id, job_id: job.id }, 'Featured listing clicked')
    incrementListingClick(job.listing_id)
  }
}

// Computed properties based on actual is_pinned status
const pinnedJobs = computed<JobWithMeta[]>(() => jobs.value.filter(job => job.is_pinned))
const unpinnedJobs = computed<JobWithMeta[]>(() => jobs.value.filter(job => !job.is_pinned))
</script>

<template>
  <!-- Only render when we have featured listings -->
  <section
    v-if="jobs.length > 0"
    aria-labelledby="featured-jobs-heading"
    aria-live="polite"
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 id="featured-jobs-heading" class="text-xl font-semibold flex items-center gap-2">
          <Icon name="mdi:star-circle-outline" class="w-5 h-5 text-primary" />
          Featured Listings
        </h2>
        <Button variant="ghost" size="sm" as-child class="h-8">
          <NuxtLink to="/advertise">
            Sponsor a Listing
          </NuxtLink>
        </Button>
      </div>
      <Badge variant="secondary" class="text-xs">Featured</Badge>
    </div>

    <!-- Error -->
    <Alert v-if="error" variant="destructive" class="my-2">
      <AlertTitle>Error Loading Featured Jobs</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 gap-4">
      <!-- Pinned listings (first 2) - Card style with layout matching unpinned -->
      <NuxtLink
        v-for="(job, index) in pinnedJobs"
        :key="job.id"
        :to="getJobUrl(job.slug || job.id)"
        class="block group"
        @click="handleClick(job)"
      >
        <Card 
          class="hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col bg-primary/5 border-primary/20"
        >
          <CardContent class="px-4 py-4">
            <article class="space-y-2">
              <!-- Title row -->
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {{ job.title }}
                </h3>
                <div class="flex items-center gap-3 shrink-0">
                  <span v-if="job.formatted_salary" class="text-sm font-medium text-muted-foreground">
                    {{ job.formatted_salary }}
                  </span>
                  <Icon
                    name="mdi:pin"
                    class="w-4 h-4 text-primary rotate-45"
                    aria-label="Pinned listing"
                  />
                </div>
              </div>
              
              <!-- Company & Location row -->
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span class="text-foreground font-medium">{{ job.company }}</span>
                <span class="text-muted-foreground/50">·</span>
                <span class="text-muted-foreground">{{ job.location || 'Location Not Specified' }}</span>
              </div>

              <!-- Badges row -->
              <div class="flex flex-wrap items-center gap-2">
                <Badge 
                  v-if="job.theater" 
                  :variant="(['centcom', 'eucom', 'indopacom', 'africom', 'southcom'] as const).includes(job.theater?.toLowerCase() as any) ? job.theater?.toLowerCase() as any : 'oconus'"
                >
                  {{ job.theater }}
                </Badge>
                <Badge 
                  v-else-if="job.location_type === 'Remote'" 
                  variant="soft"
                  class="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                >
                  Remote
                </Badge>
                <Badge v-if="job.clearance_required" variant="soft">
                  {{ job.clearance_required }}
                </Badge>
                
                <span v-if="job.formatted_date" class="text-xs text-muted-foreground ml-auto">
                  {{ job.formatted_date }}
                </span>
              </div>
            </article>
          </CardContent>
        </Card>
      </NuxtLink>

      <!-- Unpinned listings (rest) - Flat borderless style matching SearchResultItem -->
      <NuxtLink
        v-for="job in unpinnedJobs"
        :key="job.id"
        :to="getJobUrl(job.slug || job.id)"
        class="block group relative px-4 py-4 border border-transparent transition-all duration-150 hover:bg-muted/40 hover:border-border/60"
        @click="handleClick(job)"
      >
        <!-- Left accent bar on hover -->
        <div class="absolute left-0 top-3 bottom-3 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <article class="space-y-2">
          <!-- Title row -->
          <div class="flex items-start justify-between gap-4">
            <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
              {{ job.title }}
            </h3>
            <span v-if="job.formatted_salary" class="text-sm font-medium text-muted-foreground shrink-0">
              {{ job.formatted_salary }}
            </span>
          </div>
          
          <!-- Company & Location row -->
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span class="text-foreground font-medium">{{ job.company }}</span>
            <span class="text-muted-foreground/50">·</span>
            <span class="text-muted-foreground">{{ job.location || 'Location Not Specified' }}</span>
          </div>

          <!-- Badges row -->
          <div class="flex flex-wrap items-center gap-2">
            <Badge 
              v-if="job.theater" 
              :variant="(['centcom', 'eucom', 'indopacom', 'africom', 'southcom'] as const).includes(job.theater?.toLowerCase() as any) ? job.theater?.toLowerCase() as any : 'oconus'"
            >
              {{ job.theater }}
            </Badge>
            <Badge 
              v-else-if="job.location_type === 'Remote'" 
              variant="soft"
              class="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              Remote
            </Badge>
            <Badge v-if="job.clearance_required" variant="soft">
              {{ job.clearance_required }}
            </Badge>
            
            <span v-if="job.formatted_date" class="text-xs text-muted-foreground ml-auto">
              {{ job.formatted_date }}
            </span>
          </div>
        </article>
      </NuxtLink>
    </div>
  </section>
</template>
