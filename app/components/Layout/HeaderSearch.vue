<!--
  @file Header search component
  @description Trigger button for the global search command palette
-->

<script setup lang="ts">
const searchOpen = ref(false);

// Detect OS for shortcut display
const isMac = ref(false);
onMounted(() => {
  isMac.value = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
});
</script>

<template>
  <div>
    <Button
      variant="outline"
      class="bg-muted/50 text-muted-foreground relative h-9 w-full justify-start rounded-md text-sm sm:pr-12 md:w-40 lg:w-56"
      @click="searchOpen = true"
    >
      <Icon name="mdi:magnify" class="mr-2 h-4 w-4" />
      <span class="hidden lg:inline-flex">Search intelligence...</span>
      <span class="inline-flex lg:hidden">Search...</span>
      <Kbd
        class="pointer-events-none absolute top-1/2 right-1.5 hidden -translate-y-1/2 sm:inline-flex"
      >
        {{ isMac ? "⌘" : "Ctrl" }}K
      </Kbd>
    </Button>
    <GlobalSearch v-model:open="searchOpen" />
  </div>
</template>
