<!--
  @file Recruiter Dashboard Page
  @description Dashboard for recruiters to manage candidates, pipeline, and HR contacts
-->
<script setup lang="ts">

definePageMeta({
  middleware: ['auth', 'recruiter']
})

useHead({
  title: 'Recruiter Dashboard | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const { isAuthReady } = useAuth()
const { displayName } = useUserProfile()

// Tab management
type TabItem = {
  id: string
  label: string
  icon: string
}

const tabs: TabItem[] = [
  { id: 'candidates', label: 'Candidates', icon: 'mdi:account-search-outline' },
  { id: 'pipeline', label: 'Pipeline', icon: 'mdi:pipe' },
  { id: 'hot-leads', label: 'Hot Leads', icon: 'mdi:fire' },
  { id: 'hr-contacts', label: 'HR Contacts', icon: 'mdi:account-tie-outline' },
]

const activeTab = ref('candidates')
const mobileMenuOpen = ref(false)

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Loading state -->
    <div v-if="!isAuthReady" class="flex items-center justify-center min-h-screen">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-semibold text-foreground">Recruiter Dashboard</h1>
              <p class="text-sm text-muted-foreground">Welcome, {{ displayName }}</p>
            </div>

            <!-- Mobile menu toggle -->
            <Button 
              variant="ghost" 
              size="sm" 
              class="md:hidden"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <Icon :name="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-5 h-5" />
            </Button>
          </div>

          <!-- Desktop tabs -->
          <nav class="hidden md:flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-background text-foreground border border-border border-b-background -mb-px'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              ]"
              @click="setActiveTab(tab.id)"
            >
              <Icon :name="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </nav>

          <!-- Mobile menu -->
          <div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-2 border-t border-border/50 pt-4">
            <nav class="flex flex-col gap-1">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="[
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                ]"
                @click="setActiveTab(tab.id)"
              >
                <Icon :name="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <!-- Candidates Tab -->
        <AdminCandidates v-if="activeTab === 'candidates'" />

        <!-- Pipeline Tab -->
        <div v-else-if="activeTab === 'pipeline'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Placement Pipeline</h2>
              <p class="text-sm text-muted-foreground">Track candidates through the placement process</p>
            </div>
          </div>
          
          <!-- Pipeline placeholder - will be enhanced later -->
          <Card class="p-8 text-center border-dashed">
            <Icon name="mdi:pipe" class="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p class="text-muted-foreground">Pipeline view coming soon</p>
            <p class="text-xs text-muted-foreground/70 mt-1">Track placements from identification to hire</p>
          </Card>
        </div>

        <!-- Hot Leads Tab -->
        <div v-else-if="activeTab === 'hot-leads'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Hot Leads</h2>
              <p class="text-sm text-muted-foreground">High-engagement candidates ready for outreach</p>
            </div>
          </div>
          
          <!-- Hot leads placeholder - will show high engagement score candidates -->
          <Card class="p-8 text-center border-dashed">
            <Icon name="mdi:fire" class="w-12 h-12 text-orange-500/50 mx-auto mb-3" />
            <p class="text-muted-foreground">Hot leads view coming soon</p>
            <p class="text-xs text-muted-foreground/70 mt-1">Candidates with engagement score above 70</p>
          </Card>
        </div>

        <!-- HR Contacts Tab -->
        <AdminHRContacts v-else-if="activeTab === 'hr-contacts'" />
      </div>
    </template>
  </div>
</template>
