<!--
  @file AdminOverview.vue
  @description Admin dashboard overview tab with stats, system health, and activity log
-->
<script setup lang="ts">
interface Props {
  systemHealth: {
    database: {
      status: "connected" | "error";
      latencyMs: number | null;
    };
    contractors: {
      total: number;
      withLogos: number;
    };
    claims: {
      pending: number;
      approved: number;
    };
    content: {
      pendingReview: number;
    };
  } | null;
  refreshing?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  setTab: [tabId: string];
  refresh: [];
}>();

// Activity log
const { fetchActivityLog, formatAction, formatEntityType, getTimeAgo } =
  useAdminActivity();

interface ActivityLogEntry {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const activityLog = ref<ActivityLogEntry[]>([]);
const activityLoading = ref(true);

const loadActivityLog = async () => {
  activityLoading.value = true;
  const { data } = await fetchActivityLog(10);
  activityLog.value = data;
  activityLoading.value = false;
};

onMounted(() => {
  loadActivityLog();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Overview</h2>
        <p class="text-muted-foreground text-sm">
          System health and quick actions
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="refreshing"
        @click="emit('refresh')"
      >
        <Icon
          :name="refreshing ? 'mdi:loading' : 'mdi:refresh'"
          :class="['mr-1.5 h-4 w-4', { 'animate-spin': refreshing }]"
        />
        Refresh
      </Button>
    </div>
    <!-- Stats Grid -->
    <div v-if="systemHealth" class="grid grid-cols-2 gap-6 md:grid-cols-4">
      <div class="space-y-1">
        <p class="text-foreground font-mono text-2xl font-bold">
          {{ systemHealth.contractors.total }}
        </p>
        <p class="text-muted-foreground text-xs tracking-wide uppercase">
          Contractors
        </p>
      </div>
      <div class="space-y-1">
        <p
          class="font-mono text-2xl font-bold text-green-600 dark:text-green-400"
        >
          {{ systemHealth.claims.approved }}
        </p>
        <p class="text-muted-foreground text-xs tracking-wide uppercase">
          Claimed Profiles
        </p>
      </div>
      <button
        class="hover:bg-muted/30 -mx-2 space-y-1 rounded px-2 text-left transition-colors"
        @click="emit('setTab', 'claims')"
      >
        <p
          class="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400"
        >
          {{ systemHealth.claims.pending }}
        </p>
        <p class="text-muted-foreground text-xs tracking-wide uppercase">
          Pending Claims
        </p>
      </button>
      <button
        class="hover:bg-muted/30 -mx-2 space-y-1 rounded px-2 text-left transition-colors"
        @click="emit('setTab', 'content')"
      >
        <p
          class="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400"
        >
          {{ systemHealth.content.pendingReview }}
        </p>
        <p class="text-muted-foreground text-xs tracking-wide uppercase">
          Content to Review
        </p>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
        Quick Actions
      </h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" @click="emit('setTab', 'claims')">
          <Icon name="mdi:shield-check-outline" class="mr-2 h-4 w-4" />
          Review Claims ({{ systemHealth?.claims.pending || 0 }})
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'content')">
          <Icon name="mdi:text-box-check-outline" class="mr-2 h-4 w-4" />
          Review Content ({{ systemHealth?.content.pendingReview || 0 }})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="emit('setTab', 'contractors')"
        >
          <Icon name="mdi:office-building-outline" class="mr-2 h-4 w-4" />
          Manage Contractors
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'users')">
          <Icon name="mdi:account-group-outline" class="mr-2 h-4 w-4" />
          Manage Users
        </Button>
      </div>
    </div>

    <!-- System Health -->
    <div class="space-y-3">
      <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
        System Health
      </h3>

      <div v-if="systemHealth" class="grid grid-cols-2 gap-6 md:grid-cols-3">
        <!-- Database Status -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :class="
                systemHealth.database.status === 'connected'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              "
            />
            <p
              class="font-mono text-2xl font-bold"
              :class="
                systemHealth.database.status === 'connected'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{ systemHealth.database.latencyMs || "—"
              }}<span class="text-sm font-normal">ms</span>
            </p>
          </div>
          <p class="text-muted-foreground text-xs tracking-wide uppercase">
            Database
          </p>
        </div>

        <!-- Contractors with Logos -->
        <div class="space-y-1">
          <p class="text-foreground font-mono text-2xl font-bold">
            {{ systemHealth.contractors.withLogos }}/{{
              systemHealth.contractors.total
            }}
          </p>
          <p class="text-muted-foreground text-xs tracking-wide uppercase">
            With Logos
          </p>
        </div>

        <!-- Claim Rate -->
        <div class="space-y-1">
          <p class="text-foreground font-mono text-2xl font-bold">
            {{
              systemHealth.contractors.total > 0
                ? Math.round(
                    (systemHealth.claims.approved /
                      systemHealth.contractors.total) *
                      100,
                  )
                : 0
            }}%
          </p>
          <p class="text-muted-foreground text-xs tracking-wide uppercase">
            Claim Rate
          </p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="space-y-3">
      <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
        Recent Activity
      </h3>

      <div v-if="activityLoading" class="flex justify-center py-6">
        <LoadingText text="Loading activity" />
      </div>

      <div
        v-else-if="activityLog.length === 0"
        class="text-muted-foreground py-4 text-sm"
      >
        No recent activity
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="entry in activityLog"
          :key="entry.id"
          class="bg-muted/30 flex items-center justify-between rounded-lg px-3 py-2"
        >
          <div class="flex min-w-0 items-center gap-3">
            <Icon
              :name="
                entry.action === 'approve'
                  ? 'mdi:check-circle'
                  : entry.action === 'reject'
                    ? 'mdi:close-circle'
                    : 'mdi:pencil'
              "
              class="h-4 w-4 shrink-0"
              :class="
                entry.action === 'approve'
                  ? 'text-green-500'
                  : entry.action === 'reject'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              "
            />
            <div class="min-w-0">
              <p class="truncate text-sm">
                <span class="font-medium">{{
                  formatAction(entry.action)
                }}</span>
                <span class="text-muted-foreground">
                  {{ formatEntityType(entry.entity_type) }}</span
                >
              </p>
              <p class="text-muted-foreground truncate text-xs">
                {{ entry.admin_email || "System" }}
              </p>
            </div>
          </div>
          <span class="text-muted-foreground shrink-0 text-xs">
            {{ getTimeAgo(entry.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
