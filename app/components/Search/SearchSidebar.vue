<!--
  @file Search sidebar component (refactored)
  @usage <SearchSidebar :sticky="!hasMosContext"><template #top>...</template></SearchSidebar>
  @description Reusable sidebar with featured jobs and alert signup
-->

<script setup lang="ts">
import type { AdContext } from '@/app/composables/useAds'

withDefaults(defineProps<{
  /** Whether the sidebar should be sticky (used when there's less content) */
  sticky?: boolean
  /** Context for contextual job matching */
  adContext?: AdContext
}>(), {
  sticky: true
})
</script>

<template>
  <div class="lg:w-80 shrink-0">
    <div :class="['space-y-6', { 'lg:sticky lg:top-[148px] lg:-mt-6': sticky }]">
      <!-- Top slot (e.g., MOS Profile card) -->
      <slot name="top" />
      
      <!-- Featured Job -->
      <FeaturedJobCard :context="adContext" />
      
      <!-- Bottom slot (e.g., Alert Signup, Similar MOS) -->
      <slot name="bottom" />
      
      <!-- Default slot for any additional content -->
      <slot />
    </div>
  </div>
</template>
