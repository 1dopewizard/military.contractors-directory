<!--
  @file Privacy Policy page
  @route /privacy
  @description Privacy policy for military.contractors
-->

<script setup lang="ts">
useHead({
  title: "Privacy Policy | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Privacy policy for military.contractors - how we collect, use, and protect your information.",
    },
  ],
});
</script>

<template>
  <div class="min-h-full">
    <DirectoryPageHeader
      eyebrow="Legal"
      title="Privacy Policy"
      description="How we collect, use, and protect your information."
      max-width="max-w-4xl"
    />

    <!-- Main Content -->
    <main class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-2xl space-y-10">
        <p class="text-muted-foreground text-sm">Last updated: December 2024</p>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Information we collect
          </h2>
          <div class="text-muted-foreground space-y-4 leading-relaxed">
            <p>
              <span class="text-foreground font-medium"
                >Account Information:</span
              >
              When you create an account, we collect your email address for
              authentication purposes.
            </p>
            <p>
              <span class="text-foreground font-medium">Usage Data:</span> We
              collect anonymized data about how you use the site, including
              search queries, pages visited, and features used. This helps us
              improve the service.
            </p>
            <p>
              <span class="text-foreground font-medium">Local Storage:</span> We
              store your preferences (recent searches, filters, and display
              settings) locally in your browser. This data never leaves your
              device unless you choose to sync it.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            How we use your information
          </h2>
          <ul
            class="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed"
          >
            <li>To provide and maintain the service</li>
            <li>
              To authenticate your account and enable personalized features
            </li>
            <li>
              To send transactional emails (password resets, account
              notifications)
            </li>
            <li>To analyze usage patterns and improve the platform</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Information sharing
          </h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            We do not sell your personal information. We may share data with:
          </p>
          <ul
            class="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed"
          >
            <li>
              <span class="text-foreground">Service Providers:</span>
              Third-party services that help us operate (hosting, analytics,
              email delivery)
            </li>
            <li>
              <span class="text-foreground">Legal Requirements:</span> When
              required by law or to protect our rights
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Cookies and tracking
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and site functionality.
            We use privacy-respecting analytics to understand how the site is
            used. We do not use advertising cookies or sell data to advertisers.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Data security</h2>
          <p class="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your
            data, including encryption in transit (HTTPS), secure
            authentication, and regular security audits. However, no method of
            transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Your rights</h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            You have the right to:
          </p>
          <ul
            class="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed"
          >
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p class="text-muted-foreground mt-4 leading-relaxed">
            To exercise these rights,
            <NuxtLink to="/contact" class="text-primary hover:underline"
              >contact us</NuxtLink
            >.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">
            Changes to this policy
          </h2>
          <p class="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. We will notify you of
            significant changes by posting a notice on the site or sending an
            email to registered users.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions about this policy?
            <NuxtLink to="/contact" class="text-primary hover:underline"
              >Get in touch</NuxtLink
            >.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
