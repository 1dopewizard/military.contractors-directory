<!--
  @file Admin Dashboard Page
  @description Admin dashboard for claimed profiles, content review, and system oversight
-->
<script setup lang="ts">
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

// Tab management with URL persistence
type TabItem = {
  id: string
  label: string
  icon: string
}

const tabs = computed<TabItem[]>(() => [
  { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard-outline' },
  { id: 'claims', label: 'Claims', icon: 'mdi:shield-check-outline' },
  { id: 'content', label: 'Content Review', icon: 'mdi:text-box-check-outline' },
  { id: 'contractors', label: 'Contractors', icon: 'mdi:office-building-outline' },
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

// System health data
interface SystemHealth {
  database: {
    status: 'connected' | 'error'
    latencyMs: number | null
  }
  contractors: {
    total: number
    withLogos: number
  }
  claims: {
    pending: number
    approved: number
  }
  content: {
    pendingReview: number
  }
}

const { data: systemHealth, pending: healthLoading, refresh: refreshHealth } = await useFetch<SystemHealth>('/api/admin/system-health')

// Keyboard navigation
const shortcuts = [
  { key: '1-5', description: 'Switch tabs' },
  { key: '/', description: 'Search' },
  { key: 'r', description: 'Refresh' },
]

const handleKeydown = (e: KeyboardEvent) => {
  // Ignore when typing
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  // Number keys for tab switching
  const num = parseInt(e.key)
  if (num >= 1 && num <= tabs.value.length) {
    e.preventDefault()
    const tab = tabs.value[num - 1]
    if (tab) setActiveTab(tab.id)
    return
  }

  // Slash for search
  if (e.key === '/') {
    e.preventDefault()
    showSearch.value = true
    return
  }

  // R for refresh
  if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    refreshHealth()
    toast.success('Data refreshed')
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
  <div class="min-h-screen bg-background">
    <ClientOnly>
      <div v-if="!isAuthReady" class="flex items-center justify-center py-24">
        <Spinner class="w-8 h-8" />
      </div>

      <template v-else>
        <!-- Header -->
        <section class="relative overflow-hidden border-b border-border/40 mb-6">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
            <Breadcrumb class="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink as-child>
                    <NuxtLink to="/">Home</NuxtLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-2xl font-semibold tracking-tight mb-2">Admin Dashboard</h1>
                <p class="text-muted-foreground text-sm">
                  Welcome back, {{ displayName }}
                </p>
              </div>
              <Button variant="outline" size="sm" @click="refreshHealth">
                <Icon name="mdi:refresh" class="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <!-- Main Content -->
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pb-16">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Sidebar Navigation -->
            <aside class="lg:w-56 shrink-0">
              <nav class="space-y-1">
                <button
                  v-for="(tab, index) in tabs"
                  :key="tab.id"
                  @click="setActiveTab(tab.id)"
                  class="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  :class="activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                >
                  <div class="flex items-center gap-3">
                    <Icon :name="tab.icon" class="w-4 h-4" />
                    <span>{{ tab.label }}</span>
                  </div>
                  <kbd class="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 text-muted-foreground rounded">
                    {{ index + 1 }}
                  </kbd>
                </button>
              </nav>

              <!-- Keyboard Shortcuts -->
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

            <!-- Main Content Area -->
            <main class="flex-1 min-w-0">
              <!-- Loading -->
              <div v-if="healthLoading" class="flex justify-center py-12">
                <Spinner class="w-8 h-8 text-muted-foreground" />
              </div>

              <template v-else>
                <!-- Overview Tab -->
                <AdminOverview
                  v-if="activeTab === 'overview'"
                  :system-health="systemHealth ?? null"
                  @set-tab="setActiveTab"
                />

                <!-- Claims Tab -->
                <AdminClaimReview v-else-if="activeTab === 'claims'" />

                <!-- Content Review Tab -->
                <AdminContentReview v-else-if="activeTab === 'content'" />

                <!-- Contractors Tab -->
                <AdminContractorList v-else-if="activeTab === 'contractors'" />

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
      </template>

      <template #fallback>
        <div class="flex items-center justify-center py-24">
          <Spinner class="w-8 h-8" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
