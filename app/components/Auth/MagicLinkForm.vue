<!--
  @file Magic link authentication form
  @usage <MagicLinkForm @success="handleSuccess" />
  @description Email input form for magic link authentication
-->

<script setup lang="ts">
import { z } from "zod";

const emit = defineEmits<{
  success: [];
}>();

const logger = useLogger("MagicLinkForm");
const { signInWithMagicLink } = useAuth();

// Form state
const email = ref("");
const loading = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

// Input ref
const emailInput = ref<{ $el: HTMLInputElement } | null>(null);

/**
 * Email validation schema
 */
const emailSchema = z.email("Please enter a valid email address");

/**
 * Validate email
 */
const validateEmail = (): boolean => {
  try {
    emailSchema.parse(email.value);
    error.value = null;
    return true;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstIssue = err.issues[0];
      if (firstIssue) {
        error.value = firstIssue.message;
      }
    }
    return false;
  }
};

/**
 * Reset form state
 */
const resetForm = () => {
  email.value = "";
  error.value = null;
  submitted.value = false;
  loading.value = false;
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateEmail()) {
    return;
  }

  loading.value = true;
  error.value = null;

  logger.info("MagicLinkForm: Submitting magic link request");

  const result = await signInWithMagicLink(email.value);
  const success = result?.success || false;
  const signInError = result?.error;

  loading.value = false;

  if (success) {
    submitted.value = true;
    logger.info("MagicLinkForm: Magic link sent successfully");
    emit("success");
  } else {
    error.value = signInError || "Failed to send magic link";
    if (signInError) {
      logger.error(
        { err: signInError },
        "MagicLinkForm: Failed to send magic link",
      );
    }
  }
};

// Clear error when user starts typing
watch(email, () => {
  if (error.value && email.value) {
    error.value = null;
  }
});

// Reset form when component is mounted (in case dialog is reopened)
onMounted(() => {
  resetForm();
});
</script>

<template>
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-2xl">Sign in to your account</CardTitle>
      <CardDescription>
        Enter your email to receive a secure sign-in link
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Success State -->
      <div v-if="submitted" class="py-2">
        <div class="flex flex-col items-center gap-4 py-4 text-center">
          <div class="flex items-center justify-center">
            <Icon name="mdi:email-check-outline" class="text-primary size-8" />
          </div>
          <div class="space-y-2">
            <p class="text-foreground text-base font-semibold">
              Check your inbox
            </p>
            <p class="text-muted-foreground max-w-[280px] text-sm">
              We sent a sign-in link to
              <span class="text-foreground mt-1 block font-medium">{{
                email
              }}</span>
            </p>
          </div>
        </div>

        <p
          class="border-border text-muted-foreground border-t pt-4 text-center text-xs"
        >
          No email? Check spam or
          <button
            type="button"
            class="text-primary font-medium hover:underline"
            @click="resetForm"
          >
            try again
          </button>
        </p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Input Group -->
        <div class="space-y-1.5">
          <label for="magic-email" class="sr-only">Email address</label>
          <InputGroup
            class="h-11 transition-colors"
            :class="error ? 'ring-destructive ring-1' : ''"
          >
            <InputGroupAddon class="pl-3">
              <Icon
                name="mdi:email-outline"
                class="text-muted-foreground size-4"
              />
            </InputGroupAddon>
            <InputGroupInput
              id="magic-email"
              ref="emailInput"
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="Enter your email"
              :disabled="loading"
              class="text-foreground caret-foreground h-full text-sm"
            />
            <InputGroupAddon v-if="loading" align="inline-end" class="pr-3">
              <Spinner class="text-primary size-4" />
            </InputGroupAddon>
          </InputGroup>
          <p
            v-if="error"
            class="text-destructive flex items-center gap-1 pt-0.5 text-xs"
          >
            <Icon name="mdi:alert-circle-outline" class="size-3.5 shrink-0" />
            {{ error }}
          </p>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          class="h-10 w-full"
          :disabled="loading || !email.trim()"
        >
          <span>{{ loading ? "Sending..." : "Continue" }}</span>
          <Icon v-if="!loading" name="mdi:arrow-right" class="ml-1.5 size-4" />
        </Button>

        <!-- Info Text -->
        <p class="text-muted-foreground text-center text-xs">
          We'll send you a secure link — no password needed.
        </p>
      </form>
    </CardContent>
  </Card>
</template>
