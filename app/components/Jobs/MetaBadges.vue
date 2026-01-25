<!--
  @file Shared job metadata badges component
  @usage <MetaBadges location="Arlington, VA" location-type="Hybrid" clearance="TS/SCI" />
  @description Consistent badge display for location type and clearance across job listings
-->

<script setup lang="ts">
const props = defineProps<{
  /** Location string (e.g., "Arlington, VA") */
  location?: string
  /** Location type for badge (CONUS, OCONUS, Remote, Hybrid) */
  locationType?: string | null
  /** Clearance level for badge */
  clearance?: string | null
  /** Whether this is OCONUS (alternative to locationType) */
  isOconus?: boolean | null
  /** Hide the location text (useful when parent handles location display) */
  hideLocation?: boolean
}>()

// Location type badge with consistent colors
const locationTypeBadge = computed(() => {
  // Check isOconus flag first (from regular job listings)
  if (props.isOconus) {
    return { label: 'OCONUS', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  }
  
  // Check locationType string (from sponsored jobs)
  const type = props.locationType
  if (type === 'OCONUS') return { label: 'OCONUS', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  if (type === 'Remote') return { label: 'Remote', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (type === 'Hybrid') return { label: 'Hybrid', class: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' }
  if (type === 'CONUS') return { label: 'CONUS', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
  
  // Default to CONUS for regular job listings (when location is provided but no explicit type)
  if (props.location) return { label: 'CONUS', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
  
  return null
})
</script>

<template>
  <!-- Prefix slot (e.g., company name) -->
  <slot name="prefix" />
  
  <!-- Location text -->
  <span v-if="location && !hideLocation" class="text-muted-foreground">{{ location }}</span>
  
  <!-- Location type badge -->
  <Badge 
    v-if="locationTypeBadge"
    variant="soft" 
    class="border-0"
    :class="locationTypeBadge.class"
  >
    {{ locationTypeBadge.label }}
  </Badge>
  
  <!-- Clearance badge -->
  <Badge 
    v-if="clearance"
    variant="soft"
    class="border-0"
  >
    {{ clearance }}
  </Badge>
  
  <!-- Suffix slot (e.g., salary) -->
  <slot name="suffix" />
  
  <!-- Default slot for additional content -->
  <slot />
</template>

