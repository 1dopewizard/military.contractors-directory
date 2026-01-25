<!--
  @file Dashboard/Advertiser/AdvertiserCreateSuccess.vue
  @description Success state after creating an ad
-->

<script setup lang="ts">
import type { AdPlacementTier } from '@/app/types/ad.types'

type AdType = 'company_spotlight' | 'featured_job'

interface Props {
  adType: AdType
  tier: AdPlacementTier
}

interface Emits {
  (e: 'createAnother'): void
  (e: 'viewAds'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const getAdTypeLabel = (type: AdType) => {
  return type === 'company_spotlight' ? 'partner spotlight' : 'featured job'
}

const getTierLabel = (tier: AdPlacementTier) => {
  return tier === 'premium' ? 'premium' : 'standard'
}
</script>

<template>
  <section class="max-w-lg mx-auto">
    <Card class="border-primary/30 bg-primary/[0.02]">
      <CardContent class="py-12 text-center">
        <div class="flex items-center justify-center mx-auto mb-6">
          <Icon name="mdi:check-bold" class="w-10 h-10 text-green-600" />
        </div>
        <h2 class="text-2xl font-bold font-mono uppercase mb-2">Ad Created</h2>
        <p class="text-muted-foreground mb-2">
          Your {{ getTierLabel(tier) }} {{ getAdTypeLabel(adType) }} ad has been saved as a draft.
        </p>
        <p v-if="tier === 'premium'" class="text-sm text-primary mb-4">
          <Icon name="mdi:star" class="w-4 h-4 inline mr-1" />
          Premium placement: Your ad will receive 2x exposure.
        </p>
        <p class="text-sm text-muted-foreground mb-8">Payment integration coming soon. For now, contact us to activate your ad.</p>
        <div class="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="ghost" @click="emit('createAnother')">
            <Icon name="mdi:plus" class="w-4 h-4 mr-2" />Create Another
          </Button>
          <Button @click="emit('viewAds')">
            <Icon name="mdi:view-list" class="w-4 h-4 mr-2" />View My Ads
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
