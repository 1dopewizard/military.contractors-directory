<!--
  @file Contractor result item
  @description Card component for displaying contractor in browse/search results
-->

<script setup lang="ts">
const props = defineProps<{
  contractor: {
    id: string
    slug: string
    name: string
    description?: string | null
    defenseNewsRank?: number | null
    headquarters?: string | null
    defenseRevenue?: number | null
    totalRevenue?: number | null
    defenseRevenuePercent?: number | null
    logoUrl?: string | null
    primarySpecialty?: {
      slug: string
      name: string | null
    } | null
  }
}>()

const contractorLink = computed(() => `/contractors/${props.contractor.slug}`)

// Format revenue for display (already in billions from API)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return 'N/A'
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`
  }
  // Convert to millions for smaller values
  const millions = revenue * 1000
  return `$${millions.toFixed(0)}M`
}
</script>

<template>
  <NuxtLink
    :to="contractorLink"
    class="block group relative px-4 py-4 border border-border/30 bg-card/30 transition-all duration-150 hover:border-primary/30 hover:bg-card/50"
  >
    <article class="flex gap-4">
      <!-- Logo -->
      <div class="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
        <img 
          v-if="contractor.logoUrl" 
          :src="contractor.logoUrl" 
          :alt="contractor.name"
          class="w-full h-full object-contain rounded"
        />
        <span v-else class="text-lg font-bold text-muted-foreground">
          {{ contractor.name?.charAt(0) }}
        </span>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0 space-y-2">
        <!-- Name + Rank row -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <h3 class="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
              {{ contractor.name }}
            </h3>
            <Badge v-if="contractor.defenseNewsRank" variant="default" class="text-xs font-bold shrink-0">
              #{{ contractor.defenseNewsRank }}
            </Badge>
          </div>
        </div>

      <!-- Stats row -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span v-if="contractor.defenseRevenue != null" class="font-medium">
          {{ formatRevenue(contractor.defenseRevenue) }} Defense
        </span>
        <span v-if="contractor.headquarters" class="flex items-center gap-1">
          <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5" />
          {{ contractor.headquarters }}
        </span>
      </div>

      <!-- Primary Specialty -->
      <div v-if="contractor.primarySpecialty" class="flex items-center gap-2">
        <Badge variant="outline" class="text-xs">
          {{ contractor.primarySpecialty.name }}
        </Badge>
      </div>

        <!-- Description snippet -->
        <p
          v-if="contractor.description"
          class="text-sm text-muted-foreground leading-relaxed line-clamp-2"
        >
          {{ contractor.description }}
        </p>
      </div>
    </article>
  </NuxtLink>
</template>
