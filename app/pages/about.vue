<!--
  @file About page
  @route /about
  @description Information about military.contractors
-->

<script setup lang="ts">
useHead({
  title: "About | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "military.contractors is the definitive directory of defense contractors - structured company profiles, specialties, and locations for the defense industry.",
    },
  ],
});
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <h1 class="text-foreground text-2xl font-bold sm:text-3xl">About</h1>
        <p class="text-muted-foreground mt-2">
          The definitive directory of defense contractors.
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-2xl space-y-10">
        <section>
          <h2 class="text-foreground mb-3 font-semibold">What we do</h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            Think of us as Crunchbase for defense contractors. Whether you're
            researching potential employers, scouting competitors, or exploring
            the defense industry landscape, we provide the structured data you
            need.
          </p>
          <p class="text-muted-foreground leading-relaxed">
            Every company profile includes key facts like employee count,
            revenue, specialties, and locations — all in a clean, consistent
            format optimized for quick research.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Who it's for</h2>
          <div class="text-muted-foreground space-y-4 leading-relaxed">
            <p>
              <span class="text-foreground font-medium"
                >Career researchers:</span
              >
              Veterans transitioning to contracting, or anyone exploring defense
              industry employers. Browse by specialty or location to find
              companies that match your interests.
            </p>
            <p>
              <span class="text-foreground font-medium"
                >Industry professionals:</span
              >
              Recruiters, business development teams, and analysts who need
              quick reference on company basics.
            </p>
            <p>
              <span class="text-foreground font-medium">Employers:</span>
              Defense contractors can claim their company profile to verify
              information, add culture content, and showcase what makes them a
              great place to work.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Why we built this</h2>
          <p class="text-muted-foreground leading-relaxed">
            There's no authoritative, defense-focused company directory.
            Wikipedia covers the major players; everyone else is scattered
            across press releases, LinkedIn, and paywalled databases. We're
            filling that gap with structured, freely accessible company
            profiles.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions, feedback, or partnership inquiries?
            <NuxtLink to="/contact" class="text-primary hover:underline"
              >Get in touch</NuxtLink
            >.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
