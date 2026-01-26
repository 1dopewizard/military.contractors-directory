<!--
  @file Dashboard/Advertiser/AdvertiserAdTypeSelector.vue
  @description Ad type and tier selection with pre-selected defaults
-->

<script setup lang="ts">
import type { AdPlacementTier } from '@/app/types/ad.types'

type AdType = 'company_spotlight' | 'featured_job'

interface Props {
  selectedAdType: AdType
  selectedTier: AdPlacementTier
}

interface Emits {
  (e: 'update:selectedAdType', value: AdType): void
  (e: 'update:selectedTier', value: AdPlacementTier): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pricing = {
  featured_job: { standard: 299, premium: 499, duration: 30 },
  company_spotlight: { standard: 499, premium: 799, duration: 30 }
}

const getDisplayPrice = (adType: AdType, tier: AdPlacementTier) => {
  return pricing[adType][tier]
}
</script>

<template>
  <section class="space-y-8">
    <!-- Step 1: Ad Type Selection -->
    <div>
      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary text-primary-foreground">
          1
        </div>
        <h2 class="text-sm font-medium text-foreground uppercase tracking-wider">Select Ad Type</h2>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <button 
          type="button" 
          @click="emit('update:selectedAdType', 'featured_job')" 
          class="relative p-5 border text-left transition-all" 
          :class="selectedAdType === 'featured_job' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="font-bold text-sm">Featured Job</span>
              <p class="text-xs text-muted-foreground mt-1">Promote a specific position</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-muted-foreground">from</p>
              <span class="text-xl font-bold font-mono">${{ pricing.featured_job.standard }}</span>
            </div>
          </div>
          <div class="w-4 h-4 border-2 flex items-center justify-center" :class="selectedAdType === 'featured_job' ? 'border-primary bg-primary' : 'border-border'">
            <Icon v-if="selectedAdType === 'featured_job'" name="mdi:check" class="w-3 h-3 text-primary-foreground" />
          </div>
        </button>

        <button 
          type="button" 
          @click="emit('update:selectedAdType', 'company_spotlight')" 
          class="relative p-5 border text-left transition-all" 
          :class="selectedAdType === 'company_spotlight' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="font-bold text-sm">Partner Spotlight</span>
              <p class="text-xs text-muted-foreground mt-1">Brand awareness campaign</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-muted-foreground">from</p>
              <span class="text-xl font-bold font-mono">${{ pricing.company_spotlight.standard }}</span>
            </div>
          </div>
          <div class="w-4 h-4 border-2 flex items-center justify-center" :class="selectedAdType === 'company_spotlight' ? 'border-primary bg-primary' : 'border-border'">
            <Icon v-if="selectedAdType === 'company_spotlight'" name="mdi:check" class="w-3 h-3 text-primary-foreground" />
          </div>
        </button>
      </div>
    </div>

    <!-- Step 2: Placement Tier Selection -->
    <div>
      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary text-primary-foreground">
          2
        </div>
        <h2 class="text-sm font-medium text-foreground uppercase tracking-wider">Select Placement Tier</h2>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <button 
          type="button" 
          @click="emit('update:selectedTier', 'standard')" 
          class="relative p-4 border text-left transition-all" 
          :class="selectedTier === 'standard' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-sm">Standard</span>
                <div 
                  class="w-4 h-4 border-2 flex items-center justify-center" 
                  :class="selectedTier === 'standard' ? 'border-primary bg-primary' : 'border-border'"
                >
                  <Icon v-if="selectedTier === 'standard'" name="mdi:check" class="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <p class="text-xs text-muted-foreground">Fair rotation with all standard ads</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold font-mono">${{ pricing[selectedAdType].standard }}</span>
              <p class="text-[10px] text-muted-foreground">{{ pricing[selectedAdType].duration }} days</p>
            </div>
          </div>
        </button>

        <button 
          type="button" 
          @click="emit('update:selectedTier', 'premium')" 
          class="relative p-4 border text-left transition-all" 
          :class="selectedTier === 'premium' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-sm text-primary">Premium</span>
                <span class="px-1.5 py-0.5 text-[10px] font-medium bg-primary/5 text-primary">2x Exposure</span>
                <div 
                  class="w-4 h-4 border-2 flex items-center justify-center" 
                  :class="selectedTier === 'premium' ? 'border-primary bg-primary' : 'border-border'"
                >
                  <Icon v-if="selectedTier === 'premium'" name="mdi:check" class="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <p class="text-xs text-muted-foreground">2x exposure vs standard tier</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold font-mono">${{ pricing[selectedAdType].premium }}</span>
              <p class="text-[10px] text-muted-foreground">{{ pricing[selectedAdType].duration }} days</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="p-4 bg-muted/30 border border-border/50">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-foreground">
            {{ selectedAdType === 'featured_job' ? 'Featured Job' : 'Partner Spotlight' }}
            <span class="text-muted-foreground">•</span>
            <span :class="selectedTier === 'premium' ? 'text-primary' : ''">
              {{ selectedTier === 'premium' ? 'Premium' : 'Standard' }}
            </span>
          </p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ pricing[selectedAdType].duration }} days
            <template v-if="selectedTier === 'premium'"> • 2x exposure</template>
          </p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold font-mono text-foreground">
            ${{ getDisplayPrice(selectedAdType, selectedTier) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
