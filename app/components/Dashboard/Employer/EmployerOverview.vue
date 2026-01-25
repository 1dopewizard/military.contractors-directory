<!--
  @file Employer Overview Component
  @description Dashboard home with stats and quick actions
-->
<script setup lang="ts">
interface Props {
  profile: {
    tier: string
    status: string
    verifiedAt: string | null
    contractor: {
      name: string
      slug: string
      description: string | null
    } | null
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [tab: string]
}>()

// Placeholder stats (would come from analytics API)
const stats = ref({
  views: 1234,
  viewsChange: 12,
  clicks: 156,
  clicksChange: 8,
  searchAppearances: 892,
  searchAppearancesChange: -3,
})

const quickActions = [
  { 
    id: 'profile', 
    label: 'Edit Profile', 
    icon: 'mdi:pencil-outline',
    description: 'Update company description and details'
  },
  { 
    id: 'content', 
    label: 'Manage Content', 
    icon: 'mdi:text-box-edit-outline',
    description: 'Add benefits, programs, and testimonials'
  },
  { 
    id: 'analytics', 
    label: 'View Analytics', 
    icon: 'mdi:chart-bar',
    description: 'See profile views and engagement'
  },
]
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Grid -->
    <div class="grid gap-4 sm:grid-cols-3">
      <Card class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">Profile Views</span>
          <Icon name="mdi:eye-outline" class="w-4 h-4 text-muted-foreground" />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{ stats.views.toLocaleString() }}</span>
          <span 
            :class="[
              'text-xs flex items-center',
              stats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'
            ]"
          >
            <Icon 
              :name="stats.viewsChange >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
              class="w-3 h-3" 
            />
            {{ Math.abs(stats.viewsChange) }}%
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-1">vs last month</p>
      </Card>

      <Card class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">Website Clicks</span>
          <Icon name="mdi:cursor-default-click-outline" class="w-4 h-4 text-muted-foreground" />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{ stats.clicks.toLocaleString() }}</span>
          <span 
            :class="[
              'text-xs flex items-center',
              stats.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'
            ]"
          >
            <Icon 
              :name="stats.clicksChange >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
              class="w-3 h-3" 
            />
            {{ Math.abs(stats.clicksChange) }}%
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-1">vs last month</p>
      </Card>

      <Card class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">Search Appearances</span>
          <Icon name="mdi:magnify" class="w-4 h-4 text-muted-foreground" />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{ stats.searchAppearances.toLocaleString() }}</span>
          <span 
            :class="[
              'text-xs flex items-center',
              stats.searchAppearancesChange >= 0 ? 'text-green-600' : 'text-red-600'
            ]"
          >
            <Icon 
              :name="stats.searchAppearancesChange >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
              class="w-3 h-3" 
            />
            {{ Math.abs(stats.searchAppearancesChange) }}%
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-1">vs last month</p>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <button
          v-for="action in quickActions"
          :key="action.id"
          class="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          @click="emit('navigate', action.id)"
        >
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon :name="action.icon" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="font-medium">{{ action.label }}</p>
            <p class="text-sm text-muted-foreground">{{ action.description }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Profile Completeness -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Profile Completeness</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Your profile is</span>
          <span class="font-medium">75% complete</span>
        </div>
        <Progress :model-value="75" class="h-2" />
        <div class="grid gap-2 sm:grid-cols-2 text-sm">
          <div class="flex items-center gap-2">
            <Icon name="mdi:check-circle" class="w-4 h-4 text-green-600" />
            <span>Basic information</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mdi:check-circle" class="w-4 h-4 text-green-600" />
            <span>Company description</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mdi:circle-outline" class="w-4 h-4 text-muted-foreground" />
            <span class="text-muted-foreground">Why Work Here section</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mdi:circle-outline" class="w-4 h-4 text-muted-foreground" />
            <span class="text-muted-foreground">Notable programs</span>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="emit('navigate', 'content')">
          Complete Your Profile
          <Icon name="mdi:arrow-right" class="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>

    <!-- Tier Info -->
    <Card v-if="profile.tier === 'claimed'" class="p-6 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <Icon name="mdi:star-outline" class="w-5 h-5 text-amber-600" />
        </div>
        <div class="flex-1">
          <h3 class="font-semibold mb-1">Upgrade to Premium</h3>
          <p class="text-sm text-muted-foreground mb-3">
            Get spotlight content blocks, employee testimonials, and priority placement in search results.
          </p>
          <Button size="sm" class="bg-amber-500 hover:bg-amber-600 text-white">
            Upgrade for $399/mo
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>
