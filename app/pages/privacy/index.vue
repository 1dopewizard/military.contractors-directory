<!--
  @file Privacy Policy page
  @description Practical, scannable privacy policy for military.contractors
-->

<script setup lang="ts">
useHead({
  title: "Privacy Policy | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Privacy policy for military.contractors. We collect minimal data and never sell your information.",
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
        <span class="text-foreground">Privacy Policy</span>
      </nav>

      <!-- Page Title -->
      <header class="mb-10">
        <h1 class="text-foreground mb-2 text-2xl font-bold md:text-3xl">
          Privacy Policy
        </h1>
        <p class="text-muted-foreground">Last updated: November 2024</p>
      </header>

      <div class="space-y-10 text-sm leading-relaxed">
        <!-- TL;DR -->
        <section class="border-primary border-l-2 pl-4">
          <h2 class="text-foreground mb-2 font-semibold">The Short Version</h2>
          <ul class="text-muted-foreground space-y-1">
            <li>We collect only what's needed to run the service</li>
            <li>We never sell your data</li>
            <li>You can delete your account anytime</li>
            <li>No tracking across other sites</li>
          </ul>
        </section>

        <!-- What We Collect -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            What We Collect
          </h2>

          <div class="text-muted-foreground space-y-4">
            <div>
              <strong class="text-foreground">Account Information</strong><br />
              Email address and password (hashed). Used for authentication only.
            </div>

            <div>
              <strong class="text-foreground">Profile Data</strong><br />
              MOS/AFSC codes, saved jobs, and preferences you choose to add.
            </div>

            <div>
              <strong class="text-foreground">Usage Data</strong><br />
              Pages visited, searches made. Used to improve the service. Not
              tied to your identity for analytics.
            </div>
          </div>
        </section>

        <!-- What We Don't Collect -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            What We Don't Collect
          </h2>

          <ul class="text-muted-foreground space-y-1">
            <li>Social security numbers or government IDs</li>
            <li>Financial information (we don't process payments directly)</li>
            <li>Location tracking</li>
            <li>Cross-site browsing data</li>
          </ul>
        </section>

        <!-- How We Use It -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">
            How We Use Your Data
          </h2>

          <ul class="text-muted-foreground space-y-1">
            <li>Match jobs to your MOS and preferences</li>
            <li>Send job alerts (if you opt in)</li>
            <li>Improve search and ranking algorithms</li>
            <li>Detect and prevent abuse</li>
          </ul>
        </section>

        <!-- Data Sharing -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">Data Sharing</h2>

          <div class="text-muted-foreground space-y-3">
            <p>
              <strong class="text-foreground">We never sell your data.</strong>
            </p>
            <p>We share data only with:</p>
            <ul class="space-y-1">
              <li>
                <strong class="text-foreground">Supabase</strong> — Database and
                authentication provider
              </li>
              <li>
                <strong class="text-foreground">Vercel</strong> — Hosting
                provider
              </li>
              <li>
                <strong class="text-foreground">Resend</strong> — Email delivery
                (for job alerts)
              </li>
            </ul>
            <p>
              These providers process data on our behalf under strict
              agreements.
            </p>
          </div>
        </section>

        <!-- Your Rights -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">Your Rights</h2>

          <div class="text-muted-foreground grid gap-4 sm:grid-cols-2">
            <div>
              <strong class="text-foreground">Access</strong><br />
              Request a copy of your data
            </div>
            <div>
              <strong class="text-foreground">Delete</strong><br />
              Request account deletion
            </div>
            <div>
              <strong class="text-foreground">Correct</strong><br />
              Update inaccurate data
            </div>
            <div>
              <strong class="text-foreground">Export</strong><br />
              Download your data
            </div>
          </div>
        </section>

        <!-- Cookies -->
        <section>
          <h2 class="text-foreground mb-3 text-lg font-bold">Cookies</h2>

          <p class="text-muted-foreground">
            We use essential cookies only — for authentication and remembering
            your preferences (like dark mode). No advertising or third-party
            tracking cookies.
          </p>
        </section>

        <!-- Contact -->
        <section class="border-border border-t pt-6">
          <h2 class="text-foreground mb-2 font-semibold">Questions?</h2>
          <a
            href="mailto:privacy@military.contractors"
            class="text-primary font-mono hover:underline"
          >
            privacy@military.contractors
          </a>
        </section>
      </div>
    </div>
  </div>
</template>
