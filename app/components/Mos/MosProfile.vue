<!--
  @file MOS Profile card component
  @usage <MosProfile :mos="resolvedMos" :variants="mosVariants" result-label="companies" @select-branch="handleBranch" />
  @description Displays MOS details and match count in the sidebar
-->

<script setup lang="ts">
import type { ResolvedMos } from '@/app/types/search.types'

interface MosVariant {
  code: string
  branch: string
  title: string
}

const props = withDefaults(defineProps<{
  mos: ResolvedMos
  variants?: MosVariant[]
  /** Label for the result count (e.g., "jobs" or "companies") */
  resultLabel?: string
}>(), {
  resultLabel: 'companies'
})

const emit = defineEmits<{
  (e: 'selectBranch', branch: string): void
}>()

const config = useRuntimeConfig()

// Helper to get branch slug for directory URL
const getBranchSlug = (branch: string): string => {
  const slugMap: Record<string, string> = {
    'Army': 'army',
    'Navy': 'navy',
    'Air Force': 'air-force',
    'Marine Corps': 'marines',
    'Coast Guard': 'coast-guard',
    'Space Force': 'space-force'
  }
  return slugMap[branch] || 'army'
}

// Get result count (supports both company_count and legacy job_count)
const resultCount = computed(() => {
  const mos = props.mos as ResolvedMos & { job_count?: number }
  return mos.company_count ?? mos.job_count ?? 0
})

const handleBranchSelect = (branch: string) => {
  emit('selectBranch', branch.toLowerCase().replace(' ', '_'))
}
</script>

<template>
  <Card class="border-none bg-sidebar overflow-hidden">
    <CardContent class="p-0">
      <!-- MOS Header Section -->
      <div class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">MOS Profile</span>
        
        <!-- Branch Toggle (when MOS exists in multiple branches) -->
        <div v-if="variants && variants.length > 1" class="flex gap-1 mb-3">
          <Button
            v-for="variant in variants"
            :key="variant.branch"
            :variant="variant.branch === mos.branch ? 'default' : 'ghost'"
            size="xs"
            class="h-7 px-2 text-xs"
            @click="handleBranchSelect(variant.branch)"
          >
            {{ variant.branch }}
          </Button>
        </div>
        
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="soft">{{ mos.branch }}</Badge>
          <Badge v-if="mos.is_it_cyber" variant="soft">IT/Cyber</Badge>
          <Badge v-else variant="soft">{{ mos.category || 'Other' }}</Badge>
        </div>
        <h3 class="text-2xl font-mono font-bold text-foreground">{{ mos.code }}</h3>
        <p class="text-xs text-muted-foreground">{{ mos.title }}</p>
        <p v-if="mos.description" class="text-xs text-muted-foreground line-clamp-3 mt-2">
          {{ mos.description }}
        </p>
      </div>
      
      <!-- Match Count Section -->
      <div class="p-4 border-b border-border/30">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Matching {{ resultLabel }}</span>
          <span class="text-foreground font-medium font-mono">{{ resultCount }}</span>
        </div>
      </div>
      
      <!-- Skills & Certs Section -->
      <div v-if="mos.core_skills?.length || mos.common_certs?.length" class="p-4 border-b border-border/30">
        <div v-if="mos.core_skills?.length" class="mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Core Skills</span>
          <div class="flex flex-wrap gap-1">
            <Badge v-for="skill in mos.core_skills.slice(0, 5)" :key="skill" variant="soft" class="text-xs">
              {{ skill }}
            </Badge>
            <span v-if="mos.core_skills.length > 5" class="text-xs text-muted-foreground self-center">
              +{{ mos.core_skills.length - 5 }}
            </span>
          </div>
        </div>
        <div v-if="mos.common_certs?.length">
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Common Certs</span>
          <div class="flex flex-wrap gap-1">
            <Badge v-for="cert in mos.common_certs.slice(0, 4)" :key="cert" variant="soft" class="text-xs">
              {{ cert }}
            </Badge>
            <span v-if="mos.common_certs.length > 4" class="text-xs text-muted-foreground self-center">
              +{{ mos.common_certs.length - 4 }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Action Section -->
      <div class="p-4">
        <Button as-child variant="ghost" size="sm" class="w-full">
          <a :href="`${config.public.directoryUrl}/${getBranchSlug(mos.branch)}/${mos.code}`" target="_blank" rel="noopener">
            View Full Profile
            <Icon name="mdi:open-in-new" class="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

