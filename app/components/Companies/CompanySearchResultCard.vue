<!--
  @file Company search result card
  @description Displays company with MOS match info in search results
-->

<script setup lang="ts">
import type { CompanySearchResult } from '@/app/types/search.types'

const props = defineProps<{
  company: CompanySearchResult
  mosCode?: string
}>()

const companyLink = computed(() => `/companies/${props.company.slug}`)

// Format match strength for display
const matchStrengthDisplay = computed(() => {
  if (!props.company.mos_match) return null
  
  const strength = props.company.mos_match.strength
  switch (strength) {
    case 'STRONG': return { label: 'Strong match', class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }
    case 'MEDIUM': return { label: 'Good match', class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' }
    case 'WEAK': return { label: 'Possible match', class: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' }
    default: return null
  }
})

// Limit typical roles display
const typicalRolesDisplay = computed(() => {
  if (!props.company.mos_match?.typical_roles.length) return []
  return props.company.mos_match.typical_roles.slice(0, 3)
})
</script>

<template>
  <NuxtLink 
    :to="companyLink" 
    class="block group relative px-4 py-4 border border-transparent transition-all duration-150 hover:bg-muted/40 hover:border-border/60"
  >
    <!-- Left accent bar on hover -->
    <div class="absolute left-0 top-3 bottom-3 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <article class="space-y-2.5">
      <!-- Company name row -->
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
            {{ company.name }}
          </h3>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span v-if="company.is_prime_contractor" class="flex items-center gap-1">
              <Icon name="mdi:star" class="w-3 h-3 text-amber-500" />
              Prime Contractor
            </span>
            <span v-if="company.theaters.length > 0">
              {{ company.theaters.slice(0, 2).join(' · ') }}
              <template v-if="company.theaters.length > 2">
                +{{ company.theaters.length - 2 }}
              </template>
            </span>
          </div>
        </div>
        
        <!-- Match strength badge -->
        <Badge 
          v-if="matchStrengthDisplay && mosCode"
          variant="soft"
          :class="matchStrengthDisplay.class"
          class="shrink-0 text-xs"
        >
          {{ matchStrengthDisplay.label }}
        </Badge>
      </div>
      
      <!-- Domain badges row -->
      <div class="flex flex-wrap items-center gap-1.5">
        <Badge 
          v-for="d in company.domains.slice(0, 4)"
          :key="d"
          variant="soft"
          class="text-xs"
        >
          {{ d }}
        </Badge>
        <span 
          v-if="company.domains.length > 4"
          class="text-xs text-muted-foreground"
        >
          +{{ company.domains.length - 4 }} more
        </span>
      </div>
      
      <!-- MOS match details (when searching by MOS) -->
      <div v-if="company.mos_match && mosCode && typicalRolesDisplay.length > 0" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span class="text-muted-foreground">Typical roles:</span>
        <span class="text-foreground">
          {{ typicalRolesDisplay.join(', ') }}
          <template v-if="company.mos_match.typical_roles.length > 3">
            <span class="text-muted-foreground">+{{ company.mos_match.typical_roles.length - 3 }} more</span>
          </template>
        </span>
      </div>
      
      <!-- Clearance info if available -->
      <div v-if="company.mos_match?.typical_clearance" class="flex items-center gap-2 text-sm">
        <Icon name="mdi:shield-check-outline" class="w-4 h-4 text-muted-foreground" />
        <span class="text-muted-foreground">Typically requires:</span>
        <span class="text-foreground font-medium">{{ company.mos_match.typical_clearance }}</span>
      </div>
      
      <!-- Summary -->
      <p 
        v-if="company.summary" 
        class="text-sm text-muted-foreground leading-relaxed line-clamp-2"
      >
        {{ company.summary }}
      </p>
      
      <!-- CTA -->
      <div class="flex items-center gap-4 pt-1">
        <span class="text-sm font-medium text-primary group-hover:underline">
          View company &rarr;
        </span>
        <a 
          v-if="company.careers_url"
          :href="company.careers_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          @click.stop
        >
          <Icon name="mdi:open-in-new" class="w-3 h-3 inline-block mr-1" />
          Careers site
        </a>
      </div>
    </article>
  </NuxtLink>
</template>

