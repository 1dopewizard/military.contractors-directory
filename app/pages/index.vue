<!--
  @file Homepage - Defense Contractor Directory
  @description Primary landing page featuring contractor directory, search, top contractors, and specialty browsing
  @usage Landing page at /
-->

<script setup lang="ts">
definePageMeta({
  layout: 'homepage'
})

useHead({
  title: 'U.S. Defense Contractor Directory | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Comprehensive directory of U.S. defense contractors from the Defense News Top 100. Browse by specialty, search by name, and explore company profiles.'
    },
    {
      name: 'keywords',
      content: 'defense contractors, military contractors, defense industry, aerospace defense, defense companies, DoD contractors, top 100 defense contractors'
    }
  ]
})

// Schema.org structured data
useWebSiteSchema()
useWebPageSchema({
  name: 'U.S. Defense Contractor Directory',
  description: 'Comprehensive directory of U.S. defense contractors featuring company profiles, specialties, and revenue data.'
})

const router = useRouter()

// Search state - opens global search modal
const searchOpen = ref(false)

// Contractor response type
interface ContractorResponse {
  contractors: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    defenseNewsRank: number | null
    headquarters: string | null
    defenseRevenue: number | null
    totalRevenue: number | null
    primarySpecialty: {
      slug: string
      name: string | null
    } | null
  }>
  total: number
}

interface Specialty {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  contractorCount?: number
}

// Fetch top 10 contractors
const { data: topContractorsData, pending: contractorsPending } = useFetch<ContractorResponse>(
  '/api/contractors?sort=rank&limit=10',
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  }
)

// Fetch all contractors for stats
const { data: allContractorsData } = useFetch<ContractorResponse>(
  '/api/contractors?limit=50',
  {
    lazy: true,
    default: () => ({ contractors: [], total: 0 }),
  }
)

// Fetch specialties with counts
const { data: specialtiesData, pending: specialtiesPending } = useFetch<{ specialties: Specialty[] }>(
  '/api/specialties?includeCounts=true',
  {
    lazy: true,
    default: () => ({ specialties: [] }),
  }
)

// Computed values
const topContractors = computed(() => topContractorsData.value?.contractors ?? [])
const totalContractors = computed(() => allContractorsData.value?.total ?? 0)
const specialties = computed(() => specialtiesData.value?.specialties ?? [])

// Calculate total defense revenue from all contractors
const totalDefenseRevenue = computed(() => {
  const contractors = allContractorsData.value?.contractors ?? []
  const total = contractors.reduce((sum, c) => sum + (c.defenseRevenue ?? 0), 0)
  return total
})

// Format revenue for display (in billions)
const formatRevenue = (revenue: number | null | undefined): string => {
  if (revenue == null) return 'N/A'
  if (revenue >= 1) {
    return `$${revenue.toFixed(1)}B`
  }
  const millions = revenue * 1000
  return `$${millions.toFixed(0)}M`
}

// Format total revenue (sum of all defense revenue)
const formatTotalRevenue = (revenue: number): string => {
  if (revenue >= 1000) {
    return `$${(revenue / 1000).toFixed(1)}T`
  }
  return `$${revenue.toFixed(0)}B`
}

// Handle search - opens the global search modal
const openSearch = () => {
  searchOpen.value = true
}

// Specialty icon mapping
const specialtyIcons: Record<string, string> = {
  'aerospace-defense': 'mdi:airplane',
  'cybersecurity-it': 'mdi:shield-lock',
  'intelligence-analytics': 'mdi:brain',
  'land-systems': 'mdi:tank',
  'naval-maritime': 'mdi:anchor',
  'space-systems': 'mdi:rocket-launch',
  'professional-services': 'mdi:briefcase',
  'logistics-support': 'mdi:truck-delivery',
  'electronics-sensors': 'mdi:radar',
  'research-development': 'mdi:flask',
}

