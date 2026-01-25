<!--
  @file AdminPipeline.vue
  @description Simplified admin dashboard pipeline management with Convex real-time log streaming
  
  Uses Convex subscriptions for real-time log streaming when a job is running,
  replacing the previous WebSocket-based implementation.
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { PipelineScriptMeta, RunScriptOptions } from '@/composables/usePipelineJobs'

const logger = useLogger('AdminPipeline')

// Use the new Convex-based pipeline jobs composable
const {
  currentJob,
  recentJobs,
  scripts,
  isLoading: pipelineLoading,
  isSubscribed,
  error: pipelineError,
  runScript,
  refresh: fetchPipelineStatus,
} = usePipelineJobs()

// Tab state
type TabId = 'dashboard' | 'scripts' | 'history' | 'stats'
const activeTab = ref<TabId>('dashboard')

// Script parameter values
const scriptParams = ref<Record<string, Record<string, string | number | boolean>>>({})

// Dry run toggle
const selectedDryRun = ref(false)

// Modal state for script params
const selectedScript = ref<string | null>(null)
const showParamsModal = computed(() => selectedScript.value !== null)

// Initialize script params with defaults
const initScriptParams = (scriptsMap: Record<string, PipelineScriptMeta>) => {
  const params: Record<string, Record<string, string | number | boolean>> = {}
  for (const [key, script] of Object.entries(scriptsMap)) {
    if (script.params) {
      params[key] = {}
      for (const param of script.params) {
        if (param.default !== undefined) {
          params[key][param.flag] = param.default
        } else if (param.type === 'boolean') {
          params[key][param.flag] = false
        } else if (param.type === 'number') {
          params[key][param.flag] = 0
        } else {
          params[key][param.flag] = ''
        }
      }
    }
  }
  scriptParams.value = params
}

// Watch for scripts change to init params
watch(
  scripts,
  (newScripts) => {
    if (Object.keys(newScripts).length > 0 && Object.keys(scriptParams.value).length === 0) {
      initScriptParams(newScripts)
    }
  },
  { immediate: true }
)

// Open script params modal
const openScriptParams = (script: string) => {
  const scriptConfig = scripts.value[script]
  selectedDryRun.value = false

  // Show modal for scripts that support dry run OR have params
  if (scriptConfig?.supportsDryRun || (scriptConfig?.params && scriptConfig.params.length > 0)) {
    selectedScript.value = script
  } else {
    // No params and no dry run support, run directly
    runPipelineScript(script)
  }
}

// Close params modal
const closeParamsModal = () => {
  selectedScript.value = null
}

// Run with params from modal
const runWithParams = () => {
  if (selectedScript.value) {
    runPipelineScript(selectedScript.value)
    closeParamsModal()
  }
}

// Run script
const runPipelineScript = async (script: string) => {
  try {
    // Build args from params
    const params = scriptParams.value[script] || {}
    const args: Record<string, string | number | boolean> = {}

    const scriptConfig = scripts.value[script]
    if (scriptConfig?.params) {
      for (const param of scriptConfig.params) {
        const value = params[param.flag]
        // Only include if value is set and not empty
        if (value !== undefined && value !== '' && value !== 0 && value !== false) {
          args[param.flag] = value
        } else if (param.required) {
          toast.error(`${param.name} is required`)
          return
        }
      }
    }

    const options: RunScriptOptions = {
      dryRun: selectedDryRun.value,
      args: Object.keys(args).length > 0 ? args : undefined,
    }

    await runScript(script, options)
    toast.success(`Started ${scriptConfig?.name || script}`)

    // Switch to dashboard to see logs
    activeTab.value = 'dashboard'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start pipeline'
    toast.error(message)
  }
}

// Status badge helper
const getPipelineStatusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return { label: 'Running', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    case 'completed':
      return { label: 'Completed', class: 'bg-green-500/10 text-green-600 dark:text-green-400' }
    case 'failed':
      return { label: 'Failed', class: 'bg-red-500/10 text-red-600 dark:text-red-400' }
    case 'cancelled':
      return { label: 'Cancelled', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    default:
      return { label: status, class: 'bg-muted text-muted-foreground' }
  }
}

