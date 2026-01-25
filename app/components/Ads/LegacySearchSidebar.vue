<!--
  @file Search sidebar component
  @deprecated Use components/Search/SearchSidebar.vue instead
  @usage <SearchSidebar :sticky="!hasMosContext"><template #top>...</template></SearchSidebar>
  @description DEPRECATED - Reusable sidebar with featured ads.
               This component uses the old self-service featured ads system.
               New code should use Search/SearchSidebar.vue with FeaturedJobCard.
-->

<script setup lang="ts">
import type { AdContext } from '@/app/composables/useAds'

withDefaults(defineProps<{
  /** Whether the sidebar should be sticky (used when there's less content) */
  sticky?: boolean
  /** Context for contextual ad matching */
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
      
      <!-- Featured Company Advertisement (Legacy) -->
      <LegacyFeaturedAd />
      
      <!-- Featured Job Advertisement (Legacy) -->
      <LegacyFeaturedJobCard :context="adContext" />
      
      <!-- Bottom slot (e.g., Alert Signup, Similar MOS) -->
      <slot name="bottom" />
      
      <!-- Default slot for any additional content -->
      <slot />
    </div>
  </div>
</template>

