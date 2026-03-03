<!--
  @file Company profile page
  @route /companies/[slug]
  @description Shows defense contractor profile with company details, key stats, and specialties
-->

<script setup lang="ts">
interface ContractorResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  defenseNewsRank: number | null;
  country: string | null;
  headquarters: string | null;
  founded: number | null;
  employeeCount: number | null;
  website: string | null;
  careersUrl: string | null;
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
  claimedProfile: {
    tier: string;
    verifiedAt: string | null;
  } | null;
  benefits: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  programs: Array<{
    id: string;
    name: string;
    category: string | null;
    description: string | null;
  }>;
  spotlight: {
    title: string;
    content: string;
    mediaUrl: string | null;
    ctaText: string | null;
    ctaUrl: string | null;
  } | null;
  testimonials: Array<{
    id: string;
    quote: string;
    employeeName: string;
    employeeTitle: string;
    employeePhotoUrl: string | null;
  }>;
  createdAt: string | null;
  updatedAt: string | null;
}

const route = useRoute();
const logger = useLogger("ContractorProfilePage");

// Get slug from route
const slug = computed(() => route.params.slug as string);

// Fetch contractor data
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

// Format revenue for display (already in billions from API)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return "N/A";
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`;
  }
  // Convert to millions for smaller values
  const millions = revenue * 1000;
  return `$${millions.toFixed(0)}M`;
};

// Format percentage
const formatPercent = (percent: number | null | undefined): string => {
  if (percent == null) return "N/A";
  return `${Math.round(percent)}%`;
};

// Get stock exchange (simplified logic - most US defense contractors are NYSE)
const stockExchange = computed(() => {
  if (!contractor.value?.stockTicker) return null;
  // Common NASDAQ defense tickers
  const nasdaqTickers = ["ANSS", "LDOS"];
  return nasdaqTickers.includes(contractor.value.stockTicker)
    ? "NASDAQ"
    : "NYSE";
});

// Get Yahoo Finance URL for stock
const yahooFinanceUrl = computed(() => {
  if (!contractor.value?.stockTicker) return null;
  return `https://finance.yahoo.com/quote/${contractor.value.stockTicker}`;
});

// SEO
useHead(() => {
  if (!contractor.value) return {};
  return {
    title: `${contractor.value.name} | Defense Contractor Profile | military.contractors`,
    meta: [
      {
        name: "description",
        content:
          contractor.value.description?.slice(0, 160) ||
          `${contractor.value.name} - U.S. defense contractor profile with company details, specialties, and career information.`,
      },
    ],
  };
});

