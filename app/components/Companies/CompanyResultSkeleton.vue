<!--
  @file Company result skeleton
  @description Loading placeholder for company search results
-->

<script setup lang="ts">
defineProps<{
  count?: number
}>()
</script>

<template>
  <div class="space-y-1">
    <div 
      v-for="i in (count || 5)" 
      :key="i" 
      class="px-4 py-4 space-y-3 animate-pulse"
    >
      <!-- Company header row -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <!-- Logo placeholder -->
          <Skeleton class="w-10 h-10" />
          <div class="space-y-1.5">
            <!-- Company name -->
            <Skeleton class="h-5 w-48" />
            <!-- Location/prime indicator -->
            <Skeleton class="h-3 w-32" />
          </div>
        </div>
        <!-- Match badge -->
        <Skeleton class="h-5 w-20" />
      </div>
      
      <!-- Domain badges -->
      <div class="flex items-center gap-1.5">
        <Skeleton class="h-5 w-14" />
        <Skeleton class="h-5 w-20" />
        <Skeleton class="h-5 w-16" />
      </div>
      
      <!-- Typical roles -->
      <div class="flex items-center gap-2">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-48" />
      </div>
      
      <!-- Summary -->
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-3/4" />
      
      <!-- CTA -->
      <Skeleton class="h-4 w-28" />
    </div>
  </div>
</template>
