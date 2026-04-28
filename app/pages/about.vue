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
            <span class="text-foreground/90 group-hover:text-primary inline-flex items-center transition-colors">
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
          Open
          <span class="text-primary">contractor intelligence</span>.
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
          Source-backed research on U.S. defense contractors, agencies,
          categories, and public spending trends.
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
            <div class="text-foreground/90 mt-4 space-y-3 text-sm leading-relaxed">
              <p>
                We organize contractor profiles, public award context, agencies,
                NAICS and PSC categories, locations, and spending trends into a
                searchable intelligence layer.
              </p>
              <p>
                The goal is simple: make it easier to understand who is winning
                public defense work, where that work sits, which agencies are
                involved, and which source records support the answer.
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
            <ol class="text-foreground/90 mt-4 space-y-4 text-sm leading-relaxed">
              <li>
                <strong class="text-foreground">1. Start with a question.</strong>
                Ask about a contractor, agency, NAICS/PSC category, location, or
                award keyword.
              </li>
              <li>
                <strong class="text-foreground">2. Use structured filters.</strong>
                The explorer converts plain English into a validated query plan
                and deterministic backend operations.
              </li>
              <li>
                <strong class="text-foreground">3. Verify the source records.</strong>
                Results include filters, ranked tables, summaries, and public
                source links rather than free-form claims.
              </li>
            </ol>
          </section>

          <section
            id="what-we-track"
            class="border-primary/40 bg-card border-l-2 p-6"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="mdi:database-outline"
                class="text-primary h-4 w-4"
              />
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
                  <li>Names, aliases, headquarters, and identifiers</li>
                  <li>Specialties and locations</li>
                  <li>Revenue context and public profile links</li>
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
              source-backed contractor intelligence.
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
                Get in touch </NuxtLink>.
            </p>
          </section>

          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button as-child size="lg" class="font-semibold">
              <NuxtLink to="/explorer">Open Explorer</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="lg">
              <NuxtLink to="/companies">Browse Companies</NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
