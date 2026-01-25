<!--
  @file AdminFeaturedListings.vue
  @description Admin dashboard for managing featured_listings table
-->
<script setup lang="ts">
import type { FeaturedListingWithJob, ListingStatus, FeaturedRequestData } from '@/app/composables/useFeaturedListings'
import type { Job } from '@/app/types/legacy-types'
import { toast } from 'vue-sonner'

const {
  getStatus,
  fetchAllFeaturedListings,
  addFeaturedListing,
  updateFeaturedListing,
  removeFeaturedListing,
  fetchAvailableJobs,
  approveFeaturedListing,
  rejectFeaturedListing,
  fetchPendingRequests
} = useFeaturedListings()

const { logActivity } = useAdminActivity()

// State
const listings = ref<FeaturedListingWithJob[]>([])
const pendingRequests = ref<FeaturedListingWithJob[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const statusFilter = ref<ListingStatus | 'all' | 'pending'>('all')
const expandedId = ref<string | null>(null)

// Per-action loading states
const actionLoadingId = ref<string | null>(null)
const isActionLoading = (id: string) => actionLoadingId.value === id

// Bulk selection
const selectedIds = ref<Set<string>>(new Set())
const isSelected = (id: string) => selectedIds.value.has(id)
const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value) // trigger reactivity
}
const selectAll = () => {
  if (selectedIds.value.size === filteredListings.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredListings.value.map(l => l.id))
  }
}
const clearSelection = () => {
  selectedIds.value = new Set()
}
const bulkLoading = ref(false)

// Add modal state
const showAddModal = ref(false)

// Confirm dialog state
const confirmDialog = ref<{
  open: boolean
  title: string
  description: string
  action: () => Promise<void>
  loading: boolean
}>({
  open: false,
  title: '',
  description: '',
  action: async () => {},
  loading: false
})

const openConfirmDialog = (title: string, description: string, action: () => Promise<void>) => {
  confirmDialog.value = { open: true, title, description, action, loading: false }
}

const handleConfirm = async () => {
  confirmDialog.value.loading = true
  await confirmDialog.value.action()
  confirmDialog.value.loading = false
  confirmDialog.value.open = false
}
const availableJobs = ref<Job[]>([])
const searchQuery = ref('')
const selectedJob = ref<Job | null>(null)
const jobSelectorOpen = ref(false)
const newStartDate = ref('')
const newEndDate = ref('')
const newDisplayOrder = ref(0)
const newIsPinned = ref(false)
const addingListing = ref(false)

// Load data
const loadData = async () => {
  loading.value = true
  error.value = null

  const [listingsResult, pendingResult] = await Promise.all([
    fetchAllFeaturedListings(),
    fetchPendingRequests()
  ])
  
  if (listingsResult.error) {
    error.value = listingsResult.error
  } else {
    // Filter out pending from main listings (they'll show in pending tab)
    listings.value = (listingsResult.data || []).filter(l => l.status !== 'pending')
  }
  
  pendingRequests.value = pendingResult.data || []
  
  loading.value = false
}

onMounted(loadData)

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Reset page when filter changes
watch(statusFilter, () => {
  currentPage.value = 1
})

// Filtered listings (before pagination)
const filteredListingsAll = computed(() => {
  if (statusFilter.value === 'pending') return pendingRequests.value
  if (statusFilter.value === 'all') return listings.value
  return listings.value.filter(l => getStatus(l.starts_at, l.ends_at) === statusFilter.value)
})

// Paginated listings
const totalPages = computed(() => Math.ceil(filteredListingsAll.value.length / pageSize.value))
const filteredListings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredListingsAll.value.slice(start, start + pageSize.value)
})

// Filtered jobs for combobox
const filteredJobs = computed(() => {
  if (!searchQuery.value) return availableJobs.value
  const q = searchQuery.value.toLowerCase()
  return availableJobs.value.filter((job: Job) => 
    job.title?.toLowerCase().includes(q) || 
    job.company?.toLowerCase().includes(q) ||
    job.location?.toLowerCase().includes(q)
  )
})

// Stats
const stats = computed(() => ({
  total: listings.value.length,
  pending: pendingRequests.value.length,
  active: listings.value.filter(l => getStatus(l.starts_at, l.ends_at) === 'active').length,
  scheduled: listings.value.filter(l => getStatus(l.starts_at, l.ends_at) === 'scheduled').length,
  expired: listings.value.filter(l => getStatus(l.starts_at, l.ends_at) === 'expired').length,
  totalImpressions: listings.value.reduce((sum, l) => sum + l.impressions, 0),
  totalClicks: listings.value.reduce((sum, l) => sum + l.clicks, 0)
}))

