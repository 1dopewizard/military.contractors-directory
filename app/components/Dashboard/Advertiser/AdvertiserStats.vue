<!--
  @file Dashboard/Advertiser/AdvertiserStats.vue
  @description Stats cards for advertiser dashboard
-->

<script setup lang="ts">
interface Stats {
  total: number
  active: number
  pending: number
  draft: number
  totalImpressions: number
  totalClicks: number
}

interface Props {
  stats: Stats
  ctr: string
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-foreground">{{ stats.total }}</p>
      <p class="text-xs text-muted-foreground">Total Ads</p>
    </Card>
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-green-600 dark:text-green-400">{{ stats.active }}</p>
      <p class="text-xs text-muted-foreground">Active</p>
    </Card>
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{{ stats.pending }}</p>
      <p class="text-xs text-muted-foreground">Pending</p>
    </Card>
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-muted-foreground">{{ stats.draft }}</p>
      <p class="text-xs text-muted-foreground">Drafts</p>
    </Card>
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalImpressions.toLocaleString() }}</p>
      <p class="text-xs text-muted-foreground">Impressions</p>
    </Card>
    <Card class="p-4 bg-transparent border border-transparent">
      <p class="text-2xl font-bold font-mono text-primary">{{ ctr }}%</p>
      <p class="text-xs text-muted-foreground">CTR</p>
    </Card>
  </div>
</template>
