<!--
  @file About page
  @route /about
  @description Explains the open contractor intelligence product
-->

<script setup lang="ts">
useHead({
  title: "About | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "military.contractors provides open intelligence on U.S. defense contractors, public awards, agencies, NAICS/PSC categories, and spending trends.",
    },
    {
      property: "og:title",
      content: "About | military.contractors",
    },
    {
      property: "og:description",
      content:
        "Open contractor intelligence backed by structured public award data and source links.",
    },
    { property: "og:type", content: "website" },
  ],
});

useWebPageSchema({
  name: "About military.contractors",
  description:
    "Open intelligence on U.S. defense contractors, public awards, agencies, categories, and spending trends.",
});
</script>

<template>
  <div class="min-h-full">
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <h1 class="text-foreground text-2xl font-bold sm:text-3xl">
          About military.contractors
        </h1>
        <p class="text-muted-foreground mt-3 max-w-2xl text-lg">
          Open intelligence on U.S. defense contractors.
        </p>
      </div>
    </header>

    <main class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-2xl space-y-10 text-sm leading-relaxed">
        <section>
          <h2 class="text-foreground mb-3 font-semibold">What We Do</h2>
          <p class="text-muted-foreground mb-4">
            We organize contractor profiles, public award context, agencies,
            NAICS and PSC categories, locations, and spending trends into a
            searchable intelligence layer.
          </p>
          <p class="text-muted-foreground">
            The goal is simple: make it easier to understand who is winning
            public defense work, where that work sits, which agencies are
            involved, and which source records support the answer.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">How It Works</h2>
          <ol class="text-muted-foreground space-y-4">
            <li>
              <strong class="text-foreground">1. Start with a question</strong>
              <br />
              Ask about a contractor, agency, NAICS/PSC category, location, or
              award keyword.
            </li>
            <li>
              <strong class="text-foreground">2. Use structured filters</strong>
              <br />
              The explorer converts plain English into a validated query plan
              and deterministic backend operations.
            </li>
            <li>
              <strong class="text-foreground">3. Verify the source records</strong>
              <br />
              Results include filters, ranked tables, summaries, and public
              source links rather than free-form claims.
            </li>
          </ol>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">What We Track</h2>
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 class="text-foreground mb-2 font-semibold">Companies</h3>
              <ul class="text-muted-foreground space-y-1">
                <li>Names, aliases, headquarters, and identifiers</li>
                <li>Specialties and locations</li>
                <li>Revenue context and public profile links</li>
                <li>Claimed profile status where applicable</li>
              </ul>
            </div>
            <div>
              <h3 class="text-foreground mb-2 font-semibold">Award Context</h3>
              <ul class="text-muted-foreground space-y-1">
                <li>Public obligation totals</li>
                <li>Top agencies, NAICS, and PSC categories</li>
                <li>Recent awards and yearly trends</li>
                <li>USAspending-shaped source metadata</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">What This Is Not</h2>
          <p class="text-muted-foreground">
            This is not a job board, MOS translator, placement service, or
            career alert product. Public product development is focused on
            source-backed contractor intelligence.
          </p>
        </section>

        <section>
          <h2 class="text-foreground mb-3 font-semibold">Contact</h2>
          <p class="text-muted-foreground leading-relaxed">
            Questions, corrections, or partnership inquiries?
            <NuxtLink to="/contact" class="text-primary hover:underline">
              Get in touch</NuxtLink
            >.
          </p>
        </section>

        <section class="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button as-child size="lg" class="font-semibold">
            <NuxtLink to="/explorer"> Open Explorer </NuxtLink>
          </Button>
          <Button as-child variant="link" size="lg">
            <NuxtLink to="/companies"> Browse Companies </NuxtLink>
          </Button>
        </section>
      </div>
    </main>
  </div>
</template>
