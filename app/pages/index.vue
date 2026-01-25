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

// Search state
const searchQuery = ref('')

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

// Handle search submission
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/contractors', query: { q: searchQuery.value.trim() } })
  } else {
    router.push('/contractors')
  }
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
        <!-- Ambient background glow -->
        <div class="-z-10 absolute inset-0">
          <div class="top-1/4 left-1/4 absolute bg-primary/5 blur-[100px] w-96 h-96 animate-pulse" />
          <div class="right-1/4 bottom-1/4 absolute bg-blue-500/5 blur-[80px] w-80 h-80 animate-pulse delay-700" />
        </div>

        <div class="space-y-6 py-6 sm:py-8 text-center">
          <!-- Eyebrow badge -->
          <div class="inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5 border border-primary/20 font-medium text-primary text-xs tracking-wide">
            <span class="relative flex w-2 h-2">
              <span class="inline-flex absolute bg-primary opacity-75 w-full h-full animate-ping" />
              <span class="inline-flex relative bg-primary w-2 h-2" />
            </span>
            DEFENSE NEWS TOP 100
          </div>

          
          <!-- Main headline -->
          <div class="space-y-4">
            <h1 class="font-bold text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
              The Defense Contractor
              <br class="hidden sm:block" />
              <span class="relative">
                <span class="bg-clip-text bg-linear-to-r from-primary via-blue-500 to-cyan-500 text-transparent">
                  Directory
                </span>
                <span class="right-0 -bottom-1 left-0 absolute bg-linear-to-r from-primary/40 via-blue-500/40 to-cyan-500/40 blur-sm h-1" />
              </span>
            </h1>
            <p class="mx-auto max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
              Browse U.S. defense contractors by specialty, revenue, and rank.
            </p>
          </div>

          <!-- Search Bar -->
          <div class="mx-auto pt-4 max-w-xl">
            <form @submit.prevent="handleSearch" class="flex gap-2">
              <div class="relative flex-1">
                <Icon name="mdi:magnify" class="top-1/2 left-3 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
                <Input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search contractors..."
                  class="bg-background/50 pl-10 border-border/50 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" class="px-6 h-12">
                Search
              </Button>
            </form>
          </div>

          <!-- Stats strip -->
          <div class="flex justify-center items-center gap-8 sm:gap-12 pt-4">
            <div class="text-center">
              <div class="font-bold tabular-nums text-primary text-3xl sm:text-4xl tracking-tight">
                {{ totalContractors }}
              </div>
              <div class="mt-0.5 text-muted-foreground text-sm">
                U.S. Contractors
              </div>
            </div>
            <div class="text-center">
              <div class="font-bold tabular-nums text-blue-600 dark:text-blue-400 text-3xl sm:text-4xl tracking-tight">
                {{ specialties.length }}
              </div>
              <div class="mt-0.5 text-muted-foreground text-sm">
                Specialties
              </div>
            </div>
            <div class="text-center">
              <div class="font-bold tabular-nums text-cyan-600 dark:text-cyan-400 text-3xl sm:text-4xl tracking-tight">
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
              <Badge
                v-if="contractor.defenseNewsRank"
                variant="default"
                class="font-bold text-sm shrink-0"
              >
                #{{ contractor.defenseNewsRank }}
              </Badge>
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
            class="group flex flex-col items-center gap-2 bg-card/30 hover:bg-card/50 p-4 border border-border/30 hover:border-primary/30 text-center transition-all duration-150"
          >
            <div class="flex justify-center items-center bg-primary/10 group-hover:bg-primary/20 w-10 h-10 text-primary transition-colors">
              <Icon :name="getSpecialtyIcon(specialty.slug)" class="w-5 h-5" />
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
          Looking to advertise?
        </h2>
        <p class="text-muted-foreground">
          Reach defense professionals and contractors through our directory.
        </p>
        <Button variant="outline" as-child>
          <NuxtLink to="/advertise" class="gap-2">
            <Icon name="mdi:bullhorn-outline" class="w-4 h-4" />
            Learn More
          </NuxtLink>
        </Button>
      </div>
    </section>
  </div>
</template>
