<!--
  @file Job military crosswalk card
  @usage <JobMilitaryCrosswalkCard :military-mapping="militaryMapping" />
-->

<script setup lang="ts">
import type { JobMilitaryMapping } from '@/app/types/job.types'

defineProps<{
  militaryMapping: JobMilitaryMapping
}>()
</script>

<template>
  <Card class="border-none bg-sidebar overflow-hidden">
    <CardHeader class="px-4 py-3 border-b border-border/30">
      <CardTitle class="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Military Crosswalk
      </CardTitle>
    </CardHeader>
    <CardContent class="p-4 space-y-4">
      <div v-if="militaryMapping?.mos?.length">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Army MOS</div>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="m in militaryMapping.mos" :key="m" variant="soft">
            {{ m }}
          </Badge>
        </div>
      </div>
      <div v-if="militaryMapping?.afsc?.length">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Air Force AFSC</div>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="a in militaryMapping.afsc" :key="a" variant="soft">
            {{ a }}
          </Badge>
        </div>
      </div>
      <div v-if="militaryMapping?.necOrRating?.length">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Navy NEC/Rating</div>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="n in militaryMapping.necOrRating" :key="n" variant="soft">
            {{ n }}
          </Badge>
        </div>
      </div>
      <div v-if="militaryMapping?.billetKeywords?.length">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Keywords</div>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="b in militaryMapping.billetKeywords" :key="b" variant="soft">
            {{ b }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

