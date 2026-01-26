<!--
  @file About page
  @route /about
  @description Information about military.contractors
-->

<script setup lang="ts">
useHead({
  title: 'About | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'military.contractors is the definitive directory of defense contractors - structured company profiles, specialties, and locations for the defense industry.'
    }
  ]
})
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
          <span class="text-foreground">About</span>
        </nav>

        <div class="max-w-2xl">
          <p class="text-xs font-mono uppercase tracking-widest text-primary mb-3">About Us</p>
          <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            The definitive directory of defense contractors.
          </h1>
          <p class="text-lg text-muted-foreground leading-relaxed">
            military.contractors is the reference destination for defense contractor intelligence. We provide authoritative, well-structured company profiles for hundreds of defense contractors.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="space-y-12 max-w-3xl">
        
        <!-- What We Do -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">What We Do</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Think of us as Crunchbase for defense contractors. Whether you're researching potential employers, scouting competitors, or exploring the defense industry landscape, we provide the structured data you need.
          </p>
          <p class="text-muted-foreground leading-relaxed">
            Every company profile includes key facts like employee count, revenue, specialties, and locations — all in a clean, consistent format optimized for quick research.
          </p>
        </section>

        <!-- Who It's For -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Who It's For</h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span class="text-foreground font-medium">Career researchers:</span> Veterans transitioning to contracting, or anyone exploring defense industry employers. Browse by specialty or location to find companies that match your interests.
            </p>
            <p>
              <span class="text-foreground font-medium">Industry professionals:</span> Recruiters, business development teams, and analysts who need quick reference on company basics.
            </p>
            <p>
              <span class="text-foreground font-medium">Employers:</span> Defense contractors can claim their company profile to verify information, add culture content, and showcase what makes them a great place to work.
            </p>
          </div>
        </section>

        <!-- Why We Built This -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Why We Built This</h2>
          <p class="text-muted-foreground leading-relaxed">
            There's no authoritative, defense-focused company directory. Wikipedia covers the major players; everyone else is scattered across press releases, LinkedIn, and paywalled databases. We're filling that gap with structured, freely accessible company profiles.
          </p>
        </section>

        <!-- Contact -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions, feedback, or partnership inquiries? Reach out at 
            <a href="mailto:hello@military.contractors" class="text-primary hover:underline">hello@military.contractors</a>.
          </p>
        </section>

      </div>
    </div>
  </div>
</template>
