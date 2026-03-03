<!--
  @file Contractor profile page skeleton
  @description Loading skeleton for the contractor profile page layout
-->

<script setup lang="ts">
import { Skeleton } from "@/app/components/ui/skeleton";
</script>

<template>
  <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-8 lg:flex-row">
      <!-- Left Column: Main Content -->
      <div class="max-w-3xl min-w-0 flex-1">
        <!-- Header Section Skeleton -->
        <div class="border-border/30 mb-8 border-b pb-6">
          <!-- Name + Rank Badge -->
          <div class="mb-4 flex flex-wrap items-start gap-3">
            <Skeleton class="h-9 w-64" />
            <Skeleton class="h-6 w-12" />
          </div>

          <!-- Primary Specialty Tag -->
          <div class="mb-4 flex items-center gap-2">
            <Skeleton class="h-4 w-4" />
            <Skeleton class="h-4 w-32" />
          </div>

          <!-- Key Stats Grid -->
          <div
            class="bg-muted/30 grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            <div v-for="i in 6" :key="i" class="text-center">
              <Skeleton class="mx-auto mb-2 h-3 w-16" />
              <Skeleton class="mx-auto h-6 w-14" />
            </div>
          </div>
        </div>

        <!-- Overview Section Skeleton -->
        <div class="mb-8">
          <Skeleton class="mb-4 h-6 w-24" />
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
          <Skeleton class="mb-4 h-6 w-36" />
          <div class="flex flex-wrap gap-3">
            <Skeleton v-for="i in 3" :key="i" class="h-16 w-48" />
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar Skeleton -->
      <div class="shrink-0 lg:w-80">
        <div class="space-y-6 lg:sticky lg:top-4">
          <!-- External Links Card Skeleton -->
          <Card class="bg-sidebar overflow-hidden border-none">
            <CardContent class="p-0">
              <div class="border-border/30 border-b p-4">
                <div class="mb-3 flex items-center gap-2">
                  <Skeleton class="h-4 w-4" />
                  <Skeleton class="h-3 w-12" />
                </div>
                <div class="space-y-2">
                  <Skeleton v-for="i in 4" :key="i" class="h-9 w-full" />
                </div>
              </div>

              <!-- Stock Info Skeleton -->
              <div class="border-border/30 border-b p-4">
                <div class="mb-3 flex items-center gap-2">
                  <Skeleton class="h-4 w-4" />
                  <Skeleton class="h-3 w-12" />
                </div>
                <div class="flex items-center gap-2">
                  <Skeleton class="h-5 w-24" />
                  <Skeleton class="h-3 w-32" />
                </div>
              </div>

              <!-- Quick Stats Skeleton -->
              <div class="p-4">
                <div class="mb-3 flex items-center gap-2">
                  <Skeleton class="h-4 w-4" />
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
          <Card class="bg-sidebar overflow-hidden border-none">
            <CardContent class="p-4">
              <div class="mb-3 flex items-center gap-2">
                <Skeleton class="h-4 w-4" />
                <Skeleton class="h-3 w-20" />
              </div>
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <Skeleton class="h-4 w-4" />
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
