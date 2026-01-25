<!--
  @file Job result item matching SearchResultItem style
  @description Borderless-until-hover style for company pages and browse
-->

<script setup lang="ts">
import type { JobWithMeta } from '@/app/types/app.types'
import { getJobUrl } from '@/app/lib/utils'

const props = defineProps<{
  job: JobWithMeta
  companySlug?: string
}>()

const jobLink = computed(() => getJobUrl(props.job.slug || props.job.id))

const companyLink = computed(() => 
  props.companySlug ? `/companies/${props.companySlug}` : null
)

const displaySalary = computed(() => {
  const min = props.job.salary_min
  const max = props.job.salary_max
  if (!min && !max) return null
  
  const formatNum = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`
  
  if (min && max && min !== max) return `${formatNum(min)} – ${formatNum(max)}`
  return formatNum(min || max || 0)
})

// Theater badge variant with fallback
const theaterVariants = ['centcom', 'eucom', 'indopacom', 'africom', 'southcom'] as const
type TheaterVariant = typeof theaterVariants[number]

const theaterBadgeVariant = computed((): TheaterVariant | 'oconus' => {
  const theater = props.job.theater
  if (!theater) return 'oconus'
  const variant = theater.toLowerCase() as TheaterVariant
  return theaterVariants.includes(variant) ? variant : 'oconus'
})

const locationDisplay = computed(() => {
  if (props.job.location) return props.job.location
  if (props.job.is_oconus) return 'OCONUS'
  if (props.job.location_type === 'Remote') return 'Remote'
  return null
})
</script>

<template>
  <NuxtLink 
    :to="jobLink" 
    class="block group relative px-4 py-4 border border-transparent transition-all duration-150 hover:bg-muted/40 hover:border-border/60"
  >
    <!-- Left accent bar on hover -->
    <div class="absolute left-0 top-3 bottom-3 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <article class="space-y-2">
      <!-- Title row -->
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
          {{ job.title }}
        </h3>
        <span v-if="displaySalary" class="text-sm font-medium text-muted-foreground shrink-0">
          {{ displaySalary }}
        </span>
      </div>
      
      <!-- Company & Location row -->
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <NuxtLink 
          v-if="companyLink"
          :to="companyLink"
          class="text-foreground font-medium hover:text-primary hover:underline transition-colors"
          @click.stop
        >
          {{ job.company }}
        </NuxtLink>
        <span v-else class="text-foreground font-medium">{{ job.company }}</span>
        <template v-if="locationDisplay">
          <span class="text-muted-foreground/50">·</span>
          <span class="text-muted-foreground">{{ locationDisplay }}</span>
        </template>
      </div>

      <!-- Badges row -->
      <div class="flex flex-wrap items-center gap-2">
        <Badge 
          v-if="job.theater" 
          :variant="theaterBadgeVariant"
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
        <Badge 
          v-else-if="job.is_oconus" 
          variant="oconus"
        >
          OCONUS
        </Badge>
        <Badge v-if="job.clearance_required" variant="soft">
          {{ job.clearance_required }}
        </Badge>
      </div>
    </article>
  </NuxtLink>
</template>
