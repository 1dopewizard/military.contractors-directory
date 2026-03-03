<!--
  @file Admin Content Review Component
  @description Review and approve/reject sponsored content
-->
<script setup lang="ts">
import { toast } from "vue-sonner";

interface Content {
  id: string;
  type: string;
  status: string;
  title: string | null;
  content: string | null;
  createdAt: string;
  contractor: {
    name: string;
    slug: string;
  };
}

const {
  data: contentItems,
  pending,
  error,
  refresh,
} = await useFetch<Content[]>("/api/admin/content");

const processingId = ref<string | null>(null);
const rejectDialogOpen = ref(false);
const rejectingItem = ref<Content | null>(null);
const rejectReason = ref("");

const handleApprove = async (item: Content) => {
  processingId.value = item.id;

  try {
    const { error: fetchError } = await useFetch(
      `/api/admin/content/${item.id}`,
      {
        method: "PATCH",
        body: { action: "approve" },
      },
    );

    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }

    toast.success("Content approved successfully");
    await refresh();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to approve content",
    );
  } finally {
    processingId.value = null;
  }
};

const openRejectDialog = (item: Content) => {
  rejectingItem.value = item;
  rejectReason.value = "";
  rejectDialogOpen.value = true;
};

const handleReject = async () => {
  if (!rejectingItem.value) return;

  processingId.value = rejectingItem.value.id;

  try {
    const { error: fetchError } = await useFetch(
      `/api/admin/content/${rejectingItem.value.id}`,
      {
        method: "PATCH",
        body: { action: "reject", reason: rejectReason.value },
      },
    );

    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }

    toast.success("Content rejected");
    rejectDialogOpen.value = false;
    await refresh();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to reject content",
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

const contentTypeLabels: Record<string, string> = {
  spotlight: "Spotlight",
  why_work_here: "Why Work Here",
  testimonial: "Testimonial",
  programs: "Programs",
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Content Review</h2>
        <p class="text-muted-foreground text-sm">
          Review and approve sponsored content submissions
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
    <Card v-else-if="!contentItems?.length" class="p-8 text-center">
      <Icon
        name="mdi:check-circle-outline"
        class="mx-auto mb-4 h-12 w-12 text-green-500 opacity-50"
      />
      <h3 class="mb-1 font-medium">No Pending Content</h3>
      <p class="text-muted-foreground text-sm">
        All content submissions have been reviewed
      </p>
    </Card>

    <!-- Content list -->
    <div v-else class="space-y-4">
      <Card v-for="item in contentItems" :key="item.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex items-center gap-2">
              <Badge variant="outline">{{
                contentTypeLabels[item.type] || item.type
              }}</Badge>
              <span class="text-muted-foreground text-sm">from</span>
              <NuxtLink
                :to="`/companies/${item.contractor.slug}`"
                class="hover:text-primary font-medium"
                target="_blank"
              >
                {{ item.contractor.name }}
              </NuxtLink>
            </div>
            <div v-if="item.title" class="mb-1 font-medium">
              {{ item.title }}
            </div>
            <p
              v-if="item.content"
              class="text-muted-foreground line-clamp-3 text-sm"
            >
              {{ item.content }}
            </p>
            <div
              class="text-muted-foreground mt-2 flex items-center gap-2 text-xs"
            >
              <Icon name="mdi:clock-outline" class="h-3 w-3" />
              <span>Submitted {{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="processingId === item.id"
              @click="openRejectDialog(item)"
            >
              <Icon name="mdi:close" class="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              size="sm"
              :disabled="processingId === item.id"
              @click="handleApprove(item)"
            >
              <Spinner v-if="processingId === item.id" class="mr-1 h-4 w-4" />
              <Icon v-else name="mdi:check" class="mr-1 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Reject Dialog -->
    <Dialog v-model:open="rejectDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Content</DialogTitle>
          <DialogDescription>
            Provide a reason for rejection (optional). This will be shared with
            the employer.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Textarea
            v-model="rejectReason"
            placeholder="Reason for rejection..."
            rows="3"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="rejectDialogOpen = false">
            Cancel
          </Button>
          <Button
            variant="destructive"
            :disabled="processingId !== null"
            @click="handleReject"
          >
            <Spinner v-if="processingId" class="mr-1 h-4 w-4" />
            Reject Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
