<!--
  @file Intelligence page header
  @description Editorial directory page header — title block, optional actions, optional filter badges. The metadata stat ribbon is rendered separately via DirectoryStatRibbon.
-->

<script setup lang="ts">
import type {
  IntelligenceFilter,
  SourceMetadata,
} from "@/app/types/intelligence.types";

interface Props {
  eyebrow: string;
  title: string;
  description?: string | null;
  metadata?: SourceMetadata | null;
  filters?: IntelligenceFilter[];
  fiscalYears?: Array<number | string>;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: null,
  metadata: null,
  filters: () => [],
  fiscalYears: () => [],
  maxWidth: "max-w-7xl",
});

const visibleFilters = computed(() =>
  props.filters.length ? props.filters : (props.metadata?.filters ?? []),
);
</script>

<template>
  <section class="border-border border-b">
    <div :class="['container mx-auto px-4 py-6 sm:px-6 lg:px-8', maxWidth]">
      <div
        class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="min-w-0">
          <p
            class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.18em] uppercase"
          >
            {{ eyebrow }}
          </p>
          <h1
            class="text-foreground mt-2 max-w-5xl text-2xl leading-tight font-semibold sm:text-3xl"
          >
            {{ title }}
          </h1>
          <p
            v-if="description"
            class="text-muted-foreground mt-2 max-w-4xl text-sm"
          >
            {{ description }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div v-if="visibleFilters.length" class="mt-4 flex flex-wrap gap-2">
        <Badge
          v-for="filter in visibleFilters"
          :key="`${filter.kind}-${filter.label}-${filter.value}`"
          variant="outline"
          class="text-xs"
        >
          {{ filter.label }}: {{ filter.value }}
        </Badge>
      </div>
    </div>
  </section>
</template>
