<!--
  @file MOS item skeleton
  @description Loading skeleton for MOS list items in sidebar cards
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
  <div class="space-y-1">
    <div
      v-for="i in count"
      :key="i"
      class="py-2 px-2"
    >
      <div class="flex items-center justify-between">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <Skeleton class="h-4 w-12" />
            <Skeleton class="h-4 w-14" />
          </div>
          <Skeleton class="h-3 w-32" />
        </div>
        <Skeleton class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
