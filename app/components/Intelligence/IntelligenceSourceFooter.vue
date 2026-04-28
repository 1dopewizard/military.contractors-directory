<!--
  @file Intelligence source footer
  @description Source, freshness, filters, warnings, and outbound evidence links
-->

<script setup lang="ts">
import type { SourceLink, SourceMetadata } from "@/app/types/intelligence.types";
import { sourceMetadataSummary } from "@/app/lib/intelligence-ui";

const props = withDefaults(
  defineProps<{
    metadata?: SourceMetadata | null;
    sourceLinks?: SourceLink[];
  }>(),
  {
    metadata: null,
    sourceLinks: () => [],
  },
);

const links = computed(() =>
  props.sourceLinks.length ? props.sourceLinks : props.metadata?.sources ?? [],
);
</script>

<template>
  <section class="border-border border-t pt-4">
    <div class="text-muted-foreground space-y-2 text-xs">
      <p>{{ sourceMetadataSummary(metadata) }}</p>
      <p v-if="metadata?.filters?.length">
        Filters:
        <span
          v-for="filter in metadata.filters"
          :key="`${filter.kind}-${filter.value}`"
          class="mr-2"
        >
          {{ filter.label }}={{ filter.value }}
        </span>
      </p>
      <p v-if="metadata?.warnings?.length" class="text-destructive">
        {{ metadata.warnings.join(" ") }}
      </p>
    </div>
    <div v-if="links.length" class="mt-3 flex flex-wrap gap-3">
      <NuxtLink
        v-for="source in links"
        :key="source.url"
        :to="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary text-xs hover:underline"
      >
        {{ source.label }}
        <Icon name="mdi:open-in-new" class="ml-1 inline h-3 w-3" />
      </NuxtLink>
    </div>
  </section>
</template>
