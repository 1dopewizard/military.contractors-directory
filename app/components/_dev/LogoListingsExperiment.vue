<!--
  @file LogoListingsExperiment component for dev page
  @usage <LogoListingsExperiment />
  @description Experiment with logo placement in job listings using JobCard style
-->

<script setup lang="ts">
import type { JobWithMeta } from '@/app/types/app.types'
import { getJobUrl } from '@/app/lib/utils'

const logger = useLogger('LogoListingsExperiment')
const { fetchLatestJobs } = useJobs()

// Component state
const jobs = ref<JobWithMeta[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Logo mapping - prefer SVG, fallback to PNG
const getCompanyLogo = (company: string): { src: string; type: 'png' | 'svg' } | null => {
  const companyLower = company.toLowerCase()
  
  // CACI - prefer SVG, fallback to PNG
  if (companyLower.includes('caci')) {
    return { src: '/logos/companies/caci.png', type: 'png' }
  }
  
  // Lockheed Martin - prefer SVG
  if (companyLower.includes('lockheed')) {
    return { src: '/logos/companies/lockheed-martin.svg', type: 'svg' }
  }
  
  // V2X - prefer SVG, fallback to JPG
  if (companyLower.includes('v2x')) {
    return { src: '/logos/companies/v2x.svg', type: 'svg' }
  }
  
  return null
}

/**
 * Load latest jobs on component mount
 */
onMounted(async () => {
  logger.info('LogoListingsExperiment: Loading jobs for logo experiment')
  
  const { data, error: fetchError } = await fetchLatestJobs(10)
  
  if (fetchError) {
    error.value = fetchError
    logger.error({ error: fetchError }, 'LogoListingsExperiment: Failed to load jobs')
  } else if (data) {
    jobs.value = data
    logger.info({ count: data.length }, 'LogoListingsExperiment: Jobs loaded successfully')
  }
  
  loading.value = false
})

// Hardcoded demo priority badges
const getPriorityBadge = (job: JobWithMeta): 'urgent' | 'new' | null => {
  if (!job.featured) return null
  const hash = job.id.charCodeAt(0) % 2
  if (hash === 0) return 'urgent'
  return 'new'
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <section class="space-y-4 pt-4">
      <Badge variant="ghost" class="w-fit text-sm px-3 py-1">
        <Icon name="mdi:code-tags" class="w-3.5 h-3.5 mr-1.5" />
        Development
      </Badge>
      <div class="space-y-2">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Logo Placement Experiment
        </h1>
        <p class="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Testing logo placement in job listings. Using CACI (PNG) and Lockheed Martin (SVG) logos.
        </p>
      </div>
    </section>

    <!-- Section Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">
        Latest Opportunities
      </h2>
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/jobs" class="flex items-center gap-1 text-sm">
          View All
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-20 w-full" />
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive" class="my-4">
      <AlertTitle>Error Loading Jobs</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Empty State -->
    <div v-else-if="!jobs.length" class="text-center py-12 text-muted-foreground">
      <Icon name="mdi:briefcase-outline" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p class="text-sm">No jobs available. Check back later for new opportunities.</p>
    </div>

    <!-- Jobs List with Logos -->
    <div v-else class="space-y-4">
      <NuxtLink 
        v-for="job in jobs" 
        :key="job.id"
        :to="getJobUrl(job.slug || job.id)"
        class="block group"
      >
        <Card 
          class="border-border/50 transition-all duration-200 hover:shadow-md hover:border-primary/30 overflow-hidden bg-card hover:bg-muted/10"
        >
          <CardContent class="p-5">
            <div class="flex items-start gap-4">
              <!-- Logo Section -->
              <div class="shrink-0 w-12 h-12 flex items-center justify-center border border-border rounded-md bg-background p-2">
                <img
                  v-if="getCompanyLogo(job.company)"
                  :src="getCompanyLogo(job.company)!.src"
                  :alt="`${job.company} logo`"
                  class="max-w-full max-h-full object-contain"
                  :class="{
                    'opacity-90': getCompanyLogo(job.company)?.type === 'png',
                    'opacity-100': getCompanyLogo(job.company)?.type === 'svg'
                  }"
                />
                <Icon
                  v-else
                  name="mdi:office-building-outline"
                  class="w-6 h-6 text-muted-foreground"
                />
              </div>

              <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-4">
                <!-- Left column: title, company, location -->
                <div class="flex-1 min-w-0 space-y-2">
                  <!-- Title with Badges -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {{ job.title }}
                      </h3>
                      <div class="flex items-center gap-1.5">
                        <PriorityBadge :priority="getPriorityBadge(job)" />
                        <Badge v-if="job.featured" variant="secondary" class="text-xs h-5 px-1.5">
                          Featured
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <!-- Metadata Row -->
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                    <span class="font-medium text-foreground flex items-center gap-1.5">
                      <Icon name="mdi:domain" class="w-3.5 h-3.5 opacity-70" />
                      {{ job.company }}
                    </span>
                    
                    <span class="hidden sm:inline text-border">|</span>
                    
                    <span class="flex items-center gap-1.5">
                      <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5 opacity-70" />
                      {{ job.location }}
                    </span>
                    
                    <template v-if="job.location_type">
                      <span class="hidden sm:inline text-border">|</span>
                      <span class="text-xs px-1.5 py-0.5 bg-muted rounded font-medium uppercase tracking-wide">
                        {{ job.location_type }}
                      </span>
                    </template>
                  </div>

                  <!-- Logo type indicator (for dev purposes) -->
                  <div v-if="getCompanyLogo(job.company)" class="flex items-center gap-1.5 text-xs mt-1 text-muted-foreground">
                    <Icon name="mdi:information-outline" class="w-3 h-3" />
                    <span>Logo: {{ getCompanyLogo(job.company)?.type.toUpperCase() }}</span>
                  </div>
                </div>

                <!-- Right column: salary + badges -->
                <div class="mt-2 sm:mt-0 sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-1">
                  <!-- Salary -->
                  <div v-if="job.formatted_salary" class="text-sm font-medium text-foreground">
                    {{ job.formatted_salary }}
                  </div>
                  
                  <!-- Badges: Clearance -->
                  <div class="flex flex-wrap items-center sm:justify-end gap-2">
                    <Badge 
                      v-if="job.clearance_required" 
                      variant="ghost"
                      class="h-5 px-1.5 text-[10px] font-medium bg-background"
                    >
                      <Icon name="mdi:shield-check" class="w-3 h-3 mr-1 text-primary/70" />
                      {{ job.clearance_required }}
                    </Badge>
                    
                    <!-- Posted Date -->
                    <span v-if="job.formatted_date" class="text-[10px] text-muted-foreground tabular-nums">
                      {{ job.formatted_date }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
