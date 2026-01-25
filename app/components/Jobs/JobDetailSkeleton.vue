<!--
  @file Job detail page skeleton
  @description Loading skeleton for the job detail page layout
-->

<script setup lang="ts">
import { Skeleton } from '@/app/components/ui/skeleton'
</script>

<template>
  <div class="container mx-auto px-4 max-w-6xl py-6">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Left Column: Job Info -->
      <div class="flex-1 min-w-0 max-w-3xl">
        <!-- Job Header Skeleton -->
        <div class="mb-8 pb-6 border-b border-border/30">
          <!-- Title -->
          <Skeleton class="h-8 w-3/4 mb-3" />
          
          <!-- Meta row: company, location -->
          <div class="flex flex-wrap items-center gap-4 mb-4">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-4 w-40" />
            <Skeleton class="h-4 w-24" />
          </div>
          
          <!-- Summary -->
          <div class="space-y-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
          </div>
        </div>

        <!-- Responsibilities Section Skeleton -->
        <section class="mb-8">
          <Skeleton class="h-6 w-40 mb-4" />
          <div class="space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-start gap-3">
              <Skeleton class="w-5 h-5 shrink-0" />
              <Skeleton class="h-4 flex-1" />
            </div>
          </div>
        </section>

        <Skeleton class="h-px w-full mb-8" />

        <!-- Qualifications Section Skeleton -->
        <section class="mb-8">
          <Skeleton class="h-6 w-36 mb-6" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Education & Experience -->
            <div class="space-y-3">
              <Skeleton class="h-3 w-32" />
              <Skeleton class="h-4 w-48" />
              <Skeleton class="h-4 w-40" />
            </div>
            <!-- Certifications -->
            <div class="space-y-3">
              <Skeleton class="h-3 w-28" />
              <div class="flex flex-wrap gap-2">
                <Skeleton class="h-5 w-16" />
                <Skeleton class="h-5 w-20" />
                <Skeleton class="h-5 w-14" />
              </div>
            </div>
          </div>
        </section>

        <Skeleton class="h-px w-full mb-8" />

        <!-- Tools & Domain Skeleton -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="space-y-3">
            <Skeleton class="h-6 w-32" />
            <div class="flex flex-wrap gap-2">
              <Skeleton v-for="i in 5" :key="i" class="h-5 w-16" />
            </div>
          </div>
          <div class="space-y-3">
            <Skeleton class="h-6 w-24" />
            <div class="flex flex-wrap gap-2">
              <Skeleton v-for="i in 3" :key="i" class="h-5 w-20" />
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Sidebar -->
      <div class="lg:w-80 shrink-0">
        <div class="lg:sticky lg:top-4 space-y-6">
          <!-- Apply CTA Skeleton -->
          <Card class="hidden lg:block border-none bg-sidebar overflow-hidden">
            <CardContent class="p-5">
              <Skeleton class="h-10 w-full mb-4" />
              <Skeleton class="h-3 w-40 mx-auto" />
            </CardContent>
          </Card>

          <!-- Job Details Card Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardContent class="p-0">
              <!-- Location Section -->
              <div class="p-4 border-b border-border/30">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-20" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 4" :key="i" class="flex justify-between">
                    <Skeleton class="h-3 w-16" />
                    <Skeleton class="h-3 w-24" />
                  </div>
                </div>
              </div>

              <!-- Security Section -->
              <div class="p-4 border-b border-border/30">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-20" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 4" :key="i" class="flex justify-between">
                    <Skeleton class="h-3 w-20" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
              </div>

              <!-- Posting Info -->
              <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <Skeleton class="w-4 h-4" />
                  <Skeleton class="h-3 w-20" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 2" :key="i" class="flex justify-between">
                    <Skeleton class="h-3 w-16" />
                    <Skeleton class="h-3 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Similar Jobs Skeleton -->
          <Card class="border-none bg-sidebar overflow-hidden">
            <CardHeader class="px-4 py-3 border-b border-border/30">
              <div class="flex items-center gap-2">
                <Skeleton class="w-4 h-4" />
                <Skeleton class="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent class="p-4">
              <div class="space-y-3">
                <div v-for="i in 3" :key="i">
                  <Skeleton class="h-4 w-3/4 mb-1" />
                  <Skeleton class="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
