<!--
  @file Dashboard/Advertiser/AdvertiserCreateSuccess.vue
  @description Success state after creating an ad
-->

<script setup lang="ts">
import type { AdPlacementTier } from "@/app/types/ad.types";

type AdType = "company_spotlight" | "featured_job";

interface Props {
  adType: AdType;
  tier: AdPlacementTier;
}

interface Emits {
  (e: "createAnother"): void;
  (e: "viewAds"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const getAdTypeLabel = (type: AdType) => {
  return type === "company_spotlight" ? "partner spotlight" : "featured job";
};

const getTierLabel = (tier: AdPlacementTier) => {
  return tier === "premium" ? "premium" : "standard";
};
</script>

<template>
  <section class="mx-auto max-w-lg">
    <Card class="border-primary/30 bg-primary/[0.02]">
      <CardContent class="py-12 text-center">
        <div class="mx-auto mb-6 flex items-center justify-center">
          <Icon name="mdi:check-bold" class="h-10 w-10 text-green-600" />
        </div>
        <h2 class="mb-2 font-mono text-2xl font-bold uppercase">Ad Created</h2>
        <p class="text-muted-foreground mb-2">
          Your {{ getTierLabel(tier) }} {{ getAdTypeLabel(adType) }} ad has been
          saved as a draft.
        </p>
        <p v-if="tier === 'premium'" class="text-primary mb-4 text-sm">
          <Icon name="mdi:star" class="mr-1 inline h-4 w-4" />
          Premium placement: Your ad will receive 2x exposure.
        </p>
        <p class="text-muted-foreground mb-8 text-sm">
          Payment integration coming soon. For now, contact us to activate your
          ad.
        </p>
        <div class="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="ghost" @click="emit('createAnother')">
            <Icon name="mdi:plus" class="mr-2 h-4 w-4" />Create Another
          </Button>
          <Button @click="emit('viewAds')">
            <Icon name="mdi:view-list" class="mr-2 h-4 w-4" />View My Ads
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
