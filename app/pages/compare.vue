<!--
  @file Contractor comparison page
  @route /compare
  @description Compare two to four contractor intelligence profiles side by side
-->

<script setup lang="ts">
import type { ContractorIntelligence } from "@/app/types/intelligence.types";

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const contractorInput = ref(
  (route.query.contractors as string) ||
    (route.query.c as string) ||
    "lockheed-martin,rtx,northrop-grumman",
);

const slugs = computed(() =>
  contractorInput.value
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4),
);

const {
  data: comparison,
  pending,
  error,
  refresh,
} = useAsyncData(
  "contractor-comparison",
  async () => {
    if (slugs.value.length < 2) return [];
    return Promise.all(
      slugs.value.map((slug) =>
        $fetch<ContractorIntelligence>(`/api/intelligence/contractors/${slug}`),
      ),
    );
  },
  {
    watch: [slugs],
    default: () => [],
  },
);

useSeoMeta({
  title: "Compare Defense Contractors | military.contractors",
  description:
    "Compare defense contractors by USAspending obligations, agencies, categories, trends, and recent awards.",
  ogTitle: "Compare Defense Contractors",
  ogDescription:
    "Side-by-side source-backed contractor intelligence comparisons.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/compare` }],
});

useJsonLd({
  "@type": "Dataset",
  name: "Defense Contractor Comparison",
  description:
    "Side-by-side comparison of normalized USAspending contractor award data.",
  isBasedOn: "https://www.usaspending.gov",
});

const runComparison = () => {
  router.replace({ path: "/compare", query: { contractors: slugs.value.join(",") } });
  refresh();
};

const formatMoney = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};
</script>

<template>
  <main class="min-h-full">
    <section class="border-border border-b">
      <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p class="text-muted-foreground text-sm">2-4 contractors</p>
        <h1 class="text-foreground mt-2 text-3xl font-semibold tracking-tight">
          Compare Contractors
        </h1>
      </div>
    </section>

    <section class="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <form class="mb-6 flex flex-col gap-3 sm:flex-row" @submit.prevent="runComparison">
        <Input
          v-model="contractorInput"
          class="rounded-none"
          placeholder="lockheed-martin,rtx,northrop-grumman"
        />
        <Button type="submit">Compare</Button>
      </form>

      <Alert v-if="error" variant="destructive" class="mb-6">
        <AlertTitle>Comparison error</AlertTitle>
        <AlertDescription>{{ error.message }}</AlertDescription>
      </Alert>

      <div v-if="pending" class="border-border border p-8">
        <LoadingText text="Loading contractor intelligence" />
      </div>

      <div
        v-else-if="comparison.length"
        class="border-border grid border-t border-l sm:grid-cols-2 xl:grid-cols-4"
      >
        <article
          v-for="item in comparison"
          :key="item.contractor.slug"
          class="border-border border-r border-b p-5"
        >
          <NuxtLink
            :to="`/companies/${item.contractor.slug}`"
            class="text-foreground hover:text-primary text-lg font-semibold"
          >
            {{ item.contractor.name }}
          </NuxtLink>

          <dl class="mt-5 space-y-4">
            <div>
              <dt class="text-muted-foreground text-xs">Matched obligations</dt>
              <dd class="text-foreground mt-1 text-2xl font-semibold">
                {{ formatMoney(item.summary.totalObligations) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">Awards</dt>
              <dd class="text-foreground mt-1">{{ item.summary.awardCount }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">Top agency</dt>
              <dd class="text-foreground mt-1">
                {{ item.summary.topSubAgency?.label || item.summary.topAgency?.label || "N/A" }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">Top NAICS</dt>
              <dd class="text-foreground mt-1">
                {{ item.summary.topNaics?.label || "N/A" }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">YoY delta</dt>
              <dd class="text-foreground mt-1">
                {{ formatMoney(item.summary.yoyDelta) }}
              </dd>
            </div>
          </dl>

          <div class="mt-5 border-t pt-4">
            <p class="text-muted-foreground mb-2 text-xs">Recent awards</p>
            <ul class="space-y-2">
              <li
                v-for="award in item.recentAwards.slice(0, 3)"
                :key="award.key"
                class="text-muted-foreground text-xs"
              >
                <span class="text-foreground">{{ formatMoney(award.obligation) }}</span>
                {{ award.awardingSubAgency || award.awardingAgency }}
              </li>
            </ul>
          </div>
        </article>
      </div>

      <Empty v-else class="border">
        <EmptyContent>
          <EmptyTitle>Choose at least two contractors</EmptyTitle>
          <EmptyDescription>
            Use comma-separated company slugs from contractor profile URLs.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </section>
  </main>
</template>