// Duration helper
const formatDuration = (startedAt: string, completedAt?: string | null) => {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const seconds = Math.floor((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Categorize scripts
const fullPipelines = computed(() =>
  Object.entries(scripts.value).filter(([_, s]) => s.isPipeline)
)

const individualScripts = computed(() =>
  Object.entries(scripts.value).filter(([_, s]) => !s.isPipeline)
)

// Initialize
onMounted(async () => {
  await fetchPipelineStatus()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Data Pipeline</h2>
        <p class="text-sm text-muted-foreground">
          Run TypeScript scripts to enrich MOS data and generate content
        </p>
      </div>
      <Button variant="ghost" size="sm" @click="fetchPipelineStatus">
        <Icon name="mdi:refresh" class="w-4 h-4 mr-1" />
        Refresh
      </Button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-border">
      <nav class="flex gap-1 -mb-px">
        <button
          v-for="tab in ([
            { id: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline' },
            { id: 'scripts', label: 'Scripts', icon: 'mdi:script-text-outline' },
            { id: 'history', label: 'History', icon: 'mdi:history' },
            { id: 'stats', label: 'Statistics', icon: 'mdi:chart-line' },
          ] as { id: TabId; label: string; icon: string }[])"
          :key="tab.id"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px]"
          :class="
            activeTab === tab.id
              ? 'text-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          "
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'" class="space-y-6">
        <!-- Current Job Status -->
        <div
          v-if="currentJob"
          class="border-2 p-4"
          :class="
            currentJob.status === 'running'
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-border'
          "
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <Spinner
                v-if="currentJob.status === 'running'"
                class="w-5 h-5 text-blue-500"
              />
              <Icon
                v-else-if="currentJob.status === 'completed'"
                name="mdi:check-circle"
                class="w-5 h-5 text-green-500"
              />
              <Icon
                v-else-if="currentJob.status === 'failed'"
                name="mdi:alert-circle"
                class="w-5 h-5 text-red-500"
              />
              <Icon v-else name="mdi:cancel" class="w-5 h-5 text-amber-500" />
              <div>
                <h3 class="font-semibold text-foreground">
                  {{ scripts[currentJob.script]?.name || currentJob.script }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ formatDuration(currentJob.startedAt, currentJob.completedAt) }}
                  <span v-if="currentJob.dryRun" class="ml-2 text-amber-600">(Dry Run)</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="getPipelineStatusBadge(currentJob.status).class"
                class="px-2 py-1 text-xs font-medium"
              >
                {{ getPipelineStatusBadge(currentJob.status).label }}
              </span>
            </div>
          </div>

          <!-- Log Terminal with real-time Convex streaming -->
          <PipelineLogTerminal
            :logs="currentJob.logs"
            title="Job Output"
            max-height="20rem"
            :auto-scroll="currentJob.status === 'running'"
          />

          <!-- Convex subscription indicator -->
          <div
            v-if="currentJob.status === 'running'"
            class="flex items-center gap-2 mt-2 text-xs text-muted-foreground"
          >
            <span v-if="isSubscribed" class="flex items-center gap-1 text-green-600">
              <span class="w-2 h-2 bg-green-500 animate-pulse"></span>
              Live streaming via Convex
            </span>
            <span v-else class="flex items-center gap-1 text-amber-600">
              <Icon name="mdi:refresh" class="w-3 h-3 animate-spin" />
              Connecting...
            </span>
          </div>
        </div>

        <!-- Quick Run Pipelines -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Run
          </h3>
          <div class="divide-y divide-border/30">
            <button
              v-for="[key, script] in fullPipelines.slice(0, 6)"
              :key="key"
              class="w-full group flex items-center gap-4 py-3 first:pt-0 text-left hover:bg-muted/30 transition-colors px-2 -mx-2"
              :disabled="currentJob?.status === 'running' || pipelineLoading"
              @click="openScriptParams(key)"
            >
              <Icon
                name="mdi:play-circle-outline"
                class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm text-foreground">{{ script.name }}</h4>
                <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {{ script.description }}
                </p>
              </div>
              <span class="text-xs text-muted-foreground shrink-0">{{ script.estimatedTime }}</span>
            </button>
          </div>
        </div>

        <!-- Recent Jobs Summary -->
        <div v-if="recentJobs.length > 0" class="space-y-3">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h3>
          <div class="divide-y divide-border/30">
            <div
              v-for="job in recentJobs.slice(0, 5)"
              :key="job.id"
              class="flex items-center gap-3 py-2 first:pt-0"
            >
              <Icon
                :name="
                  job.status === 'completed'
                    ? 'mdi:check-circle'
                    : job.status === 'failed'
                      ? 'mdi:alert-circle'
                      : 'mdi:cancel'
                "
                class="w-4 h-4 shrink-0"
                :class="
                  job.status === 'completed'
                    ? 'text-green-500'
                    : job.status === 'failed'
                      ? 'text-red-500'
                      : 'text-amber-500'
                "
              />
              <div class="flex-1 min-w-0">
                <span class="text-sm text-foreground">
                  {{ scripts[job.script]?.name || job.script }}
                </span>
              </div>
              <span class="text-xs text-muted-foreground">
                {{ formatDuration(job.startedAt, job.completedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Scripts Tab -->
      <div v-else-if="activeTab === 'scripts'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Full Pipelines -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Full Pipelines
            </h3>
            <div class="border border-border divide-y divide-border">
              <div
                v-for="[key, script] in fullPipelines"
                :key="key"
                class="p-3 hover:bg-muted/30 transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-foreground">{{ script.name }}</h4>
                    <p class="text-sm text-muted-foreground mt-1">{{ script.description }}</p>
                    <p class="text-xs text-muted-foreground/70 mt-1">
                      Est. {{ script.estimatedTime }}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    :disabled="currentJob?.status === 'running' || pipelineLoading"
                    @click="openScriptParams(key)"
                  >
                    <Icon name="mdi:play" class="w-4 h-4 mr-1" />Run
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual Scripts -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Individual Scripts
            </h3>
            <div class="border border-border divide-y divide-border">
              <div
                v-for="[key, script] in individualScripts"
                :key="key"
                class="p-3 hover:bg-muted/30 transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-medium text-foreground">{{ script.name }}</h4>
                      <span
                        v-if="script.params && script.params.length > 0"
                        class="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        {{ script.params.length }} param{{ script.params.length > 1 ? 's' : '' }}
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground mt-1">{{ script.description }}</p>
                    <p class="text-xs text-muted-foreground/70 mt-1">
                      Est. {{ script.estimatedTime }}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    :disabled="currentJob?.status === 'running' || pipelineLoading"
                    @click="openScriptParams(key)"
                  >
                    <Icon name="mdi:play" class="w-4 h-4 mr-1" />Run
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-else-if="activeTab === 'history'">
        <PipelineJobHistory />
      </div>

      <!-- Stats Tab -->
      <div v-else-if="activeTab === 'stats'">
        <PipelineStats />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="!scripts || Object.keys(scripts).length === 0" class="flex items-center justify-center py-12">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>

    <!-- Script Parameters Modal -->
    <Dialog :open="showParamsModal" @update:open="closeParamsModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ scripts[selectedScript || '']?.name || 'Run Script' }}
          </DialogTitle>
          <DialogDescription>
            {{ scripts[selectedScript || '']?.description }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedScript" class="space-y-4 py-4">
          <!-- Dry Run option (shown first for pipelines that support it) -->
          <div
            v-if="scripts[selectedScript]?.supportsDryRun"
            class="flex items-center gap-3 p-3 bg-muted/50 border border-border"
          >
            <input
              id="dry-run-checkbox"
              v-model="selectedDryRun"
              type="checkbox"
              class="border-muted-foreground/30 h-4 w-4"
            />
            <div>
              <Label for="dry-run-checkbox" class="text-sm font-medium cursor-pointer">
                Dry Run
              </Label>
              <p class="text-xs text-muted-foreground">
                Preview changes without modifying the database
              </p>
            </div>
          </div>

          <!-- Script parameters -->
          <template
            v-if="scripts[selectedScript]?.params && scriptParams[selectedScript]"
          >
            <div
              v-for="param in scripts[selectedScript]!.params"
              :key="param.flag"
              class="space-y-2"
            >
              <Label :for="param.flag" class="text-sm font-medium">
                {{ param.name }}
                <span v-if="param.required" class="text-red-500">*</span>
              </Label>

              <!-- String input -->
              <Input
                v-if="param.type === 'string'"
                :id="param.flag"
                :model-value="String(scriptParams[selectedScript]![param.flag] ?? '')"
                :placeholder="param.description"
                class="w-full"
                @update:model-value="scriptParams[selectedScript]![param.flag] = $event"
              />

              <!-- Number input -->
              <Input
                v-else-if="param.type === 'number'"
                :id="param.flag"
                :model-value="Number(scriptParams[selectedScript]![param.flag] ?? 0)"
                type="number"
                :placeholder="param.description"
                class="w-full"
                @update:model-value="scriptParams[selectedScript]![param.flag] = Number($event)"
              />

              <!-- Boolean checkbox -->
              <div v-else-if="param.type === 'boolean'" class="flex items-center gap-2">
                <input
                  :id="param.flag"
                  :checked="Boolean(scriptParams[selectedScript]![param.flag])"
                  type="checkbox"
                  class="border-muted-foreground/30"
                  @change="
                    scriptParams[selectedScript]![param.flag] = (
                      $event.target as HTMLInputElement
                    ).checked
                  "
                />
                <span class="text-sm text-muted-foreground">{{ param.description }}</span>
              </div>

              <p
                v-if="param.description && param.type !== 'boolean'"
                class="text-xs text-muted-foreground"
              >
                {{ param.description }}
              </p>
            </div>
          </template>

          <!-- No dry run support notice -->
          <div
            v-if="!scripts[selectedScript]?.supportsDryRun"
            class="text-xs text-muted-foreground/70 flex items-center gap-1"
          >
            <Icon name="mdi:information-outline" class="w-3 h-3" />
            This script does not support dry run mode
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="closeParamsModal">Cancel</Button>
          <Button :disabled="pipelineLoading" @click="runWithParams">
            <Spinner v-if="pipelineLoading" class="w-4 h-4 mr-1" />
            <Icon v-else name="mdi:play" class="w-4 h-4 mr-1" />
            Run Script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
