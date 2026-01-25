<!--
  @file Interviews browse page
  @route /interviews
  @description Browse interview experiences with filters. Anonymous users see limited previews,
               authenticated users see full interview experience cards.
-->

<script setup lang="ts">
import type {
  EnrichedInterviewExperience,
  InterviewDifficulty,
  InterviewOutcome,
  InterviewSort,
  CommunityStats,
} from '@/app/types/community.types'

const logger = useLogger('InterviewsPage')
const route = useRoute()
const router = useRouter()
const { fetchInterviews, voteHelpful, removeVote, hasVoted } = useInterviewExperiences()
const { fetchStats } = useCommunityStats()
const { getAllCompanies, allCompanies } = useCompanies()
const { isAuthenticated } = useAuth()

// SEO
useHead({
  title: 'Interview Experiences | Real Interview Reports | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse real interview experiences from veterans at defense contractors. Filter by company, outcome, difficulty, and MOS. Learn what to expect and prepare for your interviews.',
    },
  ],
})

// State
const experiences = ref<EnrichedInterviewExperience[]>([])
const stats = ref<CommunityStats | null>(null)
const isLoading = ref(true)
const totalExperiences = ref(0)

// Filter state
const searchQuery = ref('')
const selectedCompanyId = ref('')
const selectedOutcome = ref('')
const selectedDifficulty = ref('')
const selectedMosCode = ref('')
const selectedSort = ref<InterviewSort>('recent')

// Track company slug for URL syncing (company param in URL is slug, not ID)
const selectedCompanySlug = ref('')

// ===========================================
// URL Parameter Syncing
// ===========================================

/**
 * Initialize filter state from URL query parameters
 * Called on mount to support deep linking
 */
const initFromUrlParams = async () => {
  const { mos, company, outcome, difficulty, sort } = route.query
  
  // MOS code param
  if (mos && typeof mos === 'string') {
    selectedMosCode.value = mos.toUpperCase()
    logger.debug({ mos: selectedMosCode.value }, 'Initialized MOS from URL')
  }
  
  // Outcome param
  if (outcome && typeof outcome === 'string') {
    const validOutcomes = ['OFFER', 'REJECTED', 'GHOSTED', 'WITHDREW']
    if (validOutcomes.includes(outcome.toUpperCase())) {
      selectedOutcome.value = outcome.toUpperCase() as InterviewOutcome
      logger.debug({ outcome: selectedOutcome.value }, 'Initialized outcome from URL')
    }
  }
  
  // Difficulty param
  if (difficulty && typeof difficulty === 'string') {
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD']
    if (validDifficulties.includes(difficulty.toUpperCase())) {
      selectedDifficulty.value = difficulty.toUpperCase() as InterviewDifficulty
      logger.debug({ difficulty: selectedDifficulty.value }, 'Initialized difficulty from URL')
    }
  }
  
  // Sort param
  if (sort && typeof sort === 'string') {
    const validSorts = ['recent', 'helpful']
    if (validSorts.includes(sort)) {
      selectedSort.value = sort as InterviewSort
      logger.debug({ sort: selectedSort.value }, 'Initialized sort from URL')
    }
  }
  
  // Company param (slug) - requires lookup to get ID
  if (company && typeof company === 'string') {
    selectedCompanySlug.value = company.toLowerCase()
    logger.debug({ companySlug: company }, 'Company slug from URL, will resolve after companies load')
  }
}

/**
 * Resolve company slug to ID after companies are loaded
 */
const resolveCompanyFromSlug = () => {
  if (!selectedCompanySlug.value || allCompanies.value.length === 0) return
  
  const matchedCompany = allCompanies.value.find(
    c => c.slug?.toLowerCase() === selectedCompanySlug.value.toLowerCase()
  )
  
  if (matchedCompany) {
    selectedCompanyId.value = matchedCompany.id
    logger.debug({ 
      slug: selectedCompanySlug.value, 
      id: matchedCompany.id,
      name: matchedCompany.name 
    }, 'Resolved company slug to ID')
  } else {
    logger.warn({ slug: selectedCompanySlug.value }, 'Company slug not found in loaded companies')
  }
}

