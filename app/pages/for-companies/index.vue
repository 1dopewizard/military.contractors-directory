<!--
  @file Company Landing Page
  @route /for-companies
  @description Marketing landing page for claimed profiles
-->

<script setup lang="ts">
useHead({
  title: "For Companies | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Claim your company profile on military.contractors to keep public contractor intelligence accurate and maintain source-backed company context.",
    },
  ],
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Basic listing from public data",
    features: ["Basic company profile", "Public information displayed"],
    excluded: ["Edit profile & links", "Verified badge", "Analytics"],
    cta: null,
  },
  {
    name: "Claimed",
    price: "$149",
    period: "/mo",
    description: "Take control of your profile",
    features: [
      "Edit description & links",
      "Verified profile badge",
      "Upload logo",
      "Public profile highlights",
      "Notable programs list",
      "Basic analytics",
    ],
    excluded: [],
    cta: "Get Started",
    ctaLink: "/profile-manager/claim",
  },
  {
    name: "Premium",
    price: "$399",
    period: "/mo",
    description: "Maximum visibility",
    features: [
      "Everything in Claimed",
      "Spotlight content block",
      "Enhanced source and profile context",
      "Priority in search",
      "Advanced analytics",
      "Dedicated support",
    ],
    excluded: [],
    cta: "Get Premium",
    ctaLink: "/profile-manager/claim",
    highlight: true,
  },
];
</script>

<template>
  <div class="min-h-full">
    <!-- Hero -->
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <h1
          class="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Claim Your Company Profile
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-lg">
          Keep your public contractor profile accurate, verify company context,
          and add source-backed information for researchers.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <Button as-child>
            <NuxtLink to="/profile-manager/claim">Get Started</NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink to="#pricing">View Pricing</NuxtLink>
          </Button>
        </div>
      </div>
    </header>

    <!-- Benefits -->
    <section class="">
      <div class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 class="text-foreground mb-8 text-xl font-semibold">
          Why claim your profile?
        </h2>
        <div class="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          <div>
            <h3 class="text-foreground font-medium">Build Trust</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              A verified badge shows researchers your profile is authentic and
              maintained.
            </p>
          </div>
          <div>
            <h3 class="text-foreground font-medium">Control Your Narrative</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Update your description, links, and contact information anytime.
            </p>
          </div>
          <div>
            <h3 class="text-foreground font-medium">Add Context</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Add programs, aliases, links, and profile context that public data
              sources may miss.
            </p>
          </div>
          <div>
            <h3 class="text-foreground font-medium">Track Performance</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              See how researchers use your profile and which public links they
              follow.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="">
      <div class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 class="text-foreground mb-8 text-xl font-semibold">How it works</h2>
        <ol class="grid gap-8 sm:grid-cols-4">
          <li>
            <span class="text-muted-foreground text-sm font-medium">01</span>
            <h3 class="text-foreground mt-2 font-medium">Find your company</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Search our defense contractor directory.
            </p>
          </li>
          <li>
            <span class="text-muted-foreground text-sm font-medium">02</span>
            <h3 class="text-foreground mt-2 font-medium">Verify identity</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Confirm employment via email or manual review.
            </p>
          </li>
          <li>
            <span class="text-muted-foreground text-sm font-medium">03</span>
            <h3 class="text-foreground mt-2 font-medium">Choose a plan</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Select the tier that fits your needs.
            </p>
          </li>
          <li>
            <span class="text-muted-foreground text-sm font-medium">04</span>
            <h3 class="text-foreground mt-2 font-medium">Start managing</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Access your dashboard and update your profile.
            </p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="">
      <div class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 class="text-foreground mb-2 text-xl font-semibold">Pricing</h2>
        <p class="text-muted-foreground mb-8">Simple plans. Cancel anytime.</p>

        <div class="bg-border border-border grid gap-px border md:grid-cols-3">
          <div
            v-for="tier in tiers"
            :key="tier.name"
            :class="['bg-background p-6', tier.highlight ? 'bg-muted/30' : '']"
          >
            <div class="flex items-baseline justify-between">
              <h3 class="text-foreground font-semibold">{{ tier.name }}</h3>
              <span
                v-if="tier.highlight"
                class="text-primary text-xs font-medium"
                >Popular</span
              >
            </div>
            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-foreground text-3xl font-bold">{{
                tier.price
              }}</span>
              <span v-if="tier.period" class="text-muted-foreground text-sm">{{
                tier.period
              }}</span>
            </div>
            <p class="text-muted-foreground mt-2 text-sm">
              {{ tier.description }}
            </p>

            <ul class="mt-6 space-y-2 text-sm">
              <li
                v-for="feature in tier.features"
                :key="feature"
                class="flex items-start gap-2"
              >
                <Icon
                  name="mdi:check"
                  class="text-foreground mt-0.5 h-4 w-4 shrink-0"
                />
                <span>{{ feature }}</span>
              </li>
              <li
                v-for="item in tier.excluded"
                :key="item"
                class="text-muted-foreground/60 flex items-start gap-2"
              >
                <Icon name="mdi:minus" class="mt-0.5 h-4 w-4 shrink-0" />
                <span>{{ item }}</span>
              </li>
            </ul>

            <div class="mt-6">
              <Button
                v-if="tier.cta"
                :variant="tier.highlight ? 'default' : 'outline'"
                class="w-full"
                as-child
              >
                <NuxtLink :to="tier.ctaLink">{{ tier.cta }}</NuxtLink>
              </Button>
              <p v-else class="text-muted-foreground text-center text-sm">
                Default listing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section>
      <div
        class="container mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <h2 class="text-foreground text-2xl font-bold">Ready to stand out?</h2>
        <p class="text-muted-foreground mt-2">
          Join leading defense contractors who have claimed their profiles.
        </p>
        <div class="mt-6">
          <Button as-child>
            <NuxtLink to="/profile-manager/claim">Claim Your Profile</NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
