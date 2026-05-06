<!--
  @file About page
  @route /about
  @description Explains the open contractor intelligence product
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

useHead({
  title: "About | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "military.contractors is a searchable database of companies and recipients receiving U.S. Department of Defense contract awards.",
    },
    {
      property: "og:title",
      content: "About | military.contractors",
    },
    {
      property: "og:description",
      content:
        "A searchable database of companies and recipients receiving U.S. defense contract awards.",
    },
    { property: "og:type", content: "website" },
  ],
});

useWebPageSchema({
  name: "About military.contractors",
  description:
    "Searchable database of Department of Defense-awarded USAspending contract recipients with source-backed profile context.",
});

const sections = [
  { id: "what-we-do", label: "What we do", icon: "mdi:compass-outline" },
  { id: "how-it-works", label: "How it works", icon: "mdi:cogs" },
  { id: "what-we-track", label: "What we track", icon: "mdi:database-outline" },
  { id: "what-this-is-not", label: "What this is not", icon: "mdi:cancel" },
  { id: "contact", label: "Contact", icon: "mdi:email-outline" },
];
</script>

<template>
  <div class="flex min-h-full flex-col lg:flex-row">
    <!-- TOC rail (desktop) -->
    <aside
      class="border-border hidden shrink-0 border-r lg:flex lg:w-72 lg:flex-col xl:w-80"
    >
      <div class="sticky top-0 flex flex-col gap-7 p-6">
        <div
          class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
        >
          On this page
        </div>
        <div class="border-border border-t">
          <a
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="border-border group hover:bg-muted/40 flex items-center justify-between border-b py-2 text-sm transition-colors"
          >
            <span
              class="text-foreground/90 group-hover:text-primary inline-flex items-center transition-colors"
            >
              <Icon
                :name="section.icon"
                class="text-muted-foreground mr-2 h-3.5 w-3.5"
              />
              {{ section.label }}
            </span>
          </a>
        </div>
      </div>
    </aside>

    <!-- Console -->
    <div class="min-w-0 flex-1">
      <div
        class="mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
      >
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>About</span>
          <span class="text-muted-foreground/40">/</span>
          <span>military.contractors</span>
        </div>

        <h1
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          Searchable
          <span class="text-primary">contractor database</span>.
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
          Source-backed profiles for companies and recipients receiving U.S.
          defense contract awards.
        </p>

        <div class="mt-10 space-y-6">
          <section
            id="what-we-do"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:compass-outline" class="text-primary h-4 w-4" />
              <span
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                What we do
              </span>
            </div>
            <div
              class="text-foreground/90 mt-4 space-y-3 text-sm leading-relaxed"
            >
              <p>
                We organize the active trailing 36-month USAspending recipient
                snapshot for Department of Defense-awarded contracts into a fast
                searchable contractor database.
              </p>
              <p>
                The goal is simple: make it easier to find who is receiving
                public defense contract awards, inspect their source-backed
                profile, and follow the underlying USAspending records.
              </p>
            </div>
          </section>

          <section
            id="how-it-works"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:cogs" class="text-primary h-4 w-4" />
              <span
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                How it works
              </span>
            </div>
            <ol
              class="text-foreground/90 mt-4 space-y-4 text-sm leading-relaxed"
            >
              <li>
                <strong class="text-foreground"
                  >1. Start with the database.</strong
                >
                Search by recipient name, UEI/code, agency, NAICS, or PSC.
              </li>
              <li>
                <strong class="text-foreground">2. Open a profile.</strong>
                Profiles combine the snapshot row with recent USAspending award
                evidence and cached profile intelligence.
              </li>
              <li>
                <strong class="text-foreground">3. Continue research.</strong>
                Ranking, agency, topic, and category views provide deeper lenses
                on the same public award data.
              </li>
            </ol>
          </section>

          <section
            id="what-we-track"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:database-outline" class="text-primary h-4 w-4" />
              <span
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                What we track
              </span>
            </div>
            <div class="mt-4 grid gap-6 text-sm leading-relaxed sm:grid-cols-2">
              <div>
                <h3 class="text-foreground mb-2 text-sm font-semibold">
                  Companies
                </h3>
                <ul class="text-muted-foreground space-y-1">
                  <li>
                    USAspending recipient names, UEIs, and recipient codes
                  </li>
                  <li>Trailing 36-month DoD obligations and award counts</li>
                  <li>Curated company overlays for known major contractors</li>
                </ul>
              </div>
              <div>
                <h3 class="text-foreground mb-2 text-sm font-semibold">
                  Award context
                </h3>
                <ul class="text-muted-foreground space-y-1">
                  <li>Public obligation totals</li>
                  <li>Top agencies, NAICS, and PSC categories</li>
                  <li>Recent awards and yearly trends</li>
                  <li>USAspending-shaped source metadata</li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="what-this-is-not"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:cancel" class="text-primary h-4 w-4" />
              <span
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                What this is not
              </span>
            </div>
            <p class="text-foreground/90 mt-4 text-sm leading-relaxed">
              This is not a job board, MOS translator, placement service, or
              career alert product. Public product development is focused on
              source-backed contractor database and profile evidence.
            </p>
          </section>

          <section
            id="contact"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:email-outline" class="text-primary h-4 w-4" />
              <span
                class="text-foreground text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
              >
                Contact
              </span>
            </div>
            <p class="text-foreground/90 mt-4 text-sm leading-relaxed">
              Questions, corrections, or partnership inquiries?
              <NuxtLink to="/contact" class="text-primary hover:underline">
                Get in touch </NuxtLink
              >.
            </p>
          </section>

          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button as-child size="lg" class="font-semibold">
              <NuxtLink to="/">Open Database</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="lg">
              <NuxtLink to="/rankings/top-defense-contractors"
                >View Rankings</NuxtLink
              >
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
