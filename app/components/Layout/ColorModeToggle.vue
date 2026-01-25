<!--
  @file Color mode toggle component
  @description Toggle between light and dark themes
  @usage <ColorModeToggle />
-->

<script setup lang="ts">
const colorMode = useColorMode()

// Track client-side hydration to prevent icon mismatch
const isHydrated = ref(false)

/**
 * Toggle between light and dark mode
 */
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

/**
 * Get the appropriate icon based on current mode
 */
const currentIcon = computed(() => {
  // During SSR or before hydration, show a neutral icon to prevent mismatch
  if (!isHydrated.value) {
    return 'mdi:theme-light-dark'
  }
  return colorMode.value === 'dark' ? 'mdi:weather-night' : 'mdi:weather-sunny'
})

// Set hydration flag after component mounts
onMounted(() => {
  isHydrated.value = true
})
</script>

<template>
  <Button 
      variant="ghost" 
      size="icon" 
      class="hover:bg-transparent"
      @click="toggleColorMode"
  >
      <Icon :name="currentIcon" class="size-4 transition-all" />
      <span class="sr-only">Toggle theme</span>
  </Button>
</template>
