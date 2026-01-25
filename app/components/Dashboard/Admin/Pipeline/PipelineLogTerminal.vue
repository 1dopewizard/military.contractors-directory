<!--
  @file LogTerminal.vue
  @description Enhanced log terminal with ANSI color parsing, log level filtering, search, and controls
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Props {
  logs: string[]
  title?: string
  maxHeight?: string
  autoScroll?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Logs',
  maxHeight: '24rem',
  autoScroll: true,
  showControls: true
})

const emit = defineEmits<{
  'update:autoScroll': [value: boolean]
}>()

// State
const terminalRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const showSearch = ref(false)
const isAutoScrollEnabled = ref(props.autoScroll)
const selectedLevels = ref<string[]>(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
const showLevelFilter = ref(false)

// Log levels with colors
const LOG_LEVELS = [
  { id: 'DEBUG', label: 'Debug', class: 'text-zinc-400' },
  { id: 'INFO', label: 'Info', class: 'text-blue-400' },
  { id: 'WARNING', label: 'Warning', class: 'text-amber-400' },
  { id: 'ERROR', label: 'Error', class: 'text-red-400' },
  { id: 'CRITICAL', label: 'Critical', class: 'text-red-500 font-bold' }
]

// ANSI color code mapping
const ANSI_COLORS: Record<string, string> = {
  '30': 'text-zinc-900 dark:text-zinc-100',
  '31': 'text-red-500',
  '32': 'text-green-500',
  '33': 'text-yellow-500',
  '34': 'text-blue-500',
  '35': 'text-purple-500',
  '36': 'text-cyan-500',
  '37': 'text-zinc-300',
  '90': 'text-zinc-500',
  '91': 'text-red-400',
  '92': 'text-green-400',
  '93': 'text-yellow-400',
  '94': 'text-blue-400',
  '95': 'text-purple-400',
  '96': 'text-cyan-400',
  '97': 'text-white'
}

// Parse ANSI codes from a log line
const parseAnsi = (text: string): { text: string, classes: string[] }[] => {
  const segments: { text: string, classes: string[] }[] = []
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[([0-9;]+)m/g
  let lastIndex = 0
  let currentClasses: string[] = []
  let match

  while ((match = ansiRegex.exec(text)) !== null) {
    // Add text before this ANSI code
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        classes: [...currentClasses]
      })
    }

    // Parse the ANSI code
    const codes = (match[1] ?? '').split(';')
    for (const code of codes) {
      if (code === '0') {
        currentClasses = []
      } else if (code === '1') {
        currentClasses.push('font-bold')
      } else if (ANSI_COLORS[code]) {
        currentClasses = currentClasses.filter(c => !c.startsWith('text-'))
        currentClasses.push(ANSI_COLORS[code])
      }
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      classes: [...currentClasses]
    })
  }

  return segments.length ? segments : [{ text, classes: [] }]
}

// Get log level from a line
const getLogLevel = (line: string): string | null => {
  const match = line.match(/\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b/i)
  return match?.[1]?.toUpperCase() ?? null
}

// Get color class for a log line based on its content
const getLineClass = (line: string): string => {
  const level = getLogLevel(line)
  if (level) {
    const levelConfig = LOG_LEVELS.find(l => l.id === level)
    if (levelConfig) return levelConfig.class
  }
  
  // Special patterns
  if (line.includes('[ERROR]') || line.includes('[STDERR]')) return 'text-red-400'
  if (line.includes('[WARNING]')) return 'text-amber-400'
  if (line.includes('successfully') || line.includes('completed')) return 'text-green-400'
  if (line.startsWith('[CMD]') || line.startsWith('[CWD]')) return 'text-cyan-400'
  if (line.startsWith('[DRY RUN]')) return 'text-amber-500'
  
  return 'text-zinc-300'
}

// Filter logs by level and search
const filteredLogs = computed(() => {
  let logs = props.logs
  
  // Filter by level
  if (selectedLevels.value.length < LOG_LEVELS.length) {
    logs = logs.filter(line => {
      const level = getLogLevel(line)
      // Include lines without a level, or lines matching selected levels
      return !level || selectedLevels.value.includes(level)
    })
  }
  
  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    logs = logs.filter(line => line.toLowerCase().includes(query))
  }
  
  return logs
})

// Search match count
const matchCount = computed(() => {
  if (!searchQuery.value.trim()) return 0
  return filteredLogs.value.length
})

// Highlight search matches in text
const highlightSearch = (text: string): string => {
  if (!searchQuery.value.trim()) return text
  const query = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-amber-500/40 text-inherit rounded px-0.5">$1</mark>')
}

// Auto-scroll to bottom
const scrollToBottom = () => {
  if (terminalRef.value && isAutoScrollEnabled.value) {
    nextTick(() => {
      if (terminalRef.value) {
        terminalRef.value.scrollTop = terminalRef.value.scrollHeight
      }
    })
  }
}

// Watch for new logs
watch(() => props.logs.length, () => {
  scrollToBottom()
})

// Copy logs to clipboard
const copyLogs = async () => {
  try {
    await navigator.clipboard.writeText(filteredLogs.value.join('\n'))
    toast.success('Logs copied to clipboard')
  } catch {
    toast.error('Failed to copy logs')
  }
}

