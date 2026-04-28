<!--
  @file Intelligence page header
  @description Dense public intelligence page header with source, freshness, and filter metadata
-->

<script setup lang="ts">
import type {
  IntelligenceFilter,
  SourceMetadata,
} from "@/app/types/intelligence.types";
import {
  isSourceMetadataWarning,
  sourceMetadataSummary,
} from "@/app/lib/intelligence-ui";

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
  props.filters.length ? props.filters : props.metadata?.filters ?? [],
);
const hasWarning = computed(() => isSourceMetadataWarning(props.metadata));
const fiscalYearLabel = computed(() =>
  props.fiscalYears.length
    ? props.fiscalYears.map((year) => `FY${year}`).join(", ")
    : null,
);
</script>

<template>
  <section class="border-border border-b">
    <div :class="['container mx-auto px-4 py-6 sm:px-6 lg:px-8', maxWidth]">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0">
          <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {{ eyebrow }}
          </p>
          <h1
            class="text-foreground mt-2 max-w-5xl text-2xl leading-tight font-semibold sm:text-3xl"
          >
            {{ title }}
          </h1>
          <p v-if="description" class="text-muted-foreground mt-2 max-w-4xl text-sm">
            {{ description }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div
        class="border-border bg-muted/20 mt-5 grid gap-3 border px-3 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <p class="text-muted-foreground">Source</p>
          <p class="text-foreground mt-1 font-medium">USAspending.gov</p>
        </div>
        <div>
          <p class="text-muted-foreground">Freshness</p>
          <p class="text-foreground mt-1 font-medium">
            {{ sourceMetadataSummary(metadata) }}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground">Window</p>
          <p class="text-foreground mt-1 font-medium">
            {{ fiscalYearLabel || "Current public award extract" }}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground">Status</p>
          <p
            class="mt-1 font-medium"
            :class="hasWarning ? 'text-destructive' : 'text-foreground'"
          >
            {{
              hasWarning
                ? metadata?.warnings?.[0] || `Using ${metadata?.cacheStatus} data`
                : "Source-backed records"
            }}
          </p>
        </div>
      </div>

      <div v-if="visibleFilters.length" class="mt-3 flex flex-wrap gap-2">
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
