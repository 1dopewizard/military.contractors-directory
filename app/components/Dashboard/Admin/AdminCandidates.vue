<!--
  @file AdminCandidates.vue
  @description Admin dashboard tab for managing candidates and placement pipeline
-->
<script setup lang="ts">
import { toast } from "vue-sonner";

// Standalone types for job alert subscriptions (mirrors Convex jobAlertSubscriptions)
interface Candidate {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  mos_codes?: string[];
  branch?: string | null;
  military_status?: string | null;
  clearance_level?: string | null;
  clearance_status?: string | null;
  has_valid_passport?: boolean | null;
  willing_to_relocate?: boolean | null;
  willing_to_deploy_30_days?: boolean | null;
  location_preference?: string | null;
  preferred_theaters?: string[] | null;
  salary_expectation_min?: number | null;
  salary_expectation_max?: number | null;
  years_experience?: number | null;
  resume_url?: string | null;
  ets_date?: string | null;
  placement_consent?: boolean | null;
  placement_consent_at?: string | null;
  polygraph_type?: string | null;
  frequency?: string;
  include_similar_mos?: boolean;
  is_active?: boolean;
  last_sent_at?: string | null;
  emails_sent_count?: number;
  unsubscribe_token?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  placements_count?: number;
}

// Standalone types for placements (mirrors Convex placements)
interface Placement {
  id: string;
  candidateEmail: string;
  subscription_id?: string;
  job_id?: string | null;
  company_id?: string | null;
  status: string;
  notes?: string | null;
  contacted_at?: string | null;
  submitted_at?: string | null;
  interview_at?: string | null;
  placed_at?: string | null;
  fee_amount?: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  job?: { id: string; title: string; company: string } | null;
  company?: { id: string; name: string } | null;
}

const logger = useLogger("AdminCandidates");

// Tab state
type TabId = "search" | "pipeline";
const activeTab = ref<TabId>("search");

// Search state
const searchQuery = ref("");
const filters = ref({
  placementConsent: "all" as "all" | "yes" | "no",
  hasResume: "all" as "all" | "yes" | "no",
  militaryStatus: "all",
  clearanceLevel: "all",
  locationPreference: "all",
});

// Data state
const candidates = ref<Candidate[]>([]);
const placements = ref<Placement[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedCandidate = ref<Candidate | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

// Stats
const stats = computed(() => ({
  total: totalCount.value,
  withConsent: candidates.value.filter((c) => c.placement_consent).length,
  withResume: candidates.value.filter((c) => c.resume_url).length,
}));

// Fetch candidates
const fetchCandidates = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ candidates: Candidate[]; total: number }>(
      "/api/admin/candidates",
      {
        query: {
          search: searchQuery.value || undefined,
          placementConsent:
            filters.value.placementConsent !== "all"
              ? filters.value.placementConsent
              : undefined,
          hasResume:
            filters.value.hasResume !== "all"
              ? filters.value.hasResume
              : undefined,
          militaryStatus:
            filters.value.militaryStatus !== "all"
              ? filters.value.militaryStatus
              : undefined,
          clearanceLevel:
            filters.value.clearanceLevel !== "all"
              ? filters.value.clearanceLevel
              : undefined,
          locationPreference:
            filters.value.locationPreference !== "all"
              ? filters.value.locationPreference
              : undefined,
          page: currentPage.value,
          limit: pageSize,
        },
      },
    );

    candidates.value = response.candidates;
    totalCount.value = response.total;
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Failed to load candidates";
    logger.error({ error: err }, "Failed to fetch candidates");
  } finally {
    isLoading.value = false;
  }
};

// Fetch placements
const fetchPlacements = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ placements: Placement[] }>(
      "/api/admin/placements",
    );
    placements.value = response.placements;
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Failed to load placements";
    logger.error({ error: err }, "Failed to fetch placements");
  } finally {
    isLoading.value = false;
  }
};

// View candidate detail
const viewCandidate = async (id: string) => {
  try {
    const response = await $fetch<{ candidate: Candidate }>(
      `/api/admin/candidates/${id}`,
    );
    selectedCandidate.value = response.candidate;
  } catch (err: any) {
    toast.error(err.data?.statusMessage || "Failed to load candidate");
  }
};

// Create placement
const createPlacement = async (subscriptionId: string) => {
  try {
    await $fetch("/api/admin/placements", {
      method: "POST",
      body: { subscription_id: subscriptionId },
    });
    toast.success("Added to pipeline");
    await fetchPlacements();
  } catch (err: any) {
    toast.error(err.data?.statusMessage || "Failed to add to pipeline");
  }
};

