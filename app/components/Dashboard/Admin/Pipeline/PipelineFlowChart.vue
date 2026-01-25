<!--
  @file FlowChart.vue
  @description Interactive horizontal pipeline flow visualization showing stages and scripts
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface DAGNode {
  id: string
  name: string
  category: string
  description: string
  estimatedTime: string
  supportsDryRun: boolean
  hasParams: boolean
}

interface DAGEdge {
  from: string
  to: string
  type: 'requires' | 'optional'
}

interface JobStatus {
  script: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
}

interface Props {
  currentJob?: JobStatus | null
  recentJobs?: JobStatus[]
}

const props = withDefaults(defineProps<Props>(), {
  currentJob: null,
  recentJobs: () => []
})

const emit = defineEmits<{
  selectScript: [scriptId: string]
  runScript: [scriptId: string]
}>()

// State
const dag = ref<{ nodes: DAGNode[], edges: DAGEdge[], nodesByCategory: Record<string, DAGNode[]> } | null>(null)
const isLoading = ref(false)

// Pipeline stages with icons and colors
// Note: jobs/mapping stages removed in Career Intelligence pivot (January 2026)
const STAGES = [
  { 
    id: 'mos', 
    label: 'MOS Data', 
    icon: 'mdi:shield-account',
    color: 'blue',
    description: 'Military Occupational Specialties'
  }
]

// Fetch DAG data
const fetchDAG = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<typeof dag.value>('/api/admin/pipeline/dag')
    dag.value = data
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load pipeline DAG')
  } finally {
    isLoading.value = false
  }
}

// Get status for a node
const getNodeStatus = (nodeId: string): 'idle' | 'running' | 'completed' | 'failed' => {
  if (props.currentJob?.script === nodeId && props.currentJob.status === 'running') {
    return 'running'
  }
  const recentJob = props.recentJobs.find(j => j.script === nodeId)
  if (recentJob) {
    if (recentJob.status === 'completed') return 'completed'
    if (recentJob.status === 'failed' || recentJob.status === 'cancelled') return 'failed'
  }
  return 'idle'
}

// Get stage completion status
const getStageStatus = (category: string): 'idle' | 'running' | 'completed' | 'partial' => {
  const nodes = dag.value?.nodesByCategory[category] || []
  if (nodes.length === 0) return 'idle'
  
  const statuses = nodes.map(n => getNodeStatus(n.id))
  if (statuses.some(s => s === 'running')) return 'running'
  if (statuses.every(s => s === 'completed')) return 'completed'
  if (statuses.some(s => s === 'completed')) return 'partial'
  return 'idle'
}

// Node ordering within category
// Note: jobs/mapping categories removed in Career Intelligence pivot
const getNodeOrder = (category: string): string[] => {
  const orders: Record<string, string[]> = {
    mos: ['mos-classify', 'mos-enrich', 'mos-summarize', 'mos-embed', 'mos-validate']
  }
  return orders[category] || []
}

// Sort nodes by order
const getSortedNodes = (category: string): DAGNode[] => {
  if (!dag.value?.nodesByCategory[category]) return []
  const order = getNodeOrder(category)
  return [...dag.value.nodesByCategory[category]].sort((a, b) => {
    const aIdx = order.indexOf(a.id)
    const bIdx = order.indexOf(b.id)
    if (aIdx === -1 && bIdx === -1) return 0
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })
}

// Get color classes for a stage
const getStageColorClasses = (color: string, status: string) => {
  const base = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', dot: 'bg-green-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', dot: 'bg-purple-500' }
  }[color] || { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', dot: 'bg-muted-foreground' }
  
  if (status === 'running') {
    return { ...base, ring: 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' }
  }
  if (status === 'completed') {
    return { ...base, ring: 'ring-2 ring-green-500/50' }
  }
  return { ...base, ring: '' }
}

// Initialize
onMounted(() => {
  fetchDAG()
})
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="flex items-center justify-center py-8">
    <Spinner class="w-5 h-5 text-muted-foreground" />
  </div>
  
  <!-- Flow Visualization -->
  <div v-else-if="dag">
    <!-- Horizontal flow -->
    <div class="flex items-stretch gap-3 overflow-x-auto">
      <template v-for="(stage, idx) in STAGES" :key="stage.id">
        <!-- Stage column -->
        <div class="flex-1 min-w-[180px]">
          <!-- Stage header -->
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
            <Icon
              :name="stage.icon"
              class="w-4 h-4 shrink-0"
              :class="getStageColorClasses(stage.color, getStageStatus(stage.id)).text"
            />
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-semibold text-foreground uppercase tracking-wide">{{ stage.label }}</h4>
            </div>
            <!-- Stage status indicator -->
            <div class="shrink-0">
              <Spinner v-if="getStageStatus(stage.id) === 'running'" class="w-3.5 h-3.5 text-blue-500" />
              <Icon v-else-if="getStageStatus(stage.id) === 'completed'" name="mdi:check-circle" class="w-3.5 h-3.5 text-green-500" />
              <Icon v-else-if="getStageStatus(stage.id) === 'partial'" name="mdi:circle-half-full" class="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          
          <!-- Scripts in stage -->
          <div class="divide-y divide-border/30">
            <button
              v-for="node in getSortedNodes(stage.id)"
              :key="node.id"
              class="w-full group flex items-center gap-3 py-2 first:pt-0 text-left transition-colors hover:bg-muted/30 px-1 -mx-1 rounded"
              :class="{ 'bg-primary/5': getNodeStatus(node.id) === 'running' }"
              @click="emit('selectScript', node.id)"
            >
              <!-- Status indicator -->
              <div class="shrink-0">
                <Spinner v-if="getNodeStatus(node.id) === 'running'" class="w-3.5 h-3.5 text-blue-500" />
                <Icon v-else-if="getNodeStatus(node.id) === 'completed'" name="mdi:check-circle" class="w-3.5 h-3.5 text-green-500" />
                <Icon v-else-if="getNodeStatus(node.id) === 'failed'" name="mdi:alert-circle" class="w-3.5 h-3.5 text-red-500" />
                <div v-else class="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
              </div>
              
              <!-- Script info -->
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-foreground block truncate">{{ node.name }}</span>
                <span class="text-xs text-muted-foreground">{{ node.estimatedTime }}</span>
              </div>
              
              <!-- Run button -->
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Run script"
                @click.stop="emit('runScript', node.id)"
              >
                <Icon name="mdi:play" class="w-4 h-4" />
              </Button>
            </button>
          </div>
        </div>
        
        <!-- Arrow connector between stages -->
        <div v-if="idx < STAGES.length - 1" class="flex items-center justify-center shrink-0 self-center">
          <Icon name="mdi:chevron-right" class="w-5 h-5 text-muted-foreground/40" />
        </div>
      </template>
    </div>
  </div>
  
  <!-- Empty state -->
  <Empty v-else class="border">
    <EmptyMedia variant="icon">
      <Icon name="mdi:graph-outline" class="w-6 h-6" />
    </EmptyMedia>
    <EmptyTitle>Failed to load pipeline</EmptyTitle>
    <EmptyDescription>
      <Button variant="ghost" size="sm" @click="fetchDAG">Try Again</Button>
    </EmptyDescription>
  </Empty>
</template>

