<!--
  @file Intelligence trend bars
  @description Horizontal bar trend display for fiscal-year obligations
-->

<script setup lang="ts">
import type { IntelligenceBucket, TrendPoint } from "@/app/types/intelligence.types";
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

type TrendRow = IntelligenceBucket | TrendPoint;

const props = defineProps<{
  rows: TrendRow[];
}>();

const maxValue = computed(() =>
  props.rows.reduce((max, row) => Math.max(max, row.obligation), 0),
);

const width = (value: number): string => {
  if (!maxValue.value) return "0%";
  return `${Math.max(4, Math.round((value / maxValue.value) * 100))}%`;
};
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="row in rows"
      :key="row.key"
      class="grid grid-cols-[4.75rem_minmax(0,1fr)_6rem] items-center gap-3 text-sm"
    >
      <span class="text-muted-foreground truncate">{{ row.label }}</span>
      <div class="bg-muted h-2">
        <div class="bg-primary h-2" :style="{ width: width(row.obligation) }" />
      </div>
      <span class="text-right text-xs font-medium tabular-nums">
        {{ formatIntelligenceMoney(row.obligation) }}
      </span>
    </div>
  </div>
</template>
