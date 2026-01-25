<!--
  @file Search result item with borderless-until-hover style
  @description Flat result row matching homepage MOS results style
-->

<script setup lang="ts">
import type { SearchResult } from '@/app/types/search.types'
import { getJobUrl } from '@/app/lib/utils'

const props = defineProps<{
  result: SearchResult
  mosCode?: string
}>()

const jobLink = computed(() => {
  const path = getJobUrl(props.result.slug || props.result.job_id)
  if (props.mosCode) {
    return { path, query: { mos: props.mosCode } }
  }
  return path
})

const displaySalary = computed(() => {
  const min = props.result.salary_min
  const max = props.result.salary_max
  if (!min && !max) return null
  
  const formatNum = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`
  
  if (min && max && min !== max) return `${formatNum(min)} – ${formatNum(max)}`
  return formatNum(min || max || 0)
})

const mosMatchLine = computed(() => {
  if (!props.result.mos_matches?.length) return null
  return props.result.mos_matches
    .slice(0, 3)
    .map(m => m.mos_code)
    .join(' · ')
})

const primaryMatch = computed(() => props.result.mos_matches?.[0])

const matchStrengthLabel = computed(() => {
  if (!primaryMatch.value) return null
  const labels: Record<string, string> = {
    STRONG: 'Strong match',
    MEDIUM: 'Good match',
    WEAK: 'Potential match'
  }
  return labels[primaryMatch.value.match_strength] || null
})

const companyLink = computed(() => 
  props.result.company_slug ? `/companies/${props.result.company_slug}` : null
)

// Theater badge variant with fallback
const theaterVariants = ['centcom', 'eucom', 'indopacom', 'africom', 'southcom'] as const
type TheaterVariant = typeof theaterVariants[number]

const theaterBadgeVariant = computed((): TheaterVariant | 'oconus' => {
  const theater = props.result.theater
  if (!theater) return 'oconus'
  const variant = theater.toLowerCase() as TheaterVariant
  return theaterVariants.includes(variant) ? variant : 'oconus'
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
          {{ result.title }}
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
          {{ result.company }}
        </NuxtLink>
        <span v-else class="text-foreground font-medium">{{ result.company }}</span>
        <span class="text-muted-foreground/50">·</span>
        <span class="text-muted-foreground">{{ result.location }}</span>
      </div>

      <!-- Snippet/Summary -->
      <p v-if="result.snippet" class="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {{ result.snippet }}
      </p>

      <!-- Badges row -->
      <div class="flex flex-wrap items-center gap-2">
        <Badge 
          v-if="result.theater" 
          :variant="theaterBadgeVariant"
        >
          {{ result.theater }}
        </Badge>
        <Badge 
          v-else-if="result.location_type === 'Remote'" 
          variant="soft"
          class="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        >
          Remote
        </Badge>
        <Badge v-if="result.clearance_required" variant="soft">
          {{ result.clearance_required }}
        </Badge>
        
        <!-- MOS Match indicator -->
        <span v-if="primaryMatch" class="text-xs text-muted-foreground ml-auto">
          <span class="text-primary font-medium">{{ matchStrengthLabel }}</span> 
          for <span class="font-mono">{{ primaryMatch.mos_code }}</span>
        </span>
      </div>
    </article>
  </NuxtLink>
</template>
