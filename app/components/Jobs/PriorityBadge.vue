<!--
  @file Priority badge component
  @description Displays urgency/status indicators on job listings
-->

<script setup lang="ts">
type PriorityType = 'urgent' | 'hot' | 'new' | null

defineProps<{
  priority: PriorityType
  class?: string
}>()
</script>

<template>
  <span 
    v-if="priority === 'urgent'" 
    class="text-[10px] font-medium text-blue-600 dark:text-blue-400"
    :class="$props.class"
  >
    Urgent
  </span>
  <span 
    v-else-if="priority === 'new'" 
    class="text-[10px] font-medium text-green-600 dark:text-green-400"
    :class="$props.class"
  >
    New
  </span>
</template>

