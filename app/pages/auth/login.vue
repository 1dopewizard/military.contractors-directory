<!--
  @file Full-page login
  @route /auth/login
  @description Dedicated login page with magic link auth and value props
-->

<script setup lang="ts">
definePageMeta({
  layout: false,
});

useHead({
  title: "Sign In | military.contractors",
  meta: [
    {
      name: "description",
      content: "Sign in to access military.contractors admin tools.",
    },
  ],
});

const route = useRoute();
const { isAuthenticated } = useAuth();

// Redirect destination after login
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string;
  return redirect || "/advertiser";
});

// If already authenticated, redirect
watch(
  isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      navigateTo(redirectTo.value);
    }
  },
  { immediate: true },
);

// Handle successful magic link send
const handleMagicLinkSent = () => {
  // Success state is handled by the MagicLinkForm component
};

// Value props for the right side
const benefits = [
  {
    icon: "mdi:shield-check-outline",
    title: "Verify profile context",
    description:
      "Access administrative tools for contractor records, source context, and public intelligence data.",
  },
  {
    icon: "mdi:chart-line",
    title: "Track performance",
    description:
      "Monitor impressions, clicks, and engagement metrics in real-time.",
  },
  {
    icon: "mdi:clock-outline",
    title: "Control your profile",
    description:
      "Update profile content and source-backed context from your dashboard.",
  },
];
</script>

<template>
  <div class="bg-background flex min-h-screen">
    <!-- Left Side - Login Form -->
    <div class="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo / Branding -->
        <NuxtLink to="/" class="mb-8 flex items-center justify-center gap-2">
          <Badge
            variant="default"
            class="flex items-center justify-center gap-1.5 px-2"
          >
            <span class="text-primary-foreground text-base font-semibold"
              >M</span
            >
            <div class="bg-primary-foreground h-4 w-px" />
            <span class="text-primary-foreground text-base font-semibold"
              >C</span
            >
          </Badge>
          <span class="text-foreground text-lg font-semibold"
            >military.contractors</span
          >
        </NuxtLink>

        <!-- Magic Link Form -->
        <MagicLinkForm @success="handleMagicLinkSent" />

        <!-- Back to home -->
        <p class="text-muted-foreground mt-6 text-center text-sm">
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            <Icon name="mdi:arrow-left" class="mr-1 inline h-4 w-4" />
            Back to home
          </NuxtLink>
        </p>
      </div>
    </div>

    <!-- Vertical Divider (visible on lg+) -->
    <div class="bg-border hidden w-px lg:block"></div>

    <!-- Right Side - Value Props (visible on lg+) -->
    <div
      class="bg-muted/30 hidden flex-1 flex-col justify-center px-12 py-12 lg:flex"
    >
      <div class="mx-auto max-w-md">
        <p
          class="text-primary mb-4 font-mono text-xs tracking-widest uppercase"
        >
          Profile Dashboard
        </p>
        <h2 class="text-foreground mb-4 text-2xl font-bold tracking-tight">
          Keep contractor intelligence accurate
        </h2>
        <p class="text-muted-foreground mb-8">
          Maintain a verified company profile with public links, programs, and
          context researchers can trust.
        </p>

        <!-- Benefits List -->
        <div class="space-y-6">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="flex gap-4"
          >
            <div class="flex shrink-0 items-center justify-center">
              <Icon :name="benefit.icon" class="text-primary h-6 w-6" />
            </div>
            <div>
              <h3 class="text-foreground text-sm font-semibold">
                {{ benefit.title }}
              </h3>
              <p class="text-muted-foreground mt-0.5 text-sm">
                {{ benefit.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="border-border/50 mt-10 flex gap-8 border-t pt-8">
          <div>
            <p class="text-foreground font-mono text-2xl font-bold">100+</p>
            <p class="text-muted-foreground text-xs">companies</p>
          </div>
          <div>
            <p class="text-foreground font-mono text-2xl font-bold">10</p>
            <p class="text-muted-foreground text-xs">categories</p>
          </div>
          <div>
            <p class="text-foreground font-mono text-2xl font-bold">24/7</p>
            <p class="text-muted-foreground text-xs">profile access</p>
          </div>
        </div>

        <!-- Testimonial placeholder -->
        <div class="bg-background border-border/50 mt-8 rounded border p-4">
          <p class="text-muted-foreground text-sm italic">
            "Verified profile context helps researchers understand who we are
            and where to find authoritative company information."
          </p>
          <p class="text-muted-foreground mt-2 text-xs">
            — Profile Manager, Defense Contractor
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
