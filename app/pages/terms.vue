<!--
  @file Terms of Service page
  @route /terms
  @description Terms of service for military.contractors
-->

<script setup lang="ts">
useHead({
  title: "Terms of Service | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Terms of service for military.contractors - rules and guidelines for using our platform.",
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
        <h1 class="text-foreground text-2xl font-bold sm:text-3xl">
          Terms of Service
        </h1>
        <p class="text-muted-foreground mt-2">
          Rules and guidelines for using our platform.
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-2xl space-y-10">
        <p class="text-muted-foreground text-sm">Last updated: December 2024</p>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Acceptance of terms
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            By accessing or using military.contractors ("the Service"), you
            agree to be bound by these Terms of Service. If you do not agree to
            these terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Description of service
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            military.contractors is a directory of defense contractors. We
            provide company profiles with structured data including revenue,
            specialties, and locations. We do not guarantee the accuracy of any
            information displayed.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">User accounts</h2>
          <div class="text-muted-foreground space-y-4 leading-relaxed">
            <p>
              You may create an account to access certain features. You are
              responsible for maintaining the security of your account
              credentials and for all activity that occurs under your account.
            </p>
            <p>
              You agree to provide accurate information when creating an account
              and to update your information if it changes. We reserve the right
              to suspend or terminate accounts that violate these terms.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Acceptable use</h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            You agree not to:
          </p>
          <ul
            class="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed"
          >
            <li>Use the Service for any unlawful purpose</li>
            <li>
              Scrape, crawl, or automatically collect data without permission
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Impersonate another person or entity</li>
            <li>Post false or misleading information</li>
            <li>Use the Service to harass, spam, or harm others</li>
          </ul>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Claimed profiles</h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            If you claim a company profile:
          </p>
          <ul
            class="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed"
          >
            <li>
              You warrant that you are authorized to represent the company
            </li>
            <li>
              You are responsible for the accuracy of information you provide
            </li>
            <li>
              We reserve the right to reject or revoke claims at our discretion
            </li>
            <li>
              Payment terms and refund policies are specified at the time of
              purchase
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Intellectual property
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            The Service and its original content are owned by
            military.contractors and protected by copyright and other
            intellectual property laws. You may not copy, modify, or distribute
            our content without permission.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Disclaimers</h2>
          <div class="text-muted-foreground space-y-4 leading-relaxed">
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE
              DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR TIMELINESS OF ANY
              CONTENT.
            </p>
            <p>
              We are not responsible for the actions of companies listed or
              other users. We do not verify the accuracy of company information
              or conduct background checks.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Limitation of liability
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MILITARY.CONTRACTORS SHALL
            NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Changes to terms</h2>
          <p class="text-muted-foreground leading-relaxed">
            We may modify these terms at any time. Continued use of the Service
            after changes constitutes acceptance of the new terms. We will
            notify users of significant changes via the site or email.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Governing law</h2>
          <p class="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the United States. Any
            disputes shall be resolved in the appropriate courts.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions about these terms?
            <NuxtLink to="/contact" class="text-primary hover:underline"
              >Get in touch</NuxtLink
            >.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
