<!--
  @file Job detail sidebar
  @usage <JobDetailSidebar :job="job" :location-display="locationDisplay" ... />
-->

<script setup lang="ts">
import type { JobDetail } from '@/app/types/job.types'

defineProps<{
  job: JobDetail
  locationDisplay: string
  hasMilitaryMapping: boolean
  hasContractInfo: boolean
  hasPostingInfo: boolean
}>()
</script>

<template>
  <div class="lg:w-80 shrink-0">
    <div class="lg:sticky lg:top-4 space-y-6">
      <!-- Apply CTA (desktop only) -->
      <JobApplyCard 
        :job-id="job.id"
        :job-title="job.title"
        :company="job.company" 
        :source-url="job.sourceUrl" 
      />

      <!-- Job Details Card -->
      <JobDetailsCard
        :job="job"
        :location-display="locationDisplay"
        :has-contract-info="hasContractInfo"
        :has-posting-info="hasPostingInfo"
      />

      <!-- Military Crosswalk -->
      <JobMilitaryCrosswalkCard
        v-if="hasMilitaryMapping"
        :military-mapping="job.militaryMapping!"
      />

      <!-- Similar Jobs -->
      <SimilarJobs :job-id="job.id" />
    </div>
  </div>
</template>

