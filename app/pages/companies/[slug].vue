<!--
  @file Company profile page
  @route /companies/[slug]
  @description Canonical contractor profile with source-backed award context and alternate USAspending names
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
  canonicalSlug: string;
  requestedSlug: string;
  isAliasSlug: boolean;
  name: string;
  recipientName: string | null;
  normalizedName: string | null;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number | null;
  awardCount36m: number | null;
  lastAwardDate: string | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string | null;
  refreshedAt: string | null;
  snapshotWindowStart: string | null;
  snapshotWindowEnd: string | null;
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
  directoryAliases: Array<{
    id: string;
    groupId: string;
    snapshotId: string;
    slug: string;
    recipientName: string;
    normalizedName: string;
    recipientUei: string | null;
    recipientCode: string | null;
    totalObligations36m: number;
    awardCount36m: number;
    lastAwardDate: string | null;
    sourceUrl: string;
    isCanonical: boolean;
    matchReason:
      | "single_snapshot"
      | "shared_identifier"
      | "shared_name"
      | "curated_alias";
    matchKey: string;
  }>;
  alternateRecipientNames: string[];
  directoryGroup: {
    id: string;
    slug: string;
    canonicalName: string;
    aliasCount: number;
  } | null;
  locations: Array<{
    id: string;
    city: string | null;
    state: string | null;
    country: string;
    isHeadquarters: boolean;
  }>;
  snapshot: {
    id: string;
    slug: string;
    recipientName: string;
    normalizedName: string;
    recipientUei: string | null;
    recipientCode: string | null;
    totalObligations36m: number;
    awardCount36m: number;
    lastAwardDate: string | null;
    topAwardingAgency: string | null;
    topAwardingSubagency: string | null;
    topNaicsCode: string | null;
    topNaicsTitle: string | null;
    topPscCode: string | null;
    topPscTitle: string | null;
    sourceUrl: string;
    refreshedAt: string;
    snapshotWindowStart: string;
    snapshotWindowEnd: string;
  } | null;
  curated: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
  } | null;
  intelligence: ContractorIntelligence | null;
  intelligenceStatus: "separate_endpoint";
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProfileIntelligenceResponse {
  status: "ready" | "stale" | "refreshing" | "unavailable";
  intelligence: ContractorIntelligence | null;
  refreshedAt: string | null;
  expiresAt: string | null;
  refreshQueued: boolean;
  warnings: string[];
}

const config = useRuntimeConfig();
const route = useRoute();
const logger = useLogger("ContractorProfilePage");
const slug = computed(() => route.params.slug as string);

const {
  data: contractor,
  pending: isLoading,
  error,
} = useFetch<ContractorResponse | null>(
  () => `/api/contractors/${slug.value}`,
  {
    lazy: true,
    watch: [slug],
  },
);

const {
  data: intelligenceResponse,
  pending: isIntelligenceLoading,
  error: intelligenceError,
} = useFetch<ProfileIntelligenceResponse>(
  () => `/api/contractors/${slug.value}/intelligence`,
  {
    lazy: true,
    watch: [slug],
  },
);