// Helpers
const getStatusBadge = (status: ListingStatus) => {
  switch (status) {
    case 'active':
      return { label: 'Active', class: 'bg-green-500/10 text-green-600 dark:text-green-400' }
    case 'scheduled':
      return { label: 'Scheduled', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    case 'expired':
      return { label: 'Expired', class: 'bg-muted text-muted-foreground' }
  }
}

const calculateCTR = (impressions: number, clicks: number): string => {
  if (impressions === 0) return '0%'
  return `${((clicks / impressions) * 100).toFixed(2)}%`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// Actions
const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const handleTogglePinned = async (listing: FeaturedListingWithJob) => {
  // Optimistic update
  const originalValue = listing.is_pinned
  listing.is_pinned = !listing.is_pinned
  
  actionLoadingId.value = `pin-${listing.id}`
  const result = await updateFeaturedListing(listing.id, { is_pinned: !originalValue })
  actionLoadingId.value = null
  
  if (result.success) {
    toast.success(originalValue ? 'Unpinned' : 'Pinned')
    // Log activity
    logActivity({
      action: originalValue ? 'unpin' : 'pin',
      entity_type: 'featured_listing',
      entity_id: listing.id,
      details: { job_title: listing.job?.title, company: listing.job?.company }
    })
  } else {
    // Revert on error
    listing.is_pinned = originalValue
    toast.error(result.error || 'Failed to update')
  }
}

const handleRemove = (id: string) => {
  const listing = listings.value.find(l => l.id === id)
  openConfirmDialog(
    'Remove Featured Listing',
    'This will remove the listing from featured positions. This action cannot be undone.',
    async () => {
      const result = await removeFeaturedListing(id)
      if (result.success) {
        toast.success('Listing removed')
        logActivity({
          action: 'delete',
          entity_type: 'featured_listing',
          entity_id: id,
          details: { job_title: listing?.job?.title, company: listing?.job?.company }
        })
        await loadData()
      } else {
        toast.error(result.error || 'Failed to remove')
      }
    }
  )
}

const handleUpdateDates = async (listing: FeaturedListingWithJob, starts_at: string, ends_at: string) => {
  const result = await updateFeaturedListing(listing.id, { starts_at, ends_at })
  if (result.success) {
    toast.success('Dates updated')
    await loadData()
  } else {
    toast.error(result.error || 'Failed to update dates')
  }
}

// Quick extend by 30 days
const handleExtend30Days = async (listing: FeaturedListingWithJob) => {
  // Optimistic update
  const originalEndDate = listing.ends_at
  const currentEnd = new Date(listing.ends_at)
  const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000)
  listing.ends_at = newEnd.toISOString()
  
  actionLoadingId.value = `extend-${listing.id}`
  const result = await updateFeaturedListing(listing.id, { 
    ends_at: newEnd.toISOString() 
  })
  actionLoadingId.value = null
  
  if (result.success) {
    toast.success('Extended by 30 days')
  } else {
    // Revert on error
    listing.ends_at = originalEndDate
    toast.error(result.error || 'Failed to extend')
  }
}

// Add modal handlers
const openAddModal = async () => {
  showAddModal.value = true
  searchQuery.value = ''
  selectedJob.value = null
  jobSelectorOpen.value = false
  newStartDate.value = new Date().toISOString()
  newEndDate.value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  newDisplayOrder.value = 0
  newIsPinned.value = false
  
  const { data } = await fetchAvailableJobs()
  availableJobs.value = data || []
}

const selectJob = (job: Job) => {
  selectedJob.value = job
  jobSelectorOpen.value = false
  searchQuery.value = ''
}

const handleAddListing = async () => {
  if (!selectedJob.value || !newStartDate.value || !newEndDate.value) {
    toast.error('Please select a job and date range')
    return
  }

  addingListing.value = true
  const result = await addFeaturedListing({
    job_id: selectedJob.value.id,
    starts_at: newStartDate.value,
    ends_at: newEndDate.value,
    display_order: newDisplayOrder.value,
    is_pinned: newIsPinned.value
  })

  if (result.success) {
    toast.success('Featured listing added')
    logActivity({
      action: 'create',
      entity_type: 'featured_listing',
      details: { job_title: selectedJob.value?.title, company: selectedJob.value?.company }
    })
    showAddModal.value = false
    await loadData()
  } else {
    toast.error(result.error || 'Failed to add listing')
  }
  addingListing.value = false
}

// Approve/Reject handlers for pending requests
const handleApprove = async (listing: FeaturedListingWithJob) => {
  const result = await approveFeaturedListing(listing.id)
  if (result.success) {
    toast.success('Listing approved!', {
      description: 'Featured listing is now active for 30 days.'
    })
    logActivity({
      action: 'approve',
      entity_type: 'featured_listing',
      entity_id: listing.id,
      details: { job_title: listing.job?.title, company: listing.job?.company }
    })
    await loadData()
  } else {
    toast.error(result.error || 'Failed to approve')
  }
}

const handleReject = (listing: FeaturedListingWithJob) => {
  openConfirmDialog(
    'Reject Request',
    'This will reject the featured listing request. The requester will not be notified automatically.',
    async () => {
      const result = await rejectFeaturedListing(listing.id)
      if (result.success) {
        toast.success('Request rejected')
        logActivity({
          action: 'reject',
          entity_type: 'featured_listing',
          entity_id: listing.id,
          details: { job_title: listing.job?.title, company: listing.job?.company }
        })
        await loadData()
      } else {
        toast.error(result.error || 'Failed to reject')
      }
    }
  )
}

// Bulk actions
const handleBulkDelete = () => {
  if (selectedIds.value.size === 0) return
  openConfirmDialog(
    `Delete ${selectedIds.value.size} Listings`,
    `This will permanently remove ${selectedIds.value.size} featured listing(s). This action cannot be undone.`,
    async () => {
      bulkLoading.value = true
      let successCount = 0
      let errorCount = 0
      for (const id of selectedIds.value) {
        const result = await removeFeaturedListing(id)
        if (result.success) successCount++
        else errorCount++
      }
      bulkLoading.value = false
      clearSelection()
      await loadData()
      if (errorCount === 0) {
        toast.success(`Deleted ${successCount} listing(s)`)
      } else {
        toast.warning(`Deleted ${successCount}, failed ${errorCount}`)
      }
    }
  )
}

const handleBulkExtend = async () => {
  if (selectedIds.value.size === 0) return
  bulkLoading.value = true
  let successCount = 0
  let errorCount = 0
  for (const id of selectedIds.value) {
    const listing = listings.value.find(l => l.id === id)
    if (!listing) continue
    const currentEnd = new Date(listing.ends_at)
    const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000)
    const result = await updateFeaturedListing(id, { ends_at: newEnd.toISOString() })
    if (result.success) successCount++
    else errorCount++
  }
  bulkLoading.value = false
  clearSelection()
  await loadData()
  if (errorCount === 0) {
    toast.success(`Extended ${successCount} listing(s) by 30 days`)
  } else {
    toast.warning(`Extended ${successCount}, failed ${errorCount}`)
  }
}

