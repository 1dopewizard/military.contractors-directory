<!--
  @file Advertiser Dashboard
  @route /advertiser
  @description Manage featured ads and create new campaigns
-->

<script setup lang="ts">
import type { FeaturedAd, FeaturedJob, AdStatus, FeaturedAdInput, FeaturedJobInput, AdPlacementTier } from '@/app/types/ad.types'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Advertiser Dashboard | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const route = useRoute()
const router = useRouter()
const logger = useLogger('AdvertiserDashboard')
const { isAuthReady } = useAuth()
const { fetchMyAds, updateAdStatus, updateJobStatus, createFeaturedAd, createFeaturedJob, checkDuplicateAdvertiser } = useAds()

// Tab management with URL persistence
type TabItem = {
  id: string
  label: string
  icon: string
  badge?: number
}

// ============================================
// DATA STATE
// ============================================
const ads = ref<FeaturedAd[]>([])
const jobs = ref<FeaturedJob[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const statusFilter = ref<AdStatus | 'all'>('all')

const allItems = computed(() => {
  const items: Array<{
    type: 'ad' | 'job'
    data: FeaturedAd | FeaturedJob
    title: string
    subtitle: string
  }> = []

  ads.value.forEach(ad => {
    items.push({ type: 'ad', data: ad, title: ad.headline, subtitle: ad.advertiser })
  })

  jobs.value.forEach(job => {
    items.push({ type: 'job', data: job, title: job.title, subtitle: job.company })
  })

  // Sort by created_at desc (newest first)
  items.sort((a, b) => 
    new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )

  return items
})

const filteredItems = computed(() => {
  if (statusFilter.value !== 'all') {
    return allItems.value.filter(item => item.data.status === statusFilter.value)
  }
  return allItems.value
})

const stats = computed(() => ({
  total: ads.value.length + jobs.value.length,
  active: [...ads.value, ...jobs.value].filter(i => i.status === 'active').length,
  pending: [...ads.value, ...jobs.value].filter(i => i.status === 'pending_review').length,
  draft: [...ads.value, ...jobs.value].filter(i => i.status === 'draft').length,
  totalImpressions: [...ads.value, ...jobs.value].reduce((sum, i) => sum + i.impressions, 0),
  totalClicks: [...ads.value, ...jobs.value].reduce((sum, i) => sum + i.clicks, 0)
}))

const ctr = computed(() => {
  if (stats.value.totalImpressions === 0) return '0.00'
  return ((stats.value.totalClicks / stats.value.totalImpressions) * 100).toFixed(2)
})

const loadAds = async () => {
  isLoading.value = true
  error.value = null

  const result = await fetchMyAds()
  
  if (result.error) {
    error.value = result.error
    logger.error({ error: result.error }, 'Failed to load ads')
  } else {
    ads.value = result.ads
    jobs.value = result.jobs
  }

  isLoading.value = false
}

onMounted(loadAds)

// ============================================
// TAB MANAGEMENT
// ============================================
const tabs = computed<TabItem[]>(() => [
  { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard-outline' },
  { id: 'my-ads', label: 'My Ads', icon: 'mdi:view-list-outline', badge: stats.value.total },
  { id: 'create', label: 'Create Ad', icon: 'mdi:plus-circle-outline' },
])

const validTabIds = computed(() => tabs.value.map(t => t.id))

// URL-synced active tab
const activeTab = computed({
  get: () => {
    const tab = route.query.tab as string
    return validTabIds.value.includes(tab) ? tab : 'overview'
  },
  set: (val: string) => {
    router.replace({ query: { ...route.query, tab: val } })
  }
})

const mobileMenuOpen = ref(false)

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  mobileMenuOpen.value = false
}

// ============================================
// AD ACTIONS
// ============================================
const pauseItem = async (item: { type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }) => {
  const result = item.type === 'ad' 
    ? await updateAdStatus(item.data.id, 'paused')
    : await updateJobStatus(item.data.id, 'paused')
  if (result.success) await loadAds()
}

const resumeItem = async (item: { type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }) => {
  const result = item.type === 'ad' 
    ? await updateAdStatus(item.data.id, 'active')
    : await updateJobStatus(item.data.id, 'active')
  if (result.success) await loadAds()
}

const cancelItem = async (item: { type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }) => {
  const result = item.type === 'ad' 
    ? await updateAdStatus(item.data.id, 'cancelled')
    : await updateJobStatus(item.data.id, 'cancelled')
  if (result.success) await loadAds()
}

// ============================================
// CREATE AD STATE
// ============================================
type AdType = 'company_spotlight' | 'featured_job'
const selectedAdType = ref<AdType>('featured_job')
const selectedTier = ref<AdPlacementTier>('standard')

type CreateMode = 'edit' | 'success'
const createMode = ref<CreateMode>('edit')
const isSubmitting = ref(false)
const duplicateWarning = ref<string | null>(null)

// Form refs
const jobFormRef = ref<{ resetForm: () => void } | null>(null)
const spotlightFormRef = ref<{ resetForm: () => void } | null>(null)

const checkDuplicate = useDebounceFn(async (name: string, type: 'ad' | 'job') => {
  if (name.length < 2) { duplicateWarning.value = null; return }
  const { hasDuplicate, count } = await checkDuplicateAdvertiser(name, type)
  duplicateWarning.value = hasDuplicate ? `${name} already has ${count} active or pending ad${count > 1 ? 's' : ''}` : null
}, 500)

const handleJobCheckDuplicate = (name: string) => checkDuplicate(name, 'job')
const handleSpotlightCheckDuplicate = (name: string) => checkDuplicate(name, 'ad')

const handleJobSubmit = async (input: FeaturedJobInput) => {
  isSubmitting.value = true
  const { data, error: createError } = await createFeaturedJob(input)
  if (createError) {
    logger.error({ error: createError }, 'Failed to create featured job')
  } else if (data) {
    createMode.value = 'success'
  }
  isSubmitting.value = false
}

const handleSpotlightSubmit = async (input: FeaturedAdInput) => {
  isSubmitting.value = true
  const { data, error: createError } = await createFeaturedAd(input)
  if (createError) {
    logger.error({ error: createError }, 'Failed to create spotlight ad')
  } else if (data) {
    createMode.value = 'success'
  }
  isSubmitting.value = false
}

const resetAndStartOver = () => {
  jobFormRef.value?.resetForm()
  spotlightFormRef.value?.resetForm()
  createMode.value = 'edit'
  duplicateWarning.value = null
  selectedAdType.value = 'featured_job'
  selectedTier.value = 'standard'
}

const handleAdCreated = () => {
  loadAds()
  setActiveTab('my-ads')
  resetAndStartOver()
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
const handleKeydown = (e: KeyboardEvent) => {
  const num = parseInt(e.key)
  if (num >= 1 && num <= tabs.value.length && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const target = document.activeElement as HTMLElement
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
      return
    }
    setActiveTab(tabs.value[num - 1].id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <ClientOnly>
    <!-- Auth loading state -->
    <div v-if="!isAuthReady" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <Spinner class="w-8 h-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>

    <div v-else class="min-h-screen">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
          <!-- Breadcrumb -->
          <nav class="text-sm text-muted-foreground mb-8">
            <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
            <span class="mx-2">/</span>
            <span class="text-foreground">Advertiser Dashboard</span>
          </nav>

          <div class="flex items-start justify-between gap-4">
            <div class="max-w-2xl">
              <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Advertiser Dashboard
              </h1>
              <p class="text-lg text-muted-foreground leading-relaxed">
                Manage your featured ads and create new campaigns to reach thousands of cleared veterans.
              </p>
            </div>
            <div class="hidden sm:flex items-center gap-3">
              <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAds">
                <Icon :name="isLoading ? 'mdi:loading' : 'mdi:refresh'" :class="['w-4 h-4 mr-1.5', { 'animate-spin': isLoading }]" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6 pb-16">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Sidebar Navigation -->
          <aside class="lg:w-56 shrink-0 lg:sticky lg:top-24 lg:self-start">
            <!-- Mobile menu button -->
            <Button 
              variant="ghost" 
              class="w-full lg:hidden mb-4"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <Icon name="mdi:menu" class="w-4 h-4 mr-2" />
              {{ tabs.find(t => t.id === activeTab)?.label }}
            </Button>

            <nav :class="['space-y-1', { 'hidden lg:block': !mobileMenuOpen }]">
              <button
                v-for="(tab, index) in tabs"
                :key="tab.id"
                class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
                :class="activeTab === tab.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                @click="setActiveTab(tab.id)"
              >
                <div class="flex items-center gap-2">
                  <Icon :name="tab.icon" class="w-4 h-4" />
                  {{ tab.label }}
                </div>
                <div class="flex items-center gap-1.5">
                  <span 
                    v-if="tab.badge && tab.badge > 0" 
                    class="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
                  >
                    {{ tab.badge }}
                  </span>
                  <kbd class="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground">
                    {{ index + 1 }}
                  </kbd>
                </div>
              </button>
            </nav>

            <!-- Keyboard Shortcuts Help -->
            <div class="hidden lg:block mt-6 pt-4 border-t border-border">
              <Popover>
                <PopoverTrigger as-child>
                  <button class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <Icon name="mdi:keyboard" class="w-4 h-4" />
                    Keyboard Shortcuts
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" class="w-48 p-3">
                  <div class="space-y-2 text-xs">
                    <div v-for="(tab, index) in tabs" :key="tab.id" class="flex items-center justify-between">
                      <span class="text-muted-foreground">{{ tab.label }}</span>
                      <kbd class="px-1.5 py-0.5 font-mono bg-muted text-foreground">{{ index + 1 }}</kbd>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <!-- Quick Links -->
            <div class="hidden lg:block mt-4 pt-4 border-t border-border space-y-1">
              <NuxtLink 
                to="/advertise" 
                class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="mdi:information-outline" class="w-4 h-4" />
                Advertising Info
              </NuxtLink>
              <NuxtLink 
                to="/jobs" 
                class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="mdi:briefcase-search-outline" class="w-4 h-4" />
                View Job Board
              </NuxtLink>
              <NuxtLink 
                to="/companies" 
                class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="mdi:domain" class="w-4 h-4" />
                Company Directory
              </NuxtLink>
            </div>
          </aside>

          <!-- Main Content Area -->
          <main class="flex-1 min-w-0">
            <!-- Overview Tab -->
            <AdvertiserOverview
              v-if="activeTab === 'overview'"
              :stats="stats"
              :ctr="ctr"
              :recent-ads="allItems"
              :is-loading="isLoading"
              @set-tab="setActiveTab"
            />

            <!-- My Ads Tab -->
            <div v-else-if="activeTab === 'my-ads'">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-foreground">My Ads</h2>
                <Button size="sm" @click="setActiveTab('create')">
                  <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
                  Create Ad
                </Button>
              </div>

              <AdvertiserAdList
                :items="filteredItems"
                :is-loading="isLoading"
                :error="error"
                :status-filter="statusFilter"
                @update:status-filter="statusFilter = $event"
                @pause="pauseItem"
                @resume="resumeItem"
                @cancel="cancelItem"
                @retry="loadAds"
                @create="setActiveTab('create')"
              />
            </div>

            <!-- Create Ad Tab -->
            <div v-else-if="activeTab === 'create'">
              <!-- Success State -->
              <AdvertiserCreateSuccess
                v-if="createMode === 'success'"
                :ad-type="selectedAdType"
                :tier="selectedTier"
                @create-another="resetAndStartOver"
                @view-ads="handleAdCreated"
              />

              <!-- Edit Mode -->
              <div v-else class="max-w-4xl">
                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-foreground">Create New Ad</h2>
                  <p class="text-sm text-muted-foreground mt-1">
                    Choose your ad type and fill in the details to get started.
                  </p>
                </div>

                <!-- Ad Type & Tier Selection -->
                <AdvertiserAdTypeSelector
                  :selected-ad-type="selectedAdType"
                  :selected-tier="selectedTier"
                  @update:selected-ad-type="selectedAdType = $event"
                  @update:selected-tier="selectedTier = $event"
                />

                <Separator class="my-8" />

                <!-- Step 3 Header -->
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary text-primary-foreground">
                    3
                  </div>
                  <h2 class="text-sm font-medium text-foreground uppercase tracking-wider">
                    {{ selectedAdType === 'featured_job' ? 'Job Details' : 'Spotlight Details' }}
                  </h2>
                </div>

                <!-- Featured Job Form -->
                <AdvertiserFeaturedJobForm
                  v-if="selectedAdType === 'featured_job'"
                  ref="jobFormRef"
                  :is-submitting="isSubmitting"
                  :duplicate-warning="duplicateWarning"
                  :selected-tier="selectedTier"
                  @submit="handleJobSubmit"
                  @check-duplicate="handleJobCheckDuplicate"
                />

                <!-- Partner Spotlight Form -->
                <AdvertiserCompanySpotlightForm
                  v-else
                  ref="spotlightFormRef"
                  :is-submitting="isSubmitting"
                  :duplicate-warning="duplicateWarning"
                  :selected-tier="selectedTier"
                  @submit="handleSpotlightSubmit"
                  @check-duplicate="handleSpotlightCheckDuplicate"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>

    <!-- SSR Fallback -->
    <template #fallback>
      <div class="min-h-screen">
        <section class="relative overflow-hidden">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
            <Skeleton class="h-4 w-40 mb-8" />
            <Skeleton class="h-10 w-64 mb-4" />
            <Skeleton class="h-6 w-96" />
          </div>
        </section>
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6 pb-16">
          <div class="flex flex-col lg:flex-row gap-8">
            <aside class="lg:w-56 shrink-0">
              <div class="space-y-2">
                <Skeleton v-for="i in 3" :key="i" class="h-10 w-full" />
              </div>
            </aside>
            <main class="flex-1">
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                <Skeleton v-for="i in 6" :key="i" class="h-16" />
              </div>
              <Skeleton class="h-64 w-full" />
            </main>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
