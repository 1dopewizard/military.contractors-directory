<!--
  @file Generic page header wrapper
  @description Simple container with consistent padding and max-width
-->

<script setup lang="ts">
interface Props {
  padding?: string
}

withDefaults(defineProps<Props>(), {
  padding: 'py-10'
})
</script>

<template>
  <div class="relative overflow-hidden">
    <div :class="['container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl', padding]">
      <slot />
    </div>
  </div>
</template>

