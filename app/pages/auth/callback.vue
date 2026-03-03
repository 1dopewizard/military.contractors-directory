<!--
  @file Auth callback page
  @description Handles Better Auth magic link authentication callback
-->

<script setup lang="ts">
import { isAdminEmail } from "@/app/config/auth";

const logger = useLogger("AuthCallback");
const route = useRoute();
const { isAuthenticated, isAuthReady, userEmail, user } = useAuth();

const error = ref<string | null>(null);
const loading = ref(true);

// Get intended redirect destination from query params
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string | undefined;
  return redirect && redirect !== "/auth/callback" ? redirect : null;
});

// Handle the auth callback
onMounted(async () => {
  logger.info(
    {
      hash: window.location.hash ? "present" : "missing",
      search: window.location.search ? "present" : "missing",
    },
    "AuthCallback: User landed on callback page",
  );

  try {
    // Better Auth handles the token exchange automatically via the auth client
    // We just need to wait for the session to be established

    // Wait for auth to be ready (max 5 seconds)
    const maxAttempts = 50;
    let attempts = 0;

    while (!isAuthReady.value && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    // Additional wait for user to be populated after auth is ready
    attempts = 0;
    while (!user.value && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (user.value) {
      logger.info(
        { userId: user.value.id, email: userEmail.value },
        "AuthCallback: User authenticated",
      );

      // If there's a redirect parameter, use that
      if (redirectTo.value) {
        logger.info(
          { redirectPath: redirectTo.value },
          "AuthCallback: Redirecting to intended destination",
        );
        setTimeout(() => {
          navigateTo(redirectTo.value!);
        }, 500);
        return;
      }

      // Otherwise, determine redirect based on admin status
      const isAdmin = isAdminEmail(userEmail.value);

      let redirectPath = "/advertiser"; // default for advertisers

      if (isAdmin) {
        redirectPath = "/admin";
        logger.info(
          { email: userEmail.value, redirectPath, isAdmin },
          "AuthCallback: Admin user authenticated, redirecting",
        );
      } else {
        logger.info(
          { email: userEmail.value, redirectPath },
          "AuthCallback: User authenticated, redirecting to advertiser dashboard",
        );
      }

      // Small delay to ensure session is fully established
      setTimeout(() => {
        navigateTo(redirectPath);
      }, 500);
    } else {
      logger.warn("AuthCallback: User not authenticated after waiting");
      error.value = "Authentication failed. Please try signing in again.";
      loading.value = false;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error({ error: errorMessage }, "AuthCallback: Unexpected error");
    error.value = errorMessage;
    loading.value = false;
  }
});

useHead({
  title: "Signing you in... | military.contractors",
});
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <Card class="w-full max-w-md">
      <CardContent class="space-y-4 pt-6 text-center">
        <div v-if="loading">
          <Spinner class="text-primary mx-auto size-12" />
          <div class="space-y-2">
            <h2 class="text-xl font-semibold">Signing you in...</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Please wait while we authenticate your account.
            </p>
          </div>
        </div>

        <div v-else-if="error">
          <Icon
            name="mdi:alert-circle"
            class="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
          />
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">
              Authentication Failed
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ error }}
            </p>
            <div class="pt-4">
              <Button as-child variant="default">
                <NuxtLink to="/"> Return to Home </NuxtLink>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
