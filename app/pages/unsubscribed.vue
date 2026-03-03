<!--
  @file Unsubscribe confirmation page
  @route /unsubscribed
  @description Confirmation page shown after clicking unsubscribe link in email
-->

<script setup lang="ts">
const route = useRoute();

// Only allow access if redirected from unsubscribe API with success flag
const isValidAccess = computed(() => route.query.success === "1");

// Redirect to home if accessed directly without success flag
onMounted(() => {
  if (!isValidAccess.value) {
    navigateTo("/", { replace: true });
  }
});

useHead({
  title: "Unsubscribed | military.contractors",
  meta: [
    {
      name: "robots",
      content: "noindex",
    },
  ],
});

definePageMeta({
  layout: "default",
});
</script>

<template>
  <div
    v-if="isValidAccess"
    class="flex min-h-[60vh] items-center justify-center px-4"
  >
    <div class="max-w-md text-center">
      <div class="mb-6">
        <Icon
          name="mdi:email-off-outline"
          class="text-muted-foreground mx-auto h-16 w-16"
        />
      </div>

      <h1 class="text-foreground mb-3 text-2xl font-bold">
        You've been unsubscribed
      </h1>

      <p class="text-muted-foreground mb-8">
        You will no longer receive job alert emails from military.contractors.
        If this was a mistake, you can always subscribe again from any MOS page.
      </p>

      <div class="flex flex-col justify-center gap-3 sm:flex-row">
        <Button as-child>
          <NuxtLink to="/">
            <Icon name="mdi:home" class="mr-2 h-4 w-4" />
            Back to Home
          </NuxtLink>
        </Button>

        <Button as-child variant="link">
          <NuxtLink to="/jobs">
            <Icon name="mdi:briefcase-search" class="mr-2 h-4 w-4" />
            Browse Jobs
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>
