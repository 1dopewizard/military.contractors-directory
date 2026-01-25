<!--
  @file Viewed MOS item skeleton
  @description Loading skeleton for viewed MOS history items
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
  <div class="space-y-4">
    <div
      v-for="i in count"
      :key="i"
      class="flex items-center justify-between p-3"
    >
      <div class="flex items-center gap-3">
        <Skeleton class="w-9 h-9" />
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <Skeleton class="h-4 w-12" />
            <Skeleton class="h-4 w-16" />
          </div>
          <Skeleton class="h-3 w-40" />
        </div>
      </div>
      <div class="space-y-1 text-right">
        <Skeleton class="h-3 w-14 ml-auto" />
        <Skeleton class="h-3 w-12 ml-auto" />
      </div>
    </div>
  </div>
</template>
