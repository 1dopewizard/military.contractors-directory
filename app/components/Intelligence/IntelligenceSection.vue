<!--
  @file Intelligence section
  @description Bordered section shell for tables, evidence lists, and breakdowns
-->

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string | null;
    flush?: boolean;
  }>(),
  {
    description: null,
    flush: false,
  },
);
</script>

<template>
  <section class="border-border min-w-0 border">
    <div
      class="border-border flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h2 class="text-foreground text-sm font-semibold">{{ title }}</h2>
        <p v-if="description" class="text-muted-foreground mt-1 text-xs">
          {{ description }}
        </p>
      </div>
      <slot name="action" />
    </div>
    <div :class="flush ? '' : 'p-4'">
      <slot />
    </div>
  </section>
</template>
