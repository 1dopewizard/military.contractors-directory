<!--
  @file JobHistory.vue
  @description Job history table with filtering, sorting, and detailed view
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Job {
  id: string
  script: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt: string | null
  logs: string[]
  exitCode?: number
  error?: string
  dryRun: boolean
  args?: Record<string, any>
}

interface ScriptConfig {
  name: string
}

// State
const jobs = ref<Job[]>([])
const total = ref(0)
const scripts = ref<Record<string, ScriptConfig>>({})
const isLoading = ref(false)

// Filters
const filterScript = ref<string>('__all__')
const filterStatus = ref<string>('__all__')
const page = ref(1)
const limit = 20

// Selected job for detail view
const selectedJob = ref<Job | null>(null)

// Fetch jobs
const fetchJobs = async () => {
  isLoading.value = true
  try {
    const query: Record<string, any> = {
      limit,
      offset: (page.value - 1) * limit
    }
    if (filterScript.value && filterScript.value !== '__all__') query.script = filterScript.value
    if (filterStatus.value && filterStatus.value !== '__all__') query.status = filterStatus.value
    
    const [historyData, statusData] = await Promise.all([
      $fetch<{ jobs: Job[], total: number }>('/api/admin/pipeline/history', { query }),
      $fetch<{ scripts: Record<string, ScriptConfig> }>('/api/admin/pipeline/status')
    ])
    
    jobs.value = historyData.jobs
    total.value = historyData.total
    scripts.value = statusData.scripts
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load job history')
  } finally {
    isLoading.value = false
  }
}

// Watch filters
watch([filterScript, filterStatus], () => {
  page.value = 1
  fetchJobs()
})

