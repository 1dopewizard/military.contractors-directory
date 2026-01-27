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
    <header class="border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-16 sm:py-24">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Claim Your Company Profile
        </h1>
        <p class="mt-4 text-lg text-muted-foreground max-w-2xl">
          Stand out to job seekers researching defense contractors. Control your narrative and showcase what makes your company a great place to work.
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
    <section class="border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-16">
        <h2 class="text-xl font-semibold text-foreground mb-8">Why claim your profile?</h2>
        <div class="grid sm:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 class="font-medium text-foreground">Build Trust</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              A verified badge shows candidates your profile is authentic and maintained.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Control Your Narrative</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Update your description, links, and contact information anytime.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Attract Talent</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Showcase your culture, benefits, and programs to job seekers.
            </p>
          </div>
          <div>
            <h3 class="font-medium text-foreground">Track Performance</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              See how many people view your profile and click to your careers page.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-16">
        <h2 class="text-xl font-semibold text-foreground mb-8">How it works</h2>
        <ol class="grid sm:grid-cols-4 gap-8">
          <li>
            <span class="text-sm font-medium text-muted-foreground">01</span>
            <h3 class="mt-2 font-medium text-foreground">Find your company</h3>
            <p class="mt-1 text-sm text-muted-foreground">Search our defense contractor directory.</p>
          </li>
          <li>
            <span class="text-sm font-medium text-muted-foreground">02</span>
            <h3 class="mt-2 font-medium text-foreground">Verify identity</h3>
            <p class="mt-1 text-sm text-muted-foreground">Confirm employment via email or manual review.</p>
          </li>
          <li>
            <span class="text-sm font-medium text-muted-foreground">03</span>
            <h3 class="mt-2 font-medium text-foreground">Choose a plan</h3>
            <p class="mt-1 text-sm text-muted-foreground">Select the tier that fits your needs.</p>
          </li>
          <li>
            <span class="text-sm font-medium text-muted-foreground">04</span>
            <h3 class="mt-2 font-medium text-foreground">Start managing</h3>
            <p class="mt-1 text-sm text-muted-foreground">Access your dashboard and update your profile.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-16">
        <h2 class="text-xl font-semibold text-foreground mb-2">Pricing</h2>
        <p class="text-muted-foreground mb-8">Simple plans. Cancel anytime.</p>

        <div class="grid md:grid-cols-3 gap-px bg-border border border-border">
          <div
            v-for="tier in tiers"
            :key="tier.name"
            :class="[
              'bg-background p-6',
              tier.highlight ? 'bg-muted/30' : ''
            ]"
          >
            <div class="flex items-baseline justify-between">
              <h3 class="font-semibold text-foreground">{{ tier.name }}</h3>
              <span v-if="tier.highlight" class="text-xs text-primary font-medium">Popular</span>
            </div>
            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-3xl font-bold text-foreground">{{ tier.price }}</span>
              <span v-if="tier.period" class="text-sm text-muted-foreground">{{ tier.period }}</span>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">{{ tier.description }}</p>

            <ul class="mt-6 space-y-2 text-sm">
              <li v-for="feature in tier.features" :key="feature" class="flex items-start gap-2">
                <Icon name="mdi:check" class="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <span>{{ feature }}</span>
              </li>
              <li v-for="item in tier.excluded" :key="item" class="flex items-start gap-2 text-muted-foreground/60">
                <Icon name="mdi:minus" class="w-4 h-4 shrink-0 mt-0.5" />
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
              <p v-else class="text-sm text-muted-foreground text-center">Default listing</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-16 text-center">
        <h2 class="text-2xl font-bold text-foreground">Ready to stand out?</h2>
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