// Download logs
const downloadLogs = () => {
  const content = filteredLogs.value.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pipeline-logs-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.log`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Logs downloaded')
}

// Toggle level
const toggleLevel = (level: string) => {
  if (selectedLevels.value.includes(level)) {
    selectedLevels.value = selectedLevels.value.filter(l => l !== level)
  } else {
    selectedLevels.value = [...selectedLevels.value, level]
  }
}

// Select all levels
const selectAllLevels = () => {
  selectedLevels.value = LOG_LEVELS.map(l => l.id)
}

// Deselect all levels
const clearLevels = () => {
  selectedLevels.value = []
}

// Toggle auto-scroll
const toggleAutoScroll = () => {
  isAutoScrollEnabled.value = !isAutoScrollEnabled.value
  emit('update:autoScroll', isAutoScrollEnabled.value)
  if (isAutoScrollEnabled.value) {
    scrollToBottom()
  }
}

// Keyboard shortcut for search
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault()
    showSearch.value = true
    nextTick(() => {
      const input = document.querySelector('[data-log-search]') as HTMLInputElement
      input?.focus()
    })
  }
  if (e.key === 'Escape' && showSearch.value) {
    showSearch.value = false
    searchQuery.value = ''
  }
}

onMounted(() => {
  scrollToBottom()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flex flex-col border border-border bg-zinc-950 overflow-hidden">
    <!-- Header -->
    <div v-if="showControls" class="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-zinc-900/50">
      <div class="flex items-center gap-2">
        <Icon name="mdi:console" class="w-4 h-4 text-zinc-400" />
        <span class="text-xs font-medium text-zinc-300">{{ title }}</span>
        <span class="text-xs text-zinc-500">({{ filteredLogs.length }} lines)</span>
      </div>
      
      <div class="flex items-center gap-1">
        <!-- Search toggle -->
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :class="showSearch ? 'text-primary' : 'text-zinc-400'"
          title="Search (Ctrl+F)"
          @click="showSearch = !showSearch"
        >
          <Icon name="mdi:magnify" class="w-3.5 h-3.5" />
        </Button>
        
        <!-- Level filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              :class="selectedLevels.length < LOG_LEVELS.length ? 'text-primary' : 'text-zinc-400'"
              title="Filter by level"
            >
              <Icon name="mdi:filter-outline" class="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" class="w-48 p-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium">Log Levels</span>
              <div class="flex gap-1">
                <Button variant="ghost" size="sm" class="h-5 px-1 text-[10px]" @click="selectAllLevels">All</Button>
                <Button variant="ghost" size="sm" class="h-5 px-1 text-[10px]" @click="clearLevels">None</Button>
              </div>
            </div>
            <div class="space-y-1">
              <label
                v-for="level in LOG_LEVELS"
                :key="level.id"
                class="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted px-1 py-0.5 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedLevels.includes(level.id)"
                  class="rounded border-zinc-600"
                  @change="toggleLevel(level.id)"
                />
                <span :class="level.class">{{ level.label }}</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>
        
        <!-- Auto-scroll toggle -->
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :class="isAutoScrollEnabled ? 'text-primary' : 'text-zinc-400'"
          title="Auto-scroll"
          @click="toggleAutoScroll"
        >
          <Icon name="mdi:arrow-collapse-down" class="w-3.5 h-3.5" />
        </Button>
        
        <!-- Copy -->
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-zinc-400"
          title="Copy logs"
          @click="copyLogs"
        >
          <Icon name="mdi:content-copy" class="w-3.5 h-3.5" />
        </Button>
        
        <!-- Download -->
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-zinc-400"
          title="Download logs"
          @click="downloadLogs"
        >
          <Icon name="mdi:download" class="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
    
    <!-- Search bar -->
    <div v-if="showSearch" class="flex items-center gap-2 px-3 py-2 border-b border-border bg-zinc-900/30">
      <Icon name="mdi:magnify" class="w-4 h-4 text-zinc-500" />
      <input
        v-model="searchQuery"
        data-log-search
        type="text"
        placeholder="Search logs..."
        class="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
      />
      <span v-if="searchQuery" class="text-xs text-zinc-500">
        {{ matchCount }} match{{ matchCount === 1 ? '' : 'es' }}
      </span>
      <Button
        variant="ghost"
        size="icon"
        class="h-5 w-5 text-zinc-500"
        @click="showSearch = false; searchQuery = ''"
      >
        <Icon name="mdi:close" class="w-3 h-3" />
      </Button>
    </div>
    
    <!-- Log content -->
    <div
      ref="terminalRef"
      class="overflow-y-auto font-mono text-xs leading-relaxed"
      :style="{ maxHeight }"
    >
      <div class="p-3 space-y-0.5">
        <div
          v-for="(line, idx) in filteredLogs"
          :key="`log-${idx}`"
          class="whitespace-pre-wrap break-all"
          :class="getLineClass(line)"
        >
          <!-- With search: highlight matches using v-html -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="searchQuery" v-html="highlightSearch(line)" />
          <!-- Without search: render ANSI-parsed segments -->
          <span
            v-else
            v-for="(segment, sIdx) in parseAnsi(line)"
            :key="`seg-${idx}-${sIdx}`"
            :class="segment.classes"
          >{{ segment.text }}</span>
        </div>
        <div v-if="filteredLogs.length === 0" class="text-zinc-600 italic py-4 text-center">
          {{ logs.length === 0 ? 'Waiting for output...' : 'No matching logs' }}
        </div>
      </div>
    </div>
  </div>
</template>

