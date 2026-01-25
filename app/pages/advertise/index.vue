<!--
  @file advertise/index.vue
  @description Marketing page for featured ad products
-->

<script setup lang="ts">
import type { AdIndustry } from '@/app/types/ad.types'

useHead({
  title: 'Advertise | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Reach thousands of cleared veterans. Promote your company with a spotlight ad or sponsor a job listing.'
    }
  ]
})

// CTA link - advertiser page handles auth redirect if needed
const createAdLink = '/advertiser?tab=create'

// Preview data for featured job - only display fields needed
const jobPreviewData = {
  id: 'preview',
  title: 'Senior Cyber Threat Analyst',
  company: 'Booz Allen Hamilton',
  location: 'Arlington, VA',
  location_type: 'Hybrid' as const,
  clearance: 'TS/SCI',
  salary: '$140K - $175K',
  pitch: 'Join our elite threat intel team protecting critical infrastructure. $15K sign-on bonus for cleared candidates.',
  apply_url: '#',
}

// Preview data for partner spotlight - only display fields needed
const spotlightPreviewData = {
  id: 'preview',
  advertiser: 'Palantir Technologies',
  tagline: 'Software for the world\'s hardest problems',
  headline: 'Your clearance opens doors others can\'t see',
  description: 'We\'re looking for veterans who understand what it means to protect what matters. Join our forward deployed engineering teams.',
  industries: ['Defense', 'Intelligence', 'Cyber'] as AdIndustry[],
  cta_text: 'Explore Careers',
  cta_url: '#',
}
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
        <!-- Breadcrumb -->
        <nav class="text-sm text-muted-foreground mb-8">
          <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-foreground">Advertise</span>
        </nav>

        <div class="max-w-2xl">
          <p class="text-xs font-mono uppercase tracking-widest text-primary mb-3">For Employers</p>
          <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Reach veterans who are ready for their next mission.
          </h1>
          <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
            Your ad appears in the search sidebar — native, non-intrusive, and contextually relevant to veterans browsing their specialty.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <Button size="lg" as-child class="font-semibold">
              <NuxtLink :to="createAdLink">
                Get Started
              </NuxtLink>
            </Button>
            <Button size="lg" variant="link" as-child>
              <a href="mailto:advertise@military.contractors">
                Talk to Sales
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6 pb-16">
      <div class="space-y-16">
        
        <!-- Ad Products -->
        <section>
          <div class="grid md:grid-cols-[1fr_auto_1fr] gap-0">
            <!-- Featured Job -->
            <Card class="border-none bg-transparent">
              <CardContent class="p-6">
                <p class="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Direct Response</p>
                <h3 class="text-xl font-bold mb-2">Featured Job</h3>
                <p class="text-muted-foreground text-sm mb-4">
                  Promote a specific position to qualified veterans. Your job ad appears in the sidebar with key details and direct apply link.
                </p>
                <ul class="space-y-1.5 text-sm text-muted-foreground mb-6">
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                    Job title, company, and location
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                    Clearance level and salary range
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                    Custom pitch / selling point
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                    Direct link to your application
                  </li>
                </ul>
                <!-- Pricing tiers -->
                <div class="space-y-3 mt-6">
                  <div class="flex items-center justify-between p-3 border border-border/50">
                    <div>
                      <p class="font-semibold text-sm">Standard</p>
                      <p class="text-xs text-muted-foreground">Fair rotation with all standard ads</p>
                    </div>
                    <div class="text-right">
                      <span class="text-xl font-bold font-mono">$299</span>
                      <p class="text-xs text-muted-foreground">30 days</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-3 border border-primary/30 bg-primary/[0.02]">
                    <div>
                      <p class="font-semibold text-sm text-primary">Premium</p>
                      <p class="text-xs text-muted-foreground">2x exposure vs standard tier</p>
                    </div>
                    <div class="text-right">
                      <span class="text-xl font-bold font-mono">$499</span>
                      <p class="text-xs text-muted-foreground">30 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Divider -->
            <Separator orientation="vertical" class="hidden md:block h-auto" />
            <Separator class="md:hidden my-6" />

            <!-- Partner Spotlight -->
            <Card class="border-none bg-transparent">
              <CardContent class="p-6">
                <p class="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Brand Awareness</p>
                <h3 class="text-xl font-bold mb-2">Partner Spotlight</h3>
                <p class="text-muted-foreground text-sm mb-4">
                  Promote your company or service to veterans. Ideal for employers, training providers, and certification programs.
                </p>
                <ul class="space-y-1.5 text-sm text-muted-foreground mb-6">
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-muted-foreground/50" />
                    Company name and tagline
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-muted-foreground/50" />
                    Description and industry badges
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-muted-foreground/50" />
                    Custom call-to-action button
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-muted-foreground/50" />
                    Link to your careers page
                  </li>
                </ul>
                <!-- Pricing tiers -->
                <div class="space-y-3 mt-6">
                  <div class="flex items-center justify-between p-3 border border-border/50">
                    <div>
                      <p class="font-semibold text-sm">Standard</p>
                      <p class="text-xs text-muted-foreground">Fair rotation with all standard ads</p>
                    </div>
                    <div class="text-right">
                      <span class="text-xl font-bold font-mono">$499</span>
                      <p class="text-xs text-muted-foreground">30 days</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-3 border border-primary/30 bg-primary/[0.02]">
                    <div>
                      <p class="font-semibold text-sm text-primary">Premium</p>
                      <p class="text-xs text-muted-foreground">2x exposure vs standard tier</p>
                    </div>
                    <div class="text-right">
                      <span class="text-xl font-bold font-mono">$799</span>
                      <p class="text-xs text-muted-foreground">30 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="mt-6 text-center">
            <Button as-child size="lg" variant="ghost">
              <NuxtLink :to="createAdLink">
                Create Placement
                <Icon name="mdi:arrow-right" class="w-4 h-4 ml-2" />
              </NuxtLink>
            </Button>
          </div>
        </section>

        <!-- How It Works -->
        <section class="border-t border-border/50 pt-12">
          <h2 class="text-lg font-bold text-foreground mb-6">How it works</h2>
          
          <div class="grid md:grid-cols-3 gap-6 md:gap-10">
            <div>
              <p class="text-xs font-mono text-primary mb-2">01</p>
              <h3 class="font-semibold mb-1">Create your ad</h3>
              <p class="text-sm text-muted-foreground">
                Fill out a simple form with your company info and message. Takes about 2 minutes.
              </p>
            </div>
            <div>
              <p class="text-xs font-mono text-primary mb-2">02</p>
              <h3 class="font-semibold mb-1">We review & activate</h3>
              <p class="text-sm text-muted-foreground">
                We'll review your ad for quality and activate it within 24 hours. Payment links coming soon.
              </p>
            </div>
            <div>
              <p class="text-xs font-mono text-primary mb-2">03</p>
              <h3 class="font-semibold mb-1">Veterans see your ad</h3>
              <p class="text-sm text-muted-foreground">
                Your ad appears in the search sidebar as veterans browse jobs matching their skills.
              </p>
            </div>
          </div>
        </section>

        <!-- Preview Section -->
        <section class="border-t border-border/50 pt-12">
          <h2 class="text-lg font-bold text-foreground mb-4">Preview your placement</h2>
          <p class="text-muted-foreground text-sm mb-8 max-w-2xl">
            Sponsored content is clearly labeled and designed to match the site's native look. Both placement types appear in the search sidebar.
          </p>
          
          <div class="grid md:grid-cols-2 gap-8 max-w-2xl">
            <!-- Featured Job Preview -->
            <div>
              <p class="text-xs font-mono text-primary mb-3 uppercase tracking-wider">Featured Job</p>
              <LegacyFeaturedJobCard :is-preview="true" :job="jobPreviewData" />
            </div>
            
            <!-- Partner Spotlight Preview -->
            <div>
              <p class="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-wider">Partner Spotlight</p>
              <LegacyFeaturedAd :is-preview="true" :ad="spotlightPreviewData" />
            </div>
          </div>

          <div class="mt-8 max-w-2xl">
            <p class="text-muted-foreground mb-4">
              <strong class="text-foreground">Fair exposure guaranteed.</strong> All ads at the same tier receive equal rotation. Your impressions aren't penalized by click-through rates — you're paying for placement, not performance.
            </p>
            <p class="text-sm text-muted-foreground/70">
              Premium placements get 2x the exposure of standard ads. Within each tier, all advertisers receive equal share of impressions. Sponsored content is always labeled.
            </p>
          </div>
        </section>

        <!-- Contact -->
        <section class="border-t border-border/50 pt-12">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-lg font-bold text-foreground mb-3">Ready to start?</h2>
              <p class="text-muted-foreground mb-4">
                Create your ad in minutes. Standard featured jobs start at $299, premium at $499. Partner spotlights start at $499, premium at $799.
              </p>
              <Button as-child size="lg">
                <NuxtLink :to="createAdLink">
                  Get Started
                </NuxtLink>
              </Button>
            </div>
            <div>
              <h2 class="text-lg font-bold text-foreground mb-3">Enterprise & custom</h2>
              <p class="text-muted-foreground mb-4">
                Need multiple placements or a custom campaign? Let's talk.
              </p>
              <a href="mailto:advertise@military.contractors" class="text-sm text-primary hover:underline font-mono">
                advertise@military.contractors
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>
