<!--
  @file ScriptPreview.vue
  @description Script documentation and source code preview with syntax highlighting
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface ScriptParam {
  name: string
  flag: string
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  default?: string | number | boolean
  description?: string
}

interface ScriptDependency {
  script: string
  name: string
  type: 'requires' | 'optional'
}

interface ScriptDetails {
  id: string
  name: string
  description: string
  documentation?: string
  sourceFile: string
  sourceCode?: string
  estimatedTime: string
  supportsDryRun: boolean
  category: string
  isPipeline: boolean
  params?: ScriptParam[]
  dependencies: ScriptDependency[]
  dependents: ScriptDependency[]
}

interface Props {
  scriptId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  run: [scriptId: string]
  close: []
  selectScript: [scriptId: string]
}>()

// State
const script = ref<ScriptDetails | null>(null)
const isLoading = ref(false)
const activeTab = ref<'docs' | 'source' | 'deps'>('docs')

// Fetch script details
const fetchScript = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<ScriptDetails>(`/api/admin/pipeline/scripts/${props.scriptId}`)
    script.value = data
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to load script details')
  } finally {
    isLoading.value = false
  }
}

// Watch for script changes
watch(() => props.scriptId, fetchScript, { immediate: true })

// Simple Python syntax highlighting
const highlightPython = (code: string): string => {
  if (!code) return ''
  
  // Escape HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Keywords
  const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 
    'with', 'as', 'import', 'from', 'return', 'yield', 'raise', 'pass', 'break', 'continue',
    'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'async', 'await', 'lambda']
  
  // Highlight strings (simple version - handles most cases)
  html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g, 
    '<span class="text-green-400">$1</span>')
  
  // Highlight comments
  html = html.replace(/(#.*)$/gm, '<span class="text-zinc-500">$1</span>')
  
  // Highlight keywords
  for (const kw of keywords) {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    html = html.replace(regex, '<span class="text-purple-400">$1</span>')
  }
  
  // Highlight function/class definitions
  html = html.replace(/\b(def|class)\s+(\w+)/g, 
    '<span class="text-purple-400">$1</span> <span class="text-amber-400">$2</span>')
  
  // Highlight decorators
  html = html.replace(/(@\w+)/g, '<span class="text-cyan-400">$1</span>')
  
  // Highlight numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')
  
  return html
}

// Copy source code
const copySource = async () => {
  if (script.value?.sourceCode) {
    try {
      await navigator.clipboard.writeText(script.value.sourceCode)
      toast.success('Source code copied')
    } catch {
      toast.error('Failed to copy')
    }
  }
}

// Get category badge color
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'mos': return 'bg-blue-500/10 text-blue-400'
    case 'jobs': return 'bg-green-500/10 text-green-400'
    case 'mapping': return 'bg-purple-500/10 text-purple-400'
    case 'pipeline': return 'bg-amber-500/10 text-amber-400'
    default: return 'bg-muted text-muted-foreground'
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner class="w-6 h-6 text-muted-foreground" />
    </div>
    
    <template v-else-if="script">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-lg font-semibold text-foreground">{{ script.name }}</h3>
            <span :class="getCategoryColor(script.category)" class="px-2 py-0.5 text-[10px] font-medium rounded uppercase">
              {{ script.category }}
            </span>
            <span v-if="script.isPipeline" class="px-2 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary">
              Pipeline
            </span>
          </div>
          <p class="text-sm text-muted-foreground">{{ script.description }}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <Icon name="mdi:clock-outline" class="w-3.5 h-3.5" />
              {{ script.estimatedTime }}
            </span>
            <span class="flex items-center gap-1">
              <Icon name="mdi:file-code-outline" class="w-3.5 h-3.5" />
              {{ script.sourceFile }}
            </span>
            <span v-if="script.supportsDryRun" class="flex items-center gap-1 text-green-500">
              <Icon name="mdi:check-circle-outline" class="w-3.5 h-3.5" />
              Dry Run
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button size="sm" @click="emit('run', script.id)">
            <Icon name="mdi:play" class="w-4 h-4 mr-1" />
            Run
          </Button>
          <Button variant="ghost" size="icon" @click="emit('close')">
            <Icon name="mdi:close" class="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="flex items-center gap-1 pt-4 border-b border-border">
        <button
          class="px-3 py-2 text-sm font-medium transition-colors relative"
          :class="activeTab === 'docs' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'docs'"
        >
          Documentation
          <div v-if="activeTab === 'docs'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </button>
        <button
          class="px-3 py-2 text-sm font-medium transition-colors relative"
          :class="activeTab === 'source' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'source'"
        >
          Source Code
          <div v-if="activeTab === 'source'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </button>
        <button
          class="px-3 py-2 text-sm font-medium transition-colors relative"
          :class="activeTab === 'deps' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'deps'"
        >
          Dependencies
          <span v-if="script.dependencies.length + script.dependents.length > 0" class="ml-1 text-xs text-muted-foreground">
            ({{ script.dependencies.length + script.dependents.length }})
          </span>
          <div v-if="activeTab === 'deps'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </button>
      </div>
      
      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto py-4">
        <!-- Documentation tab -->
        <div v-if="activeTab === 'docs'" class="space-y-4">
          <!-- Documentation text -->
          <div v-if="script.documentation" class="prose prose-sm dark:prose-invert max-w-none">
            <pre class="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{{ script.documentation }}</pre>
          </div>
          
          <!-- Parameters -->
          <div v-if="script.params && script.params.length > 0">
            <h4 class="text-sm font-medium text-foreground mb-3">Parameters</h4>
            <div class="space-y-2">
              <div
                v-for="param in script.params"
                :key="param.flag"
                class="flex items-start gap-3 p-3 bg-muted/30 border border-border"
              >
                <code class="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 shrink-0">
                  {{ param.flag }}
                </code>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-foreground">{{ param.name }}</span>
                    <span class="text-xs text-muted-foreground">({{ param.type }})</span>
                    <span v-if="param.required" class="text-xs text-red-400">required</span>
                  </div>
                  <p v-if="param.description" class="text-xs text-muted-foreground mt-0.5">
                    {{ param.description }}
                  </p>
                  <p v-if="param.default !== undefined" class="text-xs text-muted-foreground/70 mt-0.5">
                    Default: <code class="text-muted-foreground">{{ param.default }}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No params message -->
          <Empty v-else-if="!script.documentation" class="py-8">
            <EmptyMedia variant="icon">
              <Icon name="mdi:file-document-outline" class="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle class="text-base">No additional documentation available</EmptyTitle>
          </Empty>
        </div>
        
        <!-- Source code tab -->
        <div v-else-if="activeTab === 'source'">
          <div v-if="script.sourceCode" class="relative">
            <Button
              variant="ghost"
              size="sm"
              class="absolute top-2 right-2 z-10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              @click="copySource"
            >
              <Icon name="mdi:content-copy" class="w-4 h-4 mr-1" />
              Copy
            </Button>
            <div class="bg-zinc-950 border border-border overflow-auto max-h-[500px]">
              <pre class="p-4 text-xs font-mono leading-relaxed text-zinc-300"><code v-html="highlightPython(script.sourceCode)" /></pre>
            </div>
          </div>
          <Empty v-else class="py-8">
            <EmptyMedia variant="icon">
              <Icon name="mdi:file-code-outline" class="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle class="text-base">Source code not available</EmptyTitle>
          </Empty>
        </div>
        
        <!-- Dependencies tab -->
        <div v-else-if="activeTab === 'deps'" class="space-y-6">
          <!-- Required by this script -->
          <div v-if="script.dependencies.length > 0">
            <h4 class="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Icon name="mdi:arrow-right" class="w-4 h-4 text-muted-foreground" />
              Depends On
            </h4>
            <div class="space-y-2">
              <button
                v-for="dep in script.dependencies"
                :key="dep.script"
                class="w-full flex items-center gap-3 p-3 bg-muted/30 border border-border hover:bg-muted/50 transition-colors text-left"
                @click="emit('selectScript', dep.script)"
              >
                <Icon name="mdi:script-text-outline" class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm text-foreground">{{ dep.name }}</span>
                <span :class="dep.type === 'requires' ? 'text-red-400' : 'text-amber-400'" class="text-xs">
                  {{ dep.type }}
                </span>
              </button>
            </div>
          </div>
          
          <!-- Scripts that depend on this -->
          <div v-if="script.dependents.length > 0">
            <h4 class="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Icon name="mdi:arrow-left" class="w-4 h-4 text-muted-foreground" />
              Required By
            </h4>
            <div class="space-y-2">
              <button
                v-for="dep in script.dependents"
                :key="dep.script"
                class="w-full flex items-center gap-3 p-3 bg-muted/30 border border-border hover:bg-muted/50 transition-colors text-left"
                @click="emit('selectScript', dep.script)"
              >
                <Icon name="mdi:script-text-outline" class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm text-foreground">{{ dep.name }}</span>
              </button>
            </div>
          </div>
          
          <!-- No dependencies -->
          <Empty v-if="script.dependencies.length === 0 && script.dependents.length === 0" class="py-8">
            <EmptyMedia variant="icon">
              <Icon name="mdi:graph-outline" class="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle class="text-base">No dependencies</EmptyTitle>
          </Empty>
        </div>
      </div>
    </template>
  </div>
</template>

