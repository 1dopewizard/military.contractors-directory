<!--
  @file Community/SalaryReportCard.vue
  @description Display card for a single salary report with company, MOS, salary details, and helpful voting
  @usage <SalaryReportCard :report="salaryReport" @vote="handleVote" />
-->

<script setup lang="ts">
import type { EnrichedSalaryReport, ClearanceLevel, EmploymentType } from '@/app/types/community.types'

interface Props {
  /** The salary report to display */
  report: EnrichedSalaryReport
  /** Whether the current user has voted this report helpful */
  hasVoted?: boolean
  /** Whether voting is in progress */
  isVoting?: boolean
  /** Show compact view (less details) */
  compact?: boolean
}

interface Emits {
  (e: 'vote', reportId: string): void
  (e: 'removeVote', reportId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  hasVoted: false,
  isVoting: false,
  compact: false,
})

const emit = defineEmits<Emits>()

// Format salary to display string
const formattedSalary = computed(() => {
  const salary = props.report.baseSalary
  if (salary >= 1000) {
    return `$${Math.round(salary / 1000)}K`
  }
  return `$${salary.toLocaleString()}`
})

// Format signing bonus
const formattedBonus = computed(() => {
  if (!props.report.signingBonus) return null
  const bonus = props.report.signingBonus
  if (bonus >= 1000) {
    return `$${Math.round(bonus / 1000)}K`
  }
  return `$${bonus.toLocaleString()}`
})

// Clearance level display config
const clearanceBadge = computed(() => {
  const level = props.report.clearanceLevel as ClearanceLevel
  const configs: Record<ClearanceLevel, { label: string; class: string }> = {
    NONE: { label: 'No Clearance', class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
    PUBLIC_TRUST: { label: 'Public Trust', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    SECRET: { label: 'Secret', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    TOP_SECRET: { label: 'Top Secret', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    TS_SCI: { label: 'TS/SCI', class: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    TS_SCI_POLY: { label: 'TS/SCI + Poly', class: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  }
  return configs[level] || configs.NONE
})

// Employment type display
const employmentLabel = computed(() => {
  const labels: Record<EmploymentType, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    CONTRACT_TO_HIRE: 'Contract to Hire',
    INTERN: 'Intern',
  }
  return labels[props.report.employmentType] || props.report.employmentType
})

// Format time ago
const timeAgo = computed(() => {
  const now = Date.now()
  const diff = now - props.report.createdAt
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
})

// Handle vote toggle
const handleVoteClick = () => {
  if (props.hasVoted) {
    emit('removeVote', props.report._id)
  } else {
    emit('vote', props.report._id)
  }
}
</script>

<template>
  <article 
    class="group relative px-4 py-4 border border-border/30 bg-card/30 transition-all duration-150 hover:border-primary/30 hover:bg-card/50"
  >
    
    <div class="space-y-3">
      <!-- Header: MOS, Company, Salary -->
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <!-- MOS Code & Company -->
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5">
              {{ report.mosCode }}
            </span>
            <span class="text-muted-foreground/60">→</span>
            <NuxtLink
              v-if="report.companySlug"
              :to="`/companies/${report.companySlug}`"
              class="font-semibold text-foreground hover:text-primary hover:underline transition-colors truncate"
            >
              {{ report.companyName }}
            </NuxtLink>
            <span v-else class="font-semibold text-foreground truncate">
              {{ report.companyName }}
            </span>
          </div>
          
          <!-- Location -->
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon name="mdi:map-marker" class="w-3.5 h-3.5" />
            <span>{{ report.location }}</span>
            <Badge
              v-if="report.isOconus"
              variant="soft"
              class="ml-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              OCONUS
            </Badge>
          </div>
        </div>
        
        <!-- Salary display -->
        <div class="text-right shrink-0">
          <div class="text-xl font-bold text-foreground">{{ formattedSalary }}</div>
          <div v-if="formattedBonus" class="text-xs text-emerald-600 dark:text-emerald-400">
            +{{ formattedBonus }} signing
          </div>
        </div>
      </div>
      
      <!-- Details row (not compact) -->
      <div v-if="!compact" class="flex flex-wrap items-center gap-2">
        <!-- Clearance badge -->
        <Badge variant="soft" :class="clearanceBadge.class" class="text-xs">
          {{ clearanceBadge.label }}
        </Badge>
        
        <!-- Employment type -->
        <Badge variant="outline" class="text-xs">
          {{ employmentLabel }}
        </Badge>
        
        <!-- Years experience -->
        <Badge variant="outline" class="text-xs">
          {{ report.yearsExperience }} {{ report.yearsExperience === 1 ? 'year' : 'years' }} exp.
        </Badge>
      </div>
      
      <!-- Compact details row -->
      <div v-else class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{{ clearanceBadge.label }}</span>
        <span class="text-border">•</span>
        <span>{{ employmentLabel }}</span>
        <span class="text-border">•</span>
        <span>{{ report.yearsExperience }} yrs exp</span>
      </div>
      
      <!-- Footer: Vote & Timestamp -->
      <div class="flex items-center justify-between">
        <!-- Helpful vote button -->
        <button
          type="button"
          class="flex items-center gap-1.5 text-sm transition-colors"
          :class="[
            hasVoted 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          ]"
          :disabled="isVoting"
          @click="handleVoteClick"
        >
          <Icon 
            :name="hasVoted ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'" 
            class="w-4 h-4"
            :class="{ 'animate-pulse': isVoting }"
          />
          <span>{{ report.helpfulCount }}</span>
          <span class="text-xs">helpful</span>
        </button>
        
        <!-- Timestamp -->
        <span class="text-xs text-muted-foreground/70">
          {{ timeAgo }}
        </span>
      </div>
    </div>
  </article>
</template>
