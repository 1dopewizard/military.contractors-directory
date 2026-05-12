<!--
  @file Intelligence ranking table
  @description Dense ranked contractor table for USAspending-backed pages
-->

<script setup lang="ts">
import type { RankingRow } from "@/app/types/intelligence.types";
import {
  formatIntelligenceMoney,
  formatIntelligencePercent,
} from "@/app/lib/intelligence-ui";

withDefaults(
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
</script>

<template>
  <div class="border-border overflow-x-auto border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-16">Rank</TableHead>
          <TableHead>Recipient</TableHead>
          <TableHead class="text-right">Obligations</TableHead>
          <TableHead class="text-right">Awards</TableHead>
          <TableHead v-if="showShare" class="text-right">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="!rows.length">
          <TableCell
            :colspan="showShare ? 5 : 4"
            class="text-muted-foreground py-8 text-center"
          >
            {{ emptyText }}
          </TableCell>
        </TableRow>
        <TableRow v-for="row in rows" :key="`${row.rank}-${row.name}`">
          <TableCell class="font-mono text-xs">{{ row.rank }}</TableCell>
          <TableCell class="min-w-64">
            <NuxtLink
              v-if="row.slug"
              :to="`/${row.slug}`"
              class="text-foreground hover:text-primary font-medium"
            >
              {{ row.name }}
            </NuxtLink>
            <span v-else class="text-foreground font-medium">{{
              row.name
            }}</span>
            <p
              v-if="row.uei"
              class="text-muted-foreground mt-1 font-mono text-[11px]"
            >
              UEI {{ row.uei }}
            </p>
          </TableCell>
          <TableCell class="text-right font-medium tabular-nums">
            {{ formatIntelligenceMoney(row.obligations) }}
          </TableCell>
          <TableCell class="text-right tabular-nums">
            {{ row.awardCount?.toLocaleString?.() || "N/A" }}
          </TableCell>
          <TableCell v-if="showShare" class="text-right tabular-nums">
            {{ formatIntelligencePercent(row.share) }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
