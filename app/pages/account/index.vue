<!--
  @file User Account Dashboard
  @usage /account
  @description Unified account dashboard with profile, saved jobs, alerts, and MOS interests
-->

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

useHead({
  title: 'My Account | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const logger = useLogger('AccountDashboard')
const route = useRoute()
const router = useRouter()
const { isAuthReady } = useAuth()
const { displayName, email, userId } = useUserProfile()

// Tab management with URL persistence
type TabItem = {
  id: string
  label: string
  icon: string
}

const tabs = computed<TabItem[]>(() => [
  { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard-outline' },
  { id: 'profile', label: 'Profile', icon: 'mdi:account-outline' },
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

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  // Number keys 1-5 for tab switching
  const num = parseInt(e.key)
  if (num >= 1 && num <= tabs.value.length && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const target = document.activeElement as HTMLElement
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
      return
    }
    const tab = tabs.value[num - 1]
    if (tab) {
      setActiveTab(tab.id)
    }
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
          <span class="text-foreground">My Account</span>
        </nav>

        <div class="flex items-start justify-between gap-4">
          <div class="max-w-2xl">
            <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              My Account
            </h1>
            <p class="text-lg text-muted-foreground leading-relaxed">
              Manage your profile, track saved jobs, and customize your job search experience.
            </p>
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
              <kbd class="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground">
                {{ index + 1 }}
              </kbd>
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
              to="/contractors" 
              class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="mdi:domain" class="w-4 h-4" />
              Contractors
            </NuxtLink>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
          <!-- Overview Tab -->
          <AccountOverview
            v-if="activeTab === 'overview'"
            @set-tab="setActiveTab"
          />

          <!-- Profile Tab -->
          <AccountProfile v-else-if="activeTab === 'profile'" />
        </main>
      </div>
    </div>
  </div>

    <!-- SSR Fallback -->
    <template #fallback>
      <div class="min-h-screen">
        <section class="relative overflow-hidden">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
            <Skeleton class="h-4 w-32 mb-8" />
            <Skeleton class="h-10 w-48 mb-4" />
            <Skeleton class="h-6 w-96" />
          </div>
        </section>
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6 pb-16">
          <div class="flex flex-col lg:flex-row gap-8">
            <aside class="lg:w-56 shrink-0">
              <div class="space-y-2">
                <Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
              </div>
            </aside>
            <main class="flex-1">
              <Skeleton class="h-64 w-full" />
            </main>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