const intelligence = computed(
  () =>
    intelligenceResponse.value?.intelligence ??
    contractor.value?.intelligence ??
    null,
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

const headlineMetrics = computed(() => {
  const summary = intelligence.value?.summary;
  if (!summary) {
    const profile = contractor.value;
    if (!profile) return [];

    return [
      {
        label: "Obligations",
        value: formatIntelligenceMoney(profile.totalObligations36m ?? 0),
        detail: "Snapshot aggregate",
      },
      {
        label: "Awards",
        value: (profile.awardCount36m ?? 0).toLocaleString(),
        detail: "Trailing 36 months",
      },
      {
        label: "Top agency",
        value:
          profile.topAwardingSubagency || profile.topAwardingAgency || "N/A",
        detail: profile.topAwardingAgency ?? null,
      },
      {
        label: "Top NAICS",
        value: profile.topNaicsCode || "N/A",
        detail: profile.topNaicsTitle ?? null,
      },
      {
        label: "Freshness",
        value: intelligenceStatusLabel.value,
        detail: profile.refreshedAt ? "Snapshot available" : null,
      },
    ];
  }

  return [
    {
      label: "Obligations",
      value: formatIntelligenceMoney(summary.totalObligations),
      detail: `${summary.awardCount.toLocaleString()} award records`,
    },
    {
      label: "YoY delta",
      value: formatIntelligenceMoney(summary.yoyDelta),
      detail: summary.latestFiscalYear
        ? `Latest FY${summary.latestFiscalYear}`
        : null,
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

const agencyRows = computed(() => {
  const intel = intelligence.value;
  if (intel) {
    return (
      intel.topSubAgencies?.length
        ? intel.topSubAgencies
        : (intel.topAgencies ?? [])
    ).slice(0, 6);
  }

  const profile = contractor.value;
  const key = profile?.topAwardingSubagency || profile?.topAwardingAgency;
  if (!profile || !key) return [];
  return [
    {
      key,
      label: key,
      obligation: profile.totalObligations36m ?? 0,
      awardCount: profile.awardCount36m ?? 0,
    },
  ];
});

const naicsRows = computed(() => {
  if (intelligence.value?.topNaics?.length) {
    return intelligence.value.topNaics.slice(0, 6);
  }

  const profile = contractor.value;
  if (!profile?.topNaicsCode) return [];
  return [
    {
      key: profile.topNaicsCode,
      label: profile.topNaicsTitle ?? `NAICS ${profile.topNaicsCode}`,
      obligation: profile.totalObligations36m ?? 0,
      awardCount: profile.awardCount36m ?? 0,
    },
  ];
});
const pscRows = computed(() => {
  if (intelligence.value?.topPsc?.length) {
    return intelligence.value.topPsc.slice(0, 6);
  }

  const profile = contractor.value;
  if (!profile?.topPscCode) return [];
  return [
    {
      key: profile.topPscCode,
      label: profile.topPscTitle ?? `PSC ${profile.topPscCode}`,
      obligation: profile.totalObligations36m ?? 0,
      awardCount: profile.awardCount36m ?? 0,
    },
  ];
});

const directoryAliases = computed(
  () => contractor.value?.directoryAliases ?? [],
);

const alternateDirectoryAliases = computed(() =>
  directoryAliases.value.filter((alias) => !alias.isCanonical),
);

const linkedRecipients = computed(() => {
  if (directoryAliases.value.length > 0) {
    return directoryAliases.value.map((alias) => ({
      name: alias.recipientName,
      uei: alias.recipientUei,
      code: alias.recipientCode,
      awardCount: alias.awardCount36m,
      obligations: alias.totalObligations36m,
      sourceUrl: alias.sourceUrl,
      isCanonical: alias.isCanonical,
    }));
  }

  if (intelligence.value?.linkedRecipients?.length) {
    return intelligence.value.linkedRecipients.map((recipient) => ({
      name: recipient.name,
      uei: recipient.uei,
      code: null,
      awardCount: recipient.awardCount,
      obligations: recipient.obligations,
      sourceUrl: null,
      isCanonical: false,
    }));
  }

  return contractor.value
    ? [
        {
          name: contractor.value.name,
          uei: contractor.value.recipientUei,
          code: contractor.value.recipientCode,
          awardCount: contractor.value.awardCount36m ?? 0,
          obligations: contractor.value.totalObligations36m ?? 0,
          sourceUrl: contractor.value.sourceUrl,
          isCanonical: true,
        },
      ]
    : [];
});

const intelligenceStatus = computed<ProfileIntelligenceResponse["status"]>(
  () => {
    if (isIntelligenceLoading.value && !intelligence.value) return "refreshing";
    return intelligenceResponse.value?.status ?? "unavailable";
  },
);

const intelligenceStatusLabel = computed(() => {
  const labels: Record<ProfileIntelligenceResponse["status"], string> = {
    ready: "cached",
    stale: "stale",
    refreshing: "refreshing",
    unavailable: "snapshot",
  };
  return labels[intelligenceStatus.value];
});

const intelligenceFreshness = computed(
  () =>
    intelligence.value?.sourceMetadata?.cacheStatus ??
    intelligenceStatusLabel.value,
);

const contractorSignals = computed(() => intelligence.value?.signals ?? []);

const showIntelligenceNotice = computed(
  () =>
    !!intelligenceError.value ||
    !intelligence.value ||
    intelligenceStatus.value === "stale" ||
    intelligenceStatus.value === "refreshing",
);

const intelligenceNotice = computed(() => {
  if (intelligenceError.value) {
    return {
      title: "Detailed intelligence is unavailable",
      detail:
        "The source-backed profile shell is available. Detailed award intelligence will be retried from the local cache workflow.",
    };
  }

  if (intelligenceStatus.value === "stale" && intelligence.value) {
    return {
      title: "Showing cached intelligence",
      detail:
        "Detailed award intelligence is being refreshed in the background. Snapshot totals remain available while the cache updates.",
    };
  }

  if (intelligenceStatus.value === "refreshing") {
    return {
      title: "Detailed intelligence is refreshing",
      detail:
        "This page is served from the local snapshot now. Award-level breakdowns will appear after the USAspending cache is warmed.",
    };
  }

  return {
    title: "Snapshot profile loaded",
    detail:
      "Award-level intelligence has not been cached yet. The profile remains available from the local USAspending recipient snapshot.",
  };
});

useHead(() => {
  if (!contractor.value) return {};

  return {
    title: `${contractor.value.name} | Defense Contractor Profile | military.contractors`,
    link: [
      {
        rel: "canonical",
        href: `${config.public.siteUrl}/companies/${contractor.value.canonicalSlug}`,
      },
    ],
    meta: [
      {
        name: "description",
        content:
          contractor.value.description?.slice(0, 160) ||
          `${contractor.value.name} profile with USAspending-backed DoD contract obligations, agencies, NAICS, PSC, and recent award evidence.`,
      },
      {
        name: "robots",
        content:
          contractor.value.snapshot ||
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
      <DirectoryBreadcrumb />
      <div class="flex justify-center py-12">
        <LoadingText text="Loading contractor dossier" />
      </div>
    </div>

    <div v-else-if="error || !contractor">
      <DirectoryBreadcrumb />
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
            <NuxtLink to="/">Browse Contractors</NuxtLink>
          </Button>
        </Empty>
      </div>
    </div>

    <div v-else>
      <DirectoryBreadcrumb
        :extra="[{ label: contractor.name }]"
        :freshness="intelligenceFreshness"
      />

      <DirectoryPageHeader eyebrow="Contractor" :title="contractor.name">
        <template #actions>
          <NuxtLink
            v-if="contractor.website"
            :to="contractor.website"
            target="_blank"
          >
            <Button variant="outline" size="sm">
              Website
              <Icon name="mdi:open-in-new" class="ml-1 h-3 w-3" />
            </Button>
          </NuxtLink>
        </template>
      </DirectoryPageHeader>

      <DirectoryStatRibbon
        :metrics="headlineMetrics"
        class="mx-auto max-w-7xl"
      />

      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section
          v-if="showIntelligenceNotice"
          class="border-border bg-muted/20 mb-10 border-l-2 px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <Icon
              name="mdi:database-clock-outline"
              class="text-primary mt-0.5 h-4 w-4 shrink-0"
            />
            <div>
              <h2 class="text-foreground text-sm font-semibold">
                {{ intelligenceNotice.title }}
              </h2>
              <p class="text-muted-foreground mt-1 text-sm leading-relaxed">
                {{ intelligenceNotice.detail }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="intelligence?.yearlyTrend?.length">
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Fiscal-year obligations
          </h2>
          <div class="mt-5">
            <IntelligenceTrendBars :rows="intelligence.yearlyTrend" />
          </div>
        </section>

        <section class="border-border mt-12 border-t pt-10">
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Award breakdowns
          </h2>
          <div class="mt-6 grid gap-10 lg:grid-cols-3">
            <div>
              <h3 class="text-foreground mb-3 text-sm font-semibold">Agency</h3>
              <div
                v-if="!agencyRows.length"
                class="text-muted-foreground text-sm"
              >
                No agency data.
              </div>
              <table v-else class="w-full text-sm">
                <tbody>
                  <tr
                    v-for="row in agencyRows"
                    :key="row.key"
                    class="border-border/40 border-b last:border-b-0"
                  >
                    <td class="py-2.5 pr-2 align-top">
                      <p class="text-foreground leading-snug font-medium">
                        {{ row.label }}
                      </p>
                      <p
                        v-if="row.key && row.key !== row.label"
                        class="text-muted-foreground mt-0.5 font-mono text-[11px]"
                      >
                        {{ row.key }}
                      </p>
                    </td>
                    <td
                      class="text-foreground py-2.5 text-right align-top tabular-nums"
                    >
                      {{ formatIntelligenceMoney(row.obligation) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 class="text-foreground mb-3 text-sm font-semibold">NAICS</h3>
              <div
                v-if="!naicsRows.length"
                class="text-muted-foreground text-sm"
              >
                No NAICS data.
              </div>
              <table v-else class="w-full text-sm">
                <tbody>
                  <tr
                    v-for="row in naicsRows"
                    :key="row.key"
                    class="border-border/40 border-b last:border-b-0"
                  >
                    <td class="py-2.5 pr-2 align-top">
                      <p class="text-foreground font-mono text-xs">
                        {{ row.key }}
                      </p>
                      <p
                        v-if="row.label"
                        class="text-muted-foreground mt-0.5 leading-snug"
                      >
                        {{ row.label }}
                      </p>
                    </td>
                    <td
                      class="text-foreground py-2.5 text-right align-top tabular-nums"
                    >
                      {{ formatIntelligenceMoney(row.obligation) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 class="text-foreground mb-3 text-sm font-semibold">PSC</h3>
              <div v-if="!pscRows.length" class="text-muted-foreground text-sm">
                No PSC data.
              </div>
              <table v-else class="w-full text-sm">
                <tbody>
                  <tr
                    v-for="row in pscRows"
                    :key="row.key"
                    class="border-border/40 border-b last:border-b-0"
                  >
                    <td class="py-2.5 pr-2 align-top">
                      <p class="text-foreground font-mono text-xs">
                        {{ row.key }}
                      </p>
                      <p
                        v-if="row.label"
                        class="text-muted-foreground mt-0.5 leading-snug"
                      >
                        {{ row.label }}
                      </p>
                    </td>
                    <td
                      class="text-foreground py-2.5 text-right align-top tabular-nums"
                    >
                      {{ formatIntelligenceMoney(row.obligation) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section
          v-if="intelligence?.topAwards?.length"
          class="border-border mt-12 border-t pt-10"
        >
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Top awards
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Largest matched awards in the source-backed dossier.
          </p>
          <ul class="divide-border/50 mt-5 divide-y">
            <li
              v-for="award in intelligence.topAwards"
              :key="award.key"
              class="py-4 first:pt-0"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <div class="min-w-0">
                  <p
                    class="text-foreground text-sm font-medium [overflow-wrap:anywhere]"
                  >
                    {{ award.recipientName }}
                  </p>
                  <p
                    class="text-muted-foreground mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]"
                  >
                    {{ award.description || "No description provided." }}
                  </p>
                </div>
                <p
                  class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
                >
                  {{ formatIntelligenceMoney(award.obligation) }}
                </p>
              </div>
              <div
                class="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
              >
                <span v-if="award.fiscalYear">FY{{ award.fiscalYear }}</span>
                <span>
                  {{
                    award.awardingSubAgency ||
                    award.awardingAgency ||
                    "Agency N/A"
                  }}
                </span>
                <span v-if="award.naicsCode">NAICS {{ award.naicsCode }}</span>
                <span v-if="award.pscCode">PSC {{ award.pscCode }}</span>
                <span
                  v-if="award.piid"
                  class="font-mono [overflow-wrap:anywhere]"
                >
                  PIID {{ award.piid }}
                </span>
                <NuxtLink
                  v-if="award.sourceUrl"
                  :to="award.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  Source
                </NuxtLink>
              </div>
            </li>
          </ul>
        </section>

        <ContractorSignalPanel
          v-if="contractorSignals.length"
          class="mt-12"
          :signals="contractorSignals"
          :warnings="intelligence?.sourceMetadata?.warnings ?? []"
        />

        <section
          v-if="intelligence?.recentAwards?.length"
          class="border-border mt-12 border-t pt-10"
        >
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Recent awards
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Most recent matched public award records.
          </p>
          <ul class="divide-border/50 mt-5 divide-y">
            <li
              v-for="award in intelligence.recentAwards"
              :key="award.key"
              class="py-4 first:pt-0"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <div class="min-w-0">
                  <p
                    class="text-foreground text-sm font-medium [overflow-wrap:anywhere]"
                  >
                    {{ award.recipientName }}
                  </p>
                  <p
                    class="text-muted-foreground mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]"
                  >
                    {{ award.description || "No description provided." }}
                  </p>
                </div>
                <p
                  class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
                >
                  {{ formatIntelligenceMoney(award.obligation) }}
                </p>
              </div>
              <div
                class="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
              >
                <span v-if="award.fiscalYear">FY{{ award.fiscalYear }}</span>
                <span>
                  {{
                    award.awardingSubAgency ||
                    award.awardingAgency ||
                    "Agency N/A"
                  }}
                </span>
                <span v-if="award.naicsCode">NAICS {{ award.naicsCode }}</span>
                <span v-if="award.pscCode">PSC {{ award.pscCode }}</span>
                <span
                  v-if="award.piid"
                  class="font-mono [overflow-wrap:anywhere]"
                >
                  PIID {{ award.piid }}
                </span>
                <NuxtLink
                  v-if="award.sourceUrl"
                  :to="award.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  Source
                </NuxtLink>
              </div>
            </li>
          </ul>
        </section>

        <section class="border-border mt-12 border-t pt-10">
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Identity &amp; directory context
          </h2>
          <div class="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div class="space-y-8">
              <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt class="text-muted-foreground text-xs">
                    Canonical contractor name
                  </dt>
                  <dd class="text-foreground mt-1 text-sm font-medium">
                    {{ contractor.name }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">
                    Canonical directory slug
                  </dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{ contractor.slug }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">UEI</dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{
                      intelligence?.identifiers?.uei ||
                      contractor.recipientUei ||
                      "N/A"
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Recipient code</dt>
                  <dd class="text-foreground mt-1 font-mono text-xs">
                    {{
                      contractor.recipientCode ||
                      intelligence?.identifiers?.cageCode ||
                      "N/A"
                    }}
                  </dd>
                </div>
              </dl>

              <div v-if="contractor.isAliasSlug">
                <p class="text-muted-foreground text-sm">
                  This URL matched an alternate USAspending recipient slug and
                  resolves to the canonical contractor profile.
                </p>
              </div>

              <div v-if="alternateDirectoryAliases.length > 0">
                <p class="text-muted-foreground mb-2 text-xs">
                  USAspending recipient names
                </p>
                <ul class="divide-border/50 divide-y text-sm">
                  <li
                    v-for="recipient in linkedRecipients"
                    :key="`${recipient.name}-${recipient.uei || recipient.code || recipient.sourceUrl}`"
                    class="flex items-start justify-between gap-4 py-2 first:pt-0"
                  >
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-foreground font-medium">
                          {{ recipient.name }}
                        </p>
                        <Badge
                          v-if="recipient.isCanonical"
                          variant="outline"
                          class="text-[10px]"
                        >
                          Canonical
                        </Badge>
                      </div>
                      <p
                        v-if="recipient.uei || recipient.code"
                        class="text-muted-foreground mt-0.5 font-mono text-[11px]"
                      >
                        {{ recipient.uei ? `UEI ${recipient.uei}` : "" }}
                        {{ recipient.code ? `Code ${recipient.code}` : "" }}
                      </p>
                      <NuxtLink
                        v-if="recipient.sourceUrl"
                        :to="recipient.sourceUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        USAspending source
                        <Icon name="mdi:open-in-new" class="h-3 w-3" />
                      </NuxtLink>
                    </div>
                    <div class="shrink-0 text-right">
                      <p class="text-foreground font-medium tabular-nums">
                        {{ formatIntelligenceMoney(recipient.obligations) }}
                      </p>
                      <p class="text-muted-foreground text-xs tabular-nums">
                        {{ recipient.awardCount.toLocaleString() }} awards
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div v-if="contractor.description">
                <h3 class="text-foreground mb-3 text-sm font-semibold">
                  Overview
                </h3>
                <div
                  class="text-foreground/90 space-y-3 text-sm leading-relaxed"
                >
                  <p
                    v-for="(paragraph, idx) in contractor.description.split(
                      '\n\n',
                    )"
                    :key="idx"
                  >
                    {{ paragraph }}
                  </p>
                </div>
              </div>
            </div>

            <aside class="space-y-8">
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-muted-foreground text-xs">Headquarters</dt>
                  <dd class="text-foreground mt-1">
                    {{
                      [contractor.headquarters, contractor.country]
                        .filter(Boolean)
                        .join(", ") || "N/A"
                    }}
                  </dd>
                </div>
                <div v-if="contractor.founded">
                  <dt class="text-muted-foreground text-xs">Founded</dt>
                  <dd class="text-foreground mt-1">{{ contractor.founded }}</dd>
                </div>
                <div v-if="contractor.employeeCount">
                  <dt class="text-muted-foreground text-xs">Employees</dt>
                  <dd class="text-foreground mt-1">
                    {{ contractor.employeeCount }}
                  </dd>
                </div>
                <div v-if="contractor.totalRevenue != null">
                  <dt class="text-muted-foreground text-xs">Total revenue</dt>
                  <dd class="text-foreground mt-1">
                    {{ formatDirectoryRevenue(contractor.totalRevenue) }}
                  </dd>
                </div>
                <div v-if="contractor.defenseRevenue != null">
                  <dt class="text-muted-foreground text-xs">Defense revenue</dt>
                  <dd class="text-foreground mt-1">
                    {{ formatDirectoryRevenue(contractor.defenseRevenue) }}
                    <span
                      v-if="contractor.defenseRevenuePercent != null"
                      class="text-muted-foreground"
                    >
                      ({{ Math.round(contractor.defenseRevenuePercent) }}% of
                      total)
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Public listing</dt>
                  <dd class="text-foreground mt-1">
                    {{
                      contractor.isPublic && contractor.stockTicker
                        ? `${stockExchange}: ${contractor.stockTicker}`
                        : "Private company"
                    }}
                  </dd>
                </div>
              </dl>

              <div
                v-if="
                  contractor.website ||
                  contractor.linkedinUrl ||
                  contractor.wikipediaUrl ||
                  yahooFinanceUrl
                "
              >
                <p class="text-muted-foreground mb-2 text-xs">External</p>
                <ul class="space-y-1.5 text-sm">
                  <li v-if="contractor.website">
                    <NuxtLink
                      :to="contractor.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Website
                      <Icon name="mdi:open-in-new" class="h-3 w-3" />
                    </NuxtLink>
                  </li>
                  <li v-if="contractor.linkedinUrl">
                    <NuxtLink
                      :to="contractor.linkedinUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      LinkedIn
                      <Icon name="mdi:open-in-new" class="h-3 w-3" />
                    </NuxtLink>
                  </li>
                  <li v-if="contractor.wikipediaUrl">
                    <NuxtLink
                      :to="contractor.wikipediaUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Wikipedia
                      <Icon name="mdi:open-in-new" class="h-3 w-3" />
                    </NuxtLink>
                  </li>
                  <li v-if="yahooFinanceUrl">
                    <NuxtLink
                      :to="yahooFinanceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Yahoo Finance
                      <Icon name="mdi:open-in-new" class="h-3 w-3" />
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <div v-if="contractor.locations?.length">
                <p class="text-muted-foreground mb-2 text-xs">Locations</p>
                <ul class="space-y-1.5 text-sm">
                  <li
                    v-for="location in contractor.locations"
                    :key="location.id"
                    class="flex items-center gap-2"
                  >
                    <NuxtLink
                      v-if="location.state"
                      :to="`/companies/location/${location.state.toLowerCase().replace(/\s+/g, '-')}`"
                      class="text-foreground hover:text-primary"
                    >
                      {{
                        [location.city, location.state]
                          .filter(Boolean)
                          .join(", ")
                      }}
                    </NuxtLink>
                    <span v-else class="text-foreground">
                      {{ location.city || location.country }}
                    </span>
                    <Badge
                      v-if="location.isHeadquarters"
                      variant="outline"
                      class="text-[10px]"
                    >
                      HQ
                    </Badge>
                  </li>
                </ul>
              </div>

              <div v-if="contractor.specialties?.length">
                <p class="text-muted-foreground mb-2 text-xs">Categories</p>
                <ul class="space-y-1.5 text-sm">
                  <li
                    v-for="specialty in contractor.specialties"
                    :key="specialty.id"
                  >
                    <NuxtLink
                      :to="`/companies/specialty/${specialty.slug}`"
                      class="text-foreground hover:text-primary"
                    >
                      {{ specialty.name }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section v-if="intelligence" class="border-border mt-12 border-t pt-10">
          <DirectorySourceFooter
            :metadata="intelligence.sourceMetadata"
            :source-links="intelligence.sourceLinks ?? []"
          />
        </section>
        <section
          v-else-if="contractor.sourceUrl"
          class="border-border mt-12 border-t pt-10"
        >
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Source
          </h2>
          <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
            This profile shell is served from the local contractor snapshot.
            Detailed award intelligence is refreshed asynchronously from
            USAspending.gov.
          </p>
          <NuxtLink
            :to="contractor.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary mt-3 inline-flex items-center gap-1 text-sm hover:underline"
          >
            View USAspending source
            <Icon name="mdi:open-in-new" class="h-3 w-3" />
          </NuxtLink>
        </section>
      </div>
    </div>
  </main>
</template>
