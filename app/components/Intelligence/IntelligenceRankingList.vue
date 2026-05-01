<!--
  @file Intelligence ranking list
  @description Tableless ranked contractor list with relative obligation bars
-->

<script setup lang="ts">
import { computed } from "vue";
import type { RankingRow } from "@/app/types/intelligence.types";
import {
  formatIntelligenceMoney,
  formatIntelligencePercent,
} from "@/app/lib/intelligence-ui";

const props = withDefaults(
  defineProps<{
    rows: RankingRow[];
    showShare?: boolean;
    emptyText?: string;
  }>(),
  {
    showShare: false,
    emptyText: "No ranked records available.",
  },
);

const maxObligation = computed(() =>
  props.rows.reduce((max, row) => Math.max(max, row.obligations ?? 0), 0),
);

const barWidth = (value: number | null | undefined): string => {
  if (!maxObligation.value || typeof value !== "number") return "0%";
  return `${Math.max(2, Math.round((value / maxObligation.value) * 100))}%`;
};
</script>

<template>
  <div
    v-if="!rows.length"
    class="border-border text-muted-foreground border p-8 text-center text-sm"
  >
    {{ emptyText }}
  </div>
  <ol v-else class="border-border divide-border divide-y border">
    <li
      v-for="row in rows"
      :key="`${row.rank}-${row.name}`"
      class="hover:bg-muted/30 group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-4 py-3 transition-colors sm:grid-cols-[3rem_1.4fr_2fr_auto] sm:gap-6 sm:px-5"
    >
      <span class="text-muted-foreground font-mono text-xs tabular-nums">
        #{{ row.rank }}
      </span>

      <div class="min-w-0">
        <NuxtLink
          v-if="row.slug"
          :to="`/companies/${row.slug}`"
          class="text-foreground group-hover:text-primary block truncate text-sm font-medium transition-colors"
        >
          {{ row.name }}
        </NuxtLink>
        <span v-else class="text-foreground block truncate text-sm font-medium">
          {{ row.name }}
        </span>
        <p
          v-if="row.uei"
          class="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider uppercase"
        >
          UEI {{ row.uei }}
        </p>
      </div>

      <div class="hidden sm:block">
        <div class="bg-muted/60 h-1.5 w-full">
          <div
            class="bg-primary h-1.5 transition-all"
            :style="{ width: barWidth(row.obligations) }"
          />
        </div>
        <div
          v-if="(row.awardCount ?? 0) > 0 || showShare"
          class="text-muted-foreground mt-1 flex items-center justify-between text-[11px] tabular-nums"
        >
          <span v-if="(row.awardCount ?? 0) > 0">
            {{ row.awardCount.toLocaleString() }} awards
          </span>
          <span v-else />
          <span v-if="showShare">
            {{ formatIntelligencePercent(row.share) }} share
          </span>
        </div>
      </div>

      <div class="text-right">
        <div class="text-foreground text-sm font-semibold tabular-nums">
          {{ formatIntelligenceMoney(row.obligations) }}
        </div>
      </div>
    </li>
  </ol>
</template>
