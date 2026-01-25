<!--
  @file Contractor profile page skeleton
  @description Loading skeleton for the contractor profile page layout
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Left Column: Main Content -->
      <div class="flex-1 min-w-0 max-w-3xl">
        <!-- Header Section Skeleton -->
        <div class="mb-8 pb-6 border-b border-border/30">
          <!-- Name + Rank Badge -->
          <div class="flex flex-wrap items-start gap-3 mb-4">
            <Skeleton class="h-9 w-64" />
            <Skeleton class="h-6 w-12" />
          </div>

          <!-- Primary Specialty Tag -->
          <div class="flex items-center gap-2 mb-4">
            <Skeleton class="w-4 h-4" />
            <Skeleton class="h-4 w-32" />
          </div>

          <!-- Key Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/30">
            <div v-for="i in 6" :key="i" class="text-center">
              <Skeleton class="h-3 w-16 mx-auto mb-2" />
              <Skeleton class="h-6 w-14 mx-auto" />
            </div>
          </div>
        </div>

        <!-- Overview Section Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-24 mb-4" />
          <div class="space-y-3">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-4/5" />
          </div>
        </div>

        <!-- Specialties Section Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-36 mb-4" />
          <div class="flex flex-wrap gap-3">
            <Skeleton v-for="i in 3" :key="i" class="h-16 w-48" />
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar Skeleton -->
      <div class="lg:w-80 shrink-0">
        <div class="lg:sticky lg:top-4 space-y-6">
          <!-- External Links Card Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardContent class="p-0">
              <div class="p-4 border-b border-border/30">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-12" />
                </div>
                <div class="space-y-2">
                  <Skeleton v-for="i in 4" :key="i" class="h-9 w-full" />
                </div>
              </div>

              <!-- Stock Info Skeleton -->
              <div class="p-4 border-b border-border/30">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-12" />
                </div>
                <div class="flex items-center gap-2">
                  <Skeleton class="h-5 w-24" />
                  <Skeleton class="h-3 w-32" />
                </div>
              </div>

              <!-- Quick Stats Skeleton -->
              <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-16" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 3" :key="i" class="flex justify-between">
                    <Skeleton class="h-4 w-24" />
                    <Skeleton class="h-4 w-12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Locations Card Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardContent class="p-4">
              <div class="flex items-center gap-2 mb-3">
                <Skeleton class="w-4 h-4" />
                <Skeleton class="h-3 w-20" />
              </div>
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-4 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
