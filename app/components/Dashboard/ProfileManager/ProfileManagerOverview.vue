<!--
  @file Employer Overview Component
  @description Dashboard home with stats and quick actions
-->
<script setup lang="ts">
interface Props {
  profile: {
    tier: string;
    status: string;
    verifiedAt: string | null;
    contractor: {
      name: string;
      slug: string;
      description: string | null;
    } | null;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  navigate: [tab: string];
}>();

// Placeholder stats (would come from analytics API)
const stats = ref({
  views: 1234,
  viewsChange: 12,
  clicks: 156,
  clicksChange: 8,
  searchAppearances: 892,
  searchAppearancesChange: -3,
});

const quickActions = [
  {
    id: "profile",
    label: "Edit Profile",
    icon: "mdi:pencil-outline",
    description: "Update company description and details",
  },
  {
    id: "content",
    label: "Manage Content",
    icon: "mdi:text-box-edit-outline",
    description: "Add benefits, programs, and testimonials",
  },
  {
    id: "analytics",
    label: "View Analytics",
    icon: "mdi:chart-bar",
    description: "See profile views and engagement",
  },
];
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Grid -->
    <div class="grid gap-4 sm:grid-cols-3">
      <Card class="p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-muted-foreground text-sm">Profile Views</span>
          <Icon name="mdi:eye-outline" class="text-muted-foreground h-4 w-4" />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{
            stats.views.toLocaleString()
          }}</span>
          <span
            :class="[
              'flex items-center text-xs',
              stats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600',
            ]"
          >
            <Icon
              :name="stats.viewsChange >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'"
              class="h-3 w-3"
            />
            {{ Math.abs(stats.viewsChange) }}%
          </span>
        </div>
        <p class="text-muted-foreground mt-1 text-xs">vs last month</p>
      </Card>

      <Card class="p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-muted-foreground text-sm">Website Clicks</span>
          <Icon
            name="mdi:cursor-default-click-outline"
            class="text-muted-foreground h-4 w-4"
          />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{
            stats.clicks.toLocaleString()
          }}</span>
          <span
            :class="[
              'flex items-center text-xs',
              stats.clicksChange >= 0 ? 'text-green-600' : 'text-red-600',
            ]"
          >
            <Icon
              :name="
                stats.clicksChange >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'
              "
              class="h-3 w-3"
            />
            {{ Math.abs(stats.clicksChange) }}%
          </span>
        </div>
        <p class="text-muted-foreground mt-1 text-xs">vs last month</p>
      </Card>

      <Card class="p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-muted-foreground text-sm">Search Appearances</span>
          <Icon name="mdi:magnify" class="text-muted-foreground h-4 w-4" />
        </div>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold">{{
            stats.searchAppearances.toLocaleString()
          }}</span>
          <span
            :class="[
              'flex items-center text-xs',
              stats.searchAppearancesChange >= 0
                ? 'text-green-600'
                : 'text-red-600',
            ]"
          >
            <Icon
              :name="
                stats.searchAppearancesChange >= 0
                  ? 'mdi:arrow-up'
                  : 'mdi:arrow-down'
              "
              class="h-3 w-3"
            />
            {{ Math.abs(stats.searchAppearancesChange) }}%
          </span>
        </div>
        <p class="text-muted-foreground mt-1 text-xs">vs last month</p>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div>
      <h2 class="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <button
          v-for="action in quickActions"
          :key="action.id"
          class="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
          @click="emit('navigate', action.id)"
        >
          <div class="flex shrink-0 items-center justify-center">
            <Icon :name="action.icon" class="text-primary h-6 w-6" />
          </div>
          <div>
            <p class="font-medium">{{ action.label }}</p>
            <p class="text-muted-foreground text-sm">
              {{ action.description }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Profile Completeness -->
    <Card class="p-6">
      <h2 class="mb-4 text-lg font-semibold">Profile Completeness</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Your profile is</span>
          <span class="font-medium">75% complete</span>
        </div>
        <Progress :model-value="75" class="h-2" />
        <div class="grid gap-2 text-sm sm:grid-cols-2">
          <div class="flex items-center gap-2">
            <Icon name="mdi:check-circle" class="h-4 w-4 text-green-600" />
            <span>Basic information</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mdi:check-circle" class="h-4 w-4 text-green-600" />
            <span>Company description</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon
              name="mdi:circle-outline"
              class="text-muted-foreground h-4 w-4"
            />
            <span class="text-muted-foreground">Why Work Here section</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon
              name="mdi:circle-outline"
              class="text-muted-foreground h-4 w-4"
            />
            <span class="text-muted-foreground">Notable programs</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="emit('navigate', 'content')"
        >
          Complete Your Profile
          <Icon name="mdi:arrow-right" class="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>

    <!-- Tier Info -->
    <Card
      v-if="profile.tier === 'claimed'"
      class="border-amber-500/30 bg-amber-50/50 p-6 dark:bg-amber-950/20"
    >
      <div class="flex items-start gap-4">
        <div class="flex shrink-0 items-center justify-center">
          <Icon name="mdi:star-outline" class="h-6 w-6 text-amber-600" />
        </div>
        <div class="flex-1">
          <h3 class="mb-1 font-semibold">Upgrade to Premium</h3>
          <p class="text-muted-foreground mb-3 text-sm">
            Get spotlight content blocks, employee testimonials, and priority
            placement in search results.
          </p>
          <Button size="sm" class="bg-amber-500 text-white hover:bg-amber-600">
            Upgrade for $399/mo
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>
