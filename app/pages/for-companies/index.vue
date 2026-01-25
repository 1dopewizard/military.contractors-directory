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
    <section class="relative bg-linear-to-b from-primary/5 to-background overflow-hidden">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 max-w-6xl container">
        <div class="mx-auto max-w-3xl text-center">
          <Badge variant="outline" class="mb-6">For Defense Contractors</Badge>
          <h1 class="mb-6 font-bold text-foreground text-4xl md:text-5xl tracking-tight">
            Claim Your Company Profile
          </h1>
          <p class="mb-8 text-muted-foreground text-xl leading-relaxed">
            Stand out to veteran job seekers researching defense contractors. 
            Control your narrative and showcase what makes your company a great place to work.
          </p>
          <div class="flex sm:flex-row flex-col justify-center gap-4">
            <Button size="lg" as-child>
              <NuxtLink to="/profile-manager/claim">
                Get Started
                <Icon name="mdi:arrow-right" class="ml-2 w-5 h-5" />
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
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl container">
        <div class="mb-12 text-center">
          <h2 class="mb-4 font-bold text-foreground text-3xl">
            Why Claim Your Profile?
          </h2>
          <p class="mx-auto max-w-2xl text-muted-foreground text-lg">
            Take control of how your company appears to job seekers researching defense contractors.
          </p>
        </div>
        <div class="gap-8 grid md:grid-cols-2 lg:grid-cols-4">
          <Card v-for="benefit in benefits" :key="benefit.title" class="p-6 text-center">
            <div class="flex justify-center items-center mx-auto mb-4">
              <Icon :name="benefit.icon" class="w-8 h-8 text-primary" />
            </div>
            <h3 class="mb-2 font-semibold">{{ benefit.title }}</h3>
            <p class="text-muted-foreground text-sm">{{ benefit.description }}</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="bg-muted/30 py-16 lg:py-24">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl container">
        <div class="mb-12 text-center">
          <h2 class="mb-4 font-bold text-foreground text-3xl">
            How It Works
          </h2>
          <p class="text-muted-foreground text-lg">
            Get started in just a few minutes.
          </p>
        </div>
        <div class="gap-6 grid md:grid-cols-4">
          <div 
            v-for="(step, index) in steps" 
            :key="step.step"
            class="relative text-center"
          >
            <!-- Connector line (hidden on mobile, visible between items on md+) -->
            <div 
              v-if="index < steps.length - 1" 
              class="hidden md:block top-5 right-0 left-[calc(50%+24px)] absolute bg-border h-px -translate-y-1/2"
            />
            
            <Card class="inline-flex justify-center items-center mb-4 w-10 h-10 font-medium text-primary text-lg">
              {{ step.step }}
            </Card>
            <h3 class="mb-2 font-semibold">{{ step.title }}</h3>
            <p class="text-muted-foreground text-sm">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 lg:py-24">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl container">
        <div class="mb-12 text-center">
          <h2 class="mb-4 font-bold text-foreground text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p class="mx-auto max-w-2xl text-muted-foreground text-lg">
            Choose the plan that fits your recruitment needs. Cancel anytime.
          </p>
        </div>
        <div class="gap-8 grid md:grid-cols-3">
          <Card 
            v-for="tier in tiers" 
            :key="tier.name"
            :class="[
              'p-6 relative',
              tier.popular ? 'border-primary shadow-lg' : ''
            ]"
          >
            <Badge v-if="tier.popular" class="-top-3 left-1/2 absolute bg-primary -translate-x-1/2">
              Most Popular
            </Badge>
            <div class="mb-6 text-center">
              <h3 class="mb-2 font-bold text-xl">{{ tier.name }}</h3>
              <div class="flex justify-center items-baseline gap-1">
                <span class="font-bold text-4xl">{{ tier.price }}</span>
                <span v-if="tier.period" class="text-muted-foreground">{{ tier.period }}</span>
              </div>
              <p class="mt-2 text-muted-foreground text-sm">{{ tier.description }}</p>
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
            <p v-else class="text-muted-foreground text-sm text-center">
              Default listing
            </p>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-primary py-16 lg:py-24">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center container">
        <h2 class="mb-4 font-bold text-primary-foreground text-3xl">
          Ready to Stand Out?
        </h2>
        <p class="mb-8 text-primary-foreground/80 text-xl">
          Join companies like Lockheed Martin and Booz Allen Hamilton who have claimed their profiles.
        </p>
        <Button size="lg" variant="secondary" as-child>
          <NuxtLink to="/profile-manager/claim">
            Claim Your Profile Today
            <Icon name="mdi:arrow-right" class="ml-2 w-5 h-5" />
          </NuxtLink>
        </Button>
      </div>
    </section>
  </div>
</template>
