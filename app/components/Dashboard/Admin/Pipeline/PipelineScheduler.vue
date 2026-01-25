<!--
  @file Scheduler.vue
  @description Pipeline job scheduler with cron builder UI
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Schedule {
  id: string
  name: string
  script: string
  cronExpression: string
  args: Record<string, string | number | boolean>
  dryRun: boolean
  enabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
}

interface CronPreset {
  label: string
  value: string
  description: string
}

interface ScriptConfig {
  name: string
  description: string
  supportsDryRun: boolean
  params?: { name: string; flag: string; type: string; default?: any }[]
}

// State
const schedules = ref<Schedule[]>([])
const presets = ref<CronPreset[]>([])
const scripts = ref<Record<string, ScriptConfig>>({})
const isLoading = ref(false)
const showCreateDialog = ref(false)
const editingSchedule = ref<Schedule | null>(null)

// Form state
const formName = ref('')
const formScript = ref('')
const formCron = ref('')
const formDryRun = ref(false)
const formEnabled = ref(true)
const formArgs = ref<Record<string, any>>({})
const isSaving = ref(false)

// Fetch schedules
const fetchSchedules = async () => {
  isLoading.value = true
  try {
    const [schedulesData, statusData] = await Promise.all([
      $fetch<{ schedules: Schedule[], presets: CronPreset[] }>('/api/admin/pipeline/schedules'),
      $fetch<{ scripts: Record<string, ScriptConfig> }>('/api/admin/pipeline/status')
    ])
    schedules.value = schedulesData.schedules
    presets.value = schedulesData.presets
    scripts.value = statusData.scripts
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load schedules')
  } finally {
    isLoading.value = false
  }
}

// Reset form
const resetForm = () => {
  formName.value = ''
  formScript.value = ''
  formCron.value = ''
  formDryRun.value = false
  formEnabled.value = true
  formArgs.value = {}
  editingSchedule.value = null
}

// Open create dialog
const openCreate = () => {
  resetForm()
  showCreateDialog.value = true
}

// Open edit dialog
const openEdit = (schedule: Schedule) => {
  editingSchedule.value = schedule
  formName.value = schedule.name
  formScript.value = schedule.script
  formCron.value = schedule.cronExpression
  formDryRun.value = schedule.dryRun
  formEnabled.value = schedule.enabled
  formArgs.value = { ...schedule.args }
  showCreateDialog.value = true
}

// Close dialog
const closeDialog = () => {
  showCreateDialog.value = false
  resetForm()
}

// Save schedule
const saveSchedule = async () => {
  if (!formName.value.trim()) {
    toast.error('Name is required')
    return
  }
  if (!formScript.value) {
    toast.error('Script is required')
    return
  }
  if (!formCron.value.trim()) {
    toast.error('Cron expression is required')
    return
  }
  
  isSaving.value = true
  try {
    if (editingSchedule.value) {
      // Update
      await $fetch(`/api/admin/pipeline/schedules/${editingSchedule.value.id}`, {
        method: 'PATCH',
        body: {
          name: formName.value.trim(),
          script: formScript.value,
          cronExpression: formCron.value.trim(),
          dryRun: formDryRun.value,
          enabled: formEnabled.value,
          args: formArgs.value
        }
      })
      toast.success('Schedule updated')
    } else {
      // Create
      await $fetch('/api/admin/pipeline/schedules', {
        method: 'POST',
        body: {
          name: formName.value.trim(),
          script: formScript.value,
          cronExpression: formCron.value.trim(),
          dryRun: formDryRun.value,
          enabled: formEnabled.value,
          args: formArgs.value
        }
      })
      toast.success('Schedule created')
    }
    
    closeDialog()
    await fetchSchedules()
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to save schedule')
  } finally {
    isSaving.value = false
  }
}

// Toggle enabled
const toggleEnabled = async (schedule: Schedule) => {
  try {
    await $fetch(`/api/admin/pipeline/schedules/${schedule.id}`, {
      method: 'PATCH',
      body: { enabled: !schedule.enabled }
    })
    await fetchSchedules()
    toast.success(schedule.enabled ? 'Schedule disabled' : 'Schedule enabled')
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to update schedule')
  }
}

// Delete schedule
const deletingId = ref<string | null>(null)
const deleteSchedule = async (schedule: Schedule) => {
  deletingId.value = schedule.id
  try {
    await $fetch(`/api/admin/pipeline/schedules/${schedule.id}`, {
      method: 'DELETE'
    })
    toast.success('Schedule deleted')
    await fetchSchedules()
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to delete schedule')
  } finally {
    deletingId.value = null
  }
}

