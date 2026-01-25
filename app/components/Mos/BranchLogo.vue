<!--
  @file Branch logo component
  @usage <BranchLogo branch="Army" size="sm" />
  @description Displays military branch emblem based on branch name
-->

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Branch name (Army, Navy, Air Force, Marine Corps, etc.) */
  branch?: string | null
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  size: 'sm'
})

const branchLogos: Record<string, string> = {
  'army': '/logos/branches/army.svg',
  'navy': '/logos/branches/navy.svg',
  'air_force': '/logos/branches/air_force.svg',
  'air force': '/logos/branches/air_force.svg',
  'airforce': '/logos/branches/air_force.svg',
  'marine': '/logos/branches/marines.svg',
  'marine_corps': '/logos/branches/marines.svg',
  'marine corps': '/logos/branches/marines.svg',
  'marinecorps': '/logos/branches/marines.svg',
  'marines': '/logos/branches/marines.svg',
  'space_force': '/logos/branches/space_force.svg',
  'space force': '/logos/branches/space_force.svg',
  'spaceforce': '/logos/branches/space_force.svg',
  'coast_guard': '/logos/branches/coast_guard.svg',
  'coast guard': '/logos/branches/coast_guard.svg',
  'coastguard': '/logos/branches/coast_guard.svg',
}

const logoPath = computed(() => {
  if (!props.branch) return null
  const key = props.branch.toLowerCase().trim()
  return branchLogos[key] || null
})

const sizeClasses: Record<string, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const sizeClass = computed(() => sizeClasses[props.size])
</script>

<template>
  <img 
    v-if="logoPath"
    :src="logoPath" 
    :alt="branch || 'Military branch'"
    class="object-contain"
    :class="sizeClass"
  />
  <Icon 
    v-else 
    name="mdi:account" 
    :class="sizeClass" 
    class="text-muted-foreground"
  />
</template>