/**
 * Sync current filter state to URL query parameters
 * Uses router.replace to avoid adding to history stack on every filter change
 */
const syncToUrl = () => {
  const query: Record<string, string> = {}
  
  if (selectedMosCode.value) {
    query.mos = selectedMosCode.value
  }
  
  if (selectedCompanyId.value) {
    // Store slug in URL, not ID
    const company = allCompanies.value.find(c => c.id === selectedCompanyId.value)
    if (company?.slug) {
      query.company = company.slug
    }
  }
  
  if (selectedOutcome.value) {
    query.outcome = selectedOutcome.value
  }
  
  if (selectedDifficulty.value) {
    query.difficulty = selectedDifficulty.value
  }
  
  if (selectedSort.value && selectedSort.value !== 'recent') {
    query.sort = selectedSort.value
  }
  
  // Replace URL without navigating (preserves scroll position, doesn't add to history)
  router.replace({ query })
}

// Pagination
const currentPage = ref(1)
const pageSize = 20

// Vote tracking
const votedExperienceIds = ref<Set<string>>(new Set())
const votingExperienceIds = ref<Set<string>>(new Set())

// Expanded cards tracking
const expandedExperienceIds = ref<Set<string>>(new Set())

// Outcome options
const outcomeOptions: { value: InterviewOutcome | ''; label: string }[] = [
  { value: '', label: 'Any Outcome' },
  { value: 'OFFER', label: 'Got Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'GHOSTED', label: 'Ghosted' },
  { value: 'WITHDREW', label: 'Withdrew' },
]

// Difficulty options
const difficultyOptions: { value: InterviewDifficulty | ''; label: string }[] = [
  { value: '', label: 'Any Difficulty' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

// Sort options
const sortOptions: { value: InterviewSort; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'helpful', label: 'Most Helpful' },
]

// Load interview experiences (for authenticated users)
const loadExperiences = async () => {
  isLoading.value = true
  try {
    const result = await fetchInterviews({
      companyId: selectedCompanyId.value || undefined,
      mosCode: selectedMosCode.value || undefined,
      outcome: (selectedOutcome.value as InterviewOutcome) || undefined,
      difficulty: (selectedDifficulty.value as InterviewDifficulty) || undefined,
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
      sort: selectedSort.value,
    })
    experiences.value = result.experiences
    totalExperiences.value = result.total

    // Check vote status for each experience
    if (isAuthenticated.value) {
      await checkVoteStatuses(result.experiences)
    }
  } catch (error) {
    logger.error({ error }, 'Failed to load interview experiences')
    experiences.value = []
    totalExperiences.value = 0
  } finally {
    isLoading.value = false
  }
}

// Check vote statuses for experiences
const checkVoteStatuses = async (interviewExperiences: EnrichedInterviewExperience[]) => {
  const newVotedIds = new Set<string>()
  await Promise.all(
    interviewExperiences
      .filter((exp) => exp._id) // Only check experiences with valid IDs
      .map(async (exp) => {
        const voted = await hasVoted(exp._id)
        if (voted) newVotedIds.add(exp._id)
      })
  )
  votedExperienceIds.value = newVotedIds
}

// Handle vote
const handleVote = async (experienceId: string) => {
  if (!isAuthenticated.value || votingExperienceIds.value.has(experienceId)) return

  votingExperienceIds.value.add(experienceId)
  try {
    const result = await voteHelpful(experienceId)
    if (result.success) {
      votedExperienceIds.value.add(experienceId)
      // Optimistically update the count
      const exp = experiences.value.find((e) => e._id === experienceId)
      if (exp) exp.helpfulCount++
    }
  } finally {
    votingExperienceIds.value.delete(experienceId)
  }
}

// Handle remove vote
const handleRemoveVote = async (experienceId: string) => {
  if (!isAuthenticated.value || votingExperienceIds.value.has(experienceId)) return

  votingExperienceIds.value.add(experienceId)
  try {
    const result = await removeVote(experienceId)
    if (result.success) {
      votedExperienceIds.value.delete(experienceId)
      // Optimistically update the count
      const exp = experiences.value.find((e) => e._id === experienceId)
      if (exp && exp.helpfulCount > 0) exp.helpfulCount--
    }
  } finally {
    votingExperienceIds.value.delete(experienceId)
  }
}

// Handle expand toggle
const handleExpand = (experienceId: string) => {
  if (expandedExperienceIds.value.has(experienceId)) {
    expandedExperienceIds.value.delete(experienceId)
  } else {
    expandedExperienceIds.value.add(experienceId)
  }
}

// Apply filter
const applyFilter = (filter: string, value: string) => {
  if (filter === 'company') {
    selectedCompanyId.value = value === 'ANY' ? '' : value
  } else if (filter === 'outcome') {
    selectedOutcome.value = value === 'ANY' ? '' : value
  } else if (filter === 'difficulty') {
    selectedDifficulty.value = value === 'ANY' ? '' : value
  } else if (filter === 'sort') {
    selectedSort.value = value as InterviewSort
  }
  currentPage.value = 1
  syncToUrl()
  loadExperiences()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedCompanyId.value = ''
  selectedCompanySlug.value = ''
  selectedOutcome.value = ''
  selectedDifficulty.value = ''
  selectedMosCode.value = ''
  selectedSort.value = 'recent'
  currentPage.value = 1
  // Clear URL params
  router.replace({ query: {} })
  loadExperiences()
}

// Computed
const hasResults = computed(() => experiences.value.length > 0)
const hasActiveFilters = computed(
  () =>
    !!selectedCompanyId.value ||
    !!selectedOutcome.value ||
    !!selectedDifficulty.value ||
    !!selectedMosCode.value ||
    selectedSort.value !== 'recent'
)

const totalPages = computed(() => Math.ceil(totalExperiences.value / pageSize))

const selectedCompanyName = computed(() => {
  if (!selectedCompanyId.value) return null
  const company = allCompanies.value.find((c) => c.id === selectedCompanyId.value)
  return company?.name || null
})

// Active filter chips for display
const activeFilterChips = computed(() => {
  const chips: { key: string; label: string; value: string }[] = []
  
  if (selectedMosCode.value) {
    chips.push({ key: 'mos', label: 'MOS', value: selectedMosCode.value })
  }
  
  if (selectedCompanyName.value) {
    chips.push({ key: 'company', label: 'Company', value: selectedCompanyName.value })
  }
  
  if (selectedOutcome.value) {
    const outcomeOption = outcomeOptions.find(o => o.value === selectedOutcome.value)
    chips.push({ 
      key: 'outcome', 
      label: 'Outcome', 
      value: outcomeOption?.label || selectedOutcome.value 
    })
  }
  
  if (selectedDifficulty.value) {
    const difficultyOption = difficultyOptions.find(o => o.value === selectedDifficulty.value)
    chips.push({ 
      key: 'difficulty', 
      label: 'Difficulty', 
      value: difficultyOption?.label || selectedDifficulty.value 
    })
  }
  
  return chips
})

// Remove a specific filter
const removeFilter = (key: string) => {
  if (key === 'mos') {
    selectedMosCode.value = ''
  } else if (key === 'company') {
    selectedCompanyId.value = ''
    selectedCompanySlug.value = ''
  } else if (key === 'outcome') {
    selectedOutcome.value = ''
  } else if (key === 'difficulty') {
    selectedDifficulty.value = ''
  }
  currentPage.value = 1
  syncToUrl()
  loadExperiences()
}

// Pagination handlers
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadExperiences()
  }
}

