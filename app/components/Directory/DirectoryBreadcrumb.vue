<!--
  @file Directory breadcrumb chip strip
  @description Source/subject/window/freshness chips rendered above the page header on every directory page.
-->

<script setup lang="ts">
interface ExtraChip {
  label: string;
}

interface Props {
  source?: string;
  subject?: string;
  window?: string;
  freshness?: string | null;
  extra?: ExtraChip[];
}

withDefaults(defineProps<Props>(), {
  source: "USAspending.gov",
  subject: "DoD-awarded contracts",
  window: "Trailing 36 months",
  freshness: null,
  extra: () => [],
});
</script>

<template>
  <section class="border-border border-b">
    <div
      class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[0.7rem] tracking-[0.18em] uppercase sm:px-6 lg:px-8"
    >
      <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
      <span class="text-muted-foreground">{{ source }}</span>
      <span class="text-muted-foreground/40">/</span>
      <span class="text-muted-foreground">{{ subject }}</span>
      <span class="text-muted-foreground/40">/</span>
      <span class="text-muted-foreground">{{ window }}</span>
      <template v-for="chip in extra" :key="chip.label">
        <span class="text-muted-foreground/40 hidden sm:inline">/</span>
        <span class="text-foreground">{{ chip.label }}</span>
      </template>
      <template v-if="freshness">
        <span class="text-muted-foreground/40 hidden sm:inline">/</span>
        <span class="text-muted-foreground">Refreshed {{ freshness }}</span>
      </template>
    </div>
  </section>
</template>
