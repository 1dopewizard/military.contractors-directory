<!--
  @file Admin Dashboard Page
  @description Admin dashboard for featured listings review and system oversight
-->
<script setup lang="ts">
import type { FeaturedAd, FeaturedJob, AdStatus } from '@/app/types/ad.types'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth', 'admin']
})

useHead({
  title: 'Admin Dashboard | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const logger = useLogger('AdminDashboard')
const route = useRoute()
const router = useRouter()
const { isAuthReady } = useAuth()
const { displayName } = useUserProfile()
const { fetchPendingAds, fetchAllAds, approveAd, rejectAd } = useAds()

// Tab management with URL persistence
type TabItem = {
  id: string
  label: string
  icon: string
  badge?: number
}

const tabs = computed<TabItem[]>(() => [
  { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard-outline' },
  { id: 'candidates', label: 'Candidates', icon: 'mdi:account-search-outline' },
  { id: 'hr-contacts', label: 'HR Contacts', icon: 'mdi:account-tie-outline' },
  { id: 'recruiters', label: 'Recruiters', icon: 'mdi:account-group-outline' },
  { id: 'featured-listings', label: 'Featured Listings', icon: 'mdi:star-outline', badge: pendingCount.value },
  { id: 'pipeline', label: 'Pipeline', icon: 'mdi:pipe' },
  { id: 'users', label: 'Users', icon: 'mdi:account-group-outline' },
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
const showSearch = ref(false)

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  mobileMenuOpen.value = false
}

// Data
const pendingAds = ref<FeaturedAd[]>([])
const pendingJobs = ref<FeaturedJob[]>([])
const allAds = ref<FeaturedAd[]>([])
const allJobs = ref<FeaturedJob[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const lastRefreshed = ref<Date | null>(null)

// Format time ago for last refreshed
const lastRefreshedText = computed(() => {
  if (!lastRefreshed.value) return null
  const now = new Date()
  const diff = now.getTime() - lastRefreshed.value.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return lastRefreshed.value.toLocaleDateString()
})

// Combined pending items
const pendingItems = computed(() => {
  const items: Array<{ type: 'ad' | 'job'; data: FeaturedAd | FeaturedJob }> = []
  pendingAds.value.forEach(ad => items.push({ type: 'ad', data: ad }))
  pendingJobs.value.forEach(job => items.push({ type: 'job', data: job }))
  // Sort by created_at asc (oldest first for review queue)
  items.sort((a, b) => 
    new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime()
  )
  return items
})

const pendingCount = computed(() => pendingAds.value.length + pendingJobs.value.length)

// Stats
const stats = computed(() => ({
  totalAds: allAds.value.length + allJobs.value.length,
  active: [...allAds.value, ...allJobs.value].filter(i => i.status === 'active').length,
  pendingReview: pendingCount.value,
  totalImpressions: [...allAds.value, ...allJobs.value].reduce((sum, i) => sum + i.impressions, 0),
  totalClicks: [...allAds.value, ...allJobs.value].reduce((sum, i) => sum + i.clicks, 0)
}))

// Load data
const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    const [pendingResult, allResult] = await Promise.all([
      fetchPendingAds(),
      fetchAllAds()
    ])

    if (pendingResult.error) {
      error.value = pendingResult.error
    } else {
      pendingAds.value = pendingResult.ads
      pendingJobs.value = pendingResult.jobs
    }

    if (allResult.error && !error.value) {
      error.value = allResult.error
    } else {
      allAds.value = allResult.ads
      allJobs.value = allResult.jobs
    }
  } catch (err) {
    error.value = 'Failed to load data'
    logger.error({ error: err }, 'Failed to load admin data')
  }

  isLoading.value = false
  lastRefreshed.value = new Date()
}

onMounted(loadData)

// Actions
const handleApprove = async (id: string, type: 'ad' | 'job') => {
  const result = await approveAd(id, type)
  if (result.success) {
    toast.success('Listing approved successfully')
    await loadData()
  } else {
    toast.error(result.error || 'Failed to approve listing')
  }
}

const handleReject = async (id: string, type: 'ad' | 'job', reason: string) => {
  const result = await rejectAd(id, type, reason)
  if (result.success) {
    toast.success('Listing rejected')
    await loadData()
  } else {
    toast.error(result.error || 'Failed to reject listing')
  }
}

// Keyboard shortcuts
const { shortcuts } = useAdminShortcuts({
  tabs: tabs.value,
  activeTab,
  setActiveTab,
  onRefresh: loadData,
  onSearch: () => { showSearch.value = true }
})
</script>

<template>
  <!-- Auth loading state (client-only) -->
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
          <span class="text-foreground">Admin Dashboard</span>
        </nav>

        <div class="flex items-start justify-between gap-4">
          <div class="max-w-2xl">
            <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Admin Dashboard
            </h1>
            <p class="text-lg text-muted-foreground leading-relaxed">
              Welcome back, {{ displayName }}. Manage featured listings, users, and system oversight.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="lastRefreshedText" class="text-xs text-muted-foreground hidden sm:inline">
              Updated {{ lastRefreshedText }}
            </span>
            <Button variant="outline" size="sm" :disabled="isLoading" @click="loadData">
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
              class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md transition-colors"
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
                  class="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  {{ tab.badge }}
                </span>
                <kbd class="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded">
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
                  <div v-for="shortcut in shortcuts" :key="shortcut.key" class="flex items-center justify-between">
                    <span class="text-muted-foreground">{{ shortcut.description }}</span>
                    <kbd class="px-1.5 py-0.5 font-mono bg-muted rounded text-foreground">{{ shortcut.key }}</kbd>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-w-0">
          <!-- Loading -->
          <div v-if="isLoading" class="flex justify-center py-12">
            <Spinner class="w-8 h-8 text-muted-foreground" />
          </div>

          <!-- Error -->
          <Card v-else-if="error" class="p-6 text-center border-destructive/30">
            <Icon name="mdi:alert-circle-outline" class="w-8 h-8 text-destructive mx-auto mb-2" />
            <p class="text-sm text-destructive">{{ error }}</p>
            <Button variant="ghost" size="sm" class="mt-4" @click="loadData">
              Try Again
            </Button>
          </Card>

          <template v-else>
            <!-- Overview Tab -->
            <AdminOverview
              v-if="activeTab === 'overview'"
              :stats="stats"
              :pending-items="pendingItems"
              @set-tab="setActiveTab"
              @approve="handleApprove"
              @reject="handleReject"
            />

            <!-- Candidates Tab -->
            <AdminCandidates v-else-if="activeTab === 'candidates'" />

            <!-- HR Contacts Tab -->
            <AdminHRContacts v-else-if="activeTab === 'hr-contacts'" />

            <!-- Recruiters Tab -->
            <AdminRecruitersList v-else-if="activeTab === 'recruiters'" />

            <!-- Featured Listings Tab -->
            <AdminFeaturedListings v-else-if="activeTab === 'featured-listings'" />

            <!-- Pipeline Tab -->
            <AdminPipeline v-else-if="activeTab === 'pipeline'" />

            <!-- Users Tab -->
            <UserManagementTable v-else-if="activeTab === 'users'" />
          </template>
        </main>
      </div>
    </div>

    <!-- Search Command Palette -->
    <AdminSearch
      v-model:open="showSearch"
      :tabs="tabs"
      @select-tab="setActiveTab"
    />
  </div>
</template>
