<!--
  @file Intelligence bucket table
  @description Compact agency, NAICS, PSC, and trend breakdown table
-->

<script setup lang="ts">
import type {
  IntelligenceBucket,
  TrendPoint,
} from "@/app/types/intelligence.types";
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

type BucketRow = IntelligenceBucket | TrendPoint;

withDefaults(
  defineProps<{
    rows: BucketRow[];
    codeLabel?: string;
    emptyText?: string;
  }>(),
  {
    codeLabel: "Code",
    emptyText: "No breakdown records available.",
  },
);
</script>

<template>
  <div class="border-border overflow-x-auto border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ codeLabel }}</TableHead>
          <TableHead>Label</TableHead>
          <TableHead class="text-right">Obligations</TableHead>
          <TableHead class="text-right">Awards</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="!rows.length">
          <TableCell colspan="4" class="text-muted-foreground py-8 text-center">
            {{ emptyText }}
          </TableCell>
        </TableRow>
        <TableRow v-for="row in rows" :key="row.key">
          <TableCell class="font-mono text-xs">{{ row.key }}</TableCell>
          <TableCell class="min-w-60">{{ row.label }}</TableCell>
          <TableCell class="text-right font-medium tabular-nums">
            {{ formatIntelligenceMoney(row.obligation) }}
          </TableCell>
          <TableCell class="text-right tabular-nums">
            {{ row.awardCount.toLocaleString() }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
