<!--
  @file Employer Dashboard Page
  @description Main employer dashboard for managing claimed profile
-->
<script setup lang="ts">
interface EmployerProfile {
  id: string
  tier: string
  status: string
  verifiedAt: string | null
  contractor: {
    id: string
    name: string
    slug: string
    description: string | null
    headquarters: string | null
    employeeCount: string | null
    website: string | null
    careersUrl: string | null
    linkedinUrl: string | null
    logoUrl: string | null
  } | null
}

definePageMeta({
  middleware: ['auth', 'profile-manager']
})

useHead({
  title: 'Employer Dashboard | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const route = useRoute()
const router = useRouter()
const { isAuthReady } = useAuth()

// Fetch employer profile
const { data: profile, pending: profileLoading, error: profileError, refresh } = await useFetch<EmployerProfile>('/api/profile-manager/profile')

// Tab management
type TabItem = {
  id: string
  label: string
  icon: string
}

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard-outline' },
  { id: 'profile', label: 'Profile', icon: 'mdi:office-building-outline' },
  { id: 'content', label: 'Content', icon: 'mdi:text-box-outline' },
  { id: 'analytics', label: 'Analytics', icon: 'mdi:chart-line' },
]

const validTabIds = computed(() => tabs.map(t => t.id))

const activeTab = computed({
  get: () => {
    const tab = route.query.tab as string
    return validTabIds.value.includes(tab) ? tab : 'overview'
  },
  set: (val: string) => {
    router.replace({ query: { ...route.query, tab: val } })
  }
})

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const tierBadgeColor = computed(() => {
  if (!profile.value) return 'bg-muted text-muted-foreground'
  switch (profile.value.tier) {
    case 'premium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'enterprise': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    default: return 'bg-primary/10 text-primary'
  }
})
</script>

<template>
  <!-- Auth loading state -->
  <div v-if="!isAuthReady || profileLoading" class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Spinner class="w-8 h-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="profileError" class="min-h-screen flex items-center justify-center">
    <Card class="p-6 text-center max-w-md">
      <Icon name="mdi:alert-circle-outline" class="w-12 h-12 text-destructive mx-auto mb-4" />
      <h2 class="text-lg font-semibold mb-2">Unable to Load Profile</h2>
      <p class="text-sm text-muted-foreground mb-4">{{ profileError.message }}</p>
      <Button @click="refresh">Try Again</Button>
    </Card>
  </div>

  <!-- No profile state -->
  <div v-else-if="!profile" class="min-h-screen flex items-center justify-center">
    <Card class="p-6 text-center max-w-md">
      <Icon name="mdi:office-building-plus-outline" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-lg font-semibold mb-2">No Claimed Profile</h2>
      <p class="text-sm text-muted-foreground mb-4">
        You haven't claimed a company profile yet. Claim your company to manage your presence on military.contractors.
      </p>
      <Button as-child>
        <NuxtLink to="/profile-manager/claim">Claim Your Profile</NuxtLink>
      </Button>
    </Card>
  </div>

  <div v-else class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
        <!-- Breadcrumb -->
        <nav class="text-sm text-muted-foreground mb-8">
          <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-foreground">Employer Dashboard</span>
        </nav>

        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <img 
                v-if="profile.contractor?.logoUrl" 
                :src="profile.contractor.logoUrl" 
                :alt="profile.contractor.name"
                class="w-full h-full object-contain rounded-lg"
              />
              <span v-else class="text-2xl font-bold text-muted-foreground">
                {{ profile.contractor?.name?.charAt(0) || 'C' }}
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl font-bold text-foreground">
                  {{ profile.contractor?.name || 'Company' }}
                </h1>
                <Badge :class="tierBadgeColor" class="capitalize">
                  {{ profile.tier }}
                </Badge>
                <Badge v-if="profile.status === 'active'" variant="outline" class="text-green-600 border-green-600/30">
                  <Icon name="mdi:check-circle" class="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                Manage your company profile and sponsored content
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink :to="`/contractors/${profile.contractor?.slug}`" target="_blank">
              <Icon name="mdi:open-in-new" class="w-4 h-4 mr-1.5" />
              View Public Profile
            </NuxtLink>
          </Button>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6 pb-16">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:w-48 shrink-0 lg:sticky lg:top-24 lg:self-start">
          <nav class="space-y-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors"
              :class="activeTab === tab.id 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="setActiveTab(tab.id)"
            >
              <Icon :name="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </nav>
        </aside>

        <!-- Tab Content -->
        <main class="flex-1 min-w-0">
          <!-- Overview Tab -->
          <ProfileManagerOverview 
            v-if="activeTab === 'overview'" 
            :profile="profile"
            @navigate="setActiveTab"
          />

          <!-- Profile Tab -->
          <ProfileManagerProfileForm 
            v-else-if="activeTab === 'profile'" 
            :profile="profile"
            @updated="refresh"
          />

          <!-- Content Tab -->
          <ProfileManagerContentManager 
            v-else-if="activeTab === 'content'" 
            :profile="profile"
          />

          <!-- Analytics Tab -->
          <ProfileManagerAnalytics 
            v-else-if="activeTab === 'analytics'" 
            :profile="profile"
          />
        </main>
      </div>
    </div>
  </div>
</template>