// Update placement status
const updatePlacementStatus = async (placementId: string, status: string) => {
  try {
    await $fetch(`/api/admin/placements/${placementId}`, {
      method: "PATCH",
      body: { status },
    });
    toast.success("Status updated");
    await fetchPlacements();
  } catch (err: any) {
    toast.error(err.data?.statusMessage || "Failed to update status");
  }
};

// Watch for filter changes
watch(
  [searchQuery, filters],
  () => {
    currentPage.value = 1;
    fetchCandidates();
  },
  { deep: true },
);

// Watch for tab changes
watch(activeTab, (tab) => {
  if (tab === "search") {
    fetchCandidates();
  } else if (tab === "pipeline") {
    fetchPlacements();
  }
});

// Init
onMounted(() => {
  fetchCandidates();
});

// Filter options
const militaryStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active_duty", label: "Active Duty" },
  { value: "reserve", label: "Reserve/Guard" },
  { value: "transitioning", label: "Transitioning" },
  { value: "veteran", label: "Veteran" },
];

const clearanceOptions = [
  { value: "all", label: "All clearances" },
  { value: "none", label: "None" },
  { value: "secret", label: "Secret" },
  { value: "top-secret", label: "Top Secret" },
  { value: "ts-sci", label: "TS/SCI" },
];

const locationOptions = [
  { value: "all", label: "All locations" },
  { value: "CONUS", label: "CONUS" },
  { value: "OCONUS", label: "OCONUS" },
  { value: "REMOTE", label: "Remote" },
];

