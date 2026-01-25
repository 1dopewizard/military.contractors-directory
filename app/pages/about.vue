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
      content: 'Learn about military.contractors - connecting cleared veterans with defense contractor opportunities.'
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
            Translating military experience into civilian careers.
          </h1>
          <p class="text-lg text-muted-foreground leading-relaxed">
            military.contractors helps veterans find cleared IT and cyber contractor positions by matching their military occupational specialties to relevant job opportunities.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="space-y-12 max-w-3xl">
        
        <!-- Mission -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Our Mission</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Transitioning from military to civilian employment can be challenging. Veterans often struggle to translate their specialized training and experience into terms civilian employers understand. We bridge that gap.
          </p>
          <p class="text-muted-foreground leading-relaxed">
            By indexing thousands of Military Occupational Specialties (MOSes) across all branches and matching them to contractor job listings, we help veterans quickly find positions that value their unique skills and security clearances.
          </p>
        </section>

        <!-- How It Works -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">How It Works</h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span class="text-foreground font-medium">Search by MOS:</span> Enter your MOS code (like 25B, 17C, or 0651) and instantly see relevant contractor positions that match your training.
            </p>
            <p>
              <span class="text-foreground font-medium">Filter by clearance:</span> Already have a security clearance? Filter jobs by clearance level to find positions where your credentials give you an advantage.
            </p>
            <p>
              <span class="text-foreground font-medium">Browse companies:</span> Research defense contractors, see what positions they're hiring for, and understand the landscape before applying.
            </p>
          </div>
        </section>

        <!-- Free for Job Seekers -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Free for Veterans</h2>
          <p class="text-muted-foreground leading-relaxed">
            Job searching should never cost you money. All features on military.contractors are completely free for job seekers. We sustain the platform through sponsored job listings and company advertisements — never by charging veterans.
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
