<!--
  @file Dashboard/Advertiser/AdvertiserStats.vue
  @description Stats cards for advertiser dashboard
-->

<script setup lang="ts">
interface Stats {
  total: number;
  active: number;
  pending: number;
  draft: number;
  totalImpressions: number;
  totalClicks: number;
}

interface Props {
  stats: Stats;
  ctr: string;
}

defineProps<Props>();
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    <Card class="border border-transparent bg-transparent p-4">
      <p class="text-foreground font-mono text-2xl font-bold">
        {{ stats.total }}
      </p>
      <p class="text-muted-foreground text-xs">Total Ads</p>
    </Card>
    <Card class="border border-transparent bg-transparent p-4">
      <p
        class="font-mono text-2xl font-bold text-green-600 dark:text-green-400"
      >
        {{ stats.active }}
      </p>
      <p class="text-muted-foreground text-xs">Active</p>
    </Card>
    <Card class="border border-transparent bg-transparent p-4">
      <p
        class="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400"
      >
        {{ stats.pending }}
      </p>
      <p class="text-muted-foreground text-xs">Pending</p>
    </Card>
    <Card class="border border-transparent bg-transparent p-4">
      <p class="text-muted-foreground font-mono text-2xl font-bold">
        {{ stats.draft }}
      </p>
      <p class="text-muted-foreground text-xs">Drafts</p>
    </Card>
    <Card class="border border-transparent bg-transparent p-4">
      <p class="text-foreground font-mono text-2xl font-bold">
        {{ stats.totalImpressions.toLocaleString() }}
      </p>
      <p class="text-muted-foreground text-xs">Impressions</p>
    </Card>
    <Card class="border border-transparent bg-transparent p-4">
      <p class="text-primary font-mono text-2xl font-bold">{{ ctr }}%</p>
      <p class="text-muted-foreground text-xs">CTR</p>
    </Card>
  </div>
</template>
