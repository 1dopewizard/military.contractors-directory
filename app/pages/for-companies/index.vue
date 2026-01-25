<!--
  @file Company Landing Page
  @route /for-companies
  @description Marketing landing page for claimed profiles
-->

<script setup lang="ts">
useHead({
  title: 'For Companies - Claim Your Company Profile | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Claim your company profile on military.contractors. Stand out to veteran job seekers, control your narrative, and showcase your culture and programs.',
    },
  ],
})

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Basic listing from public data',
    features: [
      { text: 'Basic company profile', included: true },
      { text: 'Public information displayed', included: true },
      { text: 'Edit profile & links', included: false },
      { text: 'Verified employer badge', included: false },
      { text: 'Why Work Here section', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
    cta: null,
  },
  {
    name: 'Claimed',
    price: '$149',
    period: '/month',
    description: 'Take control of your profile',
    features: [
      { text: 'Edit description, links', included: true },
      { text: 'Verified employer badge', included: true },
      { text: 'Upload logo', included: true },
      { text: 'Why Work Here section', included: true },
      { text: 'Notable programs list', included: true },
      { text: 'Basic analytics', included: true },
    ],
    cta: 'Get Started',
    ctaLink: '/profile-manager/claim',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$399',
    period: '/month',
    description: 'Maximum visibility and engagement',
    features: [
      { text: 'Everything in Claimed', included: true },
      { text: 'Spotlight content block', included: true },
      { text: 'Employee testimonials', included: true },
      { text: 'Priority in search results', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Dedicated support', included: true },
    ],
    cta: 'Get Premium',
    ctaLink: '/profile-manager/claim',
    popular: true,
  },
]

const benefits = [
  {
    icon: 'mdi:check-decagram',
    title: 'Build Trust',
    description: 'A verified employer badge shows candidates your profile is authentic and up-to-date.',
  },
  {
    icon: 'mdi:pencil-outline',
    title: 'Control Your Narrative',
    description: 'Update your company description, links, and contact information anytime.',
  },
  {
    icon: 'mdi:account-group-outline',
    title: 'Attract Talent',
    description: 'Showcase your culture, benefits, and notable programs to veteran job seekers.',
  },
  {
    icon: 'mdi:chart-line',
    title: 'Track Performance',
    description: 'See how many people view your profile and click through to your careers page.',
  },
]

const steps = [
  {
    step: 1,
    title: 'Search for Your Company',
    description: 'Find your company in our defense contractor directory.',
  },
  {
    step: 2,
    title: 'Verify Your Identity',
    description: 'Confirm your employment through email domain or manual review.',
  },
  {
    step: 3,
    title: 'Choose Your Plan',
    description: 'Select the tier that fits your recruitment needs.',
  },
  {
    step: 4,
    title: 'Start Managing',
    description: 'Access your dashboard and update your profile.',
  },
]
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-16 lg:py-24">
        <div class="text-center max-w-3xl mx-auto">
          <Badge variant="outline" class="mb-6">For Defense Contractors</Badge>
          <h1 class="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Claim Your Company Profile
          </h1>
          <p class="text-xl text-muted-foreground mb-8 leading-relaxed">
            Stand out to veteran job seekers researching defense contractors. 
            Control your narrative and showcase what makes your company a great place to work.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" as-child>
              <NuxtLink to="/profile-manager/claim">
                Get Started
                <Icon name="mdi:arrow-right" class="w-5 h-5 ml-2" />
              </NuxtLink>
            </Button>
            <Button size="lg" variant="outline" as-child>
              <NuxtLink to="#pricing">
                View Pricing
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-16 lg:py-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            Why Claim Your Profile?
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take control of how your company appears to job seekers researching defense contractors.
          </p>
        </div>
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card v-for="benefit in benefits" :key="benefit.title" class="p-6 text-center">
            <div class="flex items-center justify-center mx-auto mb-4">
              <Icon :name="benefit.icon" class="w-8 h-8 text-primary" />
            </div>
            <h3 class="font-semibold mb-2">{{ benefit.title }}</h3>
            <p class="text-sm text-muted-foreground">{{ benefit.description }}</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 lg:py-24 bg-muted/30">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p class="text-lg text-muted-foreground">
            Get started in just a few minutes.
          </p>
        </div>
        <div class="space-y-6">
          <div 
            v-for="step in steps" 
            :key="step.step"
            class="flex items-start gap-4"
          >
            <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
              {{ step.step }}
            </div>
            <div class="pt-1">
              <h3 class="font-semibold mb-1">{{ step.title }}</h3>
              <p class="text-muted-foreground">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 lg:py-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your recruitment needs. Cancel anytime.
          </p>
        </div>
        <div class="grid gap-8 md:grid-cols-3">
          <Card 
            v-for="tier in tiers" 
            :key="tier.name"
            :class="[
              'p-6 relative',
              tier.popular ? 'border-primary shadow-lg' : ''
            ]"
          >
            <Badge v-if="tier.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              Most Popular
            </Badge>
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold mb-2">{{ tier.name }}</h3>
              <div class="flex items-baseline justify-center gap-1">
                <span class="text-4xl font-bold">{{ tier.price }}</span>
                <span v-if="tier.period" class="text-muted-foreground">{{ tier.period }}</span>
              </div>
              <p class="text-sm text-muted-foreground mt-2">{{ tier.description }}</p>
            </div>
            <ul class="space-y-3 mb-6">
              <li 
                v-for="feature in tier.features" 
                :key="feature.text"
                class="flex items-center gap-2 text-sm"
              >
                <Icon 
                  :name="feature.included ? 'mdi:check' : 'mdi:close'" 
                  :class="feature.included ? 'text-green-600' : 'text-muted-foreground/50'"
                  class="w-4 h-4 shrink-0"
                />
                <span :class="feature.included ? '' : 'text-muted-foreground/50'">
                  {{ feature.text }}
                </span>
              </li>
            </ul>
            <Button 
              v-if="tier.cta"
              :variant="tier.popular ? 'default' : 'outline'"
              class="w-full"
              as-child
            >
              <NuxtLink :to="tier.ctaLink">
                {{ tier.cta }}
              </NuxtLink>
            </Button>
            <p v-else class="text-center text-sm text-muted-foreground">
              Default listing
            </p>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-24 bg-primary">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
        <h2 class="text-3xl font-bold text-primary-foreground mb-4">
          Ready to Stand Out?
        </h2>
        <p class="text-xl text-primary-foreground/80 mb-8">
          Join companies like Lockheed Martin and Booz Allen Hamilton who have claimed their profiles.
        </p>
        <Button size="lg" variant="secondary" as-child>
          <NuxtLink to="/profile-manager/claim">
            Claim Your Profile Today
            <Icon name="mdi:arrow-right" class="w-5 h-5 ml-2" />
          </NuxtLink>
        </Button>
      </div>
    </section>
  </div>
</template>
