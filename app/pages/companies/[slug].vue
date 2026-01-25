<!--
  @file Company detail page
  @route /companies/[slug]
  @description Shows contractor overview, domains, and MOS matches (military specialties they hire)
-->

<script setup lang="ts">
import CompanyDetailSkeleton from '@/app/components/Companies/CompanyDetailSkeleton.vue'
import type { Company, CompanyMosMatch } from '@/app/types/company.types'

const route = useRoute()
const logger = useLogger('CompanyDetailPage')
const { getCompanyBySlug } = useCompanies()

const slug = computed(() => route.params.slug as string)
const company = ref<Company | null>(null)
const isLoadingCompany = ref(true)

// Load company data
watchEffect(async () => {
  if (!slug.value) return
  
  isLoadingCompany.value = true
  try {
    const result = await getCompanyBySlug(slug.value)
    company.value = result || null
  } catch (error) {
    logger.error({ error, slug: slug.value }, 'Failed to load company')
    company.value = null
  } finally {
    isLoadingCompany.value = false
  }
})

// Group MOS matches by strength tier
const matchesByStrength = computed(() => {
  if (!company.value?.mosMatches) return { STRONG: [], MEDIUM: [], WEAK: [] }
  
  const grouped: Record<'STRONG' | 'MEDIUM' | 'WEAK', CompanyMosMatch[]> = {
    STRONG: [],
    MEDIUM: [],
    WEAK: []
  }
  
  for (const match of company.value.mosMatches) {
    const strength = match.strength as 'STRONG' | 'MEDIUM' | 'WEAK'
    if (grouped[strength]) {
      grouped[strength].push(match)
    }
  }
  
  // Sort each group alphabetically by MOS code
  for (const key of Object.keys(grouped) as ('STRONG' | 'MEDIUM' | 'WEAK')[]) {
    grouped[key].sort((a, b) => a.mosCode.localeCompare(b.mosCode))
  }
  
  return grouped
})

// Active tab state
const activeStrengthTab = ref<'STRONG' | 'MEDIUM' | 'WEAK'>('STRONG')

// Items shown per tier (for "Load More")
const itemsShown = ref<Record<'STRONG' | 'MEDIUM' | 'WEAK', number>>({
  STRONG: 12,
  MEDIUM: 12,
  WEAK: 12
})

// Get visible matches for current tab
const visibleMatches = computed(() => {
  const tier = activeStrengthTab.value
  return matchesByStrength.value[tier].slice(0, itemsShown.value[tier])
})

// Check if there are more to load
const hasMore = computed(() => {
  const tier = activeStrengthTab.value
  return itemsShown.value[tier] < matchesByStrength.value[tier].length
})

// Remaining count
const remainingCount = computed(() => {
  const tier = activeStrengthTab.value
  return matchesByStrength.value[tier].length - itemsShown.value[tier]
})

// Load more items
const loadMore = () => {
  const tier = activeStrengthTab.value
  itemsShown.value[tier] += 12
}

// Reset items shown when tab changes
watch(activeStrengthTab, () => {
  // Keep the current shown count, don't reset
})

// Tab labels with counts
const strengthTabs = computed(() => [
  { 
    value: 'STRONG' as const, 
    label: 'Strong Matches', 
    count: matchesByStrength.value.STRONG.length,
    description: 'Excellent fit based on skills and experience'
  },
  { 
    value: 'MEDIUM' as const, 
    label: 'Good Matches', 
    count: matchesByStrength.value.MEDIUM.length,
    description: 'Solid fit with transferable skills'
  },
  { 
    value: 'WEAK' as const, 
    label: 'Possible Matches', 
    count: matchesByStrength.value.WEAK.length,
    description: 'May require additional training'
  }
])

// Sort all matches for sidebar (STRONG first)
const mosMatchesSorted = computed(() => {
  if (!company.value) return []
  return [...(company.value.mosMatches || [])].sort((a, b) => {
    const order: Record<'WEAK' | 'MEDIUM' | 'STRONG', number> = { WEAK: 0, MEDIUM: 1, STRONG: 2 }
    return order[b.strength] - order[a.strength]
  })
})

