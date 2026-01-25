<!--
  @file Job details card (location, security, contract, posting)
  @usage <JobDetailsCard :job="job" :location-display="locationDisplay" />
-->

<script setup lang="ts">
import type { JobDetail } from '@/app/types/job.types'

const props = defineProps<{
  job: JobDetail
  locationDisplay: string
  hasContractInfo: boolean
  hasPostingInfo: boolean
}>()

const { formatDate } = useJobs()
</script>

<template>
  <Card class="border-none bg-sidebar overflow-hidden">
    <CardContent class="p-0">
      <!-- Location Section -->
      <div class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Location</span>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">City</span>
            <span class="text-foreground font-medium">{{ locationDisplay }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Region</span>
            <span class="text-foreground font-medium">{{ job.location.region }}</span>
          </div>
          <div v-if="job.location.theater" class="flex justify-between">
            <span class="text-muted-foreground">Theater</span>
            <span class="text-foreground font-medium">{{ job.location.theater }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Work Type</span>
            <span class="text-foreground font-medium">{{ job.location.type?.replace('_', ' ') }}</span>
          </div>
          <div v-if="job.location.travelPercent" class="flex justify-between">
            <span class="text-muted-foreground">Travel</span>
            <span class="text-foreground font-medium">{{ job.location.travelPercent }}%</span>
          </div>
        </div>
      </div>

      <!-- Security Section -->
      <div class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Security</span>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Clearance</span>
            <span class="text-foreground font-medium">{{ job.clearance.level }}</span>
          </div>
          <div v-if="job.clearance.polygraph && job.clearance.polygraph !== 'NONE'" class="flex justify-between">
            <span class="text-muted-foreground">Polygraph</span>
            <span class="text-foreground font-medium">{{ job.clearance.polygraph }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Active Required</span>
            <span class="text-foreground font-medium">{{ job.clearance.activeRequired ? 'Yes' : 'No' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">US Citizenship</span>
            <span class="text-foreground font-medium">{{
              job.clearance.usCitizenshipRequired ? 'Required' : 'Not Required'
            }}</span>
          </div>
          <div v-if="job.clearance.sponsorAvailable" class="flex justify-between">
            <span class="text-muted-foreground">Sponsorship</span>
            <span class="text-foreground font-medium">Available</span>
          </div>
        </div>
      </div>

      <!-- Contract Section -->
      <div v-if="hasContractInfo" class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Contract</span>
        <div class="space-y-2 text-xs">
          <div v-if="job.contract.type" class="flex justify-between">
            <span class="text-muted-foreground">Type</span>
            <span class="text-foreground font-medium">{{ job.contract.type.replace('_', ' ') }}</span>
          </div>
          <div v-if="job.contract.programOrMission" class="flex justify-between">
            <span class="text-muted-foreground">Program</span>
            <span class="text-foreground font-medium text-right max-w-[140px] truncate">{{
              job.contract.programOrMission
            }}</span>
          </div>
          <div v-if="job.contract.vehicleOrIDIQ" class="flex justify-between">
            <span class="text-muted-foreground">Vehicle</span>
            <span class="text-foreground font-medium">{{ job.contract.vehicleOrIDIQ }}</span>
          </div>
          <div v-if="job.contract.durationMonths" class="flex justify-between">
            <span class="text-muted-foreground">Duration</span>
            <span class="text-foreground font-medium">{{ job.contract.durationMonths }} months</span>
          </div>
        </div>
      </div>

      <!-- Posting Info -->
      <div v-if="hasPostingInfo || job.postedAt" class="p-4">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Posting</span>
        <div class="space-y-2 text-xs">
          <div v-if="job.posting?.datePosted || job.postedAt" class="flex justify-between">
            <span class="text-muted-foreground">Posted</span>
            <span class="text-foreground font-medium">{{
              job.posting?.datePosted || (job.postedAt ? formatDate(job.postedAt) : '')
            }}</span>
          </div>
          <div v-if="job.posting?.validThrough" class="flex justify-between">
            <span class="text-muted-foreground">Expires</span>
            <span class="text-foreground font-medium">{{ job.posting.validThrough }}</span>
          </div>
          <div v-if="job.posting?.shift && job.posting.shift !== 'NOT_STATED'" class="flex justify-between">
            <span class="text-muted-foreground">Shift</span>
            <span class="text-foreground font-medium">{{ job.posting.shift }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

