<!--
  @file Company profile page
  @route /companies/[slug]
  @description Contractor intelligence dossier with source-backed award context first
-->

<script setup lang="ts">
import type { ContractorIntelligence } from "@/app/types/intelligence.types";
import {
  formatDirectoryRevenue,
  formatIntelligenceMoney,
} from "@/app/lib/intelligence-ui";

definePageMeta({
  layout: "homepage",
});

interface ContractorResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  defenseNewsRank: number | null;
  country: string | null;
  headquarters: string | null;
  founded: number | null;
  employeeCount: string | null;
  website: string | null;
  linkedinUrl: string | null;
  wikipediaUrl: string | null;
  stockTicker: string | null;
  isPublic: boolean;
  totalRevenue: number | null;
  defenseRevenue: number | null;
  defenseRevenuePercent: number | null;
  logoUrl: string | null;
  specialties: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    isPrimary: boolean;
  }>;
  primarySpecialty: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    isPrimary: boolean;
  } | null;
  locations: Array<{
    id: string;
    city: string | null;
    state: string | null;
    country: string;
    isHeadquarters: boolean;
  }>;
  createdAt: string | null;
  updatedAt: string | null;
}

const config = useRuntimeConfig();
const route = useRoute();
const logger = useLogger("ContractorProfilePage");
const slug = computed(() => route.params.slug as string);

const {
  data: contractor,
  pending: isLoading,
  error,
} = useFetch<ContractorResponse | null>(() => `/api/contractors/${slug.value}`, {
  lazy: true,
  watch: [slug],
});

const { data: intelligence } = useFetch<ContractorIntelligence | null>(
  () => `/api/intelligence/contractors/${slug.value}`,
  {
    lazy: true,
    watch: [slug],
    default: () => null,
  },
);

const stockExchange = computed(() => {
  if (!contractor.value?.stockTicker) return null;
  const nasdaqTickers = ["ANSS", "LDOS"];
  return nasdaqTickers.includes(contractor.value.stockTicker)
    ? "NASDAQ"
    : "NYSE";
});

const yahooFinanceUrl = computed(() => {
  if (!contractor.value?.stockTicker) return null;
  return `https://finance.yahoo.com/quote/${contractor.value.stockTicker}`;
});

const descriptionLead = computed(() => {
  const description = contractor.value?.description;
  if (!description) {
    return contractor.value
      ? `${contractor.value.name} public award intelligence dossier.`
      : "Contractor public award intelligence dossier.";
  }

  return description.split("\n\n")[0];
});

const dossierMetrics = computed(() => {
  const summary = intelligence.value?.summary;
  if (!summary) return [];

  return [
    {
      label: "Obligations",
      value: formatIntelligenceMoney(summary.totalObligations),
      detail: `${summary.awardCount.toLocaleString()} public award records`,
    },
    {
      label: "YoY delta",
      value: formatIntelligenceMoney(summary.yoyDelta),
      detail: summary.latestFiscalYear ? `Latest FY${summary.latestFiscalYear}` : null,
    },
    {
      label: "Top agency",
      value: summary.topSubAgency?.label || summary.topAgency?.label || "N/A",
      detail: summary.topAgency
        ? formatIntelligenceMoney(summary.topAgency.obligation)
        : null,
    },
    {
      label: "Top NAICS",
      value: summary.topNaics?.key || "N/A",
      detail: summary.topNaics?.label || null,
    },
    {
      label: "Top PSC",
      value: summary.topPsc?.key || "N/A",
      detail: summary.topPsc?.label || null,
    },
    {
      label: "Freshness",
      value: intelligence.value?.sourceMetadata.cacheStatus || "N/A",
      detail: intelligence.value?.sourceMetadata.freshness || null,
    },
  ];
});

const directoryMetrics = computed(() => {
  if (!contractor.value) return [];

  return [
    {
      label: "Defense revenue",
      value: formatDirectoryRevenue(contractor.value.defenseRevenue),
      detail: "Directory context",
    },
    {
      label: "Total revenue",
      value: formatDirectoryRevenue(contractor.value.totalRevenue),
      detail:
        contractor.value.defenseRevenuePercent == null
          ? null
          : `${Math.round(contractor.value.defenseRevenuePercent)}% defense`,
    },
    {
      label: "Employees",
      value: contractor.value.employeeCount || "N/A",
      detail: contractor.value.founded ? `Founded ${contractor.value.founded}` : null,
    },
    {
      label: "Headquarters",
      value: contractor.value.headquarters || "N/A",
      detail: contractor.value.country || null,
    },
  ];
});

