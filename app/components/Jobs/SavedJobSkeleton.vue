<!--
  @file Saved job item skeleton
  @description Loading skeleton for saved job list items
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'

withDefaults(defineProps<{
  count?: number
}>(), {
  count: 3
})
</script>

<template>
  <div class="divide-y divide-border/30">
    <div
      v-for="i in count"
      :key="i"
      class="py-3 first:pt-0"
    >
      <div class="space-y-2">
        <Skeleton class="h-4 w-3/4" />
        <div class="flex items-center gap-2">
          <Skeleton class="h-3 w-24" />
          <Skeleton class="h-3 w-28" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-5 w-14" />
          <Skeleton class="h-5 w-16" />
        </div>
      </div>
    </div>
  </div>
</template>