// Format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format relative time
const formatRelative = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  
  if (diffMins < 0) return 'Past due'
  if (diffMins < 60) return `in ${diffMins}m`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `in ${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  return `in ${diffDays}d`
}

// Select preset
const selectPreset = (preset: CronPreset) => {
  formCron.value = preset.value
}

// Get script params
const selectedScriptParams = computed(() => {
  if (!formScript.value || !scripts.value[formScript.value]) return []
  return scripts.value[formScript.value]?.params ?? []
})

// Watch script changes to reset args
watch(formScript, () => {
  formArgs.value = {}
  // Set defaults
  for (const param of selectedScriptParams.value) {
    if (param.default !== undefined) {
      formArgs.value[param.flag] = param.default
    }
  }
})

// Initialize
onMounted(() => {
  fetchSchedules()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Scheduled Jobs</h3>
      </div>
      <div class="flex items-center gap-3">
        <Button size="sm" @click="openCreate">
          <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
          New Schedule
        </Button>
      </div>
    </div>
    
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner class="w-6 h-6 text-muted-foreground" />
    </div>

    <!-- Schedules list -->
    <div v-else-if="schedules.length > 0" class="divide-y divide-border/30">
      <div
        v-for="schedule in schedules"
        :key="schedule.id"
        class="py-3 first:pt-0"
        :class="{ 'opacity-60': !schedule.enabled }"
      >
        <div class="flex items-center gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-sm">{{ schedule.name }}</span>
              <span
                :class="schedule.enabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'"
                class="px-1.5 py-0.5 text-[10px] font-medium rounded"
              >
                {{ schedule.enabled ? 'Active' : 'Disabled' }}
              </span>
              <span v-if="schedule.dryRun" class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500">
                Dry Run
              </span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ scripts[schedule.script]?.name || schedule.script }}
            </p>
            <p class="text-xs text-muted-foreground/70 mt-0.5 font-mono">
              {{ schedule.cronExpression }} · Next: {{ formatRelative(schedule.nextRunAt) }}
            </p>
          </div>
          
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="toggleEnabled(schedule)">
              <Icon :name="schedule.enabled ? 'mdi:pause' : 'mdi:play'" class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="openEdit(schedule)">
              <Icon name="mdi:pencil" class="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0 text-destructive"
              :disabled="deletingId === schedule.id"
              @click="deleteSchedule(schedule)"
            >
              <Spinner v-if="deletingId === schedule.id" class="w-4 h-4" />
              <Icon v-else name="mdi:delete" class="w-4 h-4" />
            </Button>
          </div>

          <!-- Date -->
          <span class="text-xs text-muted-foreground shrink-0 w-24 text-right">
            {{ formatDate(schedule.lastRunAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <Empty v-else>
      <EmptyMedia variant="icon">
        <Icon name="mdi:calendar-clock" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle>No scheduled jobs</EmptyTitle>
      <EmptyDescription>Create a schedule to automate pipeline runs</EmptyDescription>
      <Button size="sm" @click="openCreate">
        <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
        Create Schedule
      </Button>
    </Empty>
    
    <!-- Create/Edit Dialog -->
    <Dialog :open="showCreateDialog" @update:open="closeDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingSchedule ? 'Edit Schedule' : 'New Schedule' }}</DialogTitle>
          <DialogDescription>
            Configure automated pipeline job execution
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <!-- Name -->
          <div class="space-y-2">
            <Label for="schedule-name">Name</Label>
            <Input
              id="schedule-name"
              v-model="formName"
              placeholder="Daily job scrape"
            />
          </div>
          
          <!-- Script -->
          <div class="space-y-2">
            <Label for="schedule-script">Script</Label>
            <Select v-model="formScript">
              <SelectTrigger>
                <SelectValue placeholder="Select a script" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="[key, config] in Object.entries(scripts)"
                  :key="key"
                  :value="key"
                >
                  {{ config.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Script params -->
          <div v-if="selectedScriptParams.length > 0" class="space-y-3">
            <Label>Script Parameters</Label>
            <div
              v-for="param in selectedScriptParams"
              :key="param.flag"
              class="flex items-center gap-3"
            >
              <Label class="w-24 text-xs text-muted-foreground shrink-0">
                {{ param.name }}
              </Label>
              <Input
                v-if="param.type === 'string'"
                :model-value="String(formArgs[param.flag] ?? '')"
                @update:model-value="formArgs[param.flag] = $event"
                :placeholder="param.flag"
                class="flex-1"
              />
              <Input
                v-else-if="param.type === 'number'"
                type="number"
                :model-value="Number(formArgs[param.flag] ?? 0)"
                @update:model-value="formArgs[param.flag] = Number($event)"
                class="flex-1"
              />
              <Checkbox
                v-else-if="param.type === 'boolean'"
                :checked="Boolean(formArgs[param.flag])"
                @update:checked="formArgs[param.flag] = $event"
              />
            </div>
          </div>
          
          <!-- Cron expression -->
          <div class="space-y-2">
            <Label for="schedule-cron">Cron Expression</Label>
            <Input
              id="schedule-cron"
              v-model="formCron"
              placeholder="0 6 * * *"
              class="font-mono"
            />
            <p class="text-xs text-muted-foreground">Format: minute hour day month weekday</p>
          </div>
          
          <!-- Presets -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Quick Presets</Label>
            <div class="flex flex-wrap gap-1">
              <Button
                v-for="preset in presets"
                :key="preset.value"
                variant="ghost"
                size="sm"
                class="text-xs h-7"
                :class="{ 'ring-1 ring-primary': formCron === preset.value }"
                @click="selectPreset(preset)"
              >
                {{ preset.label }}
              </Button>
            </div>
          </div>
          
          <!-- Options -->
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox v-model:checked="formEnabled" />
              <span>Enabled</span>
            </label>
            <label v-if="scripts[formScript]?.supportsDryRun" class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox v-model:checked="formDryRun" />
              <span>Dry Run</span>
            </label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" @click="closeDialog">Cancel</Button>
          <Button @click="saveSchedule" :disabled="isSaving">
            <Spinner v-if="isSaving" class="w-4 h-4 mr-1" />
            {{ editingSchedule ? 'Update' : 'Create' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

