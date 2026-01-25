<!--
  @file Viewed MOSes list component
  @usage <ViewedMosesList />
  @description Displays recently viewed MOS pages using Better Auth + API
-->

<script setup lang="ts">
import ViewedMosSkeleton from '@/app/components/Mos/ViewedMosSkeleton.vue'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/app/components/ui/empty'

interface ViewedMos {
  id: string
  code: string
  title: string
  branch: string
  viewedAt: number
  viewCount: number
}

const { isAuthenticated, isAuthReady } = useAuth()
const { userId } = useUserProfile()
const viewedMoses = ref<ViewedMos[]>([])
const loading = ref(true)

const loadViewedMoses = async () => {
  // Wait for auth to be ready and require authenticated user
  if (!isAuthenticated.value || !userId.value) {
    loading.value = false
    return
  }
  
  try {
    const data = await $fetch<ViewedMos[]>('/api/users/viewed-mos', {
      query: { limit: 10 },
    })
    
    viewedMoses.value = (data || []).map((item: any) => ({
      id: item.id,
      code: item.code || '',
      title: item.title || '',
      branch: item.branch || '',
      viewedAt: item.viewedAt,
      viewCount: item.viewCount
    }))
  } catch (error) {
    console.error('Failed to load viewed MOSes:', error)
  } finally {
    loading.value = false
  }
}

// Watch for auth state changes and reload when user is ready
watch(
  [isAuthReady, userId],
  ([ready]) => {
    if (ready) {
      loadViewedMoses()
    }
  },
  { immediate: true }
)

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold tracking-tight">Recently Viewed MOSes</h2>
    </div>

    <Card>
      <CardContent class="pt-6">
        <!-- Loading state -->
        <ViewedMosSkeleton v-if="loading" :count="5" />
        
        <!-- Empty state -->
        <Empty v-else-if="viewedMoses.length === 0">
          <EmptyMedia variant="icon">
            <Icon name="mdi:history" class="size-5" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>No MOS pages viewed yet</EmptyTitle>
            <EmptyDescription>MOS codes you view will appear here</EmptyDescription>
          </EmptyContent>
        </Empty>
        
        <!-- Data -->
        <div v-else class="space-y-4">
          <NuxtLink
            v-for="mos in viewedMoses"
            :key="mos.id"
            :to="`/search?q=${mos.code}`"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <Icon name="mdi:shield-account" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-semibold">{{ mos.code }}</p>
                  <Badge variant="soft" class="text-xs">{{ mos.branch }}</Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ mos.title }}</p>
              </div>
            </div>
            <div class="text-right text-xs text-muted-foreground">
              <p>{{ formatTimeAgo(mos.viewedAt) }}</p>
              <p>{{ mos.viewCount }} {{ mos.viewCount === 1 ? 'view' : 'views' }}</p>
            </div>
          </NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>