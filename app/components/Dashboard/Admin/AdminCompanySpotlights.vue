<!--
  @file AdminCompanySpotlights.vue
  @description Admin dashboard company spotlights management tab
-->
<script setup lang="ts">
import type { FeaturedAd, AdStatus } from "@/app/types/ad.types";

interface Props {
  ads: FeaturedAd[];
  statusFilter: AdStatus | "all";
  regeneratingAll: "jobs" | "ads" | null;
  regenerateProgress: { current: number; total: number };
  expandedCardId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:statusFilter": [value: AdStatus | "all"];
  activate: [id: string];
  pause: [id: string];
  resume: [id: string];
  regenerateEmbedding: [id: string];
  regenerateAll: [];
  toggleExpand: [id: string];
}>();

// Filtered ads
const filteredAds = computed(() => {
  if (props.statusFilter === "all") return props.ads;
  return props.ads.filter((a) => a.status === props.statusFilter);
});

// Count of ads that can be regenerated (active or paused)
const regeneratableCount = computed(
  () =>
    props.ads.filter((a) => a.status === "active" || a.status === "paused")
      .length,
);

// Helpers
const getStatusBadge = (status: AdStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        class: "bg-green-500/10 text-green-600 dark:text-green-400",
      };
    case "draft":
      return { label: "Draft", class: "bg-muted text-muted-foreground" };
    case "pending_review":
      return {
        label: "Pending Review",
        class: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    case "pending_payment":
      return {
        label: "Pending Payment",
        class: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    case "paused":
      return {
        label: "Paused",
        class: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      };
    case "expired":
      return {
        label: "Expired",
        class: "bg-red-500/10 text-red-600 dark:text-red-400",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        class: "bg-muted text-muted-foreground line-through",
      };
    default:
      return { label: status, class: "bg-muted text-muted-foreground" };
  }
};

const calculateCTR = (impressions: number, clicks: number): string => {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-foreground text-sm font-semibold tracking-wide uppercase">
        Partner Spotlights
      </h2>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          :disabled="regeneratingAll !== null || regeneratableCount === 0"
          @click="emit('regenerateAll')"
        >
          <Spinner v-if="regeneratingAll === 'ads'" class="mr-1.5 h-4 w-4" />
          <Icon v-else name="mdi:refresh" class="mr-1.5 h-4 w-4" />
          <template v-if="regeneratingAll === 'ads'">
            {{ regenerateProgress.current }}/{{ regenerateProgress.total }}
          </template>
          <template v-else>
            Regenerate All ({{ regeneratableCount }})
          </template>
        </Button>
        <div class="flex items-center gap-2">
          <Label class="text-muted-foreground text-xs">Filter:</Label>
          <Select
            :model-value="statusFilter"
            @update:model-value="
              emit('update:statusFilter', $event as AdStatus | 'all')
            "
          >
            <SelectTrigger class="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <Empty v-if="filteredAds.length === 0">
      <EmptyMedia variant="icon">
        <Icon name="mdi:bullhorn-outline" class="h-6 w-6" />
      </EmptyMedia>
      <EmptyTitle>No partner spotlights found</EmptyTitle>
    </Empty>

    <div v-else class="border-border divide-border divide-y border-y">
      <div v-for="ad in filteredAds" :key="ad.id" class="group">
        <div
          class="hover:bg-muted/30 flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span
                :class="getStatusBadge(ad.status).class"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
              >
                {{ getStatusBadge(ad.status).label }}
              </span>
              <template v-if="(ad.matched_mos_codes || []).length > 0">
                <span
                  v-for="mos in (ad.matched_mos_codes || []).slice(0, 3)"
                  :key="mos"
                  class="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-600 dark:text-blue-400"
                >
                  {{ mos }}
                </span>
                <span
                  v-if="(ad.matched_mos_codes || []).length > 3"
                  class="text-muted-foreground text-[10px]"
                  >+{{ (ad.matched_mos_codes || []).length - 3 }}</span
                >
              </template>
              <span
                v-else
                class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium"
                >No MOS match</span
              >
            </div>
            <h3 class="text-foreground truncate font-semibold">
              {{ ad.headline }}
            </h3>
            <p class="text-muted-foreground truncate text-sm">
              {{ ad.advertiser }}
            </p>
            <p class="text-muted-foreground/70 mt-1 text-xs">
              {{ ad.tagline }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-4 text-center sm:gap-6">
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ ad.impressions.toLocaleString() }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">
                Impressions
              </p>
            </div>
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ ad.clicks.toLocaleString() }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">Clicks</p>
            </div>
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ calculateCTR(ad.impressions, ad.clicks) }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">CTR</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              class="hover:bg-muted rounded p-1 transition-colors"
              @click="emit('toggleExpand', ad.id)"
            >
              <Icon
                :name="
                  expandedCardId === ad.id
                    ? 'mdi:chevron-up'
                    : 'mdi:chevron-down'
                "
                class="text-muted-foreground h-4 w-4"
              />
            </button>
            <Button
              v-if="ad.status === 'pending_payment'"
              size="sm"
              @click="emit('activate', ad.id)"
            >
              <Icon
                name="mdi:rocket-launch-outline"
                class="mr-1 h-4 w-4"
              />Activate
            </Button>
            <Button
              v-if="ad.status === 'active'"
              variant="ghost"
              size="sm"
              @click="emit('pause', ad.id)"
            >
              <Icon name="mdi:pause" class="mr-1 h-4 w-4" />Pause
            </Button>
            <Button
              v-if="ad.status === 'paused'"
              variant="ghost"
              size="sm"
              @click="emit('resume', ad.id)"
            >
              <Icon name="mdi:play" class="mr-1 h-4 w-4" />Resume
            </Button>
            <Button
              v-if="ad.status === 'active' || ad.status === 'paused'"
              variant="ghost"
              size="sm"
              @click="emit('regenerateEmbedding', ad.id)"
              title="Regenerate MOS matching"
            >
              <Icon name="mdi:refresh" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div v-if="expandedCardId === ad.id" class="bg-muted/20 px-4 pt-0 pb-4">
          <div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <div class="space-y-3">
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Description
                </p>
                <p class="text-foreground text-sm">{{ ad.description }}</p>
              </div>
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  CTA
                </p>
                <p class="text-foreground text-sm">
                  {{ ad.cta_text }} →
                  <a
                    :href="ad.cta_url"
                    target="_blank"
                    class="text-primary hover:underline"
                    >{{ ad.cta_url }}</a
                  >
                </p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  ID
                </p>
                <p class="text-muted-foreground font-mono text-xs">
                  {{ ad.id }}
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Created
                </p>
                <p class="text-foreground text-sm">
                  {{ formatDate(ad.created_at) }}
                </p>
              </div>
              <div v-if="(ad.matched_mos_codes || []).length > 0">
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Matched MOS Codes
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="mos in ad.matched_mos_codes"
                    :key="mos"
                    class="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400"
                    >{{ mos }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
