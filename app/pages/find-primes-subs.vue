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

const breadcrumbExtra = [{ label: "Prime/Sub discovery" }];

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

const roleFitLabel = (roleFit: TeamingSearchResult["roleFit"]) =>
  roleFit === "likely_prime" ? "Likely prime" : "Potential sub";

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
    <DirectoryBreadcrumb :extra="breadcrumbExtra" />

    <DirectoryPageHeader
      eyebrow="Capability search"
      title="Find primes and potential subs"
      description="Search public award evidence by capability, NAICS, PSC, and agency. Results separate likely prime capacity from potential subcontractor fit."
      max-width="max-w-6xl"
    />

    <main class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section class="border-border bg-card/50 border">
        <div class="border-border border-b px-4 py-3 sm:px-5">
          <p
            class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.18em] uppercase"
          >
            Search filters
          </p>
        </div>

        <form
          class="grid gap-4 p-4 sm:p-5 lg:grid-cols-12"
          @submit.prevent="handleSearch"
        >
          <div class="lg:col-span-4">
            <Label for="q">Keyword</Label>
            <Input
              id="q"
              v-model="filters.q"
              class="mt-2 h-10 rounded-none"
              placeholder="cyber, ship, logistics"
            />
          </div>
          <div class="sm:col-span-2 lg:col-span-2">
            <Label for="naics">NAICS</Label>
            <Input
              id="naics"
              v-model="filters.naics"
              class="mt-2 h-10 rounded-none font-mono"
              placeholder="541512"
            />
          </div>
          <div class="sm:col-span-2 lg:col-span-2">
            <Label for="psc">PSC</Label>
            <Input
              id="psc"
              v-model="filters.psc"
              class="mt-2 h-10 rounded-none font-mono"
              placeholder="D399"
            />
          </div>
          <div class="lg:col-span-2">
            <Label for="agency">Agency</Label>
            <Input
              id="agency"
              v-model="filters.agency"
              class="mt-2 h-10 rounded-none"
              placeholder="Navy"
            />
          </div>
          <div class="lg:col-span-2">
            <Label for="role">Role</Label>
            <Select v-model="filters.role">
              <SelectTrigger id="role" class="mt-2 h-10 w-full rounded-none">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any fit</SelectItem>
                <SelectItem value="prime">Likely primes</SelectItem>
                <SelectItem value="sub">Potential subs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-end lg:col-span-12">
            <Button type="submit" class="h-10 rounded-none" :disabled="pending">
              <Icon
                :name="pending ? 'mdi:loading' : 'mdi:target'"
                :class="['mr-2 h-4 w-4', { 'animate-spin': pending }]"
              />
              <span v-if="pending">Searching...</span>
              <span v-else>Find matches</span>
            </Button>
          </div>
        </form>
      </section>

      <section class="mt-8">
        <div
          class="border-border flex items-end justify-between gap-4 border-b pb-3"
        >
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
          <p class="text-muted-foreground text-sm tabular-nums">
            {{ data?.total ?? results.length }} matches
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

        <div class="divide-border border-border mt-5 divide-y border-y">
          <article
            v-for="result in results"
            :key="result.slug"
            class="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <NuxtLink
                  :to="`/${result.slug}`"
                  class="text-foreground text-lg font-semibold tracking-tight hover:underline"
                >
                  {{ result.name }}
                </NuxtLink>
                <Badge variant="outline" class="rounded-none text-[0.65rem]">
                  {{ roleFitLabel(result.roleFit) }}
                </Badge>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="reason in result.reasons"
                  :key="`${result.slug}-${reason.label}-${reason.value}`"
                  class="border-border bg-muted/20 inline-flex items-center gap-2 border px-2.5 py-1.5 text-xs"
                >
                  <span class="text-foreground font-medium">{{
                    reason.label
                  }}</span>
                  <span class="text-muted-foreground">{{ reason.value }}</span>
                  <span
                    class="text-primary text-[0.65rem] tracking-wide uppercase"
                  >
                    public
                  </span>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-right text-sm">
              <div>
                <p
                  class="text-muted-foreground text-[0.65rem] tracking-wide uppercase"
                >
                  Obligations
                </p>
                <p class="text-foreground mt-1 font-medium tabular-nums">
                  {{ formatCurrency(result.obligations36m) }}
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground text-[0.65rem] tracking-wide uppercase"
                >
                  Awards
                </p>
                <p class="text-foreground mt-1 font-medium tabular-nums">
                  {{ result.awardCount36m.toLocaleString() }}
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground text-[0.65rem] tracking-wide uppercase"
                >
                  Score
                </p>
                <p class="text-foreground mt-1 font-medium tabular-nums">
                  {{ result.matchScore }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-8 grid gap-3 text-sm leading-relaxed md:grid-cols-2">
        <div class="border-border bg-muted/10 border-l-2 px-4 py-3">
          <p class="text-muted-foreground">{{ data?.provenance.publicData }}</p>
        </div>
        <div class="border-border bg-muted/10 border-l-2 px-4 py-3">
          <p class="text-muted-foreground">
            {{ data?.provenance.contractorDeclared }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>
