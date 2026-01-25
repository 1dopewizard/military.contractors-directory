<!--
  @file Community/InterviewExperienceCard.vue
  @description Display card for a single interview experience with company, outcome, timeline, and helpful voting
  @usage <InterviewExperienceCard :experience="interviewExperience" @vote="handleVote" />
-->

<script setup lang="ts">
import type {
  EnrichedInterviewExperience,
  InterviewDifficulty,
  InterviewOutcome,
} from '@/app/types/community.types'

interface Props {
  /** The interview experience to display */
  experience: EnrichedInterviewExperience
  /** Whether the current user has voted this experience helpful */
  hasVoted?: boolean
  /** Whether voting is in progress */
  isVoting?: boolean
  /** Show compact view (less details) */
  compact?: boolean
  /** Show expanded view with questions and tips */
  expanded?: boolean
}

interface Emits {
  (e: 'vote', experienceId: string): void
  (e: 'removeVote', experienceId: string): void
  (e: 'expand', experienceId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  hasVoted: false,
  isVoting: false,
  compact: false,
  expanded: false,
})

const emit = defineEmits<Emits>()

// Outcome badge configuration
const outcomeBadge = computed(() => {
  const outcome = props.experience.outcome as InterviewOutcome
  const configs: Record<InterviewOutcome, { label: string; icon: string; class: string }> = {
    OFFER: {
      label: 'Got Offer',
      icon: 'mdi:check-circle',
      class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    REJECTED: {
      label: 'Rejected',
      icon: 'mdi:close-circle',
      class: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    GHOSTED: {
      label: 'Ghosted',
      icon: 'mdi:ghost',
      class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    },
    WITHDREW: {
      label: 'Withdrew',
      icon: 'mdi:account-arrow-left',
      class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  }
  return configs[outcome] || configs.REJECTED
})

// Difficulty badge configuration
const difficultyBadge = computed(() => {
  const difficulty = props.experience.difficulty as InterviewDifficulty
  const configs: Record<InterviewDifficulty, { label: string; class: string }> = {
    EASY: { label: 'Easy', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    MEDIUM: { label: 'Medium', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    HARD: { label: 'Hard', class: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  }
  return configs[difficulty] || configs.MEDIUM
})

// Format interview date
const formattedDate = computed(() => {
  const date = new Date(props.experience.interviewDate)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

// Format time ago
const timeAgo = computed(() => {
  const now = Date.now()
  const diff = now - props.experience.createdAt
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
})

// Timeline text
const timelineText = computed(() => {
  const weeks = props.experience.timelineWeeks
  if (weeks === 1) return '1 week process'
  return `${weeks} weeks process`
})

// Handle vote toggle
const handleVoteClick = () => {
  if (props.hasVoted) {
    emit('removeVote', props.experience._id)
  } else {
    emit('vote', props.experience._id)
  }
}

// Handle expand toggle
const handleExpandClick = () => {
  emit('expand', props.experience._id)
}
</script>

<template>
  <article 
    class="group relative px-4 py-4 border border-border/30 bg-card/30 transition-all duration-150 hover:border-primary/30 hover:bg-card/50"
  >
    
    <div class="space-y-3">
      <!-- Header: Company, Role, Outcome -->
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <!-- Company & Role -->
          <div class="flex items-center gap-2 mb-1">
            <NuxtLink
              v-if="experience.companySlug"
              :to="`/companies/${experience.companySlug}`"
              class="font-semibold text-foreground hover:text-primary hover:underline transition-colors truncate"
            >
              {{ experience.companyName }}
            </NuxtLink>
            <span v-else class="font-semibold text-foreground truncate">
              {{ experience.companyName }}
            </span>
          </div>

          <!-- Role Title -->
          <div class="text-sm text-muted-foreground mb-1 truncate">
            {{ experience.roleTitle }}
          </div>

          <!-- MOS & Interview Date -->
          <div class="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span class="font-mono bg-primary/10 text-primary px-1.5 py-0.5">
              {{ experience.mosCode }}
            </span>
            <span class="text-border">•</span>
            <span>{{ formattedDate }}</span>
          </div>
        </div>

        <!-- Outcome badge -->
        <Badge variant="soft" :class="outcomeBadge.class" class="shrink-0">
          <Icon :name="outcomeBadge.icon" class="w-3.5 h-3.5 mr-1" />
          {{ outcomeBadge.label }}
        </Badge>
      </div>

      <!-- Details row (not compact) -->
      <div v-if="!compact" class="flex flex-wrap items-center gap-2">
        <!-- Difficulty badge -->
        <Badge variant="soft" :class="difficultyBadge.class" class="text-xs">
          {{ difficultyBadge.label }} interview
        </Badge>

        <!-- Timeline -->
        <Badge variant="outline" class="text-xs">
          <Icon name="mdi:clock-outline" class="w-3 h-3 mr-1" />
          {{ timelineText }}
        </Badge>

        <!-- Questions count -->
        <Badge v-if="experience.questionsAsked.length > 0" variant="outline" class="text-xs">
          <Icon name="mdi:comment-question" class="w-3 h-3 mr-1" />
          {{ experience.questionsAsked.length }}
          {{ experience.questionsAsked.length === 1 ? 'question' : 'questions' }}
        </Badge>
      </div>

      <!-- Compact details row -->
      <div v-else class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{{ difficultyBadge.label }}</span>
        <span class="text-border">•</span>
        <span>{{ timelineText }}</span>
      </div>

      <!-- Process description preview -->
      <p v-if="!compact" class="text-sm text-muted-foreground line-clamp-2">
        {{ experience.processDescription }}
      </p>

      <!-- Expanded content -->
      <div v-if="expanded && !compact" class="space-y-4 pt-3 border-t border-border/30">
        <!-- Full process description -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Interview Process
          </h4>
          <p class="text-sm text-foreground">
            {{ experience.processDescription }}
          </p>
        </div>

        <!-- Questions asked -->
        <div v-if="experience.questionsAsked.length > 0">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Questions Asked
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(question, idx) in experience.questionsAsked"
              :key="idx"
              class="text-sm text-foreground flex items-start gap-2"
            >
              <Icon name="mdi:comment-question-outline" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{{ question }}</span>
            </li>
          </ul>
        </div>

        <!-- Tips -->
        <div v-if="experience.tips">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Tips & Advice
          </h4>
          <div class="p-3 bg-primary/5 border-l-2 border-primary">
            <p class="text-sm text-foreground italic">
              "{{ experience.tips }}"
            </p>
          </div>
        </div>
      </div>

      <!-- Footer: Vote, Expand, Timestamp -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Helpful vote button -->
          <button
            type="button"
            class="flex items-center gap-1.5 text-sm transition-colors"
            :class="[
              hasVoted
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            :disabled="isVoting"
            @click="handleVoteClick"
          >
            <Icon
              :name="hasVoted ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
              class="w-4 h-4"
              :class="{ 'animate-pulse': isVoting }"
            />
            <span>{{ experience.helpfulCount }}</span>
            <span class="text-xs">helpful</span>
          </button>

          <!-- Expand/collapse button -->
          <button
            v-if="!compact"
            type="button"
            class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            @click="handleExpandClick"
          >
            <Icon :name="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4" />
            {{ expanded ? 'Show less' : 'Show more' }}
          </button>
        </div>

        <!-- Timestamp -->
        <span class="text-xs text-muted-foreground/70">
          {{ timeAgo }}
        </span>
      </div>
    </div>
  </article>
</template>
