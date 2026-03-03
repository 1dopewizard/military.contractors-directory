<!--
  @file Insights Hub Page
  @route /insights
  @description Collection of defense contractor industry insights and analysis articles
-->

<script setup lang="ts">
useHead({
  title: "Defense Contractor Insights & Intelligence | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Expert analysis on defense contractor hiring, military contractor pay, MOS career paths, and industry trends. Updated for the 2026 Iran conflict hiring surge.",
    },
    {
      property: "og:title",
      content:
        "Defense Contractor Insights & Intelligence | military.contractors",
    },
    {
      property: "og:description",
      content:
        "Expert analysis on defense contractor hiring, military contractor pay, MOS career paths, and industry trends.",
    },
  ],
});

useCollectionPageSchema({
  name: "Defense Contractor Insights & Intelligence",
  description:
    "Expert analysis on defense contractor hiring, military contractor pay, MOS career paths, and industry trends.",
});

useBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Insights", url: "/insights" },
]);

const articles = [
  {
    date: "March 2, 2026",
    title:
      "Defense Contractor Hiring Surge: What the Iran Conflict Means for Veterans",
    summary:
      "Operation Epic Fury has triggered the largest defense hiring surge since Iraq. Which contractors are hiring, what roles are in demand, and how veterans can capitalize on $858.9B in defense spending.",
    href: "/insights/defense-hiring-surge-2026",
  },
  {
    date: "March 2, 2026",
    title: "Which Defense Contractors Are Hiring Now (March 2026)",
    summary:
      "Company-by-company breakdown of defense contractors actively hiring. LOGCAP, PMC/security, IT/cyber, and OEM positions with pay ranges and career page links.",
    href: "/insights/contractors-hiring-now",
  },
  {
    date: "March 2, 2026",
    title: "MOS Codes Most in Demand for Middle East Operations (2026)",
    summary:
      "Intelligence, cyber, SOF, and combat arms MOS codes most sought by defense contractors. Pay ranges $80K-$300K+, 90% placement rates for top specialties.",
    href: "/insights/mos-demand-middle-east",
  },
  {
    date: "March 2, 2026",
    title: "Military Contractor Pay & Tax Benefits: 2026 Complete Guide",
    summary:
      "Complete guide to military contractor pay ($80K-$300K+), the Foreign Earned Income Exclusion ($132,900), combat zone tax benefits, and compensation optimization strategies.",
    href: "/insights/contractor-pay-tax-guide",
  },
];
</script>

<template>
  <div class="min-h-full">
    <!-- Hero -->
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <h1
          class="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Defense Contractor Insights
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-lg">
          Expert analysis on defense contractor hiring trends, military
          contractor compensation, MOS career paths, and industry intelligence.
          Written for veterans and military professionals navigating the defense
          labor market.
        </p>
      </div>
    </header>

    <!-- Article Grid -->
    <section>
      <div class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="bg-border border-border grid gap-px border md:grid-cols-2">
          <NuxtLink
            v-for="article in articles"
            :key="article.href"
            :to="article.href"
            class="bg-background group flex flex-col p-6 transition-colors hover:bg-muted/50"
          >
            <Badge variant="secondary" class="w-fit text-xs">
              {{ article.date }}
            </Badge>
            <h2
              class="text-foreground group-hover:text-primary mt-3 text-lg font-semibold transition-colors"
            >
              {{ article.title }}
            </h2>
            <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
              {{ article.summary }}
            </p>
            <span
              class="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium"
            >
              Read more
              <Icon name="mdi:arrow-right" class="h-4 w-4" />
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-border border-t">
      <div
        class="container mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <h2 class="text-foreground text-2xl font-bold">
          Ready to get placed?
        </h2>
        <p class="text-muted-foreground mt-2">
          Submit your profile and get matched with defense contractors hiring
          now.
        </p>
        <div class="mt-6 flex justify-center gap-4">
          <Button as-child>
            <NuxtLink to="/for-companies">For Companies</NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink to="/companies">Browse Companies</NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
