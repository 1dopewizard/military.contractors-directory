<!--
  @file Alert signup card for sidebar
  @usage <AlertSignupCard />
  @description Compact CTA for job alert signup in search sidebar
-->

<script setup lang="ts">
import { toast } from "vue-sonner";

const email = ref("");
const isLoading = ref(false);
const isSubmitted = ref(false);

const handleSubmit = async () => {
  if (!email.value || isLoading.value) return;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    toast.error("Please enter a valid email address");
    return;
  }

  isLoading.value = true;

  try {
    await $fetch("/api/alerts/subscribe", {
      method: "POST",
      body: { email: email.value },
    });

    isSubmitted.value = true;
    toast.success("Subscribed!", {
      description: "You'll receive job alerts matching your interests.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to subscribe";
    toast.error("Subscription failed", { description: message });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Label -->
    <div class="mb-2 flex items-center gap-1.5">
      <span
        class="text-muted-foreground/60 text-[10px] font-medium tracking-widest uppercase"
        >Job Alerts</span
      >
    </div>

    <Card class="overflow-hidden">
      <CardContent class="p-4">
        <!-- Success state -->
        <div v-if="isSubmitted" class="py-2 text-center">
          <Icon
            name="mdi:check-circle"
            class="mx-auto mb-2 h-8 w-8 text-green-500"
          />
          <p class="text-foreground text-sm font-medium">You're subscribed!</p>
          <p class="text-muted-foreground mt-1 text-xs">
            Check your inbox for confirmation.
          </p>
        </div>

        <!-- Form -->
        <template v-else>
          <div class="mb-3 flex items-center gap-2">
            <Icon name="mdi:bell-ring" class="text-primary h-5 w-5" />
            <h4 class="text-foreground text-sm font-semibold">
              Get Job Alerts
            </h4>
          </div>

          <p class="text-muted-foreground mb-3 text-xs leading-relaxed">
            New cleared jobs matching your MOS, delivered weekly.
          </p>

          <form @submit.prevent="handleSubmit" class="space-y-2">
            <Input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="h-9 text-sm"
              :disabled="isLoading"
            />
            <Button
              type="submit"
              size="sm"
              class="w-full"
              :disabled="!email || isLoading"
            >
              <Spinner v-if="isLoading" class="mr-1.5 h-3 w-3" />
              Subscribe
            </Button>
          </form>

          <p class="text-muted-foreground/60 mt-2 text-center text-[9px]">
            Unsubscribe anytime. No spam.
          </p>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
