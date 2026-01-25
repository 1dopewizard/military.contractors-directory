<!--
  @file Dashboard/Advertiser/AdvertiserAdList.vue
  @description List of ads with filtering for advertiser dashboard
-->

<script setup lang="ts">
import type { FeaturedAd, FeaturedJob, AdStatus } from '@/app/types/ad.types'

interface AdItem {
  type: 'ad' | 'job'
  data: FeaturedAd | FeaturedJob
  title: string
  subtitle: string
}

interface Props {
  items: AdItem[]
  isLoading: boolean
  error: string | null
  statusFilter: AdStatus | 'all'
}

interface Emits {
  (e: 'update:statusFilter', value: AdStatus | 'all'): void
  (e: 'pause', item: AdItem): void
  (e: 'resume', item: AdItem): void
  (e: 'cancel', item: AdItem): void
  (e: 'retry'): void
  (e: 'create'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getStatusBadge = (status: AdStatus) => {
  switch (status) {
    case 'active': return { label: 'Active', class: 'bg-green-500/10 text-green-600 dark:text-green-400' }
    case 'draft': return { label: 'Draft', class: 'bg-muted text-muted-foreground' }
    case 'pending_review': return { label: 'Pending Review', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    case 'pending_payment': return { label: 'Pending Payment', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    case 'paused': return { label: 'Paused', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    case 'expired': return { label: 'Expired', class: 'bg-red-500/10 text-red-600 dark:text-red-400' }
    case 'cancelled': return { label: 'Cancelled', class: 'bg-muted text-muted-foreground line-through' }
    default: return { label: status, class: 'bg-muted text-muted-foreground' }
  }
}

const getPriorityBadge = (priority?: number) => {
  if (priority === 2) return { label: 'Premium', class: 'bg-primary/10 text-primary' }
  return null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <!-- Filter -->
  <div class="flex items-center gap-2 mb-6">
    <Label class="text-xs text-muted-foreground">Filter:</Label>
    <Select :model-value="statusFilter" @update:model-value="(v) => emit('update:statusFilter', v as AdStatus | 'all')">
      <SelectTrigger class="w-44 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="pending_review">Pending Review</SelectItem>
        <SelectItem value="paused">Paused</SelectItem>
        <SelectItem value="pending_payment">Pending Payment</SelectItem>
        <SelectItem value="expired">Expired</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <!-- Loading -->
  <div v-if="isLoading" class="space-y-4">
    <div v-for="i in 3" :key="i" class="p-4 border border-border rounded animate-pulse">
      <div class="h-4 bg-muted w-1/3 mb-2"></div>
      <div class="h-3 bg-muted w-1/2"></div>
    </div>
  </div>

  <!-- Error -->
  <Card v-else-if="error" class="p-6 text-center border-destructive/30">
    <Icon name="mdi:alert-circle-outline" class="w-8 h-8 text-destructive mx-auto mb-2" />
    <p class="text-sm text-destructive">{{ error }}</p>
    <Button variant="ghost" size="sm" class="mt-4" @click="emit('retry')">Try Again</Button>
  </Card>

  <!-- Empty State -->
  <Card v-else-if="items.length === 0" class="p-12 text-center">
    <Icon name="mdi:bullhorn-outline" class="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
    <h3 class="font-semibold text-foreground mb-2">No ads yet</h3>
    <p class="text-sm text-muted-foreground mb-6">Create your first featured ad to reach thousands of cleared veterans.</p>
    <Button @click="emit('create')">
      <Icon name="mdi:plus" class="w-4 h-4 mr-2" />
      Create Your First Ad
    </Button>
  </Card>

  <!-- Ad List -->
  <Card v-else class="bg-transparent border border-transparent divide-y divide-border">
    <div v-for="item in items" :key="`${item.type}-${item.data.id}`" class="p-4 hover:bg-muted/30 transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded" :class="item.type === 'job' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'">
              {{ item.type === 'job' ? 'Job' : 'Spotlight' }}
            </span>
            <span class="px-1.5 py-0.5 text-[10px] font-medium rounded" :class="getStatusBadge(item.data.status).class">
              {{ getStatusBadge(item.data.status).label }}
            </span>
            <span v-if="getPriorityBadge(item.data.priority)" class="px-1.5 py-0.5 text-[10px] font-medium rounded" :class="getPriorityBadge(item.data.priority)!.class">
              {{ getPriorityBadge(item.data.priority)!.label }}
            </span>
          </div>
          <h3 class="font-semibold text-foreground truncate">{{ item.title }}</h3>
          <p class="text-sm text-muted-foreground truncate">{{ item.subtitle }}</p>
          <p class="text-xs text-muted-foreground/70 mt-1">Created {{ formatDate(item.data.created_at) }}</p>
          <p v-if="item.data.status === 'cancelled' && item.data.rejection_reason" class="text-xs text-destructive mt-1">
            Rejection reason: {{ item.data.rejection_reason }}
          </p>
        </div>

        <div class="flex items-center gap-6 text-center">
          <div>
            <p class="text-lg font-mono font-semibold text-foreground">{{ item.data.impressions.toLocaleString() }}</p>
            <p class="text-[10px] text-muted-foreground uppercase">Impressions</p>
          </div>
          <div>
            <p class="text-lg font-mono font-semibold text-foreground">{{ item.data.clicks.toLocaleString() }}</p>
            <p class="text-[10px] text-muted-foreground uppercase">Clicks</p>
          </div>
          <div>
            <p class="text-lg font-mono font-semibold text-primary">
              {{ item.data.impressions > 0 ? ((item.data.clicks / item.data.impressions) * 100).toFixed(1) : '0.0' }}%
            </p>
            <p class="text-[10px] text-muted-foreground uppercase">CTR</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <template v-if="item.data.status === 'active'">
            <Button variant="ghost" size="sm" @click="emit('pause', item)">
              <Icon name="mdi:pause" class="w-4 h-4 mr-1" />Pause
            </Button>
          </template>
          <template v-else-if="item.data.status === 'paused'">
            <Button variant="ghost" size="sm" @click="emit('resume', item)">
              <Icon name="mdi:play" class="w-4 h-4 mr-1" />Resume
            </Button>
          </template>

          <DropdownMenu v-if="!['cancelled', 'expired'].includes(item.data.status)">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                <Icon name="mdi:dots-vertical" class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem class="text-destructive" @click="emit('cancel', item)">
                <Icon name="mdi:close-circle-outline" class="w-4 h-4 mr-2" />Cancel Ad
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </Card>
</template>
