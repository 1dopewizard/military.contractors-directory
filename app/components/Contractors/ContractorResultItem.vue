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

const contractorLink = computed(() => `/companies/${props.contractor.slug}`)

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
    class="group block relative hover:bg-card/50 px-4 py-4 border border-transparent hover:border-primary/30 transition-all duration-150"
  >
    <article class="flex gap-4">
      <!-- Content -->
      <div class="flex-1 space-y-2 min-w-0">
        <!-- Name row -->
        <div class="flex justify-between items-start gap-4">
          <h3 class="font-semibold text-foreground group-hover:text-primary text-base md:text-lg truncate leading-snug transition-colors">
            {{ contractor.name }}
          </h3>
        </div>

        <!-- Stats row -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
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
          class="text-muted-foreground text-sm line-clamp-2 leading-relaxed"
        >
          {{ contractor.description }}
        </p>
      </div>

      <!-- Logo -->
      <div class="flex justify-center items-center bg-muted w-12 h-12 shrink-0">
        <img 
          v-if="contractor.logoUrl" 
          :src="contractor.logoUrl" 
          :alt="contractor.name"
          class="w-full h-full object-contain"
        />
        <span v-else class="font-bold text-muted-foreground text-lg">
          {{ contractor.name?.charAt(0) }}
        </span>
      </div>
    </article>
  </NuxtLink>
</template>