watch(page, fetchJobs)

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format duration
const formatDuration = (startedAt: string, completedAt: string | null) => {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const seconds = Math.floor((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return { label: 'Running', class: 'bg-blue-500/10 text-blue-500', icon: 'mdi:loading' }
    case 'completed':
      return { label: 'Completed', class: 'bg-green-500/10 text-green-500', icon: 'mdi:check-circle' }
    case 'failed':
      return { label: 'Failed', class: 'bg-red-500/10 text-red-500', icon: 'mdi:alert-circle' }
    case 'cancelled':
      return { label: 'Cancelled', class: 'bg-amber-500/10 text-amber-500', icon: 'mdi:cancel' }
    default:
      return { label: status, class: 'bg-muted text-muted-foreground', icon: 'mdi:help-circle' }
  }
}

// Pagination
const totalPages = computed(() => Math.ceil(total.value / limit))
const canPrev = computed(() => page.value > 1)
const canNext = computed(() => page.value < totalPages.value)

// Script options for filter
const scriptOptions = computed(() => Object.entries(scripts.value).map(([key, cfg]) => ({
  value: key,
  label: cfg.name
})))

// Close detail view
const closeDetail = () => {
  selectedJob.value = null
}

// Initialize
onMounted(fetchJobs)
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <Select v-model="filterScript">
          <SelectTrigger class="w-44">
            <SelectValue placeholder="All scripts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All scripts</SelectItem>
            <SelectItem v-for="opt in scriptOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="filterStatus">
          <SelectTrigger class="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="running">Running</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{{ total }} total</span>
        <Button variant="ghost" size="sm" @click="fetchJobs">
          <Icon name="mdi:refresh" class="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner class="w-6 h-6 text-muted-foreground" />
    </div>

    <!-- Job list and detail view -->
    <div v-else class="grid gap-4" :class="selectedJob ? 'lg:grid-cols-[1fr_400px]' : ''">
      <!-- Empty state -->
      <Empty v-if="jobs.length === 0" class="border">
        <EmptyMedia variant="icon">
          <Icon name="mdi:history" class="w-6 h-6" />
        </EmptyMedia>
        <EmptyTitle class="text-base">No jobs found</EmptyTitle>
        <EmptyDescription>Run a pipeline script to see job history here.</EmptyDescription>
      </Empty>

      <!-- Job list -->
      <div v-else class="divide-y divide-border/30">
        <button
          v-for="job in jobs"
          :key="job.id"
          class="w-full flex items-center gap-4 py-3 first:pt-0 text-left hover:bg-muted/30 transition-colors px-2 -mx-2 rounded"
          :class="{ 'bg-primary/5': selectedJob?.id === job.id }"
          @click="selectedJob = job"
        >
          <Spinner v-if="job.status === 'running'" class="w-5 h-5 shrink-0 text-blue-500" />
          <Icon
            v-else
            :name="getStatusBadge(job.status).icon"
            class="w-5 h-5 shrink-0"
            :class="getStatusBadge(job.status).class.split(' ')[1]"
          />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-sm">
                {{ scripts[job.script]?.name || job.script }}
              </span>
              <span :class="getStatusBadge(job.status).class" class="px-1.5 py-0.5 text-[10px] font-medium rounded">
                {{ getStatusBadge(job.status).label }}
              </span>
              <span v-if="job.dryRun" class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500">
                Dry Run
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ formatDate(job.startedAt) }} · {{ formatDuration(job.startedAt, job.completedAt) }}
            </p>
          </div>
        </button>
      </div>

      <!-- Detail panel -->
      <div v-if="selectedJob" class="border border-border p-4 rounded-lg h-fit sticky top-4">
        <div class="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 class="font-medium text-foreground">
              {{ scripts[selectedJob.script]?.name || selectedJob.script }}
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ formatDate(selectedJob.startedAt) }}
            </p>
          </div>
          <Button variant="ghost" size="icon" class="h-6 w-6" @click="closeDetail">
            <Icon name="mdi:close" class="w-4 h-4" />
          </Button>
        </div>

        <!-- Details -->
        <div class="space-y-3 text-sm mb-4">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Status</span>
            <span :class="getStatusBadge(selectedJob.status).class" class="px-2 py-0.5 text-xs font-medium rounded">
              {{ getStatusBadge(selectedJob.status).label }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Duration</span>
            <span class="text-foreground">{{ formatDuration(selectedJob.startedAt, selectedJob.completedAt) }}</span>
          </div>
          <div v-if="selectedJob.exitCode !== undefined" class="flex items-center justify-between">
            <span class="text-muted-foreground">Exit Code</span>
            <span :class="selectedJob.exitCode === 0 ? 'text-green-500' : 'text-red-500'">
              {{ selectedJob.exitCode }}
            </span>
          </div>
          <div v-if="selectedJob.dryRun" class="flex items-center justify-between">
            <span class="text-muted-foreground">Dry Run</span>
            <span class="text-amber-500">Yes</span>
          </div>
          <div v-if="selectedJob.error" class="pt-2 border-t border-border">
            <span class="text-muted-foreground text-xs">Error</span>
            <p class="text-red-400 text-xs mt-1 font-mono">{{ selectedJob.error }}</p>
          </div>
          <div v-if="selectedJob.args && Object.keys(selectedJob.args).length > 0" class="pt-2 border-t border-border">
            <span class="text-muted-foreground text-xs">Arguments</span>
            <pre class="text-xs mt-1 font-mono text-foreground bg-muted p-2 overflow-auto">{{ JSON.stringify(selectedJob.args, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Logs -->
        <div v-if="selectedJob.logs.length > 0">
          <h4 class="text-xs font-medium text-muted-foreground mb-2">Logs ({{ selectedJob.logs.length }} lines)</h4>
          <PipelineLogTerminal
            :logs="selectedJob.logs"
            title="Job Logs"
            max-height="16rem"
            :auto-scroll="false"
          />
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="ghost" size="sm" :disabled="!canPrev" @click="page--">
        <Icon name="mdi:chevron-left" class="w-4 h-4" />
      </Button>
      <span class="text-sm text-muted-foreground px-2">
        Page {{ page }} of {{ totalPages }}
      </span>
      <Button variant="ghost" size="sm" :disabled="!canNext" @click="page++">
        <Icon name="mdi:chevron-right" class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>

