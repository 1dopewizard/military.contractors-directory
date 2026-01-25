<!--
  @file Company detail page skeleton
  @description Loading skeleton for the company detail page layout
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'
</script>

<template>
  <div class="container mx-auto px-4 max-w-6xl py-6">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Left Column: Company Info + Jobs -->
      <div class="flex-1 min-w-0 max-w-3xl">
        <!-- Company Header Skeleton -->
        <div class="mb-8 pb-6 border-b border-border/30">
          <!-- Company Name -->
          <Skeleton class="h-8 w-2/3 mb-3" />
          
          <!-- Summary -->
          <div class="space-y-2 mb-4">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
          </div>
          
          <!-- Meta row: Theaters & Domains -->
          <div class="flex flex-wrap items-center gap-2">
            <Skeleton class="h-3 w-32" />
            <Skeleton class="h-5 w-16" />
            <Skeleton class="h-5 w-20" />
            <Skeleton class="h-5 w-14" />
          </div>
          
          <!-- Website Button -->
          <Skeleton class="h-9 w-32 mt-4" />
        </div>

        <!-- Sample Jobs Section Skeleton -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <Skeleton class="w-5 h-5" />
            <Skeleton class="h-6 w-32" />
          </div>
          
          <!-- Job items -->
          <div class="space-y-0">
            <div
              v-for="i in 4"
              :key="i"
              class="py-4 border-b border-border/30 last:border-b-0"
            >
              <div class="flex items-start gap-4">
                <div class="flex-1 min-w-0 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <Skeleton class="h-5 w-2/3" />
                    <Skeleton class="h-4 w-20 shrink-0" />
                  </div>
                  <div class="flex items-center gap-3">
                    <Skeleton class="h-4 w-28" />
                    <Skeleton class="h-4 w-32" />
                  </div>
                  <div class="flex items-center gap-2 pt-1">
                    <Skeleton class="h-5 w-16" />
                    <Skeleton class="h-5 w-14" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar -->
      <div class="lg:w-80 shrink-0">
        <div class="lg:sticky lg:top-4 space-y-6">
          <!-- Hiring Stats Card Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardContent class="p-0">
              <div class="p-4 border-b border-border/30">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-28" />
                </div>
                <div class="flex items-center gap-3">
                  <Skeleton class="h-8 w-12" />
                  <Skeleton class="h-3 w-32" />
                </div>
              </div>
              
              <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-24" />
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <Skeleton class="h-3 w-16" />
                    <Skeleton class="h-3 w-8" />
                  </div>
                  <div class="flex justify-between">
                    <Skeleton class="h-3 w-14" />
                    <Skeleton class="h-3 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- MOS Matches Card Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardContent class="p-0">
              <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-28" />
                </div>
                
                <div class="space-y-2">
                  <div v-for="i in 4" :key="i" class="py-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Skeleton class="h-4 w-12" />
                        <Skeleton class="h-4 w-16" />
                      </div>
                      <Skeleton class="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
