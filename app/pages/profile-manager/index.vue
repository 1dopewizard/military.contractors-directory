<!--
  @file Company Dashboard Page
  @description Main company dashboard for managing claimed profile
-->
<script setup lang="ts">
interface CompanyProfile {
  id: string;
  tier: string;
  status: string;
  verifiedAt: string | null;
  contractor: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    headquarters: string | null;
    employeeCount: string | null;
    website: string | null;
    careersUrl: string | null;
    linkedinUrl: string | null;
    logoUrl: string | null;
  } | null;
}

definePageMeta({
  middleware: ["auth", "profile-manager"],
});

useHead({
  title: "Company Dashboard | military.contractors",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const route = useRoute();
const router = useRouter();
const { isAuthReady } = useAuth();

// Fetch company profile
const {
  data: profile,
  pending: profileLoading,
  error: profileError,
  refresh,
} = await useFetch<CompanyProfile>("/api/profile-manager/profile");

// Tab management
type TabItem = {
  id: string;
  label: string;
  icon: string;
};

const tabs: TabItem[] = [
  { id: "overview", label: "Overview", icon: "mdi:view-dashboard-outline" },
  { id: "profile", label: "Profile", icon: "mdi:office-building-outline" },
  { id: "content", label: "Content", icon: "mdi:text-box-outline" },
  { id: "analytics", label: "Analytics", icon: "mdi:chart-line" },
];

const validTabIds = computed(() => tabs.map((t) => t.id));

const activeTab = computed({
  get: () => {
    const tab = route.query.tab as string;
    return validTabIds.value.includes(tab) ? tab : "overview";
  },
  set: (val: string) => {
    router.replace({ query: { ...route.query, tab: val } });
  },
});

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId;
};

const tierBadgeColor = computed(() => {
  if (!profile.value) return "bg-muted text-muted-foreground";
  switch (profile.value.tier) {
    case "premium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "enterprise":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    default:
      return "bg-primary/5 text-primary";
  }
});
</script>

<template>
  <div>
    <!-- Auth loading state -->
    <div
      v-if="!isAuthReady || profileLoading"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="flex flex-col items-center gap-4">
        <LoadingText text="Loading" />
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="profileError"
      class="flex min-h-screen items-center justify-center"
    >
      <Card class="max-w-md p-6 text-center">
        <Icon
          name="mdi:alert-circle-outline"
          class="text-destructive mx-auto mb-4 h-12 w-12"
        />
        <h2 class="mb-2 text-lg font-semibold">Unable to Load Profile</h2>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ profileError.message }}
        </p>
        <Button @click="refresh">Try Again</Button>
      </Card>
    </div>

    <!-- No profile state -->
    <div
      v-else-if="!profile"
      class="flex min-h-screen items-center justify-center"
    >
      <Card class="max-w-md p-6 text-center">
        <Icon
          name="mdi:office-building-plus-outline"
          class="text-muted-foreground mx-auto mb-4 h-12 w-12"
        />
        <h2 class="mb-2 text-lg font-semibold">No Claimed Profile</h2>
        <p class="text-muted-foreground mb-4 text-sm">
          You haven't claimed a company profile yet. Claim your company to
          manage your presence on military.contractors.
        </p>
        <Button as-child>
          <NuxtLink to="/profile-manager/claim">Claim Your Profile</NuxtLink>
        </Button>
      </Card>
    </div>

    <div v-else class="min-h-screen">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="container mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
          <!-- Breadcrumb -->
          <nav class="text-muted-foreground mb-8 text-sm">
            <NuxtLink to="/" class="hover:text-primary transition-colors"
              >Home</NuxtLink
            >
            <span class="mx-2">/</span>
            <span class="text-foreground">Company Dashboard</span>
          </nav>

          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div
                class="bg-muted flex h-16 w-16 items-center justify-center rounded-lg"
              >
                <img
                  v-if="profile.contractor?.logoUrl"
                  :src="profile.contractor.logoUrl"
                  :alt="profile.contractor.name"
                  class="h-full w-full rounded-lg object-contain"
                />
                <span v-else class="text-muted-foreground text-2xl font-bold">
                  {{ profile.contractor?.name?.charAt(0) || "C" }}
                </span>
              </div>
              <div>
                <div class="mb-1 flex items-center gap-2">
                  <h1 class="text-foreground text-2xl font-bold">
                    {{ profile.contractor?.name || "Company" }}
                  </h1>
                  <Badge :class="tierBadgeColor" class="capitalize">
                    {{ profile.tier }}
                  </Badge>
                  <Badge
                    v-if="profile.status === 'active'"
                    variant="outline"
                    class="border-green-600/30 text-green-600"
                  >
                    <Icon name="mdi:check-circle" class="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <p class="text-muted-foreground text-sm">
                  Manage your company profile and sponsored content
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink
                :to="`/companies/${profile.contractor?.slug}`"
                target="_blank"
              >
                <Icon name="mdi:open-in-new" class="mr-1.5 h-4 w-4" />
                View Public Profile
              </NuxtLink>
            </Button>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="container mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-8 lg:flex-row">
          <!-- Sidebar Navigation -->
          <aside class="shrink-0 lg:sticky lg:top-24 lg:w-48 lg:self-start">
            <nav class="space-y-1">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                :class="
                  activeTab === tab.id
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                "
                @click="setActiveTab(tab.id)"
              >
                <Icon :name="tab.icon" class="h-4 w-4" />
                {{ tab.label }}
              </button>
            </nav>
          </aside>

          <!-- Tab Content -->
          <main class="min-w-0 flex-1">
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
  </div>
</template>
