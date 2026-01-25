<!--
  @file Job card skeleton
  @description Loading skeleton for job cards in grid layouts
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'

withDefaults(defineProps<{
  count?: number
}>(), {
  count: 4
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card
      v-for="i in count"
      :key="i"
      class="h-full bg-card overflow-hidden flex flex-col border-border/50"
    >
      <CardContent class="p-5 flex flex-col h-full gap-4">
        <!-- Header -->
        <div class="space-y-2">
          <!-- Title -->
          <Skeleton class="h-5 w-4/5" />
          
          <!-- Company & Location -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-28" />
            </div>
            <Skeleton class="h-4 w-16" />
          </div>
        </div>

        <!-- Description placeholder -->
        <div class="space-y-1.5">
          <Skeleton class="h-3 w-full" />
          <Skeleton class="h-3 w-3/4" />
        </div>

        <!-- Footer: Badges & Date -->
        <div class="flex items-end justify-between pt-3 border-t border-border/50 mt-auto gap-2">
          <div class="flex flex-wrap gap-2">
            <Skeleton class="h-5 w-14" />
            <Skeleton class="h-5 w-16" />
          </div>
          <Skeleton class="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
