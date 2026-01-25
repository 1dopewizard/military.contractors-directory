<!--
  @file AdminAdReview.vue
  @description Admin dashboard ad review queue tab
-->
<script setup lang="ts">
import type { FeaturedAd, FeaturedJob } from '@/app/types/ad.types'
import AdReviewCard from './AdReviewCard.vue'

interface Props {
  pendingItems: Array<{ type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }>
}

defineProps<Props>()

const emit = defineEmits<{
  approve: [id: string, type: 'ad' | 'job']
  reject: [id: string, type: 'ad' | 'job', reason: string]
}>()

// Handlers to re-emit from AdReviewCard's object format to separate args
const onApprove = (payload: { id: string; type: 'ad' | 'job' }) => {
  emit('approve', payload.id, payload.type)
}

const onReject = (payload: { id: string; type: 'ad' | 'job'; reason: string }) => {
  emit('reject', payload.id, payload.type, payload.reason)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Pending Review</h2>
      <span class="text-sm text-muted-foreground">{{ pendingItems.length }} ads waiting</span>
    </div>

    <div v-if="pendingItems.length === 0" class="text-center py-12">
      <Icon name="mdi:check-circle-outline" class="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h3 class="font-semibold text-foreground mb-2">All caught up!</h3>
      <p class="text-sm text-muted-foreground">No ads waiting for review.</p>
    </div>

    <div v-else class="border-y border-border divide-y divide-border">
      <AdReviewCard
        v-for="item in pendingItems"
        :key="`${item.type}-${item.data.id}`"
        :item="item"
        @approve="onApprove"
        @reject="onReject"
      />
    </div>
  </div>
</template>