// Get icon for specialty
const getSpecialtyIcon = (slug: string): string => {
  return specialtyIcons[slug] || 'mdi:domain'
}
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section -->
    <section class="mx-auto px-4 sm:px-6 lg:px-8 pt-[clamp(1.5rem,6vh,3rem)] pb-8 container">
      <div class="relative overflow-hidden">
        <div class="space-y-6 py-6 sm:py-8 text-center">
          <!-- Eyebrow badge -->
          <div class="inline-flex items-center gap-2 bg-primary/5 px-3 py-1.5 border border-primary/20 font-medium text-primary text-xs tracking-wide">
            <span class="relative flex w-2 h-2">
              <span class="inline-flex absolute bg-primary opacity-75 w-full h-full animate-ping" />
              <span class="inline-flex relative bg-primary w-2 h-2" />
            </span>
            TOP 100 CONTRACTORS
          </div>

          
          <!-- Main headline -->
          <div class="space-y-4">
            <h1 class="font-bold text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
              The Defense Contractor
              <br class="hidden sm:block" />
              Directory
            </h1>
            <p class="mx-auto max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
              Browse U.S. defense contractors by specialty, revenue, and rank.
            </p>
          </div>

          <!-- Search Bar - Opens Global Search Modal -->
          <div class="mx-auto pt-4 max-w-xl">
            <Button
              variant="outline"
              class="justify-start bg-background/50 hover:bg-background/80 px-4 border-border/50 w-full h-12 text-muted-foreground hover:text-foreground"
              @click="openSearch"
            >
              <Icon name="mdi:magnify" class="mr-3 w-5 h-5" />
              <span class="flex-1 text-base text-left">Search contractors...</span>
              <Kbd class="hidden sm:inline-flex">⌘K</Kbd>
            </Button>
            <GlobalSearch v-model:open="searchOpen" />
          </div>

          <!-- Stats strip -->
          <div class="flex justify-center items-center gap-8 sm:gap-12 pt-4">
            <div class="text-center">
              <div class="font-bold tabular-nums text-foreground text-3xl sm:text-4xl tracking-tight">
                {{ totalContractors }}
              </div>
              <div class="mt-0.5 text-muted-foreground text-sm">
                U.S. Contractors
              </div>
            </div>
            <div class="text-center">
              <div class="font-bold tabular-nums text-foreground text-3xl sm:text-4xl tracking-tight">
                {{ specialties.length }}
              </div>
              <div class="mt-0.5 text-muted-foreground text-sm">
                Specialties
              </div>
            </div>
            <div class="text-center">
              <div class="font-bold tabular-nums text-foreground text-3xl sm:text-4xl tracking-tight">
                {{ formatTotalRevenue(totalDefenseRevenue) }}
              </div>
              <div class="mt-0.5 text-muted-foreground text-sm">
                Defense Revenue
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Top 10 Contractors Section -->
    <section class="mx-auto px-4 sm:px-6 lg:px-8 py-8 container">
      <div class="mx-auto max-w-5xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-bold text-foreground text-2xl">
            Top 10 Contractors
          </h2>
          <Button variant="ghost" as-child class="text-muted-foreground hover:text-foreground">
            <NuxtLink to="/contractors" class="gap-2">
              View All
              <Icon name="mdi:arrow-right" class="w-4 h-4" />
            </NuxtLink>
          </Button>
        </div>

        <!-- Loading State -->
        <div v-if="contractorsPending" class="gap-3 grid grid-cols-1 md:grid-cols-2">
          <div
            v-for="i in 10"
            :key="i"
            class="bg-card/30 p-4 border border-border/30 animate-pulse"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 space-y-2">
                <div class="bg-muted w-3/4 h-5" />
                <div class="bg-muted/50 w-1/2 h-4" />
              </div>
              <div class="bg-muted w-10 h-6" />
            </div>
          </div>
        </div>

        <!-- Contractors Grid -->
        <div v-else class="gap-3 grid grid-cols-1 md:grid-cols-2">
          <NuxtLink
            v-for="contractor in topContractors"
            :key="contractor.id"
            :to="`/contractors/${contractor.slug}`"
            class="group relative bg-card/30 hover:bg-card/50 px-4 py-4 border border-border/30 hover:border-primary/30 transition-all duration-150"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-3">
                  <h3 class="font-semibold text-foreground group-hover:text-primary text-base truncate transition-colors">
                    {{ contractor.name }}
                  </h3>
                </div>
                <div class="flex items-center gap-3 text-muted-foreground text-sm">
                  <span v-if="contractor.defenseRevenue != null" class="font-medium">
                    {{ formatRevenue(contractor.defenseRevenue) }}
                  </span>
                  <span v-if="contractor.headquarters" class="flex items-center gap-1 truncate">
                    <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5 shrink-0" />
                    {{ contractor.headquarters }}
                  </span>
                </div>
                <Badge
                  v-if="contractor.primarySpecialty"
                  variant="outline"
                  class="text-xs"
                >
                  {{ contractor.primarySpecialty.name }}
                </Badge>
              </div>
              <span
                v-if="contractor.defenseNewsRank"
                class="text-muted-foreground text-sm shrink-0"
              >
                #{{ contractor.defenseNewsRank }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Browse by Specialty Section -->
    <section class="mx-auto px-4 sm:px-6 lg:px-8 py-8 border-border/30 border-t container">
      <div class="mx-auto max-w-5xl">
        <h2 class="mb-6 font-bold text-foreground text-2xl">
          Browse by Specialty
        </h2>

        <!-- Loading State -->
        <div v-if="specialtiesPending" class="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <div
            v-for="i in 10"
            :key="i"
            class="bg-card/30 p-4 border border-border/30 animate-pulse"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="bg-muted w-8 h-8" />
              <div class="bg-muted w-3/4 h-4" />
              <div class="bg-muted/50 w-1/2 h-3" />
            </div>
          </div>
        </div>

        <!-- Specialty Grid -->
        <div v-else class="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <NuxtLink
            v-for="specialty in specialties"
            :key="specialty.id"
            :to="{ path: '/contractors', query: { specialty: specialty.slug } }"
            class="group flex flex-col items-center gap-2 p-4 text-center"
          >
            <div class="flex justify-center items-center w-10 h-10 text-primary">
              <Icon :name="getSpecialtyIcon(specialty.slug)" class="w-6 h-6" />
            </div>
            <span class="font-medium text-foreground group-hover:text-primary text-sm line-clamp-2 transition-colors">
              {{ specialty.name }}
            </span>
            <span v-if="specialty.contractorCount" class="text-muted-foreground text-xs">
              {{ specialty.contractorCount }} {{ specialty.contractorCount === 1 ? 'contractor' : 'contractors' }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="mx-auto px-4 sm:px-6 lg:px-8 py-12 border-border/30 border-t container">
      <div class="space-y-4 mx-auto max-w-2xl text-center">
        <h2 class="font-semibold text-foreground text-xl">
          Are you a defense contractor?
        </h2>
        <p class="text-muted-foreground">
          Claim your company profile to showcase your organization to job seekers and industry professionals.
        </p>
        <Button variant="outline" as-child>
          <NuxtLink to="/for-companies" class="gap-2">
            <Icon name="mdi:domain" class="w-4 h-4" />
            Learn More
          </NuxtLink>
        </Button>
      </div>
    </section>
  </div>
</template>
