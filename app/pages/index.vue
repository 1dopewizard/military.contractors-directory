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

// Search state
const searchQuery = ref('')
const router = useRouter()

// Handle search submission
const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ path: '/contractors', query: { q } })
  } else {
    router.push('/contractors')
  }
}

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

// Fetch top contractors
const { data: topContractorsData, pending: contractorsPending } = useFetch<ContractorResponse>(
  '/api/contractors?sort=rank&limit=6',
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
    <!-- Hero Section - Search Centric -->
    <section class="relative">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 pt-[clamp(4rem,12vh,8rem)] pb-12 container">
        <div class="mx-auto max-w-3xl text-center">
          <!-- Primary headline - Large and commanding -->
          <h1 class="font-bold text-foreground text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
            Find Defense
            <br />
            Contractors
          </h1>
          
          <!-- Subheadline -->
          <p class="mt-6 text-muted-foreground text-lg sm:text-xl">
            Search {{ totalContractors }} U.S. defense contractors by name, specialty, or location.
          </p>

          <!-- Search Bar - Hero Element -->
          <div class="mt-10 mx-auto max-w-2xl">
            <form @submit.prevent="handleSearch" class="flex items-center w-full h-14 sm:h-16 border border-border bg-card transition-colors focus-within:border-primary">
              <Icon name="mdi:magnify" class="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground shrink-0 ml-5 sm:ml-6" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search contractors..."
                class="flex-1 h-full px-4 bg-transparent text-foreground text-base sm:text-lg placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                class="h-full px-5 sm:px-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="mdi:arrow-right" class="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </form>
          </div>

          <!-- Quick filters -->
          <div class="mt-6 flex flex-wrap justify-center gap-2">
            <NuxtLink
              v-for="specialty in specialties.slice(0, 5)"
              :key="specialty.id"
              :to="{ path: '/contractors', query: { specialty: specialty.slug } }"
              class="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors"
            >
              {{ specialty.name }}
            </NuxtLink>
            <NuxtLink
              to="/contractors"
              class="px-3 py-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="border-t border-border">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 container">
        <div class="mx-auto max-w-4xl">
          <div class="grid grid-cols-3 divide-x divide-border">
            <div class="px-4 sm:px-8 text-center">
              <div class="font-bold tabular-nums text-foreground text-2xl sm:text-3xl md:text-4xl tracking-tight">
                {{ totalContractors }}
              </div>
              <div class="mt-1 text-muted-foreground text-xs sm:text-sm">
                U.S. Contractors
              </div>
            </div>
            <div class="px-4 sm:px-8 text-center">
              <div class="font-bold tabular-nums text-foreground text-2xl sm:text-3xl md:text-4xl tracking-tight">
                {{ specialties.length }}
              </div>
              <div class="mt-1 text-muted-foreground text-xs sm:text-sm">
                Specialties
              </div>
            </div>
            <div class="px-4 sm:px-8 text-center">
              <div class="font-bold tabular-nums text-foreground text-2xl sm:text-3xl md:text-4xl tracking-tight">
                {{ formatTotalRevenue(totalDefenseRevenue) }}
              </div>
              <div class="mt-1 text-muted-foreground text-xs sm:text-sm">
                Defense Revenue
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Contractors Section -->
    <section class="border-t border-border">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-12 container">
        <div class="mx-auto max-w-5xl">
          <div class="flex justify-between items-baseline mb-8">
            <h2 class="font-bold text-foreground text-xl sm:text-2xl">
              Featured Contractors
            </h2>
            <NuxtLink 
              to="/contractors" 
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </NuxtLink>
          </div>

          <!-- Loading State -->
          <div v-if="contractorsPending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            <div
              v-for="i in 6"
              :key="i"
              class="bg-background p-6 animate-pulse"
            >
              <div class="space-y-3">
                <div class="flex justify-between">
                  <div class="bg-muted w-2/3 h-5" />
                  <div class="bg-muted w-8 h-5" />
                </div>
                <div class="bg-muted/50 w-1/2 h-4" />
                <div class="bg-muted/50 w-1/3 h-4" />
              </div>
            </div>
          </div>

          <!-- Contractors Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            <NuxtLink
              v-for="contractor in topContractors"
              :key="contractor.id"
              :to="`/contractors/${contractor.slug}`"
              class="group bg-background p-5 sm:p-6 transition-colors hover:bg-muted/30"
            >
              <div class="space-y-3">
                <h3 class="font-semibold text-foreground group-hover:text-primary text-base leading-tight transition-colors">
                  {{ contractor.name }}
                </h3>
                <div class="space-y-1 text-sm text-muted-foreground">
                  <div v-if="contractor.defenseRevenue != null" class="font-medium text-foreground">
                    {{ formatRevenue(contractor.defenseRevenue) }} defense revenue
                  </div>
                  <div v-if="contractor.headquarters" class="truncate">
                    {{ contractor.headquarters }}
                  </div>
                  <div v-if="contractor.primarySpecialty" class="text-xs">
                    {{ contractor.primarySpecialty.name }}
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Browse by Specialty Section -->
    <section class="border-t border-border">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-12 container">
        <div class="mx-auto max-w-5xl">
          <h2 class="mb-8 font-bold text-foreground text-xl sm:text-2xl">
            Browse by Specialty
          </h2>

          <!-- Loading State -->
          <div v-if="specialtiesPending" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div
              v-for="i in 10"
              :key="i"
              class="p-4 animate-pulse"
            >
              <div class="space-y-2">
                <div class="bg-muted w-6 h-6" />
                <div class="bg-muted w-3/4 h-4" />
                <div class="bg-muted/50 w-1/2 h-3" />
              </div>
            </div>
          </div>

          <!-- Specialty Grid -->
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <NuxtLink
              v-for="specialty in specialties"
              :key="specialty.id"
              :to="{ path: '/contractors', query: { specialty: specialty.slug } }"
              class="group p-4 border border-transparent hover:border-border transition-colors"
            >
              <div class="text-primary mb-2">
                <Icon :name="getSpecialtyIcon(specialty.slug)" class="w-5 h-5" />
              </div>
              <div class="font-medium text-foreground group-hover:text-primary text-sm transition-colors">
                {{ specialty.name }}
              </div>
              <div v-if="specialty.contractorCount" class="mt-1 text-muted-foreground text-xs">
                {{ specialty.contractorCount }} contractors
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="border-t border-border bg-muted/20">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-12 container">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="font-semibold text-foreground text-lg sm:text-xl">
            Are you a defense contractor?
          </h2>
          <p class="mt-2 text-muted-foreground text-sm sm:text-base">
            Claim your company profile to manage your presence and reach job seekers.
          </p>
          <div class="mt-6">
            <Button variant="outline" as-child>
              <NuxtLink to="/for-companies">
                Learn more
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