// Log page load
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
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="min-h-full">
      <SearchablePageHeader>
        <template #filters>
          <div class="h-7" />
        </template>
      </SearchablePageHeader>
      <div class="flex justify-center py-12">
        <LoadingText text="Loading contractor profile" />
      </div>
    </div>

    <!-- Error/Not Found State -->
    <div v-else-if="error || !contractor" class="min-h-full">
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
          <div class="flex justify-center gap-3">
            <Button as-child variant="default">
              <NuxtLink to="/companies">Browse Contractors</NuxtLink>
            </Button>
          </div>
        </Empty>
      </div>
    </div>

    <!-- Contractor Profile -->
    <div v-else class="min-h-full">
      <!-- Page Header -->
      <SearchablePageHeader>
        <template #filters>
          <!-- Breadcrumb -->
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
            <span class="text-foreground truncate font-medium">{{
              contractor.name
            }}</span>
          </div>
        </template>
      </SearchablePageHeader>

      <!-- Main Content -->
      <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-8 lg:flex-row">
          <!-- Left Column: Main Content -->
          <div class="max-w-3xl min-w-0 flex-1">
            <!-- Header Section -->
            <div class="border-border/30 mb-8 border-b pb-6">
              <!-- Name + Rank Badge + Verified Badge -->
              <div class="mb-4 flex flex-wrap items-start gap-3">
                <h1 class="text-foreground text-2xl font-bold md:text-3xl">
                  {{ contractor.name }}
                </h1>

                <Badge
                  v-if="contractor.claimedProfile"
                  variant="outline"
                  class="shrink-0 border-green-600/30 text-green-600"
                >
                  <Icon name="mdi:check-decagram" class="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>

              <!-- Primary Specialty Tag -->
              <NuxtLink
                v-if="contractor.primarySpecialty"
                :to="`/companies/specialty/${contractor.primarySpecialty.slug}`"
                class="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
              >
                <Icon
                  v-if="contractor.primarySpecialty.icon"
                  :name="contractor.primarySpecialty.icon"
                  class="text-primary h-4 w-4"
                />
                {{ contractor.primarySpecialty.name }}
              </NuxtLink>

              <!-- Key Stats Grid -->
              <div
                class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6"
              >
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    Defense Revenue
                  </p>
                  <p class="text-foreground text-lg font-bold">
                    {{ formatRevenue(contractor.defenseRevenue) }}
                  </p>
                </div>
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    Total Revenue
                  </p>
                  <p class="text-foreground text-lg font-bold">
                    {{ formatRevenue(contractor.totalRevenue) }}
                  </p>
                </div>
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    % Defense
                  </p>
                  <p class="text-foreground text-lg font-bold">
                    {{ formatPercent(contractor.defenseRevenuePercent) }}
                  </p>
                </div>
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    Employees
                  </p>
                  <p class="text-foreground text-lg font-bold">
                    {{ contractor.employeeCount || "N/A" }}
                  </p>
                </div>
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    Founded
                  </p>
                  <p class="text-foreground text-lg font-bold">
                    {{ contractor.founded || "N/A" }}
                  </p>
                </div>
                <div class="text-center">
                  <p
                    class="text-muted-foreground mb-1 text-xs tracking-wide uppercase"
                  >
                    Headquarters
                  </p>
                  <p
                    class="text-foreground text-sm leading-tight font-semibold"
                  >
                    {{ contractor.headquarters || "N/A" }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Overview Section -->
            <section v-if="contractor.description" class="mb-8">
              <h2 class="text-foreground mb-4 text-lg font-bold">Overview</h2>
              <div class="text-foreground/90 prose prose-sm max-w-none">
                <p
                  v-for="(paragraph, idx) in contractor.description.split(
                    '\n\n',
                  )"
                  :key="idx"
                  class="mb-4 leading-relaxed last:mb-0"
                >
                  {{ paragraph }}
                </p>
              </div>
            </section>

            <!-- Specialties Section -->
            <section v-if="contractor.specialties?.length" class="mb-8">
              <h2 class="text-foreground mb-4 text-lg font-bold">
                Areas of Expertise
              </h2>
              <div class="flex flex-wrap gap-3">
                <NuxtLink
                  v-for="specialty in contractor.specialties"
                  :key="specialty.id"
                  :to="`/companies/specialty/${specialty.slug}`"
                  class="group hover:border-border flex items-center gap-2 border border-transparent px-4 py-2 transition-colors"
                >
                  <Icon
                    v-if="specialty.icon"
                    :name="specialty.icon"
                    class="text-primary h-5 w-5"
                  />
                  <div>
                    <p
                      class="text-foreground group-hover:text-primary text-sm font-medium transition-colors"
                    >
                      {{ specialty.name }}
                    </p>
                    <p
                      v-if="specialty.description"
                      class="text-muted-foreground text-xs"
                    >
                      {{ specialty.description }}
                    </p>
                  </div>
                  <Badge
                    v-if="specialty.isPrimary"
                    variant="outline"
                    class="ml-auto text-[10px]"
                  >
                    Primary
                  </Badge>
                </NuxtLink>
              </div>
            </section>

            <!-- Why Work Here Section (Claimed Profiles) -->
            <section v-if="contractor.benefits?.length" class="mb-8">
              <h2 class="text-foreground mb-4 text-lg font-bold">
                Why Work Here
              </h2>
              <div class="grid gap-4 sm:grid-cols-3">
                <div
                  v-for="benefit in contractor.benefits"
                  :key="benefit.id"
                  class="rounded-lg p-4"
                >
                  <Icon
                    :name="benefit.icon"
                    class="text-primary mb-2 h-8 w-8"
                  />
                  <h3 class="mb-1 font-semibold">{{ benefit.title }}</h3>
                  <p class="text-muted-foreground text-sm">
                    {{ benefit.description }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Notable Programs Section (Claimed Profiles) -->
            <section v-if="contractor.programs?.length" class="mb-8">
              <h2 class="text-foreground mb-4 text-lg font-bold">
                Notable Programs
              </h2>
              <div class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="program in contractor.programs"
                  :key="program.id"
                  class="flex items-start gap-3 rounded-lg p-3"
                >
                  <Icon
                    name="mdi:rocket-launch-outline"
                    class="text-primary mt-0.5 h-5 w-5 shrink-0"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="font-medium">{{ program.name }}</h3>
                      <Badge
                        v-if="program.category"
                        variant="outline"
                        class="text-xs"
                      >
                        {{ program.category }}
                      </Badge>
                    </div>
                    <p
                      v-if="program.description"
                      class="text-muted-foreground mt-0.5 text-sm"
                    >
                      {{ program.description }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Spotlight Section (Premium Tier) -->
            <section v-if="contractor.spotlight" class="mb-8">
              <Card class="bg-primary/3 border-primary/30 p-6">
                <div class="mb-4 flex items-center gap-2">
                  <Badge class="bg-primary/5 text-primary"
                    >Company Spotlight</Badge
                  >
                </div>
                <h3
                  v-if="contractor.spotlight.title"
                  class="mb-2 text-xl font-bold"
                >
                  {{ contractor.spotlight.title }}
                </h3>
                <p
                  v-if="contractor.spotlight.content"
                  class="text-muted-foreground mb-4"
                >
                  {{ contractor.spotlight.content }}
                </p>
                <img
                  v-if="contractor.spotlight.mediaUrl"
                  :src="contractor.spotlight.mediaUrl"
                  alt="Spotlight media"
                  class="mb-4 w-full rounded-lg"
                />
                <Button v-if="contractor.spotlight.ctaUrl" as-child>
                  <NuxtLink :to="contractor.spotlight.ctaUrl" target="_blank">
                    {{ contractor.spotlight.ctaText || "Learn More" }}
                    <Icon name="mdi:arrow-right" class="ml-1 h-4 w-4" />
                  </NuxtLink>
                </Button>
              </Card>
            </section>

            <!-- Testimonials Section (Premium Tier) -->
            <section v-if="contractor.testimonials?.length" class="mb-8">
              <h2 class="text-foreground mb-4 text-lg font-bold">
                What Employees Say
              </h2>
              <div class="space-y-4">
                <Card
                  v-for="testimonial in contractor.testimonials"
                  :key="testimonial.id"
                  class="p-4"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    >
                      <img
                        v-if="testimonial.employeePhotoUrl"
                        :src="testimonial.employeePhotoUrl"
                        :alt="testimonial.employeeName"
                        class="h-full w-full rounded-full object-cover"
                      />
                      <Icon
                        v-else
                        name="mdi:account"
                        class="text-muted-foreground h-6 w-6"
                      />
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-2 italic">
                        "{{ testimonial.quote }}"
                      </p>
                      <p class="font-medium">{{ testimonial.employeeName }}</p>
                      <p class="text-muted-foreground text-sm">
                        {{ testimonial.employeeTitle }}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <!-- Claim CTA (Unclaimed Profiles) -->
            <div
              v-if="!contractor.claimedProfile"
              class="mb-8 rounded-lg border-2 border-dashed p-4 text-center"
            >
              <p class="text-muted-foreground mb-2">Is this your company?</p>
              <NuxtLink
                to="/for-companies"
                class="text-primary hover:underline"
              >
                Claim this profile to update information and add content
                <Icon name="mdi:arrow-right" class="ml-1 inline h-4 w-4" />
              </NuxtLink>
            </div>
          </div>

          <!-- Right Column: Sidebar -->
          <div class="shrink-0 lg:w-80">
            <div class="space-y-6 lg:sticky lg:top-4">
              <!-- External Links Card -->
              <Card class="overflow-hidden border-none">
                <CardContent class="p-0">
                  <div class="border-border/30 border-b p-4">
                    <div class="mb-3 flex items-center gap-2">
                      <Icon
                        name="mdi:link-variant"
                        class="text-muted-foreground h-4 w-4"
                      />
                      <span
                        class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                        >Links</span
                      >
                    </div>
                    <div class="space-y-2">
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
                          <Icon name="mdi:web" class="mr-2 h-4 w-4" />
                          Website
                          <Icon
                            name="mdi:open-in-new"
                            class="ml-auto h-3 w-3 opacity-50"
                          />
                        </NuxtLink>
                      </Button>
                      <Button
                        v-if="contractor.careersUrl"
                        as-child
                        variant="default"
                        size="sm"
                        class="w-full justify-start"
                      >
                        <NuxtLink
                          :to="contractor.careersUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon name="mdi:briefcase" class="mr-2 h-4 w-4" />
                          Careers
                          <Icon
                            name="mdi:open-in-new"
                            class="ml-auto h-3 w-3 opacity-50"
                          />
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
                          <Icon name="mdi:linkedin" class="mr-2 h-4 w-4" />
                          LinkedIn
                          <Icon
                            name="mdi:open-in-new"
                            class="ml-auto h-3 w-3 opacity-50"
                          />
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
                          <Icon name="mdi:wikipedia" class="mr-2 h-4 w-4" />
                          Wikipedia
                          <Icon
                            name="mdi:open-in-new"
                            class="ml-auto h-3 w-3 opacity-50"
                          />
                        </NuxtLink>
                      </Button>
                    </div>
                  </div>

                  <!-- Stock Info -->
                  <div class="border-border/30 border-b p-4">
                    <div class="mb-3 flex items-center gap-2">
                      <Icon
                        name="mdi:chart-line"
                        class="text-muted-foreground h-4 w-4"
                      />
                      <span
                        class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                        >Stock</span
                      >
                    </div>
                    <div
                      v-if="contractor.isPublic && contractor.stockTicker"
                      class="flex items-center gap-2"
                    >
                      <Badge variant="outline" class="font-mono">
                        {{ stockExchange }}: {{ contractor.stockTicker }}
                      </Badge>
                      <NuxtLink
                        v-if="yahooFinanceUrl"
                        :to="yahooFinanceUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-muted-foreground hover:text-primary text-xs transition-colors"
                      >
                        View on Yahoo Finance
                        <Icon
                          name="mdi:open-in-new"
                          class="ml-1 inline h-3 w-3"
                        />
                      </NuxtLink>
                    </div>
                    <p v-else class="text-muted-foreground text-sm">
                      Private Company
                    </p>
                  </div>

                  <!-- Quick Stats -->
                  <div class="p-4">
                    <div class="mb-3 flex items-center gap-2">
                      <Icon
                        name="mdi:information"
                        class="text-muted-foreground h-4 w-4"
                      />
                      <span
                        class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                        >Details</span
                      >
                    </div>
                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <dt class="text-muted-foreground">Country</dt>
                        <dd class="font-medium">
                          {{ contractor.country || "N/A" }}
                        </dd>
                      </div>

                      <div
                        v-if="contractor.specialties?.length"
                        class="flex justify-between"
                      >
                        <dt class="text-muted-foreground">Specialties</dt>
                        <dd class="font-medium">
                          {{ contractor.specialties.length }}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
              </Card>

              <!-- Headquarters Location Card -->
              <Card
                v-if="contractor.locations?.length"
                class="overflow-hidden border-none"
              >
                <CardContent class="p-4">
                  <div class="mb-3 flex items-center gap-2">
                    <Icon
                      name="mdi:map-marker"
                      class="text-muted-foreground h-4 w-4"
                    />
                    <span
                      class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                      >Locations</span
                    >
                  </div>
                  <ul class="space-y-2">
                    <li
                      v-for="location in contractor.locations"
                      :key="location.id"
                      class="flex items-start gap-2 text-sm"
                    >
                      <Icon
                        :name="
                          location.isHeadquarters
                            ? 'mdi:office-building'
                            : 'mdi:map-marker-outline'
                        "
                        class="text-primary mt-0.5 h-4 w-4 shrink-0"
                      />
                      <div>
                        <NuxtLink
                          v-if="location.state"
                          :to="`/companies/location/${location.state.toLowerCase().replace(/\s+/g, '-')}`"
                          class="hover:text-primary font-medium transition-colors"
                        >
                          {{
                            [location.city, location.state]
                              .filter(Boolean)
                              .join(", ")
                          }}
                        </NuxtLink>
                        <span v-else class="font-medium">
                          {{ location.city || location.country }}
                        </span>
                        <Badge
                          v-if="location.isHeadquarters"
                          variant="outline"
                          class="ml-2 text-[10px]"
                        >
                          HQ
                        </Badge>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
