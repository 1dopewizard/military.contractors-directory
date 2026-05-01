<!--
  @file Intelligence award list
  @description Source-backed award evidence list with compact metadata
-->

<script setup lang="ts">
import type { AwardSummary } from "@/app/types/intelligence.types";
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

withDefaults(
  defineProps<{
    awards: AwardSummary[];
    emptyText?: string;
  }>(),
  {
    emptyText: "No award evidence available.",
  },
);
</script>

<template>
  <div class="border-border border">
    <div
      v-if="!awards.length"
      class="text-muted-foreground p-8 text-center text-sm"
    >
      {{ emptyText }}
    </div>
    <div v-else class="divide-border divide-y">
      <article v-for="award in awards" :key="award.key" class="p-4">
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0">
            <p
              class="text-foreground text-sm font-medium [overflow-wrap:anywhere]"
            >
              {{ award.recipientName }}
            </p>
            <p
              class="text-muted-foreground mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]"
            >
              {{ award.description || "No description provided." }}
            </p>
          </div>
          <p
            class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
          >
            {{ formatIntelligenceMoney(award.obligation) }}
          </p>
        </div>
        <div
          class="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        >
          <span v-if="award.fiscalYear">FY{{ award.fiscalYear }}</span>
          <span>{{
            award.awardingSubAgency || award.awardingAgency || "Agency N/A"
          }}</span>
          <span v-if="award.naicsCode">NAICS {{ award.naicsCode }}</span>
          <span v-if="award.pscCode">PSC {{ award.pscCode }}</span>
          <span v-if="award.piid" class="font-mono [overflow-wrap:anywhere]">
            PIID {{ award.piid }}
          </span>
          <NuxtLink
            :to="award.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline"
          >
            Source record
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
