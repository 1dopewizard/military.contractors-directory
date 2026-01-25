<!--
  @file PipelineLogViewer.vue
  @description Historical log viewer for pipeline jobs from Supabase
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface LogJob {
  name: string // job_id
  script: string
  status: string
  size: number
  sizeFormatted: string
  lineCount: number
  modifiedAt: string
  createdAt: string
}

interface LogStats {
  totalFiles: number
  totalSize: number
  totalSizeFormatted: string
  totalLines: number
  oldestFile: string | null
  newestFile: string | null
}

interface SearchResult {
  jobId: string
  script: string
  status: string
  startedAt: string
  line: number
  content: string
  context: {
    before: string[]
    after: string[]
  }
}

// State
const jobs = ref<LogJob[]>([])
const stats = ref<LogStats | null>(null)
const selectedJob = ref<string | null>(null)
const selectedJobInfo = ref<{ script: string; status: string } | null>(null)
const fileContent = ref<string[]>([])
const isLoadingJobs = ref(false)
const isLoadingContent = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)

// Fetch job list
const fetchJobs = async () => {
  isLoadingJobs.value = true
  try {
    const data = await $fetch<{ files: LogJob[], stats: LogStats }>('/api/admin/pipeline/log-list')
    jobs.value = data.files
    stats.value = data.stats
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load job logs')
  } finally {
    isLoadingJobs.value = false
  }
}

// Fetch job log content
const fetchJobContent = async (jobId: string) => {
  selectedJob.value = jobId
  const job = jobs.value.find(j => j.name === jobId)
  selectedJobInfo.value = job ? { script: job.script, status: job.status } : null
  isLoadingContent.value = true
  fileContent.value = []
  
  try {
    const data = await $fetch<{ lines: string[] }>('/api/admin/pipeline/log-read', {
      query: { file: jobId, limit: 2000 }
    })
    fileContent.value = data.lines
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load job logs')
    selectedJob.value = null
    selectedJobInfo.value = null
  } finally {
    isLoadingContent.value = false
  }
}

// Search across all logs
const searchLogs = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  try {
    const data = await $fetch<{ results: SearchResult[] }>('/api/admin/pipeline/log-search', {
      query: { q: searchQuery.value, limit: 50 }
    })
    searchResults.value = data.results
  } catch (err: any) {
    toast.error(err.data?.message || 'Search failed')
  } finally {
    isSearching.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(searchLogs, 300)

watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    debouncedSearch()
  } else {
    searchResults.value = []
  }
})

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    case 'cancelled': return 'text-yellow-500'
    case 'running': return 'text-blue-500'
    default: return 'text-muted-foreground'
  }
}

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'mdi:check-circle'
    case 'failed': return 'mdi:alert-circle'
    case 'cancelled': return 'mdi:cancel'
    case 'running': return 'mdi:play-circle'
    default: return 'mdi:help-circle'
  }
}

// Close viewer
const closeViewer = () => {
  selectedJob.value = null
  selectedJobInfo.value = null
  fileContent.value = []
}