// Format branch name for display
const formatBranch = (branch?: string): string => {
  if (!branch) return ''
  return branch
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Get strength badge variant
const getStrengthVariant = (strength: string): 'default' | 'secondary' | 'outline' => {
  switch (strength) {
    case 'STRONG': return 'default'
    case 'MEDIUM': return 'secondary'
    default: return 'outline'
  }
}

useHead(() => {
  if (!company.value) return {}
  return {
    title: `${company.value.name} | military.contractors`,
    meta: [{ name: 'description', content: company.value.summary }]
  }
})

// Schema.org Organization structured data
useOrganizationSchema(company)
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoadingCompany" class="min-h-full">
    <SearchablePageHeader>
      <template #filters>
        <div class="h-7"></div>
      </template>
    </SearchablePageHeader>
    <CompanyDetailSkeleton />
  </div>
  
  <!-- Not Found State -->
  <div v-else-if="!company" class="min-h-full">
    <SearchablePageHeader />
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
      <div class="text-center space-y-4">
        <Icon name="mdi:domain-off" class="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 class="text-xl font-semibold">Company Not Found</h2>
        <p class="text-sm text-muted-foreground">The company "{{ slug }}" could not be found.</p>
        <Button as-child variant="default">
          <NuxtLink to="/companies">Browse Companies</NuxtLink>
        </Button>
      </div>
    </div>
  </div>

  <!-- Company Detail -->
  <div v-else class="min-h-full">
    <!-- Page Header -->
    <SearchablePageHeader>
      <template #filters>
        <!-- Breadcrumb-style context -->
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink to="/companies" class="text-muted-foreground hover:text-primary transition-colors">
            Companies
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium truncate">{{ company.name }}</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Company Info + MOS Matches -->
        <div class="flex-1 min-w-0 max-w-3xl">
          <!-- Company Header -->
          <div class="mb-8 pb-6 border-b border-border/30">
            <h1 class="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {{ company.name }}
            </h1>
            
            <p class="text-base text-muted-foreground leading-relaxed mb-4">
              {{ company.summary }}
            </p>
            
            <!-- Meta row -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="text-muted-foreground">{{ company.theaters.join(' · ') }}</span>
              <Badge 
                v-for="domain in company.domains.slice(0, 4)"
                :key="domain"
                variant="soft"
              >
                {{ domain }}
              </Badge>
              <span v-if="company.domains.length > 4" class="text-[10px] text-muted-foreground">
                +{{ company.domains.length - 4 }} more
              </span>
            </div>
            
            <Button
              v-if="company.websiteUrl"
              as-child
              variant="ghost"
              size="sm"
              class="mt-4"
            >
              <NuxtLink :to="company.websiteUrl" target="_blank" rel="noopener noreferrer">
                Visit Careers Page
                <Icon name="mdi:open-in-new" class="w-3.5 h-3.5 ml-1.5" />
              </NuxtLink>
            </Button>
          </div>

          <!-- Military Specialties We Hire -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-foreground mb-2">
              Military Specialties We Hire
            </h2>
            <p class="text-sm text-muted-foreground mb-4">
              Based on {{ company.name }}'s domains and typical hiring patterns, these MOS codes match well.
            </p>
            
            <!-- Strength Tier Tabs -->
            <div v-if="mosMatchesSorted.length > 0">
              <!-- Tab Navigation -->
              <div class="flex gap-1 mb-4 p-1 bg-muted/30">
                <button
                  v-for="tab in strengthTabs"
                  :key="tab.value"
                  :class="[
                    'flex-1 py-2 px-3 text-xs font-medium transition-all',
                    activeStrengthTab === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  ]"
                  :disabled="tab.count === 0"
                  @click="activeStrengthTab = tab.value"
                >
                  <span class="block">{{ tab.label }}</span>
                  <span :class="[
                    'block text-[10px] mt-0.5',
                    activeStrengthTab === tab.value ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  ]">
                    {{ tab.count }} {{ tab.count === 1 ? 'match' : 'matches' }}
                  </span>
                </button>
              </div>
              
              <!-- Tab Description -->
              <p class="text-[11px] text-muted-foreground mb-4">
                {{ strengthTabs.find(t => t.value === activeStrengthTab)?.description }}
              </p>
              
              <!-- MOS Cards Grid -->
              <div v-if="visibleMatches.length > 0" class="grid gap-3 sm:grid-cols-2">
                <NuxtLink
                  v-for="match in visibleMatches"
                  :key="match.mosCode"
                  :to="`/search?q=${match.mosCode}`"
                  class="block p-4 bg-sidebar hover:bg-muted/50 transition-colors group"
                >
                  <!-- Header: Branch logo + MOS code + title -->
                  <div class="flex items-start gap-3 mb-3">
                    <BranchLogo :branch="match.branch" size="sm" class="shrink-0 mt-0.5" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-mono font-semibold text-primary group-hover:underline">
                          {{ match.mosCode }}
                        </span>
                        <Badge :variant="getStrengthVariant(match.strength)" class="text-[10px]">
                          {{ match.strength }}
                        </Badge>
                      </div>
                      <p class="text-xs text-muted-foreground mt-0.5 truncate">
                        {{ match.mosTitle }}
                      </p>
                      <p v-if="match.branch" class="text-[10px] text-muted-foreground/70">
                        {{ formatBranch(match.branch) }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Typical Roles -->
                  <div v-if="match.typicalRoles && match.typicalRoles.length > 0" class="pl-8">
                    <p class="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                      Typical Roles
                    </p>
                    <p class="text-xs text-foreground/80 line-clamp-2">
                      {{ match.typicalRoles.slice(0, 3).map(r => r.replace(/_/g, ' ')).join(', ') }}
                      <span v-if="match.typicalRoles.length > 3" class="text-muted-foreground">
                        +{{ match.typicalRoles.length - 3 }} more
                      </span>
                    </p>
                  </div>
                  
                  <!-- Clearance hint -->
                  <div v-if="match.typicalClearance" class="pl-8 mt-2">
                    <span class="text-[10px] text-muted-foreground">
                      Typical clearance: {{ match.typicalClearance }}
                    </span>
                  </div>
                </NuxtLink>
              </div>
              
              <!-- Empty state for current tab -->
              <Empty v-else class="py-8">
                <EmptyMedia>
                  <Icon name="mdi:account-search-outline" class="w-10 h-10" />
                </EmptyMedia>
                <EmptyTitle>No {{ activeStrengthTab.toLowerCase() }} matches</EmptyTitle>
                <EmptyDescription>
                  There are no {{ activeStrengthTab === 'STRONG' ? 'strong' : activeStrengthTab === 'MEDIUM' ? 'good' : 'possible' }} 
                  matches for this company. Try another category.
                </EmptyDescription>
              </Empty>
              
              <!-- Load More Button -->
              <div v-if="hasMore" class="mt-6 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="loadMore"
                  class="min-w-[200px]"
                >
                  <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
                  Load {{ Math.min(remainingCount, 12) }} more
                  <span class="text-muted-foreground ml-1">({{ remainingCount }} remaining)</span>
                </Button>
              </div>
              
              <!-- Showing count -->
              <p class="text-[11px] text-muted-foreground mt-4 text-center">
                Showing {{ visibleMatches.length }} of {{ matchesByStrength[activeStrengthTab].length }} 
                {{ activeStrengthTab === 'STRONG' ? 'strong' : activeStrengthTab === 'MEDIUM' ? 'good' : 'possible' }} matches
              </p>
            </div>
            
            <Empty v-else class="py-8">
              <EmptyMedia>
                <Icon name="mdi:account-outline" class="w-10 h-10" />
              </EmptyMedia>
              <EmptyTitle>No MOS matches available</EmptyTitle>
              <EmptyDescription>
                This company hasn't been matched to specific military occupational specialties yet.
              </EmptyDescription>
            </Empty>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <CompanyDetailSidebar 
          :stats="company.stats" 
          :mos-matches="mosMatchesSorted" 
        />
      </div>
    </div>
  </div>
</template>
