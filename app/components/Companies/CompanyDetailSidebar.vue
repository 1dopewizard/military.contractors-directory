<!--
  @file Company detail sidebar
  @usage <CompanyDetailSidebar :stats="company.stats" :mos-matches="mosMatchesSorted" />
-->

<script setup lang="ts">
interface CompanyStats {
  totalMosMatches: number
  strongMatches: number
  mediumMatches: number
  weakMatches: number
  clearanceLevels: string[]
  branches: string[]
}

interface MosMatch {
  mosCode: string
  mosTitle?: string
  branch?: string
  strength: 'WEAK' | 'MEDIUM' | 'STRONG'
  typicalRoles?: string[]
  typicalClearance?: string | null
}

defineProps<{
  stats?: CompanyStats | null
  mosMatches: MosMatch[]
}>()
</script>

<template>
  <div class="lg:w-80 shrink-0">
    <div class="lg:sticky lg:top-4 space-y-6">
      <!-- Hiring Stats -->
      <CompanyHiringStatsCard 
        v-if="stats && stats.totalMosMatches > 0" 
        :stats="stats" 
      />

      <!-- MOS Matches (Quick Navigation) -->
      <CompanyMosMatchesCard 
        v-if="mosMatches.length" 
        :matches="mosMatches" 
      />
    </div>
  </div>
</template>