// Download logs
const downloadLogs = async (jobId: string) => {
  try {
    const data = await $fetch<{ lines: string[] }>('/api/admin/pipeline/log-read', {
      query: { file: jobId, limit: 100000 }
    })
    
    const content = data.lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${jobId}.log`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs downloaded')
  } catch (err: any) {
    toast.error('Failed to download logs')
  }
}

// Initialize
onMounted(() => {
  fetchJobs()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header with search -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Job Logs</h3>
        <span v-if="stats" class="text-xs text-muted-foreground">
          {{ stats.totalFiles }} jobs · {{ stats.totalLines.toLocaleString() }} lines
        </span>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="relative">
          <Icon name="mdi:magnify" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Search all logs..."
            class="pl-8 w-48 h-8"
          />
          <Spinner
            v-if="isSearching"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
        </div>
        <Button variant="ghost" size="sm" @click="fetchJobs">
          <Icon name="mdi:refresh" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Search results -->
    <div v-if="searchResults.length > 0" class="border border-border p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium">Search Results ({{ searchResults.length }})</h4>
        <Button variant="ghost" size="sm" @click="searchQuery = ''; searchResults = []">
          Clear
        </Button>
      </div>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(result, idx) in searchResults"
          :key="idx"
          class="p-2 bg-muted/50 hover:bg-muted cursor-pointer text-xs font-mono"
          @click="fetchJobContent(result.jobId)"
        >
          <div class="flex items-center gap-2 text-muted-foreground mb-1">
            <Icon :name="getStatusIcon(result.status)" :class="['w-3 h-3', getStatusColor(result.status)]" />
            <span class="font-sans font-medium">{{ result.script }}</span>
            <span class="text-muted-foreground/60">line {{ result.line }}</span>
            <span class="text-muted-foreground/40 ml-auto">{{ formatDate(result.startedAt) }}</span>
          </div>
          <div class="text-foreground truncate">{{ result.content }}</div>
        </div>
      </div>
    </div>

    <!-- Job list or content viewer -->
    <!-- Loading -->
    <div v-if="isLoadingJobs" class="flex items-center justify-center py-12">
      <Spinner class="w-6 h-6 text-muted-foreground" />
    </div>

    <!-- Empty state -->
    <Empty v-else-if="jobs.length === 0" class="border">
      <EmptyMedia variant="icon">
        <Icon name="mdi:file-document-remove-outline" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle class="text-base">No job logs found</EmptyTitle>
      <EmptyDescription>Job logs will appear here after running pipeline scripts.</EmptyDescription>
    </Empty>

    <div v-else class="grid gap-4" :class="selectedJob ? 'lg:grid-cols-[1fr_400px]' : ''">
      <!-- Job list -->
      <div class="divide-y divide-border/30" :class="selectedJob ? 'hidden lg:block' : ''">
        <button
          v-for="job in jobs"
          :key="job.name"
          class="w-full flex items-center gap-4 py-3 first:pt-0 text-left hover:bg-muted/30 transition-colors px-2 -mx-2"
          :class="{ 'bg-primary/5': selectedJob === job.name }"
          @click="fetchJobContent(job.name)"
        >
          <Icon :name="getStatusIcon(job.status)" :class="['w-5 h-5 shrink-0', getStatusColor(job.status)]" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-sm">{{ job.script }}</span>
              <span class="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                {{ job.lineCount }} lines
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5 truncate">
              {{ formatDate(job.createdAt) }}
              <span class="text-muted-foreground/50 mx-1">·</span>
              <span class="font-mono text-[10px]">{{ job.name.slice(0, 20) }}...</span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 shrink-0"
            title="Download"
            @click.stop="downloadLogs(job.name)"
          >
            <Icon name="mdi:download" class="w-4 h-4" />
          </Button>
        </button>
      </div>

      <!-- Content viewer -->
      <div v-if="selectedJob" class="border border-border overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <div class="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 lg:hidden"
              @click="closeViewer"
            >
              <Icon name="mdi:arrow-left" class="w-4 h-4" />
            </Button>
            <Icon 
              v-if="selectedJobInfo" 
              :name="getStatusIcon(selectedJobInfo.status)" 
              :class="['w-4 h-4 shrink-0', getStatusColor(selectedJobInfo.status)]" 
            />
            <span class="text-sm font-medium truncate">
              {{ selectedJobInfo?.script || selectedJob }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              @click="downloadLogs(selectedJob)"
            >
              <Icon name="mdi:download" class="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 hidden lg:flex"
              @click="closeViewer"
            >
              <Icon name="mdi:close" class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div v-if="isLoadingContent" class="flex items-center justify-center py-12">
          <Spinner class="w-6 h-6 text-muted-foreground" />
        </div>

        <PipelineLogTerminal
          v-else
          :logs="fileContent"
          :title="selectedJobInfo?.script || selectedJob"
          max-height="32rem"
          :auto-scroll="false"
        />
      </div>

      <!-- Empty state when no job selected -->
      <Empty v-else-if="!selectedJob && jobs.length > 0" class="hidden lg:flex">
        <EmptyMedia variant="icon">
          <Icon name="mdi:file-document-outline" class="w-6 h-6" />
        </EmptyMedia>
        <EmptyTitle>Select a job</EmptyTitle>
        <EmptyDescription>Choose a job from the list to view its logs</EmptyDescription>
      </Empty>
    </div>
  </div>
</template>