useHead(() => {
  if (!contractor.value) return {};

  return {
    title: `${contractor.value.name} | Defense Contractor Dossier | military.contractors`,
    link: [
      {
        rel: "canonical",
        href: `${config.public.siteUrl}/companies/${slug.value}`,
      },
    ],
    meta: [
      {
        name: "description",
        content:
          contractor.value.description?.slice(0, 160) ||
          `${contractor.value.name} public award dossier with USAspending-backed obligations, agencies, categories, and recent award evidence.`,
      },
      {
        name: "robots",
        content:
          (intelligence.value?.sourceMetadata.structuredRecords ?? 0) > 0
            ? "index, follow"
            : "noindex",
      },
    ],
  };
});

watchEffect(() => {
  if (contractor.value) {
    logger.info(
      { slug: slug.value, name: contractor.value.name },
      "Contractor profile loaded",
    );
  }
});
</script>

<template>
  <main class="min-h-full">
    <div v-if="isLoading">
      <SearchablePageHeader>
        <template #filters>
          <div class="h-7" />
        </template>
      </SearchablePageHeader>
      <div class="flex justify-center py-12">
        <LoadingText text="Loading contractor dossier" />
      </div>
    </div>

    <div v-else-if="error || !contractor">
      <SearchablePageHeader />
      <div
        class="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <Empty>
          <EmptyMedia variant="icon">
            <Icon name="mdi:domain-off" class="size-5" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>Contractor Not Found</EmptyTitle>
            <EmptyDescription>
              The contractor "{{ slug }}" could not be found.
            </EmptyDescription>
          </EmptyContent>
          <Button as-child variant="default">
            <NuxtLink to="/companies">Browse Contractors</NuxtLink>
          </Button>
        </Empty>
      </div>
    </div>

    <div v-else>
      <SearchablePageHeader>
        <template #filters>
          <div class="flex items-center gap-2 text-sm">
            <NuxtLink
              to="/companies"
              class="text-muted-foreground hover:text-primary transition-colors"
            >
              Companies
            </NuxtLink>
            <Icon
              name="mdi:chevron-right"
              class="text-muted-foreground/50 h-4 w-4"
            />
            <span class="text-foreground truncate font-medium">
              {{ contractor.name }}
            </span>
          </div>
        </template>
      </SearchablePageHeader>

      <IntelligencePageHeader
        eyebrow="Contractor dossier"
        :title="contractor.name"
        :description="descriptionLead"
        :metadata="intelligence?.sourceMetadata"
        :filters="intelligence?.sourceMetadata.filters || []"
        max-width="max-w-7xl"
      >
        <template #actions>
          <NuxtLink :to="`/compare?contractors=${contractor.slug}`">
            <Button variant="outline" size="sm">Compare</Button>
          </NuxtLink>
          <NuxtLink v-if="contractor.website" :to="contractor.website" target="_blank">
            <Button variant="outline" size="sm">
              Website
              <Icon name="mdi:open-in-new" class="ml-1 h-3 w-3" />
            </Button>
          </NuxtLink>
        </template>
      </IntelligencePageHeader>

      <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div v-if="!intelligence" class="mb-8">
          <IntelligenceErrorState
            title="Award intelligence unavailable"
            message="This profile is available, but the source-backed award dossier could not be loaded."
          />
        </div>

        <div v-else class="space-y-8">
          <section class="border-border grid border-t border-l lg:grid-cols-[1fr_1fr]">
            <div class="border-border border-r border-b p-4">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">
                Identity
              </p>
              <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-muted-foreground">Canonical name</dt>
                  <dd class="text-foreground mt-1 font-medium">
                    {{ contractor.name }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Directory slug</dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{ contractor.slug }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">UEI</dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{ intelligence.identifiers?.uei || "N/A" }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">CAGE</dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{ intelligence.identifiers?.cageCode || "N/A" }}
                  </dd>
                </div>
              </dl>
              <div v-if="intelligence.aliases?.length" class="mt-4">
                <p class="text-muted-foreground mb-2 text-xs">Aliases</p>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="alias in intelligence.aliases"
                    :key="alias"
                    variant="outline"
                    class="text-xs"
                  >
                    {{ alias }}
                  </Badge>
                </div>
              </div>
            </div>

            <div class="border-border border-r border-b p-4">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">
                Linked USAspending recipients
              </p>
              <div class="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead class="text-right">Obligations</TableHead>
                      <TableHead class="text-right">Awards</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="recipient in intelligence.linkedRecipients"
                      :key="`${recipient.name}-${recipient.uei}`"
                    >
                      <TableCell>
                        <p class="text-sm font-medium">{{ recipient.name }}</p>
                        <p
                          v-if="recipient.uei"
                          class="text-muted-foreground mt-1 font-mono text-[11px]"
                        >
                          UEI {{ recipient.uei }}
                        </p>
                      </TableCell>
                      <TableCell class="text-right text-sm font-medium">
                        {{ formatIntelligenceMoney(recipient.obligations) }}
                      </TableCell>
                      <TableCell class="text-right text-sm">
                        {{ recipient.awardCount.toLocaleString() }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <IntelligenceMetricStrip :metrics="dossierMetrics" />

          <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div class="min-w-0 space-y-8">
              <IntelligenceSection
                v-if="intelligence.yearlyTrend?.length"
                title="Fiscal-Year Trend"
              >
                <IntelligenceTrendBars :rows="intelligence.yearlyTrend" />
              </IntelligenceSection>

              <div class="grid gap-8 lg:grid-cols-2">
                <IntelligenceSection title="Agency Breakdown" flush>
                  <IntelligenceBucketTable
                    :rows="intelligence.topSubAgencies?.length ? intelligence.topSubAgencies : (intelligence.topAgencies ?? [])"
                    code-label="Agency"
                  />
                </IntelligenceSection>

                <IntelligenceSection title="NAICS Breakdown" flush>
                  <IntelligenceBucketTable
                    :rows="intelligence.topNaics ?? []"
                    code-label="NAICS"
                  />
                </IntelligenceSection>
              </div>

              <IntelligenceSection title="PSC Breakdown" flush>
                <IntelligenceBucketTable
                  :rows="intelligence.topPsc ?? []"
                  code-label="PSC"
                />
              </IntelligenceSection>

              <IntelligenceSection
                title="Top Awards"
                description="Largest matched awards in the source-backed dossier."
                flush
              >
                <IntelligenceAwardList :awards="intelligence.topAwards ?? []" />
              </IntelligenceSection>

              <IntelligenceSection
                title="Recent Awards"
                description="Most recent matched public award records."
                flush
              >
                <IntelligenceAwardList :awards="intelligence.recentAwards ?? []" />
              </IntelligenceSection>

              <IntelligenceSourceFooter
                :metadata="intelligence.sourceMetadata"
                :source-links="intelligence.sourceLinks ?? []"
              />
            </div>

            <aside class="space-y-6">
              <section class="border-border border">
                <div class="border-border border-b px-4 py-3">
                  <h2 class="text-foreground text-sm font-semibold">
                    External Links
                  </h2>
                </div>
                <div class="space-y-2 p-4">
                  <Button
                    v-if="contractor.website"
                    as-child
                    variant="outline"
                    size="sm"
                    class="w-full justify-start"
                  >
                    <NuxtLink
                      :to="contractor.website"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                      <Icon name="mdi:open-in-new" class="ml-auto h-3 w-3" />
                    </NuxtLink>
                  </Button>
                  <Button
                    v-if="contractor.linkedinUrl"
                    as-child
                    variant="outline"
                    size="sm"
                    class="w-full justify-start"
                  >
                    <NuxtLink
                      :to="contractor.linkedinUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                      <Icon name="mdi:open-in-new" class="ml-auto h-3 w-3" />
                    </NuxtLink>
                  </Button>
                  <Button
                    v-if="contractor.wikipediaUrl"
                    as-child
                    variant="outline"
                    size="sm"
                    class="w-full justify-start"
                  >
                    <NuxtLink
                      :to="contractor.wikipediaUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Wikipedia
                      <Icon name="mdi:open-in-new" class="ml-auto h-3 w-3" />
                    </NuxtLink>
                  </Button>
                </div>
              </section>

              <section class="border-border border">
                <div class="border-border border-b px-4 py-3">
                  <h2 class="text-foreground text-sm font-semibold">
                    Directory Context
                  </h2>
                </div>
                <dl class="space-y-3 p-4 text-sm">
                  <div>
                    <dt class="text-muted-foreground">Public listing</dt>
                    <dd class="text-foreground mt-1">
                      {{
                        contractor.isPublic && contractor.stockTicker
                          ? `${stockExchange}: ${contractor.stockTicker}`
                          : "Private company"
                      }}
                    </dd>
                    <NuxtLink
                      v-if="yahooFinanceUrl"
                      :to="yahooFinanceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary mt-1 inline-flex text-xs hover:underline"
                    >
                      Yahoo Finance
                    </NuxtLink>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Country</dt>
                    <dd class="text-foreground mt-1">
                      {{ contractor.country || "N/A" }}
                    </dd>
                  </div>
                  <div v-if="contractor.primarySpecialty">
                    <dt class="text-muted-foreground">Primary category</dt>
                    <dd class="mt-1">
                      <NuxtLink
                        :to="`/companies/specialty/${contractor.primarySpecialty.slug}`"
                        class="text-primary hover:underline"
                      >
                        {{ contractor.primarySpecialty.name }}
                      </NuxtLink>
                    </dd>
                  </div>
                </dl>
              </section>

              <section v-if="contractor.locations?.length" class="border-border border">
                <div class="border-border border-b px-4 py-3">
                  <h2 class="text-foreground text-sm font-semibold">Locations</h2>
                </div>
                <ul class="divide-border divide-y">
                  <li
                    v-for="location in contractor.locations"
                    :key="location.id"
                    class="p-4 text-sm"
                  >
                    <NuxtLink
                      v-if="location.state"
                      :to="`/companies/location/${location.state.toLowerCase().replace(/\s+/g, '-')}`"
                      class="text-foreground hover:text-primary font-medium"
                    >
                      {{
                        [location.city, location.state].filter(Boolean).join(", ")
                      }}
                    </NuxtLink>
                    <span v-else class="text-foreground font-medium">
                      {{ location.city || location.country }}
                    </span>
                    <Badge
                      v-if="location.isHeadquarters"
                      variant="outline"
                      class="ml-2 text-[10px]"
                    >
                      HQ
                    </Badge>
                  </li>
                </ul>
              </section>
            </aside>
          </div>

          <section class="border-border border-t pt-8">
            <div class="mb-5">
              <h2 class="text-foreground text-lg font-semibold">
                Profile Context
              </h2>
              <p class="text-muted-foreground mt-1 text-sm">
                Directory information maintained separately from public award
                intelligence.
              </p>
            </div>

            <IntelligenceMetricStrip :metrics="directoryMetrics" />

            <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <section v-if="contractor.description">
                <h3 class="text-foreground mb-4 text-sm font-semibold">Overview</h3>
                <div class="text-foreground/90 space-y-4 text-sm leading-relaxed">
                  <p
                    v-for="(paragraph, idx) in contractor.description.split('\n\n')"
                    :key="idx"
                  >
                    {{ paragraph }}
                  </p>
                </div>
              </section>

              <section v-if="contractor.specialties?.length">
                <h3 class="text-foreground mb-4 text-sm font-semibold">
                  Contractor Categories
                </h3>
                <div class="space-y-2">
                  <NuxtLink
                    v-for="specialty in contractor.specialties"
                    :key="specialty.id"
                    :to="`/companies/specialty/${specialty.slug}`"
                    class="border-border hover:bg-muted/50 block border px-3 py-2 transition-colors"
                  >
                    <p class="text-foreground text-sm font-medium">
                      {{ specialty.name }}
                    </p>
                    <p
                      v-if="specialty.description"
                      class="text-muted-foreground mt-1 text-xs"
                    >
                      {{ specialty.description }}
                    </p>
                  </NuxtLink>
                </div>
              </section>
            </div>
          </section>

        </div>
      </div>
    </div>
  </main>
</template>
