<!--
  @file Company profile page
  @route /[slug]
  @description Canonical contractor profile with source-backed award context and alternate USAspending names
-->

<script setup lang="ts">
import type { ContractorIntelligence } from "@/app/types/intelligence.types";
import { formatIntelligenceMoney } from "@/app/lib/intelligence-ui";

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
  refresh: refreshIntelligence,
} = useFetch<ProfileIntelligenceResponse>(
  () => `/api/contractors/${slug.value}/intelligence`,
  {
    lazy: true,
    watch: [slug],
  },
);

const intelligenceRefreshAttempts = ref(0);
const maxIntelligenceRefreshAttempts = 8;
let intelligenceRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const clearIntelligenceRefreshTimer = () => {
  if (!intelligenceRefreshTimer) return;
  clearTimeout(intelligenceRefreshTimer);
  intelligenceRefreshTimer = null;
};

const formatAwardDate = (value: string | null): string | null => {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const formatContractDates = (
  startDate: string | null,
  endDate: string | null,
): string | null => {
  const formattedStart = formatAwardDate(startDate);
  const formattedEnd = formatAwardDate(endDate);
  if (formattedStart && formattedEnd)
    return `${formattedStart} - ${formattedEnd}`;
  return formattedStart ?? formattedEnd;
};

const intelligence = computed(
  () =>
    intelligenceResponse.value?.intelligence ??
    contractor.value?.intelligence ??
    null,
);

const intelligenceFreshness = computed(
  () =>
    intelligence.value?.sourceMetadata?.cacheStatus ??
    intelligenceResponse.value?.status ??
    "snapshot",
);

const shouldPollIntelligence = computed(
  () =>
    !intelligence.value &&
    !isIntelligenceLoading.value &&
    (intelligenceResponse.value?.status === "refreshing" ||
      intelligenceResponse.value?.refreshQueued === true),
);

watch(slug, () => {
  intelligenceRefreshAttempts.value = 0;
  clearIntelligenceRefreshTimer();
});

watch(
  shouldPollIntelligence,
  (shouldPoll) => {
    clearIntelligenceRefreshTimer();

    if (
      !shouldPoll ||
      intelligenceRefreshAttempts.value >= maxIntelligenceRefreshAttempts
    ) {
      return;
    }

    intelligenceRefreshTimer = setTimeout(() => {
      intelligenceRefreshAttempts.value += 1;
      void refreshIntelligence();
    }, 2000);
  },
  { immediate: true },
);

onUnmounted(clearIntelligenceRefreshTimer);

useHead(() => {
  if (!contractor.value) return {};

  return {
    title: `${contractor.value.name} | Defense Contractor Profile | military.contractors`,
    link: [
      {
        rel: "canonical",
        href: `${config.public.siteUrl}/${contractor.value.canonicalSlug}`,
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

      <DirectoryPageHeader eyebrow="Contractor" :title="contractor.name" />

      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          v-if="
            !intelligence && (isIntelligenceLoading || shouldPollIntelligence)
          "
          class="flex justify-center py-12"
        >
          <LoadingText text="Loading award records" />
        </div>

        <section v-if="intelligence?.topAwards?.length">
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
                <span
                  v-if="formatContractDates(award.startDate, award.endDate)"
                >
                  Contract
                  {{ formatContractDates(award.startDate, award.endDate) }}
                </span>
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
                <span
                  v-if="formatContractDates(award.startDate, award.endDate)"
                >
                  Contract
                  {{ formatContractDates(award.startDate, award.endDate) }}
                </span>
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
      </div>
    </div>
  </main>
</template>
