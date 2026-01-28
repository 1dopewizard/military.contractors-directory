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
  <div class="bg-background min-h-screen">
    <ClientOnly>
      <div v-if="!isAuthReady" class="flex justify-center items-center py-24">
        <Spinner class="w-8 h-8" />
      </div>

      <template v-else>
        <!-- Header -->
        <section class="relative mb-6 border-border/40 border-b overflow-hidden">
          <div class="mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 max-w-6xl container">
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

            <div class="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
              <div>
                <h1 class="mb-2 font-semibold text-2xl tracking-tight">Admin Dashboard</h1>
                <p class="text-muted-foreground text-sm">
                  Welcome back, {{ displayName }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Main Content -->
        <div class="mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl container">
          <div class="flex lg:flex-row flex-col gap-8">
            <!-- Sidebar Navigation -->
            <aside class="lg:w-56 shrink-0">
              <div class="lg:top-4 lg:sticky space-y-6">
                <Card class="border-none overflow-hidden">
                  <CardContent class="p-0">
                    <!-- Navigation -->
                    <div class="p-4 border-border/30 border-b">
                      <div class="flex items-center gap-2 mb-3">
                        <Icon name="mdi:menu" class="w-4 h-4 text-muted-foreground" />
                        <span class="font-bold text-muted-foreground text-xs uppercase tracking-widest">Navigation</span>
                      </div>
                      <nav class="space-y-1">
                        <button
                          v-for="(tab, index) in tabs"
                          :key="tab.id"
                          @click="setActiveTab(tab.id)"
                          class="flex items-center justify-between w-full px-2 py-2 rounded-md text-sm transition-colors"
                          :class="activeTab === tab.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                        >
                          <span class="flex items-center gap-2">
                            <Icon :name="tab.icon" class="size-4" />
                            <span>{{ tab.label }}</span>
                          </span>
                          <kbd class="hidden lg:inline-flex items-center justify-center size-5 rounded bg-muted font-mono text-[10px] text-muted-foreground">
                            {{ index + 1 }}
                          </kbd>
                        </button>
                      </nav>
                    </div>

                    <!-- Keyboard Shortcuts -->
                    <div class="hidden lg:block p-4">
                      <div class="flex items-center gap-2 mb-3">
                        <Icon name="mdi:keyboard" class="w-4 h-4 text-muted-foreground" />
                        <span class="font-bold text-muted-foreground text-xs uppercase tracking-widest">Shortcuts</span>
                      </div>
                      <div class="space-y-2">
                        <div v-for="shortcut in shortcuts" :key="shortcut.key" class="flex justify-between items-center text-sm">
                          <span class="text-muted-foreground">{{ shortcut.description }}</span>
                          <kbd class="inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded bg-muted font-mono text-[10px] text-foreground">{{ shortcut.key }}</kbd>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                  :refreshing="healthLoading"
                  @set-tab="setActiveTab"
                  @refresh="refreshHealth"
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
        <div class="flex justify-center items-center py-24">
          <Spinner class="w-8 h-8" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
