<!--
  @file Privacy Policy page
  @route /privacy
  @description Privacy policy for military.contractors
-->

<script setup lang="ts">
useHead({
  title: 'Privacy Policy | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Privacy policy for military.contractors - how we collect, use, and protect your information.'
    }
  ]
})
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <header class="border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16">
        <h1 class="text-2xl sm:text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p class="mt-2 text-muted-foreground">
          How we collect, use, and protect your information.
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
      <div class="space-y-10 max-w-2xl">
        
        <p class="text-sm text-muted-foreground">Last updated: December 2024</p>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Information we collect</h2>
          <div class="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span class="text-foreground font-medium">Account Information:</span> When you create an account, we collect your email address for authentication purposes.
            </p>
            <p>
              <span class="text-foreground font-medium">Usage Data:</span> We collect anonymized data about how you use the site, including search queries, pages visited, and features used. This helps us improve the service.
            </p>
            <p>
              <span class="text-foreground font-medium">Local Storage:</span> We store your preferences (saved jobs, search filters) locally in your browser. This data never leaves your device unless you choose to sync it.
            </p>
          </div>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">How we use your information</h2>
          <ul class="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>To provide and maintain the service</li>
            <li>To authenticate your account and enable personalized features</li>
            <li>To send transactional emails (password resets, account notifications)</li>
            <li>To analyze usage patterns and improve the platform</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Information sharing</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            We do not sell your personal information. We may share data with:
          </p>
          <ul class="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li><span class="text-foreground">Service Providers:</span> Third-party services that help us operate (hosting, analytics, email delivery)</li>
            <li><span class="text-foreground">Legal Requirements:</span> When required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Cookies and tracking</h2>
          <p class="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and site functionality. We use privacy-respecting analytics to understand how the site is used. We do not use advertising cookies or sell data to advertisers.
          </p>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Data security</h2>
          <p class="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS), secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Your rights</h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul class="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p class="text-muted-foreground leading-relaxed mt-4">
            To exercise these rights, <NuxtLink to="/contact" class="text-primary hover:underline">contact us</NuxtLink>.
          </p>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Changes to this policy</h2>
          <p class="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. We will notify you of significant changes by posting a notice on the site or sending an email to registered users.
          </p>
        </section>

        <section>
          <h2 class="font-semibold text-foreground mb-3">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions about this policy? <NuxtLink to="/contact" class="text-primary hover:underline">Get in touch</NuxtLink>.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
