<!--
  @file AccountJobAlerts.vue
  @description Manage job alert subscriptions
-->
<script setup lang="ts">
const { email } = useUserProfile()

// Fetch job alerts for this user via API
const { data: jobAlerts, status } = useAsyncData(
  'job-alerts',
  async () => {
    if (!email.value) return []
    return await $fetch<Array<{
      id: string
      isActive: boolean
      frequency?: string
      keywords?: string[]
      locations?: string[]
      clearanceLevels?: string[]
      mosCodes?: string[]
    }>>('/api/users/job-alerts', {
      query: { email: email.value },
    })
  },
  {
    watch: [email],
    default: () => [],
  }
)

const isLoading = computed(() => status.value === 'pending')

// Format frequency
const formatFrequency = (freq?: string) => {
  switch (freq) {
    case 'daily': return 'Daily'
    case 'weekly': return 'Weekly'
    case 'instant': return 'Instant'
    default: return 'Weekly'
  }
}

// Get frequency icon
const getFrequencyIcon = (freq?: string) => {
  switch (freq) {
    case 'daily': return 'mdi:calendar-today'
    case 'instant': return 'mdi:lightning-bolt'
    default: return 'mdi:calendar-week'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Job Alerts</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Get notified when new jobs match your criteria
        </p>
      </div>
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/jobs">
          <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
          Create Alert
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="p-4 border border-border">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 space-y-2">
            <div class="flex gap-2">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-5 w-24" />
            </div>
            <div class="flex gap-2 mt-3">
              <Skeleton class="h-6 w-20" />
              <Skeleton class="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!jobAlerts?.length" class="py-12 text-center">
      <Empty>
        <EmptyMedia>
          <Icon name="mdi:bell-outline" class="size-12 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle>No job alerts set up</EmptyTitle>
        <EmptyDescription>
          Create a job alert to get notified when new jobs match your search criteria.
        </EmptyDescription>
      </Empty>
      <Button class="mt-6" as-child>
        <NuxtLink to="/jobs">Search Jobs</NuxtLink>
      </Button>
    </div>

    <!-- Job alerts list -->
    <div v-else class="space-y-3">
      <div 
        v-for="alert in jobAlerts" 
        :key="alert.id"
        class="p-4 border border-border"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <!-- Status & Frequency -->
            <div class="flex items-center gap-3">
              <Badge 
                :variant="alert.isActive ? 'default' : 'secondary'" 
                class="text-xs"
              >
                <span 
                  class="w-1.5 h-1.5 rounded-full mr-1.5"
                  :class="alert.isActive ? 'bg-green-500' : 'bg-muted-foreground'"
                />
                {{ alert.isActive ? 'Active' : 'Paused' }}
              </Badge>
              <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon :name="getFrequencyIcon(alert.frequency)" class="size-4" />
                {{ formatFrequency(alert.frequency) }} digest
              </span>
            </div>
            
            <!-- Alert Criteria -->
            <div class="mt-3 flex flex-wrap gap-2">
              <!-- Keywords -->
              <Badge 
                v-for="keyword in (alert.keywords || [])" 
                :key="keyword" 
                variant="outline"
                class="font-normal"
              >
                <Icon name="mdi:text-search" class="size-3 mr-1" />
                {{ keyword }}
              </Badge>

              <!-- Locations -->
              <Badge 
                v-for="location in (alert.locations || [])" 
                :key="location" 
                variant="outline"
                class="font-normal"
              >
                <Icon name="mdi:map-marker" class="size-3 mr-1" />
                {{ location }}
              </Badge>

              <!-- Clearance Levels -->
              <Badge 
                v-for="clearance in (alert.clearanceLevels || [])" 
                :key="clearance" 
                variant="outline"
                class="font-normal"
              >
                <Icon name="mdi:shield" class="size-3 mr-1" />
                {{ clearance }}
              </Badge>

              <!-- MOS Codes -->
              <Badge 
                v-for="mos in (alert.mosCodes || [])" 
                :key="mos" 
                variant="outline"
                class="font-normal"
              >
                <Icon name="mdi:badge-account" class="size-3 mr-1" />
                {{ mos }}
              </Badge>

              <!-- All Jobs -->
              <span 
                v-if="!alert.keywords?.length && !alert.locations?.length && !alert.clearanceLevels?.length && !alert.mosCodes?.length" 
                class="text-sm text-muted-foreground"
              >
                <Icon name="mdi:checkbox-multiple-marked" class="size-4 inline mr-1" />
                All new jobs
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Help text -->
      <div class="flex items-start gap-2 p-3 bg-muted/30 text-sm text-muted-foreground">
        <Icon name="mdi:information-outline" class="size-4 shrink-0 mt-0.5" />
        <p>
          To create new alerts, use the "Get Job Alerts" option when searching for jobs.
          You can customize keywords, locations, clearance levels, and MOS codes.
        </p>
      </div>

      <!-- Count -->
      <p class="text-xs text-muted-foreground text-center pt-2">
        {{ jobAlerts.length }} alert{{ jobAlerts.length === 1 ? '' : 's' }} configured
      </p>
    </div>
  </div>
</template>
