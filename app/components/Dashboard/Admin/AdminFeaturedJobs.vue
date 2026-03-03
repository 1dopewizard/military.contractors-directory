<!--
  @file AdminFeaturedJobs.vue
  @description Admin dashboard featured jobs management tab
-->
<script setup lang="ts">
import type { FeaturedJob, AdStatus } from "@/app/types/ad.types";

interface Props {
  jobs: FeaturedJob[];
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

// Filtered jobs
const filteredJobs = computed(() => {
  if (props.statusFilter === "all") return props.jobs;
  return props.jobs.filter((j) => j.status === props.statusFilter);
});

// Count of jobs that can be regenerated (active or paused)
const regeneratableCount = computed(
  () =>
    props.jobs.filter((j) => j.status === "active" || j.status === "paused")
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
        Featured Jobs
      </h2>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          :disabled="regeneratingAll !== null || regeneratableCount === 0"
          @click="emit('regenerateAll')"
        >
          <Spinner v-if="regeneratingAll === 'jobs'" class="mr-1.5 h-4 w-4" />
          <Icon v-else name="mdi:refresh" class="mr-1.5 h-4 w-4" />
          <template v-if="regeneratingAll === 'jobs'">
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

    <Empty v-if="filteredJobs.length === 0">
      <EmptyMedia variant="icon">
        <Icon name="mdi:briefcase-outline" class="h-6 w-6" />
      </EmptyMedia>
      <EmptyTitle>No featured jobs found</EmptyTitle>
    </Empty>

    <div v-else class="border-border divide-border divide-y border-y">
      <div v-for="job in filteredJobs" :key="job.id" class="group">
        <div
          class="hover:bg-muted/30 flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span
                :class="getStatusBadge(job.status).class"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
              >
                {{ getStatusBadge(job.status).label }}
              </span>
              <template v-if="(job.matched_mos_codes || []).length > 0">
                <span
                  v-for="mos in (job.matched_mos_codes || []).slice(0, 3)"
                  :key="mos"
                  class="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-600 dark:text-blue-400"
                >
                  {{ mos }}
                </span>
                <span
                  v-if="(job.matched_mos_codes || []).length > 3"
                  class="text-muted-foreground text-[10px]"
                  >+{{ (job.matched_mos_codes || []).length - 3 }}</span
                >
              </template>
              <span
                v-else
                class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium"
                >No MOS match</span
              >
            </div>
            <h3 class="text-foreground truncate font-semibold">
              {{ job.title }}
            </h3>
            <p class="text-muted-foreground truncate text-sm">
              {{ job.company }} · {{ job.location }}
            </p>
            <p class="text-muted-foreground/70 mt-1 text-xs">
              {{ job.clearance }} · {{ job.salary }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-4 text-center sm:gap-6">
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ job.impressions.toLocaleString() }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">
                Impressions
              </p>
            </div>
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ job.clicks.toLocaleString() }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">Clicks</p>
            </div>
            <div>
              <p class="text-foreground font-mono text-lg font-semibold">
                {{ calculateCTR(job.impressions, job.clicks) }}
              </p>
              <p class="text-muted-foreground text-[10px] uppercase">CTR</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              class="hover:bg-muted rounded p-1 transition-colors"
              @click="emit('toggleExpand', job.id)"
            >
              <Icon
                :name="
                  expandedCardId === job.id
                    ? 'mdi:chevron-up'
                    : 'mdi:chevron-down'
                "
                class="text-muted-foreground h-4 w-4"
              />
            </button>
            <Button
              v-if="job.status === 'pending_payment'"
              size="sm"
              @click="emit('activate', job.id)"
            >
              <Icon
                name="mdi:rocket-launch-outline"
                class="mr-1 h-4 w-4"
              />Activate
            </Button>
            <Button
              v-if="job.status === 'active'"
              variant="ghost"
              size="sm"
              @click="emit('pause', job.id)"
            >
              <Icon name="mdi:pause" class="mr-1 h-4 w-4" />Pause
            </Button>
            <Button
              v-if="job.status === 'paused'"
              variant="ghost"
              size="sm"
              @click="emit('resume', job.id)"
            >
              <Icon name="mdi:play" class="mr-1 h-4 w-4" />Resume
            </Button>
            <Button
              v-if="job.status === 'active' || job.status === 'paused'"
              variant="ghost"
              size="sm"
              @click="emit('regenerateEmbedding', job.id)"
              title="Regenerate MOS matching"
            >
              <Icon name="mdi:refresh" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          v-if="expandedCardId === job.id"
          class="bg-muted/20 px-4 pt-0 pb-4"
        >
          <div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <div class="space-y-3">
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Pitch
                </p>
                <p class="text-foreground text-sm">{{ job.pitch }}</p>
              </div>
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Apply URL
                </p>
                <a
                  :href="job.apply_url"
                  target="_blank"
                  class="text-primary text-sm break-all hover:underline"
                  >{{ job.apply_url }}</a
                >
              </div>
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Location Type
                </p>
                <p class="text-foreground text-sm">
                  {{ job.location_type || "Not specified" }}
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
                  {{ job.id }}
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Created
                </p>
                <p class="text-foreground text-sm">
                  {{ formatDate(job.created_at) }}
                </p>
              </div>
              <div v-if="(job.matched_mos_codes || []).length > 0">
                <p
                  class="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase"
                >
                  Matched MOS Codes
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="mos in job.matched_mos_codes"
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
