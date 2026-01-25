<!--
  @file Unified job card component for displaying job listings
  @usage <JobCard :job="job" />
  @description Flexible job card supporting featured, match strength, and pin indicators
-->

<script setup lang="ts">
import { computed } from 'vue'

import type { JobWithMeta } from '@/app/types/app.types'
import type { JobWithMosMatch } from '@/app/types/mos.types'
import { getJobUrl } from '@/app/lib/utils'

type MatchStrength = 'STRONG' | 'MEDIUM' | 'WEAK'

// Accept either JobWithMeta or JobWithMosMatch
type JobProp = (JobWithMeta | JobWithMosMatch) & { ranking_score?: number }

const props = withDefaults(defineProps<{
  job: JobProp
  compact?: boolean
  showBadges?: boolean
  hideSalary?: boolean
  showPinIcon?: boolean
  isPinned?: boolean
  priorityBackground?: boolean
  mosCode?: string
  matchStrength?: MatchStrength
  matchReason?: string
  showMatchDetails?: boolean
  rankingScore?: number
  rank?: number
}>(), {
  compact: false,
  showBadges: false,
  hideSalary: false,
  showPinIcon: false,
  isPinned: false,
  priorityBackground: false,
  showMatchDetails: false
})

// Computed ranking score (prop takes precedence)
const effectiveRankingScore = computed(() => {
  return props.rankingScore ?? props.job.ranking_score
})

const logger = useLogger('JobCard')

// Match strength badge configuration
const getMatchBadge = (strength: MatchStrength) => {
  const configs = {
    STRONG: {
      label: 'Strong Match',
      class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0',
      icon: 'mdi:check-circle'
    },
    MEDIUM: {
      label: 'Good Match',
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0',
      icon: 'mdi:check'
    },
    WEAK: {
      label: 'Potential Match',
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-0',
      icon: 'mdi:circle-outline'
    }
  }
  return configs[strength] || configs.MEDIUM
}

const effectiveMatchStrength = computed(() => {
  if (props.matchStrength) return props.matchStrength
  return 'match_strength' in props.job ? props.job.match_strength : undefined
})

const matchBadge = computed(() => {
  return effectiveMatchStrength.value ? getMatchBadge(effectiveMatchStrength.value) : null
})

const effectiveMatchReason = computed(() => {
  if (props.matchReason) return props.matchReason
  return 'mapping_reason' in props.job ? props.job.mapping_reason : ''
})

// Truncate match reason for display
const truncatedReason = computed(() => {
  if (!props.showMatchDetails || !effectiveMatchReason.value) return ''
  const maxLength = 150
  if (effectiveMatchReason.value.length <= maxLength) {
    return effectiveMatchReason.value
  }
  return effectiveMatchReason.value.slice(0, maxLength) + '...'
})

const jobLink = computed(() => {
  const slug = 'slug' in props.job ? props.job.slug : undefined
  const path = getJobUrl(slug || props.job.id)
  if (props.mosCode) {
    return { path, query: { mos: props.mosCode } }
  }
  return path
})

// Format salary from min/max if formatted_salary isn't provided
const displaySalary = computed(() => {
  // Use pre-formatted salary if available
  if (props.job.formatted_salary) {
    return props.job.formatted_salary
  }
  
  // Otherwise compute from salary_min/salary_max
  const min = props.job.salary_min
  const max = props.job.salary_max
  
  if (!min && !max) return null
  
  const formatNum = (n: number) => {
    if (n >= 1000) {
      return `$${Math.round(n / 1000)}K`
    }
    return `$${n.toLocaleString()}`
  }
  
  if (min && max && min !== max) {
    return `${formatNum(min)} - ${formatNum(max)}`
  }
  
  return formatNum(min || max || 0)
})

// Card styling based on priority
const cardClass = computed(() => {
  const classes = ['h-full hover:border-primary/40 transition-all duration-200 overflow-hidden flex flex-col']
  
  if (props.priorityBackground) {
    classes.push('bg-primary/5 border-primary/20')
  } else if (props.isPinned) {
    classes.push('border-primary/20')
  } else {
    classes.push('bg-card border-border/40')
  }
  
  return classes.join(' ')
})

// Company link - check for company_slug in job data
const companyLink = computed(() => {
  const slug = 'company_slug' in props.job ? props.job.company_slug : null
  return slug ? `/companies/${slug}` : null
})

// Theater badge variant with fallback
const theaterVariants = ['centcom', 'eucom', 'indopacom', 'africom', 'southcom'] as const
type TheaterVariant = typeof theaterVariants[number]

