<!--
  @file Admin Dashboard Page
  @description Admin dashboard for contractor records, intelligence data, and system oversight
-->
<script setup lang="ts">
import { toast } from "vue-sonner";

definePageMeta({
  middleware: ["auth", "admin"],
});

useHead({
  title: "Admin Dashboard | military.contractors",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const logger = useLogger("AdminDashboard");
const route = useRoute();
const router = useRouter();
const { isAuthReady, userEmail } = useAuth();
const displayName = computed(() => {
  const value = userEmail.value;
  return value ? value.split("@")[0] : "Admin";
});

// Tab management with URL persistence
type TabItem = {
  id: string;
  label: string;
  icon: string;
};

const tabs = computed<TabItem[]>(() => [
  { id: "overview", label: "Overview", icon: "mdi:view-dashboard-outline" },
  {
    id: "contractors",
    label: "Contractors",
    icon: "mdi:office-building-outline",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: "mdi:database-search-outline",
  },
  { id: "users", label: "Users", icon: "mdi:account-group-outline" },
]);

const validTabIds = computed(() => tabs.value.map((t) => t.id));

// URL-synced active tab
const activeTab = computed({
  get: () => {
    const tab = route.query.tab as string;
    return validTabIds.value.includes(tab) ? tab : "overview";
  },
  set: (val: string) => {
    router.replace({ query: { ...route.query, tab: val } });
  },
});

const mobileMenuOpen = ref(false);
const showSearch = ref(false);

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId;
  mobileMenuOpen.value = false;
};

// System health data
interface SystemHealth {
  database: {
    status: "connected" | "error";
    latencyMs: number | null;
  };
  contractors: {
    total: number;
    withLogos: number;
  };
}

const {
  data: systemHealth,
  pending: healthLoading,
  refresh: refreshHealth,
} = await useFetch<SystemHealth>("/api/admin/system-health");

// Keyboard navigation
const shortcuts = [
  { key: "1-4", description: "Switch tabs" },
  { key: "/", description: "Search" },
  { key: "r", description: "Refresh" },
];

const handleKeydown = (e: KeyboardEvent) => {
  // Ignore when typing
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  )
    return;

  // Number keys for tab switching
  const num = parseInt(e.key);
  if (num >= 1 && num <= tabs.value.length) {
    e.preventDefault();
    const tab = tabs.value[num - 1];
    if (tab) setActiveTab(tab.id);
    return;
  }

  // Slash for search
  if (e.key === "/") {
    e.preventDefault();
    showSearch.value = true;
    return;
  }

  // R for refresh
  if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    refreshHealth();
    toast.success("Data refreshed");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="bg-background min-h-screen">
    <ClientOnly>
      <div v-if="!isAuthReady" class="flex items-center justify-center py-24">
        <Spinner class="h-8 w-8" />
      </div>

      <template v-else>
        <!-- Header -->
        <section
          class="border-border/40 relative mb-6 overflow-hidden border-b"
        >
          <div
            class="container mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 lg:px-8"
          >
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

            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h1 class="mb-2 text-2xl font-semibold tracking-tight">
                  Admin Dashboard
                </h1>
                <p class="text-muted-foreground text-sm">
                  Welcome back, {{ displayName }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Main Content -->
        <div class="container mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-8 lg:flex-row">
            <!-- Sidebar Navigation -->
            <aside class="shrink-0 lg:w-56">
              <div class="space-y-6 lg:sticky lg:top-4">
                <Card class="overflow-hidden border-none">
                  <CardContent class="p-0">
                    <!-- Navigation -->
                    <div class="border-border/30 border-b p-4">
                      <div class="mb-3 flex items-center gap-2">
                        <Icon
                          name="mdi:menu"
                          class="text-muted-foreground h-4 w-4"
                        />
                        <span
                          class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                          >Navigation</span
                        >
                      </div>
                      <nav class="space-y-1">
                        <button
                          v-for="(tab, index) in tabs"
                          :key="tab.id"
                          @click="setActiveTab(tab.id)"
                          class="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition-colors"
                          :class="
                            activeTab === tab.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          "
                        >
                          <span class="flex items-center gap-2">
                            <Icon :name="tab.icon" class="size-4" />
                            <span>{{ tab.label }}</span>
                          </span>
                          <kbd
                            class="bg-muted text-muted-foreground hidden size-5 items-center justify-center rounded font-mono text-[10px] lg:inline-flex"
                          >
                            {{ index + 1 }}
                          </kbd>
                        </button>
                      </nav>
                    </div>

                    <!-- Keyboard Shortcuts -->
                    <div class="hidden p-4 lg:block">
                      <div class="mb-3 flex items-center gap-2">
                        <Icon
                          name="mdi:keyboard"
                          class="text-muted-foreground h-4 w-4"
                        />
                        <span
                          class="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                          >Shortcuts</span
                        >
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="shortcut in shortcuts"
                          :key="shortcut.key"
                          class="flex items-center justify-between text-sm"
                        >
                          <span class="text-muted-foreground">{{
                            shortcut.description
                          }}</span>
                          <kbd
                            class="bg-muted text-foreground inline-flex h-5 min-w-6 items-center justify-center rounded px-1.5 font-mono text-[10px]"
                            >{{ shortcut.key }}</kbd
                          >
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>

            <!-- Main Content Area -->
            <main class="min-w-0 flex-1">
              <!-- Loading -->
              <div v-if="healthLoading" class="flex justify-center py-12">
                <Spinner class="text-muted-foreground h-8 w-8" />
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

                <!-- Contractors Tab -->
                <AdminContractorList v-else-if="activeTab === 'contractors'" />

                <!-- Intelligence Tab -->
                <AdminIntelligenceTools
                  v-else-if="activeTab === 'intelligence'"
                />

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
          <Spinner class="h-8 w-8" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
