<!--
  @file Employer Analytics Component
  @description Profile analytics display
-->
<script setup lang="ts">
interface Props {
  profile: {
    tier: string
    contractor: {
      name: string
    } | null
  }
}

const props = defineProps<Props>()

// Placeholder analytics data
const timeRange = ref('30d')
const timeRangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const stats = computed(() => ({
  views: { value: 1234, change: 12, label: 'Profile Views' },
  clicks: { value: 156, change: 8, label: 'Website Clicks' },
  ctr: { value: 12.6, change: -2, label: 'Click-through Rate', suffix: '%' },
  searchAppearances: { value: 892, change: 15, label: 'Search Appearances' },
}))

const topSources = ref([
  { source: 'Direct Search', views: 456, percentage: 37 },
  { source: 'Specialty Browse', views: 312, percentage: 25 },
  { source: 'Location Browse', views: 234, percentage: 19 },
  { source: 'Top Contractors List', views: 156, percentage: 13 },
  { source: 'Other', views: 76, percentage: 6 },
])

const topSearchTerms = ref([
  { term: 'aerospace defense contractor', count: 89 },
  { term: 'lockheed martin careers', count: 67 },
  { term: 'f-35 jobs', count: 45 },
  { term: 'defense contractor maryland', count: 34 },
  { term: 'security clearance jobs', count: 28 },
])
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold mb-1">Analytics</h2>
        <p class="text-sm text-muted-foreground">
          Track how job seekers interact with your profile
        </p>
      </div>
      <Select v-model="timeRange">
        <SelectTrigger class="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="option in timeRangeOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="(stat, key) in stats" :key="key" class="p-4">
        <p class="text-sm text-muted-foreground mb-1">{{ stat.label }}</p>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">
            {{ stat.value.toLocaleString() }}{{ stat.suffix || '' }}
          </span>
          <span 
            :class="[
              'text-xs flex items-center',
              stat.change >= 0 ? 'text-green-600' : 'text-red-600'
            ]"
          >
            <Icon 
              :name="stat.change >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
              class="w-3 h-3" 
            />
            {{ Math.abs(stat.change) }}%
          </span>
        </div>
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Views Over Time (Placeholder) -->
      <Card class="p-6">
        <h3 class="font-medium mb-4">Views Over Time</h3>
        <div class="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
          <div class="text-center">
            <Icon name="mdi:chart-line" class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm">Chart visualization coming soon</p>
          </div>
        </div>
      </Card>

      <!-- Traffic Sources -->
      <Card class="p-6">
        <h3 class="font-medium mb-4">Traffic Sources</h3>
        <div class="space-y-3">
          <div v-for="source in topSources" :key="source.source" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span>{{ source.source }}</span>
              <span class="text-muted-foreground">{{ source.views }} views</span>
            </div>
            <Progress :model-value="source.percentage" class="h-2" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Top Search Terms -->
    <Card class="p-6">
      <h3 class="font-medium mb-4">Top Search Terms</h3>
      <p class="text-sm text-muted-foreground mb-4">
        Search terms that led visitors to your profile
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left font-medium py-2">Search Term</th>
              <th class="text-right font-medium py-2">Appearances</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(term, index) in topSearchTerms" :key="term.term" class="border-b last:border-0">
              <td class="py-2">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground">{{ index + 1 }}.</span>
                  {{ term.term }}
                </div>
              </td>
              <td class="text-right py-2 text-muted-foreground">{{ term.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Premium Analytics Upsell -->
    <Card v-if="profile.tier === 'claimed'" class="p-6 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
      <div class="flex items-start gap-4">
        <Icon name="mdi:chart-box-outline" class="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-semibold mb-1">Advanced Analytics</h3>
          <p class="text-sm text-muted-foreground mb-3">
            Upgrade to Premium for detailed analytics including visitor demographics, 
            engagement trends, and competitive insights.
          </p>
          <Button size="sm" class="bg-amber-500 hover:bg-amber-600 text-white">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>
