<!--
  @file Terms of Service page
  @description Practical, scannable terms of service for military.contractors
-->

<script setup lang="ts">
useHead({
  title: "Terms of Service | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Terms of service for military.contractors. Rules for using the platform.",
    },
  ],
});
</script>

<template>
  <div class="min-h-full">
    <!-- Content -->
    <div class="container mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="text-muted-foreground mb-8 text-sm">
        <NuxtLink to="/" class="hover:text-primary transition-colors"
          >Home</NuxtLink
        >
        <span class="mx-2">/</span>
        <span class="text-foreground">Terms of Service</span>
      </nav>

      <!-- Page Title -->
      <header class="mb-10">
        <h1 class="text-foreground mb-2 text-2xl font-bold md:text-3xl">
          Terms of Service
        </h1>
        <p class="text-muted-foreground">Last updated: November 2024</p>
      </header>

      <div class="space-y-10 text-sm leading-relaxed">
        <!-- TL;DR -->
        <section class="border-primary border-l-2 pl-4">
          <h2 class="text-foreground mb-2 font-semibold">The Short Version</h2>
          <ul class="text-muted-foreground space-y-1">
            <li>Free for job seekers, always</li>
            <li>Don't scrape or abuse the service</li>
            <li>We're not responsible for third-party job listings</li>
            <li>We can suspend accounts that violate these terms</li>
          </ul>
        </section>

        <!-- Agreement -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">1. Agreement</h2>
          <p class="text-muted-foreground">
            By using military.contractors, you agree to these terms. If you
            don't agree, don't use the site.
          </p>
        </section>

        <!-- The Service -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">2. The Service</h2>
          <p class="text-muted-foreground mb-3">
            military.contractors provides:
          </p>
          <ul class="text-muted-foreground space-y-1">
            <li>Job listings matched to military specialties (MOS/AFSC)</li>
            <li>Company and contractor information</li>
            <li>Search and filtering tools</li>
            <li>Optional account features (saved jobs, alerts)</li>
          </ul>
        </section>

        <!-- Your Responsibilities -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            3. Your Responsibilities
          </h2>

          <div class="text-muted-foreground space-y-4">
            <div>
              <strong class="text-foreground">Be Accurate</strong><br />
              Provide truthful information about your background and
              qualifications.
            </div>

            <div>
              <strong class="text-foreground">Don't Abuse</strong><br />
              No scraping, automated access, spamming, or attempts to disrupt
              the service.
            </div>

            <div>
              <strong class="text-foreground">Respect Others</strong><br />
              No harassment, threats, or illegal activity.
            </div>
          </div>
        </section>

        <!-- Disclaimers -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">4. Disclaimers</h2>

          <ul class="text-muted-foreground space-y-2">
            <li>
              <strong class="text-foreground">Job listings:</strong> Posted by
              employers. We don't guarantee accuracy, availability, or hiring
              outcomes.
            </li>
            <li>
              <strong class="text-foreground">Companies:</strong> Information is
              aggregated from public sources. Verify directly with employers.
            </li>
            <li>
              <strong class="text-foreground">Clearances:</strong> Listed
              requirements are from job postings. Actual requirements may vary.
            </li>
          </ul>
        </section>

        <!-- Account Termination -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            5. Account Termination
          </h2>

          <p class="text-muted-foreground mb-2">
            We may suspend or terminate accounts that:
          </p>
          <ul class="text-muted-foreground mb-3 space-y-1">
            <li>Violate these terms</li>
            <li>Abuse the service</li>
            <li>Engage in fraudulent activity</li>
            <li>Scrape or extract data without permission</li>
          </ul>
          <p class="text-muted-foreground">
            You can delete your account anytime from your profile settings.
          </p>
        </section>

        <!-- IP -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            6. Intellectual Property
          </h2>

          <p class="text-muted-foreground">
            The military.contractors name, logo, and original content are our
            property. Job listings belong to their respective employers. You may
            not reproduce or redistribute site content without permission.
          </p>
        </section>

        <!-- Changes -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            7. Changes to Terms
          </h2>

          <p class="text-muted-foreground">
            We may update these terms. Significant changes will be announced on
            the site. Continued use after changes means you accept the new
            terms.
          </p>
        </section>

        <!-- Contact -->
        <section class="border-border border-t pt-6">
          <h2 class="text-foreground mb-2 font-semibold">Questions?</h2>
          <a
            href="mailto:legal@military.contractors"
            class="text-primary font-mono hover:underline"
          >
            legal@military.contractors
          </a>
        </section>
      </div>
    </div>
  </div>
</template>