const theaterBadgeVariant = computed((): TheaterVariant | 'oconus' => {
  const theater = 'theater' in props.job ? props.job.theater : null
  if (!theater) return 'oconus'
  const variant = theater.toLowerCase() as TheaterVariant
  return theaterVariants.includes(variant) ? variant : 'oconus'
})
</script>

<template>
  <NuxtLink :to="jobLink" class="block group h-full">
    <Card :class="cardClass">
      <CardContent class="p-4 sm:p-5 flex flex-col h-full gap-3 sm:gap-4">
        <!-- Header -->
        <div class="flex flex-col gap-2">
          <!-- Title & Badges Row -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div class="flex items-start gap-3">
              <!-- Rank indicator -->
              <span 
                v-if="rank" 
                class="flex items-center justify-center w-7 h-7 bg-muted/50 text-muted-foreground text-sm font-mono font-bold shrink-0 border border-border/50"
                :title="`Rank #${rank}${effectiveRankingScore ? ` • Score: ${(effectiveRankingScore * 100).toFixed(0)}%` : ''}`"
              >
                {{ rank }}
              </span>
              <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 sm:pr-2">
                {{ job.title }}
              </h3>
            </div>
            
            <!-- Badge / Pin Row -->
            <div class="flex items-center gap-2 shrink-0 sm:ml-auto">
              <!-- Match Strength Badge (for MOS pages) -->
              <Badge
                v-if="matchBadge"
                :class="matchBadge.class"
                class="text-[10px] px-2 py-0.5 h-5 font-medium"
              >
                <Icon :name="matchBadge.icon" class="w-3 h-3 mr-1" />
                {{ matchBadge.label }}
              </Badge>
              <!-- Featured Badge (when no match badge) -->
              <Badge v-else-if="job.featured" variant="default" class="text-[10px] px-1.5 h-5 cursor-default hover:bg-inherit hover:text-inherit pointer-events-none">
                Featured
              </Badge>
              <!-- Pin Icon -->
              <Icon 
                v-if="showPinIcon || isPinned"
                name="mdi:pin" 
                class="w-4 h-4 text-primary shrink-0 rotate-45" 
                aria-label="Pinned listing"
              />
            </div>
          </div>

          <!-- Metadata Row: Company • Location • Salary -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm text-muted-foreground">
            <div class="flex items-center gap-2 min-w-0">
              <span class="flex items-center gap-1.5 font-medium text-foreground shrink-0">
                <Icon name="mdi:domain" class="w-3.5 h-3.5 opacity-70" />
                <NuxtLink
                  v-if="companyLink"
                  :to="companyLink"
                  class="truncate hover:text-primary hover:underline transition-colors"
                  @click.stop
                >
                  {{ job.company }}
                </NuxtLink>
                <span v-else class="truncate">{{ job.company }}</span>
              </span>
              <span class="text-border shrink-0">•</span>
              <span class="flex items-center gap-1.5 truncate">
                {{ job.location }}
              </span>
            </div>
            
            <!-- Salary -->
            <span v-if="!hideSalary && displaySalary" class="font-medium text-foreground whitespace-nowrap shrink-0 sm:ml-2">
              {{ displaySalary }}
            </span>
            <span v-else-if="hideSalary" class="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap shrink-0 sm:ml-2">
              <Icon name="mdi:lock-outline" class="w-3 h-3" /> Comp. Hidden
            </span>
          </div>
        </div>

        <!-- Match Explanation (for MOS pages when details shown) -->
        <div v-if="truncatedReason" class="text-xs text-muted-foreground/90 bg-muted/30 p-2 sm:p-3 rounded-md border-l-2 border-primary/30 italic">
          <span class="font-semibold not-italic text-[10px] text-primary block mb-0.5 uppercase tracking-wider">Match Analysis</span>
          <span class="break-words">{{ truncatedReason }}</span>
        </div>

        <!-- Footer: Badges (Left) & Date (Right) -->
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between pt-3 border-t border-border/30 mt-auto gap-2">
          <div class="flex flex-wrap gap-1.5">
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
            <Badge v-if="job.clearance_required" variant="soft" class="">
              {{ job.clearance_required }}
            </Badge>
          </div>

          <span v-if="job.formatted_date" class="text-[10px] text-muted-foreground/80 tabular-nums whitespace-nowrap shrink-0 sm:ml-auto">
            {{ job.formatted_date }}
          </span>
        </div>
      </CardContent>
    </Card>
  </NuxtLink>
</template>
