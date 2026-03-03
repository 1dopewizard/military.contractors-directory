<!--
  @file Dashboard/Advertiser/AdvertiserAdTypeSelector.vue
  @description Ad type and tier selection with pre-selected defaults
-->

<script setup lang="ts">
import type { AdPlacementTier } from "@/app/types/ad.types";

type AdType = "company_spotlight" | "featured_job";

interface Props {
  selectedAdType: AdType;
  selectedTier: AdPlacementTier;
}

interface Emits {
  (e: "update:selectedAdType", value: AdType): void;
  (e: "update:selectedTier", value: AdPlacementTier): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const pricing = {
  featured_job: { standard: 299, premium: 499, duration: 30 },
  company_spotlight: { standard: 499, premium: 799, duration: 30 },
};

const getDisplayPrice = (adType: AdType, tier: AdPlacementTier) => {
  return pricing[adType][tier];
};
</script>

<template>
  <section class="space-y-8">
    <!-- Step 1: Ad Type Selection -->
    <div>
      <div class="mb-4 flex items-center gap-3">
        <div
          class="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center text-xs font-bold"
        >
          1
        </div>
        <h2
          class="text-foreground text-sm font-medium tracking-wider uppercase"
        >
          Select Ad Type
        </h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          @click="emit('update:selectedAdType', 'featured_job')"
          class="relative border p-5 text-left transition-all"
          :class="
            selectedAdType === 'featured_job'
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
          "
        >
          <div class="mb-3 flex items-start justify-between">
            <div>
              <span class="text-sm font-bold">Featured Job</span>
              <p class="text-muted-foreground mt-1 text-xs">
                Promote a specific position
              </p>
            </div>
            <div class="text-right">
              <p class="text-muted-foreground text-xs">from</p>
              <span class="font-mono text-xl font-bold"
                >${{ pricing.featured_job.standard }}</span
              >
            </div>
          </div>
          <div
            class="flex h-4 w-4 items-center justify-center border-2"
            :class="
              selectedAdType === 'featured_job'
                ? 'border-primary bg-primary'
                : 'border-border'
            "
          >
            <Icon
              v-if="selectedAdType === 'featured_job'"
              name="mdi:check"
              class="text-primary-foreground h-3 w-3"
            />
          </div>
        </button>

        <button
          type="button"
          @click="emit('update:selectedAdType', 'company_spotlight')"
          class="relative border p-5 text-left transition-all"
          :class="
            selectedAdType === 'company_spotlight'
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
          "
        >
          <div class="mb-3 flex items-start justify-between">
            <div>
              <span class="text-sm font-bold">Partner Spotlight</span>
              <p class="text-muted-foreground mt-1 text-xs">
                Brand awareness campaign
              </p>
            </div>
            <div class="text-right">
              <p class="text-muted-foreground text-xs">from</p>
              <span class="font-mono text-xl font-bold"
                >${{ pricing.company_spotlight.standard }}</span
              >
            </div>
          </div>
          <div
            class="flex h-4 w-4 items-center justify-center border-2"
            :class="
              selectedAdType === 'company_spotlight'
                ? 'border-primary bg-primary'
                : 'border-border'
            "
          >
            <Icon
              v-if="selectedAdType === 'company_spotlight'"
              name="mdi:check"
              class="text-primary-foreground h-3 w-3"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- Step 2: Placement Tier Selection -->
    <div>
      <div class="mb-4 flex items-center gap-3">
        <div
          class="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center text-xs font-bold"
        >
          2
        </div>
        <h2
          class="text-foreground text-sm font-medium tracking-wider uppercase"
        >
          Select Placement Tier
        </h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          @click="emit('update:selectedTier', 'standard')"
          class="relative border p-4 text-left transition-all"
          :class="
            selectedTier === 'standard'
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
          "
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-1 flex items-center gap-2">
                <span class="text-sm font-bold">Standard</span>
                <div
                  class="flex h-4 w-4 items-center justify-center border-2"
                  :class="
                    selectedTier === 'standard'
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  "
                >
                  <Icon
                    v-if="selectedTier === 'standard'"
                    name="mdi:check"
                    class="text-primary-foreground h-3 w-3"
                  />
                </div>
              </div>
              <p class="text-muted-foreground text-xs">
                Fair rotation with all standard ads
              </p>
            </div>
            <div class="text-right">
              <span class="font-mono text-lg font-bold"
                >${{ pricing[selectedAdType].standard }}</span
              >
              <p class="text-muted-foreground text-[10px]">
                {{ pricing[selectedAdType].duration }} days
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          @click="emit('update:selectedTier', 'premium')"
          class="relative border p-4 text-left transition-all"
          :class="
            selectedTier === 'premium'
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
          "
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-1 flex items-center gap-2">
                <span class="text-primary text-sm font-bold">Premium</span>
                <span
                  class="bg-primary/5 text-primary px-1.5 py-0.5 text-[10px] font-medium"
                  >2x Exposure</span
                >
                <div
                  class="flex h-4 w-4 items-center justify-center border-2"
                  :class="
                    selectedTier === 'premium'
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  "
                >
                  <Icon
                    v-if="selectedTier === 'premium'"
                    name="mdi:check"
                    class="text-primary-foreground h-3 w-3"
                  />
                </div>
              </div>
              <p class="text-muted-foreground text-xs">
                2x exposure vs standard tier
              </p>
            </div>
            <div class="text-right">
              <span class="font-mono text-lg font-bold"
                >${{ pricing[selectedAdType].premium }}</span
              >
              <p class="text-muted-foreground text-[10px]">
                {{ pricing[selectedAdType].duration }} days
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-muted/30 border-border/50 border p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-foreground text-sm font-medium">
            {{
              selectedAdType === "featured_job"
                ? "Featured Job"
                : "Partner Spotlight"
            }}
            <span class="text-muted-foreground">•</span>
            <span :class="selectedTier === 'premium' ? 'text-primary' : ''">
              {{ selectedTier === "premium" ? "Premium" : "Standard" }}
            </span>
          </p>
          <p class="text-muted-foreground mt-0.5 text-xs">
            {{ pricing[selectedAdType].duration }} days
            <template v-if="selectedTier === 'premium'">
              • 2x exposure</template
            >
          </p>
        </div>
        <div class="text-right">
          <p class="text-foreground font-mono text-2xl font-bold">
            ${{ getDisplayPrice(selectedAdType, selectedTier) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
