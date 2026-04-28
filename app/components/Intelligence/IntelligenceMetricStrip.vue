<!--
  @file Intelligence metric strip
  @description Compact metric grid for public intelligence summaries
-->

<script setup lang="ts">
interface MetricItem {
  label: string;
  value: string | number;
  detail?: string | null;
}

defineProps<{
  metrics: MetricItem[];
}>();
</script>

<template>
  <section class="border-border grid border-t border-l sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="metric in metrics"
      :key="metric.label"
      class="border-border min-w-0 border-r border-b p-4"
    >
      <p class="text-muted-foreground text-xs tracking-wide uppercase">
        {{ metric.label }}
      </p>
      <p class="text-foreground mt-1 truncate text-xl font-semibold tabular-nums">
        {{ metric.value }}
      </p>
      <p v-if="metric.detail" class="text-muted-foreground mt-1 text-xs">
        {{ metric.detail }}
      </p>
    </div>
  </section>
</template>
