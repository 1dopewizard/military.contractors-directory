<!--
  @file Job filters component
  @usage <JobFilters v-model="filters" :mos-code="mosCode" />
  @description Advanced filtering for job listings (clearance, region, pay, etc.)
-->

<script setup lang="ts">
import type { MosJobFilters } from '@/app/types/app.types'
import { MatchStrength } from '@/app/types/mos.types'

const props = defineProps<{
  mosCode?: string
}>()

const filters = defineModel<MosJobFilters>({ required: true })

const logger = useLogger('JobFilters')

// Available filter options
const clearances = ['None', 'Secret', 'TS', 'TS/SCI', 'TS/SCI with Poly']
const locationTypes = ['On-base', 'Deployed', 'Remote', 'Hybrid']
const matchStrengths = [
  { value: MatchStrength.STRONG, label: 'Strong Match' },
  { value: MatchStrength.MEDIUM, label: 'Good Match' },
  { value: MatchStrength.WEAK, label: 'Potential Match' }
]

// Filter state
const isExpanded = ref(false)

// Active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.location_type) count++
  if (filters.value.theater) count++
  if (filters.value.clearance_required) count++
  if (filters.value.salary_min) count++
  if (filters.value.work_location_type) count++
  if (filters.value.match_strength) count++
  return count
})

// Clear all filters
const clearFilters = () => {
  logger.info('Clearing all filters')
  filters.value = {}
}

// Clear individual filter
const clearFilter = (key: keyof MosJobFilters) => {
  const newFilters = { ...filters.value }
  delete newFilters[key]
  filters.value = newFilters
}

// Watch for filter changes
watch(filters, (newFilters) => {
  logger.debug({ filters: newFilters }, 'Filters updated')
}, { deep: true })
</script>

<template>
  <Card>
    <CardHeader 
      class="cursor-pointer" 
      data-expand-filters
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CardTitle class="text-base">
            <Icon name="mdi:tune" class="w-4 h-4 inline mr-2" />
            Advanced Filters
          </CardTitle>
          <Badge v-if="activeFilterCount > 0" variant="secondary" class="text-xs">
            {{ activeFilterCount }} active
          </Badge>
        </div>
        <Icon 
          :name="isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
          class="w-5 h-5 text-muted-foreground transition-transform"
        />
      </div>
    </CardHeader>
    
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[1000px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-[1000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <CardContent v-if="isExpanded" class="space-y-6">
        <!-- Note about quick filters -->
        <Alert v-if="mosCode" class="py-2">
          <Icon name="mdi:information-outline" class="w-4 h-4" />
          <AlertDescription class="text-xs">
            Common filters (Clearance, Location, Theater) are available above the job list for quick access.
          </AlertDescription>
        </Alert>

        <!-- Work Location Type -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">
              <Icon name="mdi:office-building" class="w-4 h-4 inline mr-1" />
              Work Location
            </Label>
            <Button
              v-if="filters.work_location_type"
              variant="ghost"
              size="sm"
              class="h-auto p-1 text-xs"
              @click="clearFilter('work_location_type')"
            >
              Clear
            </Button>
          </div>
          <Select v-model="filters.work_location_type">
            <SelectTrigger>
              <SelectValue placeholder="Any location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="locationType in locationTypes" 
                :key="locationType"
                :value="locationType"
              >
                {{ locationType }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Salary Filter -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">
              <Icon name="mdi:currency-usd" class="w-4 h-4 inline mr-1" />
              Minimum Salary (USD)
            </Label>
            <Button
              v-if="filters.salary_min"
              variant="ghost"
              size="sm"
              class="h-auto p-1 text-xs"
              @click="clearFilter('salary_min')"
            >
              Clear
            </Button>
          </div>
          <Input
            v-model.number="filters.salary_min"
            type="number"
            placeholder="e.g., 80000"
            step="5000"
            min="0"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            class="flex-1"
            :disabled="activeFilterCount === 0"
            @click="clearFilters"
          >
            <Icon name="mdi:filter-off" class="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Transition>
  </Card>
</template>

