<!--
  @file Contractor profile page
  @route /contractors/[slug]
  @description Shows defense contractor profile with company details, key stats, and specialties
-->

<script setup lang="ts">
interface ContractorResponse {
  id: string
  slug: string
  name: string
  description: string | null
  defenseNewsRank: number | null
  country: string | null
  headquarters: string | null
  founded: number | null
  employeeCount: number | null
  website: string | null
  careersUrl: string | null
  linkedinUrl: string | null
  wikipediaUrl: string | null
  stockTicker: string | null
  isPublic: boolean
  totalRevenue: number | null
  defenseRevenue: number | null
  defenseRevenuePercent: number | null
  logoUrl: string | null
  specialties: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    isPrimary: boolean
  }>
  primarySpecialty: {
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    isPrimary: boolean
  } | null
  locations: Array<{
    id: string
    city: string | null
    state: string | null
    country: string
    isHeadquarters: boolean
  }>
  claimedProfile: {
    tier: string
    verifiedAt: string | null
  } | null
  benefits: Array<{
    id: string
    icon: string
    title: string
    description: string
  }>
  programs: Array<{
    id: string
    name: string
    category: string | null
    description: string | null
  }>
  spotlight: {
    title: string
    content: string
    mediaUrl: string | null
    ctaText: string | null
    ctaUrl: string | null
  } | null
  testimonials: Array<{
    id: string
    quote: string
    employeeName: string
    employeeTitle: string
    employeePhotoUrl: string | null
  }>
  createdAt: string | null
  updatedAt: string | null
}

const route = useRoute()
const logger = useLogger('ContractorProfilePage')

// Get slug from route
const slug = computed(() => route.params.slug as string)

// Fetch contractor data
const { data: contractor, pending: isLoading, error } = useFetch<ContractorResponse | null>(() => `/api/contractors/${slug.value}`, {
  lazy: true,
  watch: [slug],
})

// Format revenue for display (already in billions from API)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return 'N/A'
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`
  }
  // Convert to millions for smaller values
  const millions = revenue * 1000
  return `$${millions.toFixed(0)}M`
}

// Format percentage
const formatPercent = (percent: number | null | undefined): string => {
  if (percent == null) return 'N/A'
  return `${Math.round(percent)}%`
}

// Get stock exchange (simplified logic - most US defense contractors are NYSE)
const stockExchange = computed(() => {
  if (!contractor.value?.stockTicker) return null
  // Common NASDAQ defense tickers
  const nasdaqTickers = ['ANSS', 'LDOS']
  return nasdaqTickers.includes(contractor.value.stockTicker) ? 'NASDAQ' : 'NYSE'
})

// Get Yahoo Finance URL for stock
const yahooFinanceUrl = computed(() => {
  if (!contractor.value?.stockTicker) return null
  return `https://finance.yahoo.com/quote/${contractor.value.stockTicker}`
})

// SEO
useHead(() => {
  if (!contractor.value) return {}
  return {
    title: `${contractor.value.name} | Defense Contractor Profile | military.contractors`,
    meta: [
      {
        name: 'description',
        content: contractor.value.description?.slice(0, 160) || `${contractor.value.name} defense contractor profile - rank #${contractor.value.defenseNewsRank} on Defense News Top 100`,
      },
    ],
  }
})

