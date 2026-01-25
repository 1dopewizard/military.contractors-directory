<!--
  @file Community/HelpfulVoteButton.vue
  @description Reusable helpful vote button with count and toggle state
  @usage <HelpfulVoteButton :count="12" :has-voted="false" @vote="handleVote" @remove-vote="handleRemove" />
-->

<script setup lang="ts">
interface Props {
  /** Number of helpful votes */
  count: number
  /** Whether the current user has voted */
  hasVoted?: boolean
  /** Whether a vote operation is in progress */
  isLoading?: boolean
  /** Disable voting (e.g., not authenticated) */
  disabled?: boolean
  /** Show compact variant (icon only on mobile) */
  compact?: boolean
}

interface Emits {
  (e: 'vote'): void
  (e: 'removeVote'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasVoted: false,
  isLoading: false,
  disabled: false,
  compact: false,
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  if (props.disabled || props.isLoading) return

  if (props.hasVoted) {
    emit('removeVote')
  } else {
    emit('vote')
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 text-sm transition-colors"
    :class="[
      hasVoted
        ? 'text-primary font-medium'
        : 'text-muted-foreground hover:text-foreground',
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && !isLoading && 'cursor-pointer',
    ]"
    :disabled="disabled || isLoading"
    :aria-pressed="hasVoted"
    :aria-label="`Mark as helpful. ${count} votes.`"
    @click="handleClick"
  >
    <Icon
      :name="hasVoted ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
      class="w-4 h-4"
      :class="{ 'animate-pulse': isLoading }"
    />
    <span class="tabular-nums">{{ count }}</span>
    <span v-if="!compact" class="text-xs hidden sm:inline">helpful</span>
  </button>
</template>