// Load on mount
onMounted(async () => {
  // Initialize filters from URL params first
  await initFromUrlParams()
  
  // Load companies for filter dropdown
  if (allCompanies.value.length === 0) {
    await getAllCompanies()
  }
  
  // Resolve company slug to ID after companies are loaded
  resolveCompanyFromSlug()

  // Load community stats
  stats.value = await fetchStats()

  // Load data with initialized filters
  await loadExperiences()
})

// Watch for route query changes (browser back/forward navigation)
watch(() => route.query, async (newQuery, oldQuery) => {
  // Skip if queries are the same (prevents double-fire from syncToUrl)
  if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) return
  
  // Re-initialize from new URL params
  await initFromUrlParams()
  resolveCompanyFromSlug()
  currentPage.value = 1
  await loadExperiences()
}, { deep: true })
</script>

<template>
  <div class="min-h-full">
    <!-- Search Header with Filters -->
    <div class="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <SearchablePageHeader>
        <template #filters>
          <div class="space-y-3">
            <!-- Row 1: Status & Active Filters -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Result count -->
              <span v-if="totalExperiences > 0" class="text-sm text-muted-foreground">
                {{ totalExperiences }} {{ totalExperiences === 1 ? 'experience' : 'experiences' }}
              </span>
              <span v-else class="text-sm text-muted-foreground">No experiences</span>
              
              <!-- Active filter chips (from URL params) -->
              <template v-if="activeFilterChips.length > 0">
                <span class="text-sm text-muted-foreground">matching:</span>
                <Badge
                  v-for="chip in activeFilterChips"
                  :key="chip.key"
                  variant="secondary"
                  class="h-6 gap-1 pl-2 pr-1 text-xs font-medium"
                >
                  {{ chip.value }}
                  <button
                    type="button"
                    class="ml-0.5 h-4 w-4 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    :aria-label="`Remove ${chip.label} filter`"
                    @click.stop="removeFilter(chip.key)"
                  >
                    <Icon name="mdi:close" class="w-3 h-3" />
                  </button>
                </Badge>
                
                <!-- Clear all -->
                <span class="text-muted-foreground/50">·</span>
                <Button
                  variant="link"
                  size="sm"
                  class="h-auto p-0 text-xs text-muted-foreground"
                  @click="resetFilters"
                >
                  Clear all
                </Button>
              </template>
            </div>
            
            <!-- Row 2: Filter Controls -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Company filter -->
              <Select
                :model-value="selectedCompanyId || 'ANY'"
                @update:model-value="(v) => applyFilter('company', String(v))"
              >
                <SelectTrigger class="w-auto max-w-[160px] h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent class="max-h-[300px]">
                  <SelectItem value="ANY">Any Company</SelectItem>
                  <SelectItem v-for="company in allCompanies" :key="company.id" :value="company.id">
                    {{ company.name }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Outcome filter -->
              <Select
                :model-value="selectedOutcome || 'ANY'"
                @update:model-value="(v) => applyFilter('outcome', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in outcomeOptions"
                    :key="option.value || 'any'"
                    :value="option.value || 'ANY'"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Difficulty filter -->
              <Select
                :model-value="selectedDifficulty || 'ANY'"
                @update:model-value="(v) => applyFilter('difficulty', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in difficultyOptions"
                    :key="option.value || 'any'"
                    :value="option.value || 'ANY'"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Sort -->
              <Select
                :model-value="selectedSort"
                @update:model-value="(v) => applyFilter('sort', String(v))"
              >
                <SelectTrigger class="w-auto h-8 px-3 bg-background/50 border-border/50 text-xs gap-1">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </template>
      </SearchablePageHeader>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Main Content -->
        <div class="flex-1 min-w-0 space-y-6">
          <!-- Page Intro -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-foreground mb-2">Interview Experiences</h1>
            <p class="text-muted-foreground">
              Real interview reports from veterans and cleared professionals. Learn what to expect,
              prepare better, and share your own experiences.
            </p>
          </div>

          <!-- Access Control: Show different content based on auth status -->
          <template v-if="!isAuthenticated">
            <!-- Anonymous User: Show CTA to sign up for full access -->
            <Card class="border-primary/30 bg-primary/5">
              <CardContent class="p-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <Icon name="mdi:lock-outline" class="w-5 h-5 text-primary" />
                      <h3 class="font-semibold text-foreground">
                        Sign in to view full interview experiences
                      </h3>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      Create a free account to access {{ totalExperiences }} detailed interview
                      reports, including process descriptions, questions asked, and tips from
                      candidates.
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    <Button as-child>
                      <NuxtLink to="/auth/login">
                        <Icon name="mdi:login" class="w-4 h-4 mr-1.5" />
                        Sign In
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" as-child>
                      <NuxtLink to="/interviews/submit">
                        <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
                        Contribute
                      </NuxtLink>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Show blurred preview of experiences -->
            <div class="relative">
              <div
                class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/80 to-background flex items-end justify-center pb-8"
              >
                <p class="text-sm text-muted-foreground text-center">
                  <Icon name="mdi:eye-off" class="w-4 h-4 inline mr-1" />
                  Sign in to view full interview details
                </p>
              </div>
              <div class="grid gap-4 blur-sm pointer-events-none" aria-hidden="true">
                <!-- Placeholder cards -->
                <div
                  v-for="i in 3"
                  :key="i"
                  class="bg-card border border-border p-5 opacity-50"
                >
                  <div class="flex justify-between mb-3">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <div class="bg-muted h-5 w-24" />
                        <div class="bg-muted h-4 w-16" />
                      </div>
                      <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <div class="bg-muted h-3 w-32" />
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="bg-emerald-500/10 h-6 w-20" />
                    </div>
                  </div>
                  <div class="flex gap-2 mb-4">
                    <div class="bg-muted h-5 w-24" />
                    <div class="bg-muted h-5 w-28" />
                  </div>
                  <div class="bg-muted h-10 w-full" />
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Authenticated User: Show full interview experience cards -->

            <!-- Loading State -->
            <div v-if="isLoading" class="grid gap-4">
              <Card v-for="i in 5" :key="i" class="overflow-hidden animate-pulse">
                <CardContent class="p-5">
                  <div class="flex justify-between mb-3">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <div class="bg-muted h-5 w-24" />
                        <div class="bg-muted h-4 w-16" />
                      </div>
                      <div class="flex items-center gap-1.5 text-sm">
                        <div class="bg-muted h-3 w-32" />
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="bg-muted h-6 w-20" />
                    </div>
                  </div>
                  <div class="flex gap-2 mb-4">
                    <div class="bg-muted h-5 w-24" />
                    <div class="bg-muted h-5 w-28" />
                  </div>
                  <div class="bg-muted h-12 w-full mb-3" />
                  <div class="flex justify-between pt-3 border-t border-border/30">
                    <div class="bg-muted h-4 w-20" />
                    <div class="bg-muted h-3 w-16" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Empty State -->
            <Empty v-else-if="!hasResults">
              <EmptyMedia variant="icon">
                <Icon name="mdi:message-text-outline" class="size-5" />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>No interview experiences found</EmptyTitle>
                <EmptyDescription>
                  {{
                    hasActiveFilters
                      ? 'Try adjusting your filters or search terms'
                      : 'Be the first to share interview intel for the community'
                  }}
                </EmptyDescription>
              </EmptyContent>
              <div class="flex gap-2">
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
                  Clear Filters
                </Button>
                <Button as-child size="sm">
                  <NuxtLink to="/interviews/submit">
                    <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
                    Share Experience
                  </NuxtLink>
                </Button>
              </div>
            </Empty>

            <!-- Results List -->
            <div v-else class="space-y-2">
              <InterviewExperienceCard
                v-for="exp in experiences"
                :key="exp._id"
                :experience="exp"
                :has-voted="votedExperienceIds.has(exp._id)"
                :is-voting="votingExperienceIds.has(exp._id)"
                :expanded="expandedExperienceIds.has(exp._id)"
                @vote="handleVote"
                @remove-vote="handleRemoveVote"
                @expand="handleExpand"
              />
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                <Icon name="mdi:chevron-left" class="w-4 h-4" />
                Previous
              </Button>

              <div class="flex items-center gap-1">
                <Button
                  v-for="page in Math.min(totalPages, 5)"
                  :key="page"
                  :variant="currentPage === page ? 'default' : 'ghost'"
                  size="sm"
                  class="w-8 h-8 p-0"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </Button>
                <span v-if="totalPages > 5" class="text-sm text-muted-foreground px-2">...</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Next
                <Icon name="mdi:chevron-right" class="w-4 h-4" />
              </Button>
            </div>
          </template>
        </div>

        <!-- Right Column: Sidebar -->
        <div class="lg:w-80 shrink-0">
          <div class="lg:sticky lg:top-[148px] space-y-6">
            <!-- Community Stats -->
            <CommunityStatsBar
              v-if="stats && (stats.totalSalaryReports > 0 || stats.totalInterviewExperiences > 0)"
              :stats="stats"
              :loading="false"
              size="sm"
              class="flex-col items-stretch"
            />

            <!-- Contribute CTA -->
            <ContributeCta variant="card" :compact="true" />

            <!-- Featured Job (contextual) -->
            <FeaturedJobCard :context="{ mosCode: selectedMosCode || undefined }" />

            <!-- Quick Filters -->
            <Card>
              <CardHeader class="pb-3">
                <CardTitle class="text-sm font-semibold flex items-center gap-2">
                  <Icon name="mdi:lightning-bolt" class="w-4 h-4 text-primary" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="space-y-3">
                  <!-- Outcome Quick Filters -->
                  <div>
                    <p class="text-xs text-muted-foreground mb-2">By Outcome</p>
                    <div class="flex flex-wrap gap-2">
                      <Button
                        v-for="outcome in ['OFFER', 'REJECTED', 'GHOSTED']"
                        :key="outcome"
                        variant="outline"
                        size="sm"
                        class="text-xs h-7"
                        :class="{ 'bg-primary/10 border-primary': selectedOutcome === outcome }"
                        @click="
                          applyFilter('outcome', selectedOutcome === outcome ? 'ANY' : outcome)
                        "
                      >
                        {{
                          outcome === 'OFFER'
                            ? 'Got Offer'
                            : outcome === 'REJECTED'
                              ? 'Rejected'
                              : 'Ghosted'
                        }}
                      </Button>
                    </div>
                  </div>

                  <!-- Difficulty Quick Filters -->
                  <div>
                    <p class="text-xs text-muted-foreground mb-2">By Difficulty</p>
                    <div class="flex flex-wrap gap-2">
                      <Button
                        v-for="difficulty in ['EASY', 'MEDIUM', 'HARD']"
                        :key="difficulty"
                        variant="outline"
                        size="sm"
                        class="text-xs h-7"
                        :class="{
                          'bg-primary/10 border-primary': selectedDifficulty === difficulty,
                        }"
                        @click="
                          applyFilter(
                            'difficulty',
                            selectedDifficulty === difficulty ? 'ANY' : difficulty
                          )
                        "
                      >
                        {{ difficulty.charAt(0) + difficulty.slice(1).toLowerCase() }}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- About Interviews Section -->
            <Card class="bg-muted/30">
              <CardContent class="p-4 text-sm text-muted-foreground space-y-2">
                <h4 class="font-semibold text-foreground flex items-center gap-2">
                  <Icon name="mdi:information-outline" class="w-4 h-4" />
                  About Interview Data
                </h4>
                <p>
                  All interview experiences are submitted anonymously by veterans and cleared
                  professionals in the defense contracting industry.
                </p>
                <p>
                  Reports include interview process details, questions asked, and tips to help you
                  prepare.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