// Log page load
watchEffect(() => {
  if (contractor.value) {
    logger.info({ slug: slug.value, name: contractor.value.name }, 'Contractor profile loaded')
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="min-h-full">
    <SearchablePageHeader>
      <template #filters>
        <div class="h-7" />
      </template>
    </SearchablePageHeader>
    <ContractorProfileSkeleton />
  </div>

  <!-- Error/Not Found State -->
  <div v-else-if="error || !contractor" class="min-h-full">
    <SearchablePageHeader />
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
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
        <div class="flex gap-3 justify-center">
          <Button as-child variant="default">
            <NuxtLink to="/contractors">Browse Contractors</NuxtLink>
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
          <NuxtLink to="/contractors" class="text-muted-foreground hover:text-primary transition-colors">
            Contractors
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium truncate">{{ contractor.name }}</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Main Content -->
        <div class="flex-1 min-w-0 max-w-3xl">
          <!-- Header Section -->
          <div class="mb-8 pb-6 border-b border-border/30">
            <!-- Name + Rank Badge + Verified Badge -->
            <div class="flex flex-wrap items-start gap-3 mb-4">
              <h1 class="text-2xl md:text-3xl font-bold text-foreground">
                {{ contractor.name }}
              </h1>
              <Badge v-if="contractor.defenseNewsRank" variant="default" class="text-sm font-bold shrink-0">
                #{{ contractor.defenseNewsRank }}
              </Badge>
              <Badge v-if="contractor.claimedProfile" variant="outline" class="text-green-600 border-green-600/30 shrink-0">
                <Icon name="mdi:check-decagram" class="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>

            <!-- Primary Specialty Tag -->
            <div v-if="contractor.primarySpecialty" class="flex items-center gap-2 mb-4">
              <Icon v-if="contractor.primarySpecialty.icon" :name="contractor.primarySpecialty.icon" class="w-4 h-4 text-primary" />
              <span class="text-sm text-muted-foreground">{{ contractor.primarySpecialty.name }}</span>
            </div>

            <!-- Key Stats Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/30">
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Defense Revenue</p>
                <p class="text-lg font-bold text-foreground">{{ formatRevenue(contractor.defenseRevenue) }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
                <p class="text-lg font-bold text-foreground">{{ formatRevenue(contractor.totalRevenue) }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">% Defense</p>
                <p class="text-lg font-bold text-foreground">{{ formatPercent(contractor.defenseRevenuePercent) }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Employees</p>
                <p class="text-lg font-bold text-foreground">{{ contractor.employeeCount || 'N/A' }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Founded</p>
                <p class="text-lg font-bold text-foreground">{{ contractor.founded || 'N/A' }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Headquarters</p>
                <p class="text-sm font-semibold text-foreground leading-tight">{{ contractor.headquarters || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Overview Section -->
          <section v-if="contractor.description" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Overview
            </h2>
            <div class="prose prose-sm max-w-none text-foreground/90">
              <p v-for="(paragraph, idx) in contractor.description.split('\n\n')" :key="idx" class="mb-4 last:mb-0 leading-relaxed">
                {{ paragraph }}
              </p>
            </div>
          </section>

          <!-- Specialties Section -->
          <section v-if="contractor.specialties?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Areas of Expertise
            </h2>
            <div class="flex flex-wrap gap-3">
              <NuxtLink
                v-for="specialty in contractor.specialties"
                :key="specialty.id"
                :to="`/contractors/specialty/${specialty.slug}`"
                class="flex items-center gap-2 px-4 py-2 bg-sidebar hover:bg-muted/50 transition-colors group"
              >
                <Icon v-if="specialty.icon" :name="specialty.icon" class="w-5 h-5 text-primary" />
                <div>
                  <p class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {{ specialty.name }}
                  </p>
                  <p v-if="specialty.description" class="text-xs text-muted-foreground">
                    {{ specialty.description }}
                  </p>
                </div>
                <Badge v-if="specialty.isPrimary" variant="outline" class="ml-auto text-[10px]">
                  Primary
                </Badge>
              </NuxtLink>
            </div>
          </section>

          <!-- Why Work Here Section (Claimed Profiles) -->
          <section v-if="contractor.benefits?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Why Work Here
            </h2>
            <div class="grid gap-4 sm:grid-cols-3">
              <div 
                v-for="benefit in contractor.benefits" 
                :key="benefit.id"
                class="p-4 bg-sidebar rounded-lg"
              >
                <Icon :name="benefit.icon" class="w-8 h-8 text-primary mb-2" />
                <h3 class="font-semibold mb-1">{{ benefit.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ benefit.description }}</p>
              </div>
            </div>
          </section>

          <!-- Notable Programs Section (Claimed Profiles) -->
          <section v-if="contractor.programs?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Notable Programs
            </h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <div 
                v-for="program in contractor.programs" 
                :key="program.id"
                class="flex items-start gap-3 p-3 bg-sidebar rounded-lg"
              >
                <Icon name="mdi:rocket-launch-outline" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium">{{ program.name }}</h3>
                    <Badge v-if="program.category" variant="outline" class="text-xs">
                      {{ program.category }}
                    </Badge>
                  </div>
                  <p v-if="program.description" class="text-sm text-muted-foreground mt-0.5">
                    {{ program.description }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Spotlight Section (Premium Tier) -->
          <section v-if="contractor.spotlight" class="mb-8">
            <Card class="p-6 border-primary/30 bg-primary/5">
              <div class="flex items-center gap-2 mb-4">
                <Badge class="bg-primary/5 text-primary">Company Spotlight</Badge>
              </div>
              <h3 v-if="contractor.spotlight.title" class="text-xl font-bold mb-2">
                {{ contractor.spotlight.title }}
              </h3>
              <p v-if="contractor.spotlight.content" class="text-muted-foreground mb-4">
                {{ contractor.spotlight.content }}
              </p>
              <img 
                v-if="contractor.spotlight.mediaUrl" 
                :src="contractor.spotlight.mediaUrl" 
                alt="Spotlight media"
                class="w-full rounded-lg mb-4"
              />
              <Button v-if="contractor.spotlight.ctaUrl" as-child>
                <NuxtLink :to="contractor.spotlight.ctaUrl" target="_blank">
                  {{ contractor.spotlight.ctaText || 'Learn More' }}
                  <Icon name="mdi:arrow-right" class="w-4 h-4 ml-1" />
                </NuxtLink>
              </Button>
            </Card>
          </section>

          <!-- Testimonials Section (Premium Tier) -->
          <section v-if="contractor.testimonials?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              What Employees Say
            </h2>
            <div class="space-y-4">
              <Card 
                v-for="testimonial in contractor.testimonials" 
                :key="testimonial.id"
                class="p-4"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <img 
                      v-if="testimonial.employeePhotoUrl" 
                      :src="testimonial.employeePhotoUrl" 
                      :alt="testimonial.employeeName"
                      class="w-full h-full rounded-full object-cover"
                    />
                    <Icon v-else name="mdi:account" class="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="text-muted-foreground mb-2 italic">
                      "{{ testimonial.quote }}"
                    </p>
                    <p class="font-medium">{{ testimonial.employeeName }}</p>
                    <p class="text-sm text-muted-foreground">{{ testimonial.employeeTitle }}</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <!-- Claim CTA (Unclaimed Profiles) -->
          <div v-if="!contractor.claimedProfile" class="mb-8 p-4 border-2 border-dashed rounded-lg text-center">
            <p class="text-muted-foreground mb-2">Is this your company?</p>
            <NuxtLink to="/for-companies" class="text-primary hover:underline">
              Claim this profile to update information and add content
              <Icon name="mdi:arrow-right" class="w-4 h-4 inline ml-1" />
            </NuxtLink>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <div class="lg:w-80 shrink-0">
          <div class="lg:sticky lg:top-4 space-y-6">
            <!-- External Links Card -->
            <Card class="border-none bg-sidebar overflow-hidden">
              <CardContent class="p-0">
                <div class="p-4 border-b border-border/30">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon name="mdi:link-variant" class="w-4 h-4 text-muted-foreground" />
                    <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Links</span>
                  </div>
                  <div class="space-y-2">
                    <Button v-if="contractor.website" as-child variant="outline" size="sm" class="w-full justify-start">
                      <NuxtLink :to="contractor.website" target="_blank" rel="noopener noreferrer">
                        <Icon name="mdi:web" class="w-4 h-4 mr-2" />
                        Website
                        <Icon name="mdi:open-in-new" class="w-3 h-3 ml-auto opacity-50" />
                      </NuxtLink>
                    </Button>
                    <Button v-if="contractor.careersUrl" as-child variant="default" size="sm" class="w-full justify-start">
                      <NuxtLink :to="contractor.careersUrl" target="_blank" rel="noopener noreferrer">
                        <Icon name="mdi:briefcase" class="w-4 h-4 mr-2" />
                        Careers
                        <Icon name="mdi:open-in-new" class="w-3 h-3 ml-auto opacity-50" />
                      </NuxtLink>
                    </Button>
                    <Button v-if="contractor.linkedinUrl" as-child variant="outline" size="sm" class="w-full justify-start">
                      <NuxtLink :to="contractor.linkedinUrl" target="_blank" rel="noopener noreferrer">
                        <Icon name="mdi:linkedin" class="w-4 h-4 mr-2" />
                        LinkedIn
                        <Icon name="mdi:open-in-new" class="w-3 h-3 ml-auto opacity-50" />
                      </NuxtLink>
                    </Button>
                    <Button v-if="contractor.wikipediaUrl" as-child variant="outline" size="sm" class="w-full justify-start">
                      <NuxtLink :to="contractor.wikipediaUrl" target="_blank" rel="noopener noreferrer">
                        <Icon name="mdi:wikipedia" class="w-4 h-4 mr-2" />
                        Wikipedia
                        <Icon name="mdi:open-in-new" class="w-3 h-3 ml-auto opacity-50" />
                      </NuxtLink>
                    </Button>
                  </div>
                </div>

                <!-- Stock Info -->
                <div class="p-4 border-b border-border/30">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon name="mdi:chart-line" class="w-4 h-4 text-muted-foreground" />
                    <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock</span>
                  </div>
                  <div v-if="contractor.isPublic && contractor.stockTicker" class="flex items-center gap-2">
                    <Badge variant="outline" class="font-mono">
                      {{ stockExchange }}: {{ contractor.stockTicker }}
                    </Badge>
                    <NuxtLink
                      v-if="yahooFinanceUrl"
                      :to="yahooFinanceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      View on Yahoo Finance
                      <Icon name="mdi:open-in-new" class="w-3 h-3 inline ml-1" />
                    </NuxtLink>
                  </div>
                  <p v-else class="text-sm text-muted-foreground">
                    Private Company
                  </p>
                </div>

                <!-- Quick Stats -->
                <div class="p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon name="mdi:information" class="w-4 h-4 text-muted-foreground" />
                    <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
                  </div>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-muted-foreground">Country</dt>
                      <dd class="font-medium">{{ contractor.country || 'N/A' }}</dd>
                    </div>
                    <div v-if="contractor.defenseNewsRank" class="flex justify-between">
                      <dt class="text-muted-foreground">Defense News Rank</dt>
                      <dd class="font-medium">#{{ contractor.defenseNewsRank }}</dd>
                    </div>
                    <div v-if="contractor.specialties?.length" class="flex justify-between">
                      <dt class="text-muted-foreground">Specialties</dt>
                      <dd class="font-medium">{{ contractor.specialties.length }}</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>

            <!-- Headquarters Location Card -->
            <Card v-if="contractor.locations?.length" class="border-none bg-sidebar overflow-hidden">
              <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <Icon name="mdi:map-marker" class="w-4 h-4 text-muted-foreground" />
                  <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Locations</span>
                </div>
                <ul class="space-y-2">
                  <li
                    v-for="location in contractor.locations"
                    :key="location.id"
                    class="flex items-start gap-2 text-sm"
                  >
                    <Icon
                      :name="location.isHeadquarters ? 'mdi:office-building' : 'mdi:map-marker-outline'"
                      class="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <div>
                      <span class="font-medium">
                        {{ [location.city, location.state].filter(Boolean).join(', ') || location.country }}
                      </span>
                      <Badge v-if="location.isHeadquarters" variant="outline" class="ml-2 text-[10px]">
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
</template>
