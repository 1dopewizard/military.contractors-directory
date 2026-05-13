<!--
  @file Find primes/subs page
  @route /find-primes-subs
  @description Public-data capability search for prime and subcontractor discovery
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

interface TeamingSearchResult {
  slug: string;
  name: string;
  obligations36m: number;
  awardCount36m: number;
  sourceUrl: string;
  matchScore: number;
  roleFit: "likely_prime" | "potential_sub";
  reasons: Array<{
    label: string;
    value: string;
    provenance: "public_data" | "contractor_declared";
  }>;
}

interface TeamingSearchResponse {
  results: TeamingSearchResult[];
  total: number;
  provenance: {
    publicData: string;
    contractorDeclared: string;
  };
}

const filters = reactive({
  q: "",
  naics: "",
  psc: "",
  agency: "",
  role: "any" as "any" | "prime" | "sub",
});

const queryParams = computed(() => ({
  q: filters.q || undefined,
  naics: filters.naics || undefined,
  psc: filters.psc || undefined,
  agency: filters.agency || undefined,
  role: filters.role,
  limit: 20,
}));

const { data, pending, error, refresh } = useFetch<TeamingSearchResponse>(
  "/api/teaming/search",
  {
    query: queryParams,
    lazy: true,
    default: () => ({
      results: [],
      total: 0,
      provenance: {
        publicData:
          "Matches are inferred from USAspending-backed recipient snapshot activity.",
        contractorDeclared:
          "Verified claimed capabilities will be displayed separately in later releases.",
      },
    }),
  },
);

const results = computed(() => data.value?.results ?? []);

const handleSearch = () => {
  void refresh();
};

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};

useHead({
  title: "Find Primes/Subs | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Find likely defense primes and potential subcontractors by NAICS, PSC, agency, and public award evidence.",
    },
  ],
});
</script>

<template>
  <div class="min-h-full">
    <DirectoryPageHeader
      eyebrow="Capability search"
      title="Find primes and potential subs"
      description="Search by NAICS, PSC, agency, or award keywords. Matches explain the public award evidence behind likely prime and potential subcontractor fits."
      max-width="max-w-5xl"
    />

    <main class="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section class="border-border bg-card/40 border p-5">
        <form class="grid gap-4 md:grid-cols-5" @submit.prevent="handleSearch">
          <div>
            <Label for="q">Keyword</Label>
            <Input
              id="q"
              v-model="filters.q"
              class="mt-2"
              placeholder="cyber, ship, logistics"
            />
          </div>
          <div>
            <Label for="naics">NAICS</Label>
            <Input
              id="naics"
              v-model="filters.naics"
              class="mt-2"
              placeholder="541512"
            />
          </div>
          <div>
            <Label for="psc">PSC</Label>
            <Input
              id="psc"
              v-model="filters.psc"
              class="mt-2"
              placeholder="D399"
            />
          </div>
          <div>
            <Label for="agency">Agency</Label>
            <Input
              id="agency"
              v-model="filters.agency"
              class="mt-2"
              placeholder="Navy"
            />
          </div>
          <div>
            <Label for="role">Role</Label>
            <Select v-model="filters.role">
              <SelectTrigger id="role" class="mt-2 w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any fit</SelectItem>
                <SelectItem value="prime">Likely primes</SelectItem>
                <SelectItem value="sub">Potential subs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="md:col-span-5">
            <Button type="submit" :disabled="pending">
              <span v-if="pending">Searching...</span>
              <span v-else>Find primes/subs</span>
            </Button>
          </div>
        </form>
      </section>

      <section class="mt-8">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p
              class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
            >
              Results
            </p>
            <h2
              class="text-foreground mt-2 text-2xl font-semibold tracking-tight"
            >
              Capability matches
            </h2>
          </div>
          <p class="text-muted-foreground text-sm">
            {{ results.length }} matches
          </p>
        </div>

        <div
          v-if="error"
          class="border-destructive/40 bg-destructive/5 text-destructive mt-6 border px-4 py-3 text-sm"
        >
          Teaming search is unavailable. Try a narrower filter.
        </div>

        <div
          v-else-if="!pending && !results.length"
          class="border-border bg-muted/20 mt-6 border px-5 py-8 text-center"
        >
          <p class="text-foreground font-medium">
            No matching contractors found
          </p>
          <p class="text-muted-foreground mt-2 text-sm">
            Try removing one filter or searching by a broader agency, NAICS,
            PSC, or keyword.
          </p>
        </div>

        <div class="mt-6 space-y-4">
          <article
            v-for="result in results"
            :key="result.slug"
            class="border-border bg-card/40 border p-5"
          >
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <NuxtLink
                  :to="`/${result.slug}`"
                  class="text-foreground text-lg font-semibold hover:underline"
                >
                  {{ result.name }}
                </NuxtLink>
                <p class="text-muted-foreground mt-1 text-sm">
                  {{ formatCurrency(result.obligations36m) }} over trailing 36
                  months · {{ result.awardCount36m.toLocaleString() }} awards
                </p>
              </div>
              <div class="space-y-1 text-right text-sm">
                <Badge variant="outline" class="rounded-none">
                  {{
                    result.roleFit === "likely_prime"
                      ? "Likely prime"
                      : "Potential sub"
                  }}
                </Badge>
                <p class="text-muted-foreground">
                  Match score
                  <span class="text-foreground font-medium">{{
                    result.matchScore
                  }}</span>
                </p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="reason in result.reasons"
                :key="`${result.slug}-${reason.label}-${reason.value}`"
                class="border-border bg-muted/30 inline-flex items-center gap-2 border px-2 py-1 text-xs"
              >
                <span class="text-foreground font-medium">{{
                  reason.label
                }}</span>
                <span class="text-muted-foreground">{{ reason.value }}</span>
                <span class="text-primary">public data</span>
              </span>
            </div>
          </article>
        </div>
      </section>

      <section
        class="border-border text-muted-foreground mt-10 border-l-2 px-4 py-3 text-sm leading-relaxed"
      >
        <p>{{ data?.provenance.publicData }}</p>
        <p class="mt-2">{{ data?.provenance.contractorDeclared }}</p>
      </section>
    </main>
  </div>
</template>