// CSV Export
const handleExportCSV = () => {
  const dataToExport = statusFilter.value === 'pending' ? pendingRequests.value : filteredListingsAll.value
  
  if (dataToExport.length === 0) {
    toast.error('No data to export')
    return
  }

  // CSV headers
  const headers = [
    'Job Title',
    'Company',
    'Location',
    'Status',
    'Is Pinned',
    'Display Order',
    'Impressions',
    'Clicks',
    'CTR',
    'Start Date',
    'End Date',
    'Created At'
  ]

  // CSV rows
  const rows = dataToExport.map(listing => {
    const status = listing.status === 'pending' ? 'Pending' : getStatus(listing.starts_at, listing.ends_at)
    const ctr = listing.impressions > 0 ? ((listing.clicks / listing.impressions) * 100).toFixed(2) + '%' : '0%'
    
    return [
      listing.job?.title || 'Unknown',
      listing.job?.company || 'Unknown',
      listing.job?.location || 'Unknown',
      status,
      listing.is_pinned ? 'Yes' : 'No',
      listing.display_order,
      listing.impressions,
      listing.clicks,
      ctr,
      formatDate(listing.starts_at),
      formatDate(listing.ends_at),
      formatDate(listing.created_at)
    ]
  })

  // Build CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or quote
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"'
      }
      return cellStr
    }).join(','))
  ].join('\n')

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `featured-listings-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.success(`Exported ${dataToExport.length} listings to CSV`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Featured Listings</h2>
        <!-- Pending badge if there are pending requests -->
        <Badge 
          v-if="stats.pending > 0" 
          variant="destructive"
          class="animate-pulse"
        >
          {{ stats.pending }} Pending
        </Badge>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="handleExportCSV">
          <Icon name="mdi:download" class="w-4 h-4 mr-1.5" />
          Export CSV
        </Button>
        <Button size="sm" @click="openAddModal">
          <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
          Add Listing
        </Button>
        <Select v-model="statusFilter">
          <SelectTrigger class="w-40 h-8">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({{ stats.total }})</SelectItem>
            <SelectItem value="pending">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                Pending ({{ stats.pending }})
              </span>
            </SelectItem>
            <SelectItem value="active">Active ({{ stats.active }})</SelectItem>
            <SelectItem value="scheduled">Scheduled ({{ stats.scheduled }})</SelectItem>
            <SelectItem value="expired">Expired ({{ stats.expired }})</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.total }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-green-600 dark:text-green-400">{{ stats.active }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono" :class="stats.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">{{ stats.pending }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalImpressions.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Impressions</p>
      </div>
      <div class="space-y-1">
        <p class="text-2xl font-bold font-mono text-foreground">{{ stats.totalClicks.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Clicks</p>
      </div>
    </div>

    <!-- Bulk Actions Toolbar -->
    <div 
      v-if="selectedIds.size > 0 && statusFilter !== 'pending'" 
      class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
    >
      <span class="text-sm font-medium">{{ selectedIds.size }} selected</span>
      <div class="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" :disabled="bulkLoading" @click="handleBulkExtend">
          <Spinner v-if="bulkLoading" class="w-4 h-4 mr-1.5" />
          <Icon v-else name="mdi:calendar-plus" class="w-4 h-4 mr-1.5" />
          Extend 30 Days
        </Button>
        <Button variant="outline" size="sm" class="text-destructive" :disabled="bulkLoading" @click="handleBulkDelete">
          <Icon name="mdi:delete-outline" class="w-4 h-4 mr-1.5" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" @click="clearSelection">
          Clear
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>

    <!-- Error -->
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Empty -->
    <Empty v-else-if="filteredListings.length === 0">
      <EmptyMedia variant="icon">
        <Icon name="mdi:star-outline" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle>
        {{ statusFilter === 'pending' ? 'No pending requests' : 'No featured listings' }}
      </EmptyTitle>
      <EmptyDescription>
        {{ statusFilter === 'pending' 
          ? 'All listing requests have been reviewed.' 
          : 'Add jobs to feature them on the homepage.' 
        }}
      </EmptyDescription>
      <Button v-if="statusFilter !== 'pending'" size="sm" class="mt-4" @click="openAddModal">
        <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
        Add Featured Listing
      </Button>
    </Empty>

    <!-- Listings table -->
    <div v-else class="border-y border-border divide-y divide-border">
      <!-- Select all header (only for non-pending) -->
      <div v-if="statusFilter !== 'pending' && filteredListings.length > 0" class="flex items-center gap-3 px-4 py-2 bg-muted/30">
        <Checkbox 
          :checked="selectedIds.size === filteredListings.length && filteredListings.length > 0"
          :indeterminate="selectedIds.size > 0 && selectedIds.size < filteredListings.length"
          @update:checked="selectAll"
        />
        <span class="text-xs text-muted-foreground">Select all</span>
      </div>
      <div v-for="listing in filteredListings" :key="listing.id" class="group">
        <div 
          class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors"
          :class="[
            listing.status === 'pending' ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'hover:bg-muted/30',
            isSelected(listing.id) && 'bg-primary/5'
          ]"
        >
          <!-- Checkbox (only for non-pending) -->
          <Checkbox 
            v-if="listing.status !== 'pending'"
            :checked="isSelected(listing.id)"
            class="shrink-0"
            @update:checked="toggleSelection(listing.id)"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <!-- Pending status badge -->
              <span 
                v-if="listing.status === 'pending'"
                class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-500/10 text-orange-600 dark:text-orange-400"
              >
                Pending Request
              </span>
              <!-- Regular status badge (for non-pending) -->
              <span 
                v-else
                :class="getStatusBadge(getStatus(listing.starts_at, listing.ends_at)).class" 
                class="px-1.5 py-0.5 text-[10px] font-medium rounded"
              >
                {{ getStatusBadge(getStatus(listing.starts_at, listing.ends_at)).label }}
              </span>
              <span v-if="listing.is_pinned && listing.status !== 'pending'" class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary">
                Pinned
              </span>
              <span v-if="listing.status !== 'pending'" class="text-[10px] text-muted-foreground">
                Order: {{ listing.display_order }}
              </span>
              <!-- Time since request for pending -->
              <span v-if="listing.status === 'pending' && listing.request_data?.requested_at" class="text-[10px] text-orange-600 dark:text-orange-400">
                {{ getTimeAgo(listing.request_data.requested_at) }}
              </span>
            </div>
            <h3 class="font-semibold text-foreground truncate">{{ listing.job?.title || 'Unknown Job' }}</h3>
            <p class="text-sm text-muted-foreground truncate">
              {{ listing.job?.company }} · {{ listing.job?.location }}
            </p>
            
            <!-- Contact info for pending requests -->
            <div v-if="listing.status === 'pending' && listing.request_data" class="mt-2 p-2 bg-muted/50 text-xs space-y-0.5">
              <p class="font-medium text-foreground">{{ listing.request_data.contact_name }}</p>
              <p class="text-muted-foreground flex items-center gap-1">
                <Icon name="mdi:email-outline" class="w-3 h-3" />
                <a :href="`mailto:${listing.request_data.contact_email}`" class="hover:text-primary">
                  {{ listing.request_data.contact_email }}
                </a>
              </p>
              <p v-if="listing.request_data.contact_phone" class="text-muted-foreground flex items-center gap-1">
                <Icon name="mdi:phone-outline" class="w-3 h-3" />
                <a :href="`tel:${listing.request_data.contact_phone}`" class="hover:text-primary">
                  {{ listing.request_data.contact_phone }}
                </a>
              </p>
            </div>
            
            <p v-if="listing.status !== 'pending'" class="text-xs text-muted-foreground/70 mt-1">
              {{ formatDate(listing.starts_at) }} - {{ formatDate(listing.ends_at) }}
            </p>
          </div>
          
          <!-- Stats (only for non-pending) -->
          <div v-if="listing.status !== 'pending'" class="flex items-center gap-4 sm:gap-6 text-center shrink-0">
            <div>
              <p class="text-lg font-mono font-semibold text-foreground">{{ listing.impressions.toLocaleString() }}</p>
              <p class="text-[10px] text-muted-foreground uppercase">Impressions</p>
            </div>
            <div>
              <p class="text-lg font-mono font-semibold text-foreground">{{ listing.clicks.toLocaleString() }}</p>
              <p class="text-[10px] text-muted-foreground uppercase">Clicks</p>
            </div>
            <div>
              <p class="text-lg font-mono font-semibold text-foreground">{{ calculateCTR(listing.impressions, listing.clicks) }}</p>
              <p class="text-[10px] text-muted-foreground uppercase">CTR</p>
            </div>
          </div>

          <!-- Actions for pending requests -->
          <div v-if="listing.status === 'pending'" class="flex items-center gap-2 shrink-0">
            <Button size="sm" @click="handleApprove(listing)">
              <Icon name="mdi:check" class="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button variant="ghost" size="sm" class="text-destructive" @click="handleReject(listing)">
              <Icon name="mdi:close" class="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>

          <!-- Actions for regular listings -->
          <div v-else class="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    :disabled="isActionLoading(`extend-${listing.id}`)"
                    @click="handleExtend30Days(listing)"
                  >
                    <Spinner v-if="isActionLoading(`extend-${listing.id}`)" class="w-4 h-4" />
                    <Icon v-else name="mdi:calendar-plus" class="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Extend 30 days</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon-sm" @click="toggleExpand(listing.id)">
              <Icon :name="expandedId === listing.id ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    :disabled="isActionLoading(`pin-${listing.id}`)"
                    @click="handleTogglePinned(listing)"
                  >
                    <Spinner v-if="isActionLoading(`pin-${listing.id}`)" class="w-4 h-4" />
                    <Icon 
                      v-else 
                      :name="listing.is_pinned ? 'mdi:pin' : 'mdi:pin-outline'" 
                      class="w-4 h-4"
                      :class="listing.is_pinned ? 'text-primary' : 'text-muted-foreground/60'"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ listing.is_pinned ? 'Unpin from top' : 'Pin to top' }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon-sm" class="text-destructive" @click="handleRemove(listing.id)">
              <Icon name="mdi:delete-outline" class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Expanded details (only for non-pending) -->
        <div v-if="expandedId === listing.id && listing.status !== 'pending'" class="px-4 pb-4 pt-0 bg-muted/20">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div class="space-y-3">
              <div>
                <Label class="text-[10px] uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <DateTimePicker
                  :model-value="listing.starts_at"
                  @update:model-value="(v: string) => handleUpdateDates(listing, v, listing.ends_at)"
                  class="mt-1"
                />
              </div>
              <div>
                <Label class="text-[10px] uppercase tracking-wider text-muted-foreground">End Date</Label>
                <DateTimePicker
                  :model-value="listing.ends_at"
                  @update:model-value="(v: string) => handleUpdateDates(listing, listing.starts_at, v)"
                  class="mt-1"
                />
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Job ID</p>
                <p class="text-xs font-mono text-muted-foreground">{{ listing.job_id }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Listing ID</p>
                <p class="text-xs font-mono text-muted-foreground">{{ listing.id }}</p>
              </div>
              <div v-if="listing.job?.clearance_required">
                <p class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Clearance</p>
                <p class="text-sm text-foreground">{{ listing.job.clearance_required }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredListingsAll.length > pageSize && !loading" class="flex items-center justify-between pt-4">
      <p class="text-sm text-muted-foreground">
        Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredListingsAll.length) }} of {{ filteredListingsAll.length }}
      </p>
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <Icon name="mdi:chevron-left" class="w-4 h-4" />
          Previous
        </Button>
        <span class="text-sm text-muted-foreground px-2">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Next
          <Icon name="mdi:chevron-right" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Add Modal -->
    <Dialog v-model:open="showAddModal">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Featured Listing</DialogTitle>
          <DialogDescription>Select a job and configure its featured display period.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Job Selector with Popover/Command -->
          <div class="space-y-2">
            <Label>Select Job</Label>
            <Popover v-model:open="jobSelectorOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  role="combobox"
                  :aria-expanded="jobSelectorOpen"
                  class="w-full justify-between h-auto min-h-10 py-2"
                >
                  <div v-if="selectedJob" class="text-left">
                    <p class="font-medium text-sm">{{ selectedJob.title }}</p>
                    <p class="text-xs text-muted-foreground">{{ selectedJob.company }} · {{ selectedJob.location }}</p>
                  </div>
                  <span v-else class="text-muted-foreground">Select a job...</span>
                  <Icon name="mdi:chevron-down" class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput v-model="searchQuery" placeholder="Search jobs..." />
                  <CommandList>
                    <CommandEmpty>No jobs found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        v-for="job in filteredJobs"
                        :key="job.id"
                        :value="job.id"
                        @select="selectJob(job)"
                        class="flex flex-col items-start gap-1 py-3"
                      >
                        <div class="flex items-center justify-between w-full">
                          <span class="font-medium">{{ job.title }}</span>
                          <Icon 
                            v-if="selectedJob?.id === job.id" 
                            name="mdi:check" 
                            class="h-4 w-4 text-primary" 
                          />
                        </div>
                        <span class="text-xs text-muted-foreground">
                          {{ job.company }} · {{ job.location }}
                        </span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <DateTimePicker v-model="newStartDate" class="mt-1" />
            </div>
            <div>
              <Label>End Date</Label>
              <DateTimePicker v-model="newEndDate" class="mt-1" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>Display Order</Label>
              <Input v-model.number="newDisplayOrder" type="number" min="0" class="mt-1 hide-spinners" />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 cursor-pointer">
                <Checkbox id="pin-job" v-model:checked="newIsPinned" />
                <span class="text-sm">Pin to top</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showAddModal = false">Cancel</Button>
          <Button :disabled="!selectedJob || addingListing" @click="handleAddListing">
            <Spinner v-if="addingListing" class="w-4 h-4 mr-1.5" />
            Add Listing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :loading="confirmDialog.loading"
      variant="destructive"
      confirm-text="Confirm"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.hide-spinners::-webkit-inner-spin-button,
.hide-spinners::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hide-spinners {
  -moz-appearance: textfield;
}
</style>
