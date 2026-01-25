<!--
  @file Terms of Service page
  @route /terms
  @description Terms of service for military.contractors
-->

<script setup lang="ts">
useHead({
  title: 'Terms of Service | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Terms of service for military.contractors - rules and guidelines for using our platform.'
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
          <span class="text-foreground">Terms of Service</span>
        </nav>

        <div class="max-w-2xl">
          <p class="text-xs font-mono uppercase tracking-widest text-primary mb-3">Legal</p>
          <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Terms of Service
          </h1>
          <p class="text-lg text-muted-foreground leading-relaxed">
            By using military.contractors, you agree to these terms. Please read them carefully.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="space-y-10 max-w-3xl">
        
        <p class="text-sm text-muted-foreground">Last updated: December 2024</p>

        <!-- Acceptance -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Acceptance of Terms</h2>
          <p class="text-muted-foreground leading-relaxed">
            By accessing or using military.contractors ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
          </p>
        </section>

        <!-- Description of Service -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Description of Service</h2>
          <p class="text-muted-foreground leading-relaxed">
            military.contractors is a job search platform that helps veterans find cleared IT and cyber contractor positions. We aggregate job listings from various sources and match them to military occupational specialties. We do not guarantee employment or the accuracy of any job listing.
          </p>
        </section>

        <!-- User Accounts -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">User Accounts</h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              You may create an account to access certain features. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.
            </p>
            <p>
              You agree to provide accurate information when creating an account and to update your information if it changes. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </div>
        </section>

        <!-- Acceptable Use -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Acceptable Use</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            You agree not to:
          </p>
          <ul class="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>Use the Service for any unlawful purpose</li>
            <li>Scrape, crawl, or automatically collect data without permission</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Impersonate another person or entity</li>
            <li>Post false, misleading, or fraudulent job listings (advertisers)</li>
            <li>Use the Service to harass, spam, or harm others</li>
          </ul>
        </section>

        <!-- Advertisers -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Advertiser Terms</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            If you post sponsored content or job listings:
          </p>
          <ul class="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>You warrant that your listings are accurate, legitimate, and comply with all applicable laws</li>
            <li>You are responsible for the content of your advertisements</li>
            <li>We reserve the right to reject or remove any advertisement at our discretion</li>
            <li>Payment terms and refund policies are specified at the time of purchase</li>
          </ul>
        </section>

        <!-- Intellectual Property -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Intellectual Property</h2>
          <p class="text-muted-foreground leading-relaxed">
            The Service and its original content (excluding user-submitted content and third-party job listings) are owned by military.contractors and protected by copyright and other intellectual property laws. You may not copy, modify, or distribute our content without permission.
          </p>
        </section>

        <!-- Disclaimers -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Disclaimers</h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR TIMELINESS OF JOB LISTINGS OR OTHER CONTENT.
            </p>
            <p>
              We are not responsible for the actions of employers, recruiters, or other users. We do not verify the legitimacy of job postings or conduct background checks on employers.
            </p>
          </div>
        </section>

        <!-- Limitation of Liability -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Limitation of Liability</h2>
          <p class="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MILITARY.CONTRACTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <!-- Changes -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Changes to Terms</h2>
          <p class="text-muted-foreground leading-relaxed">
            We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify users of significant changes via the site or email.
          </p>
        </section>

        <!-- Governing Law -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Governing Law</h2>
          <p class="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the United States. Any disputes shall be resolved in the appropriate courts.
          </p>
        </section>

        <!-- Contact -->
        <section>
          <h2 class="text-lg font-bold text-foreground mb-4">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions about these terms? Contact us at <a href="mailto:legal@military.contractors" class="text-primary hover:underline">legal@military.contractors</a>.
          </p>
        </section>

      </div>
    </div>
  </div>
</template>
