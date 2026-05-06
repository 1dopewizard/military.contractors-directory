<!--
  @file AdminIntelligenceTools
  @description Admin cache inspection and forced refresh tools for contractor intelligence
-->

<script setup lang="ts">
import { toast } from "vue-sonner";

interface CacheEntry {
  id: string;
  query: string;
  queryHash: string;
  cacheStatus: string | null;
  refreshedAt: string;
  expiresAt: string | null;
  updatedAt: string;
}

const contractorSlug = ref("");
const snapshotMaxPages = ref(5);
const refreshing = ref(false);

const {
  data: cacheData,
  pending,
  refresh: refreshCache,
} = useFetch<{ entries: CacheEntry[] }>("/api/admin/intelligence/cache", {
  lazy: true,
  default: () => ({ entries: [] }),
});

const forceRefreshContractor = async () => {
  if (!contractorSlug.value.trim()) return;
  refreshing.value = true;
  try {
    await $fetch("/api/admin/intelligence/refresh", {
      method: "POST",
      body: { contractorSlug: contractorSlug.value.trim() },
    });
    toast.success("Contractor profile refreshed");
    refreshCache();
  } finally {
    refreshing.value = false;
  }
};

const refreshSnapshot = async () => {
  refreshing.value = true;
  try {
    await $fetch("/api/admin/contractor-snapshot/refresh", {
      method: "POST",
      body: {
        limit: 100,
        maxPages: snapshotMaxPages.value,
      },
    });
    toast.success("Contractor snapshot refresh started");
    refreshCache();
  } finally {
    refreshing.value = false;
  }
};

const formatDate = (value: string | null): string => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">Intelligence Tools</h2>
      <p class="text-muted-foreground mt-1 text-sm">
        Inspect cache freshness and force USAspending refreshes.
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Refresh Directory Snapshot</CardTitle>
          <CardDescription
            >Pages USAspending recipient aggregates.</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="space-y-3" @submit.prevent="refreshSnapshot">
            <Input
              v-model.number="snapshotMaxPages"
              class="rounded-none"
              type="number"
              min="1"
              max="2000"
            />
            <Button type="submit" :disabled="refreshing">
              <Icon
                v-if="refreshing"
                name="mdi:loading"
                class="mr-2 h-4 w-4 animate-spin"
              />
              Refresh snapshot
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refresh Contractor Profile</CardTitle>
          <CardDescription
            >Refreshes the five-fiscal-year profile cache.</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="space-y-3" @submit.prevent="forceRefreshContractor">
            <Input
              v-model="contractorSlug"
              class="rounded-none"
              placeholder="lockheed-martin"
            />
            <Button type="submit" :disabled="refreshing">
              <Icon
                v-if="refreshing"
                name="mdi:loading"
                class="mr-2 h-4 w-4 animate-spin"
              />
              Refresh contractor
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Cache Entries</CardTitle>
          <CardDescription
            >Persistent profile, ranking, and page cache
            records.</CardDescription
          >
        </div>
        <Button variant="outline" size="sm" @click="refreshCache"
          >Reload</Button
        >
      </CardHeader>
      <CardContent>
        <div v-if="pending" class="py-8">
          <LoadingText text="Loading cache" />
        </div>
        <div v-else class="border-border overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refreshed</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="entry in cacheData.entries" :key="entry.id">
                <TableCell class="font-mono text-xs">{{ entry.id }}</TableCell>
                <TableCell class="max-w-md text-xs">{{
                  entry.query
                }}</TableCell>
                <TableCell>{{ entry.cacheStatus || "live" }}</TableCell>
                <TableCell>{{ formatDate(entry.refreshedAt) }}</TableCell>
                <TableCell>{{ formatDate(entry.expiresAt) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
