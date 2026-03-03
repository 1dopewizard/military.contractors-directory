<!--
  @file Admin Claim Review Component
  @description Review and approve/reject claim requests
-->
<script setup lang="ts">
import { toast } from "vue-sonner";

interface Claim {
  id: string;
  tier: string;
  status: string;
  verificationMethod: string;
  createdAt: string;
  contractor: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const {
  data: claims,
  pending,
  error,
  refresh,
} = await useFetch<Claim[]>("/api/admin/claims");

const processingId = ref<string | null>(null);

const handleAction = async (claim: Claim, action: "approve" | "reject") => {
  if (
    !confirm(
      `Are you sure you want to ${action} this claim for ${claim.contractor.name}?`,
    )
  ) {
    return;
  }

  processingId.value = claim.id;

  try {
    const { error: fetchError } = await useFetch(
      `/api/admin/claims/${claim.id}`,
      {
        method: "PATCH",
        body: { action },
      },
    );

    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }

    toast.success(
      `Claim ${action === "approve" ? "approved" : "rejected"} successfully`,
    );
    await refresh();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : `Failed to ${action} claim`,
    );
  } finally {
    processingId.value = null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Claim Requests</h2>
        <p class="text-muted-foreground text-sm">
          Review and approve company profile claims
        </p>
      </div>
      <Button variant="outline" size="sm" :disabled="pending" @click="refresh">
        <Icon
          :name="pending ? 'mdi:loading' : 'mdi:refresh'"
          :class="['mr-1.5 h-4 w-4', { 'animate-spin': pending }]"
        />
        Refresh
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <Spinner class="text-muted-foreground h-8 w-8" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="border-destructive/30 p-6 text-center">
      <Icon
        name="mdi:alert-circle-outline"
        class="text-destructive mx-auto mb-2 h-8 w-8"
      />
      <p class="text-destructive text-sm">{{ error.message }}</p>
      <Button variant="ghost" size="sm" class="mt-4" @click="refresh">
        Try Again
      </Button>
    </Card>

    <!-- Empty state -->
    <Card v-else-if="!claims?.length" class="p-8 text-center">
      <Icon
        name="mdi:check-circle-outline"
        class="mx-auto mb-4 h-12 w-12 text-green-500 opacity-50"
      />
      <h3 class="mb-1 font-medium">No Pending Claims</h3>
      <p class="text-muted-foreground text-sm">
        All claim requests have been reviewed
      </p>
    </Card>

    <!-- Claims list -->
    <div v-else class="space-y-4">
      <Card v-for="claim in claims" :key="claim.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex items-center gap-2">
              <h3 class="truncate font-semibold">
                {{ claim.contractor.name }}
              </h3>
              <Badge variant="outline" class="capitalize">{{
                claim.tier
              }}</Badge>
              <Badge variant="outline" class="text-xs">
                {{ claim.verificationMethod.replace("_", " ") }}
              </Badge>
            </div>
            <div class="text-muted-foreground grid gap-1 text-sm">
              <div class="flex items-center gap-2">
                <Icon name="mdi:account-outline" class="h-4 w-4" />
                <span>{{ claim.user.name }} ({{ claim.user.email }})</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:clock-outline" class="h-4 w-4" />
                <span>Submitted {{ formatDate(claim.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="processingId === claim.id"
              @click="handleAction(claim, 'reject')"
            >
              <Icon name="mdi:close" class="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              size="sm"
              :disabled="processingId === claim.id"
              @click="handleAction(claim, 'approve')"
            >
              <Spinner v-if="processingId === claim.id" class="mr-1 h-4 w-4" />
              <Icon v-else name="mdi:check" class="mr-1 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
