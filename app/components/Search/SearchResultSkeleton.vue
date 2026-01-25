<!--
  @file Search result item skeleton
  @description Loading skeleton for search result list items
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'

withDefaults(defineProps<{
  count?: number
}>(), {
  count: 5
})
</script>

<template>
  <div class="space-y-0">
    <div
      v-for="i in count"
      :key="i"
      class="py-4 border-b border-border/30 last:border-b-0"
    >
      <div class="flex items-start gap-4">
        <!-- Main content -->
        <div class="flex-1 min-w-0 space-y-3">
          <!-- Title row -->
          <div class="flex items-start justify-between gap-3">
            <Skeleton class="h-5 w-2/3" />
            <Skeleton class="h-4 w-20 shrink-0" />
          </div>
          
          <!-- Company & Location row -->
          <div class="flex items-center gap-3">
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-4 w-32" />
          </div>
          
          <!-- Snippet -->
          <div class="space-y-1.5">
            <Skeleton class="h-3 w-full" />
            <Skeleton class="h-3 w-4/5" />
          </div>
          
          <!-- Tags row -->
          <div class="flex items-center gap-2 pt-1">
            <Skeleton class="h-5 w-16" />
            <Skeleton class="h-5 w-14" />
            <Skeleton class="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