const placementStatuses = [
  {
    value: "identified",
    label: "Identified",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    value: "interested",
    label: "Interested",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    value: "submitted",
    label: "Submitted",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    value: "interviewing",
    label: "Interviewing",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    value: "offered",
    label: "Offered",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    value: "placed",
    label: "Placed",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    value: "declined",
    label: "Declined",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
];

const getStatusColor = (status: string) => {
  return (
    placementStatuses.find((s) => s.value === status)?.color ||
    "bg-muted text-muted-foreground"
  );
};

// Format date
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format military status
const formatMilitaryStatus = (status: string | null | undefined) => {
  if (!status || status === "all") return "-";
  return militaryStatusOptions.find((o) => o.value === status)?.label || status;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2
          class="text-foreground text-sm font-semibold tracking-wide uppercase"
        >
          Candidates
        </h2>
        <p class="text-muted-foreground text-sm">
          Manage talent pool and placement pipeline
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="activeTab === 'search' ? fetchCandidates() : fetchPlacements()"
      >
        <Icon name="mdi:refresh" class="mr-1 h-4 w-4" />
        Refresh
      </Button>
    </div>

    <!-- Tabs -->
    <div class="border-border border-b">
      <nav class="-mb-px flex gap-1">
        <button
          v-for="tab in [
            { id: 'search', label: 'Search', icon: 'mdi:magnify' },
            { id: 'pipeline', label: 'Pipeline', icon: 'mdi:pipe' },
          ] as { id: TabId; label: string; icon: string }[]"
          :key="tab.id"
          class="-mb-[2px] flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors"
          :class="
            activeTab === tab.id
              ? 'text-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          "
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner class="text-muted-foreground h-8 w-8" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="border-destructive/30 p-6 text-center">
      <Icon
        name="mdi:alert-circle-outline"
        class="text-destructive mx-auto mb-2 h-8 w-8"
      />
      <p class="text-destructive text-sm">{{ error }}</p>
      <Button variant="ghost" size="sm" class="mt-4" @click="fetchCandidates">
        Try Again
      </Button>
    </Card>

    <!-- Search Tab -->
    <template v-else-if="activeTab === 'search'">
      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div class="min-w-[200px] flex-1">
          <Input
            v-model="searchQuery"
            placeholder="Search by email or name..."
            class="h-9"
          >
            <template #prefix>
              <Icon name="mdi:magnify" class="text-muted-foreground h-4 w-4" />
            </template>
          </Input>
        </div>

        <Select v-model="filters.placementConsent">
          <SelectTrigger class="h-9 w-[140px]">
            <SelectValue placeholder="Consent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">With Consent</SelectItem>
            <SelectItem value="no">No Consent</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.hasResume">
          <SelectTrigger class="h-9 w-[130px]">
            <SelectValue placeholder="Resume" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Has Resume</SelectItem>
            <SelectItem value="no">No Resume</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.militaryStatus">
          <SelectTrigger class="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in militaryStatusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.clearanceLevel">
          <SelectTrigger class="h-9 w-[140px]">
            <SelectValue placeholder="Clearance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in clearanceOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Results count -->
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-sm">
          Showing {{ candidates.length }} of {{ totalCount }} candidates
          <span
            v-if="filters.placementConsent === 'yes'"
            class="text-primary ml-2 text-xs"
          >
            (filtered to placement pool)
          </span>
        </span>
      </div>

      <!-- Empty -->
      <Empty v-if="candidates.length === 0" class="border">
        <EmptyMedia variant="icon">
          <Icon name="mdi:account-search-outline" class="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle class="text-base">No candidates found</EmptyTitle>
        <EmptyDescription>Try adjusting your search filters.</EmptyDescription>
      </Empty>

      <!-- Candidates List -->
      <div v-else class="divide-border/30 divide-y">
        <div
          v-for="candidate in candidates"
          :key="candidate.id"
          class="py-3 first:pt-0"
        >
          <div class="flex items-center gap-4">
            <!-- Candidate Info -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">{{
                  candidate.name || candidate.email
                }}</span>
                <Icon
                  v-if="candidate.placement_consent"
                  name="mdi:check-circle"
                  class="h-3.5 w-3.5 text-green-500"
                  title="Placement consent"
                />
                <Badge
                  v-if="candidate.clearance_level"
                  variant="secondary"
                  class="text-[10px]"
                >
                  {{ candidate.clearance_level }}
                </Badge>
                <Badge
                  v-if="candidate.military_status"
                  variant="outline"
                  class="text-[10px]"
                >
                  {{ formatMilitaryStatus(candidate.military_status) }}
                </Badge>
              </div>
              <p v-if="candidate.name" class="text-muted-foreground text-xs">
                {{ candidate.email }}
              </p>
              <div
                v-if="candidate.mos_codes?.length"
                class="mt-1 flex flex-wrap gap-1"
              >
                <span
                  v-for="code in candidate.mos_codes.slice(0, 3)"
                  :key="code"
                  class="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {{ code }}
                </span>
                <span
                  v-if="candidate.mos_codes.length > 3"
                  class="text-muted-foreground text-[10px]"
                >
                  +{{ candidate.mos_codes.length - 3 }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0"
                title="View details"
                @click="viewCandidate(candidate.id)"
              >
                <Icon name="mdi:eye-outline" class="h-4 w-4" />
              </Button>
              <Button
                v-if="candidate.placement_consent"
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0"
                title="Add to pipeline"
                @click="createPlacement(candidate.id)"
              >
                <Icon name="mdi:plus-circle-outline" class="h-4 w-4" />
              </Button>
            </div>

            <!-- Date -->
            <span
              class="text-muted-foreground w-20 shrink-0 text-right text-xs"
            >
              {{ formatDate(candidate.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalCount > pageSize" class="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="
            currentPage--;
            fetchCandidates();
          "
        >
          Previous
        </Button>
        <span class="text-muted-foreground flex items-center px-3 text-sm">
          Page {{ currentPage }} of {{ Math.ceil(totalCount / pageSize) }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage >= Math.ceil(totalCount / pageSize)"
          @click="
            currentPage++;
            fetchCandidates();
          "
        >
          Next
        </Button>
      </div>
    </template>

    <!-- Pipeline Tab -->
    <template v-else-if="activeTab === 'pipeline'">
      <!-- Pipeline Stats -->
      <div class="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-5">
        <div
          v-for="status in placementStatuses.slice(0, 5)"
          :key="status.value"
          class="space-y-1"
        >
          <p
            class="font-mono text-2xl font-bold"
            :class="
              status.value === 'placed'
                ? 'text-green-600 dark:text-green-400'
                : 'text-foreground'
            "
          >
            {{ placements.filter((p) => p.status === status.value).length }}
          </p>
          <p class="text-muted-foreground text-xs tracking-wide uppercase">
            {{ status.label }}
          </p>
        </div>
      </div>

      <!-- Empty -->
      <Empty v-if="placements.length === 0" class="border">
        <EmptyMedia variant="icon">
          <Icon name="mdi:pipe" class="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle class="text-base">No placements in pipeline</EmptyTitle>
        <EmptyDescription
          >Add candidates from the Search tab to start building your
          pipeline.</EmptyDescription
        >
      </Empty>

      <!-- Placements List -->
      <div v-else class="divide-border/30 divide-y">
        <div
          v-for="placement in placements"
          :key="placement.id"
          class="py-3 first:pt-0"
        >
          <div class="flex items-center gap-4">
            <!-- Placement Info -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-sm font-medium"
                  >{{
                    placement.subscription_id?.slice(0, 8) ??
                    placement.id.slice(0, 8)
                  }}...</span
                >
                <span
                  :class="getStatusColor(placement.status)"
                  class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                >
                  {{
                    placementStatuses.find((s) => s.value === placement.status)
                      ?.label || placement.status
                  }}
                </span>
              </div>
              <p v-if="placement.job" class="text-muted-foreground text-xs">
                {{ placement.job.title }} · {{ placement.job.company }}
              </p>
              <p
                v-else-if="placement.company"
                class="text-muted-foreground text-xs"
              >
                {{ placement.company.name }}
              </p>
              <p
                v-if="placement.contacted_at || placement.submitted_at"
                class="text-muted-foreground/70 mt-0.5 text-xs"
              >
                <span v-if="placement.contacted_at"
                  >Contacted: {{ formatDate(placement.contacted_at) }}</span
                >
                <span v-if="placement.contacted_at && placement.submitted_at">
                  ·
                </span>
                <span v-if="placement.submitted_at"
                  >Submitted: {{ formatDate(placement.submitted_at) }}</span
                >
              </p>
            </div>

            <!-- Status Update -->
            <Select
              :model-value="placement.status"
              @update:model-value="
                (val) => val && updatePlacementStatus(placement.id, String(val))
              "
            >
              <SelectTrigger class="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="status in placementStatuses"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </template>

    <!-- Candidate Detail Dialog -->
    <Dialog :open="!!selectedCandidate" @update:open="selectedCandidate = null">
      <DialogContent v-if="selectedCandidate" class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Candidate Details</DialogTitle>
          <DialogDescription>{{ selectedCandidate.email }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Contact Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">Email</p>
              <p class="text-sm">{{ selectedCandidate.email }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">Phone</p>
              <p class="text-sm">{{ selectedCandidate.phone || "-" }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">Name</p>
              <p class="text-sm">{{ selectedCandidate.name || "-" }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">Branch</p>
              <p class="text-sm">{{ selectedCandidate.branch || "-" }}</p>
            </div>
          </div>

          <!-- Military Info -->
          <div class="border-border/50 grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">
                Military Status
              </p>
              <p class="text-sm">
                {{ formatMilitaryStatus(selectedCandidate.military_status) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">
                ETS Date
              </p>
              <p class="text-sm">
                {{ formatDate(selectedCandidate.ets_date) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">
                Clearance
              </p>
              <p class="text-sm">
                {{ selectedCandidate.clearance_level || "-" }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 text-xs uppercase">
                Location Pref
              </p>
              <p class="text-sm">
                {{ selectedCandidate.location_preference || "-" }}
              </p>
            </div>
          </div>

          <!-- MOS Codes -->
          <div class="border-border/50 border-t pt-4">
            <p class="text-muted-foreground mb-2 text-xs uppercase">
              MOS Codes
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="code in selectedCandidate.mos_codes"
                :key="code"
                class="bg-muted rounded px-2 py-1 font-mono text-xs"
              >
                {{ code }}
              </span>
            </div>
          </div>

          <!-- Placement Consent -->
          <div class="border-border/50 border-t pt-4">
            <div class="flex items-center gap-2">
              <Icon
                :name="
                  selectedCandidate.placement_consent
                    ? 'mdi:check-circle'
                    : 'mdi:close-circle'
                "
                :class="
                  selectedCandidate.placement_consent
                    ? 'text-green-500'
                    : 'text-muted-foreground'
                "
                class="h-4 w-4"
              />
              <span class="text-sm">
                {{
                  selectedCandidate.placement_consent
                    ? "Opted in to placement services"
                    : "No placement consent"
                }}
              </span>
            </div>
            <p
              v-if="selectedCandidate.placement_consent_at"
              class="text-muted-foreground mt-1 text-xs"
            >
              Consented on
              {{ formatDate(selectedCandidate.placement_consent_at) }}
            </p>
          </div>

          <!-- Resume -->
          <div
            v-if="selectedCandidate.resume_url"
            class="border-border/50 border-t pt-4"
          >
            <Button variant="outline" size="sm" as-child>
              <a
                :href="selectedCandidate.resume_url"
                target="_blank"
                rel="noopener"
              >
                <Icon name="mdi:file-document-outline" class="mr-2 h-4 w-4" />
                Download Resume
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="selectedCandidate = null"
            >Close</Button
          >
          <Button
            v-if="selectedCandidate.placement_consent"
            @click="
              createPlacement(selectedCandidate.id);
              selectedCandidate = null;
            "
          >
            <Icon name="mdi:plus" class="mr-2 h-4 w-4" />
            Add to Pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
