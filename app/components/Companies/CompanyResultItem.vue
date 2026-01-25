<!--
  @file Company result item with borderless-until-hover style
  @description Flat result row matching SearchResultItem style
-->

<script setup lang="ts">
import type { Company } from '@/app/types/company.types'

const props = defineProps<{
  company: Company
}>()

const companyLink = computed(() => `/companies/${props.company.slug}`)
</script>

<template>
  <NuxtLink 
    :to="companyLink" 
    class="block group relative px-4 py-4 border border-border/30 bg-card/30 transition-all duration-150 hover:border-primary/30 hover:bg-card/50"
  >
    
    <article class="space-y-2">
      <!-- Name row -->
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
          {{ company.name }}
        </h3>
        <span v-if="company.job_count" class="text-sm font-medium text-muted-foreground shrink-0">
          {{ company.job_count }} {{ company.job_count === 1 ? 'job' : 'jobs' }}
        </span>
      </div>
      
      <!-- Theaters row -->
      <div v-if="company.theaters?.length" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span class="text-foreground font-medium">{{ company.theaters.join(' · ') }}</span>
      </div>

      <!-- Domain badges row -->
      <div v-if="company.domains?.length" class="flex flex-wrap items-center gap-2">
        <Badge 
          v-for="domain in company.domains.slice(0, 3)"
          :key="domain"
          variant="soft"
        >
          {{ domain }}
        </Badge>
        <span 
          v-if="company.domains.length > 3"
          class="text-xs text-muted-foreground"
        >
          +{{ company.domains.length - 3 }} more
        </span>
      </div>
      
      <!-- Summary -->
      <p 
        v-if="company.summary" 
        class="text-sm text-muted-foreground leading-relaxed line-clamp-2"
      >
        {{ company.summary }}
      </p>
    </article>
  </NuxtLink>
</template>
