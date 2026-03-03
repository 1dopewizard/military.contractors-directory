<!--
  @file Contractor result skeleton
  @description Loading skeleton for contractor search results
-->

<script setup lang="ts">
import { Skeleton } from "@/app/components/ui/skeleton";

withDefaults(
  defineProps<{
    count?: number;
  }>(),
  {
    count: 6,
  },
);
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="i in count"
      :key="i"
      class="border-border/30 bg-card/30 space-y-3 border px-4 py-4"
    >
      <!-- Name + Rank row -->
      <div class="flex items-center gap-3">
        <Skeleton class="h-6 w-48" />
        <Skeleton class="h-5 w-8" />
      </div>

      <!-- Stats row -->
      <div class="flex items-center gap-4">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-32" />
      </div>

      <!-- Specialty badge -->
      <Skeleton class="h-5 w-28" />

      <!-- Description -->
      <div class="space-y-1">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-4/5" />
      </div>
    </div>
  </div>
</template>
