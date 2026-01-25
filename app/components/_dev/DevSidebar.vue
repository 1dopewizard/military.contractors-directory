<!--
  @file DevSidebar component for dev page navigation
  @usage <DevSidebar v-model:active-view="activeView" />
  @description Sidebar navigation for dev page sections
-->

<script setup lang="ts">
export type DevView = 
  | 'scraped-jobs' 
  | 'logo-test' 
  | 'logo-listings' 
  | 'lockheed-company'
  | 'job-details'
  | 'job-details-live'
  | 'chat-attachments'
  | 'chat-attachments-append'
  | 'chat-messages'
  | 'chat-request'
  | 'chat-tools'
  | 'use-object'

export type NavGroup = {
  title: string
  items: Array<{ id: DevView; label: string; icon: string }>
}

const props = defineProps<{
  activeView: DevView
  groups: NavGroup[]
}>()

const emit = defineEmits<{
  'update:activeView': [value: DevView]
}>()

const setActiveView = (view: DevView) => {
  emit('update:activeView', view)
}
</script>

<template>
  <aside class="hidden w-64 shrink-0 lg:block">
    <div class="sticky top-24 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 space-y-6">
        <div v-for="group in groups" :key="group.title" class="space-y-2">
          <div class="flex items-center justify-between px-2">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {{ group.title }}
            </span>
          </div>
          <div class="space-y-1">
            <button
              v-for="view in group.items"
              :key="view.id"
              @click="setActiveView(view.id)"
              class="w-full group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all text-left border"
              :class="[
                activeView === view.id
                  ? 'bg-primary/10 text-primary shadow-sm border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border-transparent',
              ]"
            >
              <Icon
                :name="view.icon"
                class="h-4 w-4 shrink-0"
                :class="activeView === view.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'"
              />
              <span>{{ view.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

