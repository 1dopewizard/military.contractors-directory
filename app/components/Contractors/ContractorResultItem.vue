<!--
  @file Contractor result item
  @description Card component for displaying contractor in browse/search results
-->

<script setup lang="ts">
const props = defineProps<{
  contractor: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    defenseNewsRank?: number | null;
    headquarters?: string | null;
    defenseRevenue?: number | null;
    totalRevenue?: number | null;
    defenseRevenuePercent?: number | null;
    logoUrl?: string | null;
    primarySpecialty?: {
      slug: string;
      name: string | null;
    } | null;
  };
}>();

const contractorLink = computed(() => `/${props.contractor.slug}`);

// Format revenue for display (already in billions from API)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return "N/A";
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`;
  }
  // Convert to millions for smaller values
  const millions = revenue * 1000;
  return `$${millions.toFixed(0)}M`;
};
</script>

<template>
  <NuxtLink
    :to="contractorLink"
    class="group hover:bg-card/50 hover:border-primary/30 relative block border border-transparent px-4 py-4 transition-all duration-150"
  >
    <article class="flex gap-4">
      <!-- Content -->
      <div class="min-w-0 flex-1 space-y-2">
        <!-- Name row -->
        <div class="flex items-start justify-between gap-4">
          <h3
            class="text-foreground group-hover:text-primary truncate text-base leading-snug font-semibold transition-colors md:text-lg"
          >
            {{ contractor.name }}
          </h3>
        </div>

        <!-- Stats row -->
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
        >
          <span v-if="contractor.defenseRevenue != null" class="font-medium">
            {{ formatRevenue(contractor.defenseRevenue) }} Defense
          </span>
          <span v-if="contractor.headquarters" class="flex items-center gap-1">
            <Icon name="mdi:map-marker-outline" class="h-3.5 w-3.5" />
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
          class="text-muted-foreground line-clamp-2 text-sm leading-relaxed"
        >
          {{ contractor.description }}
        </p>
      </div>

      <!-- Logo -->
      <div class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center">
        <img
          v-if="contractor.logoUrl"
          :src="contractor.logoUrl"
          :alt="contractor.name"
          class="h-full w-full object-contain"
        />
        <span v-else class="text-muted-foreground text-lg font-bold">
          {{ contractor.name?.charAt(0) }}
        </span>
      </div>
    </article>
  </NuxtLink>
</template>
