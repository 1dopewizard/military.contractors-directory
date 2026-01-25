<!--
  @file Job family card component
  @usage <JobFamilyCard :family="family" :mos-code="mosCode" />
  @description Displays a job family/role cluster with typical pay and clearance
-->

<script setup lang="ts">
import type { JobFamily } from '@/app/types/mos.types'

const props = defineProps<{
  family: JobFamily
  mosCode?: string
}>()

const emit = defineEmits<{
  select: [familyId: string]
}>()

const logger = useLogger('JobFamilyCard')

// Format salary range
const formatSalary = (min: number | null | undefined, max: number | null | undefined): string => {
  if (!min && !max) return 'Varies'
  if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`
  if (min) return `$${(min / 1000).toFixed(0)}K+`
  return 'Varies'
}

const handleClick = () => {
  logger.info({ familyId: props.family.id, mosCode: props.mosCode }, 'Job family selected')
  emit('select', props.family.id)
}
</script>

<template>
  <Card class="hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer bg-card group flex flex-col h-full" @click="handleClick">
    <CardContent class="p-5 flex flex-col h-full gap-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
          {{ family.name }}
        </h3>
        <Icon name="mdi:arrow-right" class="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      <!-- Description -->
      <p class="text-sm text-muted-foreground line-clamp-2 flex-1">
        {{ family.description }}
      </p>

      <!-- Stats -->
      <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div v-if="family.typical_clearance" class="flex items-center gap-1.5">
          <Icon name="mdi:shield-check" class="w-4 h-4 opacity-70" />
          <span>{{ family.typical_clearance }}</span>
        </div>
        <div v-if="family.typical_pay_min || family.typical_pay_max" class="flex items-center gap-1.5">
          <Icon name="mdi:currency-usd" class="w-4 h-4 opacity-70" />
          <span class="font-mono text-xs">
            {{ formatSalary(family.typical_pay_min, family.typical_pay_max) }}
          </span>
        </div>
      </div>

      <!-- Footer: Related MOSes -->
      <div v-if="family.mos_codes.length > 0" class="pt-3 border-t border-border/50 mt-auto">
         <div class="flex flex-wrap gap-1.5">
            <Badge 
              v-for="code in family.mos_codes.slice(0, 4)" 
              :key="code"
              variant="secondary"
              class="text-[10px] font-mono bg-muted/50 text-muted-foreground"
            >
              {{ code }}
            </Badge>
             <span v-if="family.mos_codes.length > 4" class="text-[10px] text-muted-foreground self-center px-1">
              +{{ family.mos_codes.length - 4 }}
            </span>
         </div>
      </div>
    </CardContent>
  </Card>
</template>

