<!--
  @file Company Landing Page
  @route /for-companies
  @description Marketing landing page for claimed profiles
-->

<script setup lang="ts">
useHead({
  title: 'For Companies | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Claim your company profile on military.contractors. Stand out to veteran job seekers, control your narrative, and showcase your culture.',
    },
  ],
})

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Basic listing from public data',
    features: [
      'Basic company profile',
      'Public information displayed',
    ],
    excluded: [
      'Edit profile & links',
      'Verified badge',
      'Analytics',
    ],
    cta: null,
  },
  {
    name: 'Claimed',
    price: '$149',
    period: '/mo',
    description: 'Take control of your profile',
    features: [
      'Edit description & links',
      'Verified employer badge',
      'Upload logo',
      'Why Work Here section',
      'Notable programs list',
      'Basic analytics',
    ],
    excluded: [],
    cta: 'Get Started',
    ctaLink: '/profile-manager/claim',
  },
  {
    name: 'Premium',
    price: '$399',
    period: '/mo',
    description: 'Maximum visibility',
    features: [
      'Everything in Claimed',
      'Spotlight content block',
      'Employee testimonials',
      'Priority in search',
      'Advanced analytics',
      'Dedicated support',
    ],
    excluded: [],
    cta: 'Get Premium',
    ctaLink: '/profile-manager/claim',
    highlight: true,
  },
]
</script>

<template>
  <div class="min-h-full">
    <!-- Hero -->
    <header class="border-border border-b">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-4xl container">
        <h1 class="font-bold text-foreground text-3xl sm:text-4xl md:text-5xl tracking-tight">
          Claim Your Company Profile
        </h1>
        <p class="mt-4 max-w-2xl text-muted-foreground text-lg">
          Stand out to job seekers researching defense contractors. Control your narrative and showcase what makes your company a great place to work.
        </p>
        <div class="flex flex-wrap gap-4 mt-8">
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
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl container">
        <h2 class="mb-8 font-semibold text-foreground text-xl">Why claim your profile?</h2>
        <div class="gap-x-12 gap-y-8 grid sm:grid-cols-2">
          <div>
            <h3 class="font-medium text-foreground">Build Trust</h3>
            <p class="mt-1 text-muted-foreground text-sm">
              A verified badge shows candidates your profile is authentic and maintained.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Control Your Narrative</h3>
            <p class="mt-1 text-muted-foreground text-sm">
              Update your description, links, and contact information anytime.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Attract Talent</h3>
            <p class="mt-1 text-muted-foreground text-sm">
              Showcase your culture, benefits, and programs to job seekers.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Track Performance</h3>
            <p class="mt-1 text-muted-foreground text-sm">
              See how many people view your profile and click to your careers page.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl container">
        <h2 class="mb-8 font-semibold text-foreground text-xl">How it works</h2>
        <ol class="gap-8 grid sm:grid-cols-4">
          <li>
            <span class="font-medium text-muted-foreground text-sm">01</span>
            <h3 class="mt-2 font-medium text-foreground">Find your company</h3>
            <p class="mt-1 text-muted-foreground text-sm">Search our defense contractor directory.</p>
          </li>
          <li>
            <span class="font-medium text-muted-foreground text-sm">02</span>
            <h3 class="mt-2 font-medium text-foreground">Verify identity</h3>
            <p class="mt-1 text-muted-foreground text-sm">Confirm employment via email or manual review.</p>
          </li>
          <li>
            <span class="font-medium text-muted-foreground text-sm">03</span>
            <h3 class="mt-2 font-medium text-foreground">Choose a plan</h3>
            <p class="mt-1 text-muted-foreground text-sm">Select the tier that fits your needs.</p>
          </li>
          <li>
            <span class="font-medium text-muted-foreground text-sm">04</span>
            <h3 class="mt-2 font-medium text-foreground">Start managing</h3>
            <p class="mt-1 text-muted-foreground text-sm">Access your dashboard and update your profile.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl container">
        <h2 class="mb-2 font-semibold text-foreground text-xl">Pricing</h2>
        <p class="mb-8 text-muted-foreground">Simple plans. Cancel anytime.</p>

        <div class="gap-px grid md:grid-cols-3 bg-border border border-border">
          <div
            v-for="tier in tiers"
            :key="tier.name"
            :class="[
              'bg-background p-6',
              tier.highlight ? 'bg-muted/30' : ''
            ]"
          >
            <div class="flex justify-between items-baseline">
              <h3 class="font-semibold text-foreground">{{ tier.name }}</h3>
              <span v-if="tier.highlight" class="font-medium text-primary text-xs">Popular</span>
            </div>
            <div class="flex items-baseline gap-1 mt-4">
              <span class="font-bold text-foreground text-3xl">{{ tier.price }}</span>
              <span v-if="tier.period" class="text-muted-foreground text-sm">{{ tier.period }}</span>
            </div>
            <p class="mt-2 text-muted-foreground text-sm">{{ tier.description }}</p>

            <ul class="space-y-2 mt-6 text-sm">
              <li v-for="feature in tier.features" :key="feature" class="flex items-start gap-2">
                <Icon name="mdi:check" class="mt-0.5 w-4 h-4 text-foreground shrink-0" />
                <span>{{ feature }}</span>
              </li>
              <li v-for="item in tier.excluded" :key="item" class="flex items-start gap-2 text-muted-foreground/60">
                <Icon name="mdi:minus" class="mt-0.5 w-4 h-4 shrink-0" />
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
              <p v-else class="text-muted-foreground text-sm text-center">Default listing</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section>
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl text-center container">
        <h2 class="font-bold text-foreground text-2xl">Ready to stand out?</h2>
        <p class="mt-2 text-muted-foreground">
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
