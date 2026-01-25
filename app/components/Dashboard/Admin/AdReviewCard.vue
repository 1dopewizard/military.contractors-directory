<script setup lang="ts">
import type { FeaturedAd, FeaturedJob, AdStatus } from '@/app/types/ad.types'

type AdItem = {
  type: 'ad' | 'job'
  data: FeaturedAd | FeaturedJob
}

const props = defineProps<{
  item: AdItem
}>()

const emit = defineEmits<{
  approve: [payload: { id: string; type: 'ad' | 'job' }]
  reject: [payload: { id: string; type: 'ad' | 'job'; reason: string }]
}>()

const rejectionReason = ref('')
const showRejectDialog = ref(false)

const isSpotlight = computed(() => props.item.type === 'ad')
const spotlight = computed(() => props.item.data as FeaturedAd)
const job = computed(() => props.item.data as FeaturedJob)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleApprove = () => {
  emit('approve', { id: props.item.data.id, type: props.item.type })
}

const handleReject = () => {
  if (!rejectionReason.value.trim()) return
  emit('reject', { id: props.item.data.id, type: props.item.type, reason: rejectionReason.value })
  showRejectDialog.value = false
  rejectionReason.value = ''
}
</script>

<template>
  <div class="border-l-2 border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span
            class="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded"
            :class="isSpotlight ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
          >
            {{ isSpotlight ? 'Spotlight' : 'Job' }}
          </span>
          <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Pending Review
          </span>
        </div>
        <h3 class="font-semibold text-foreground">
          {{ isSpotlight ? spotlight.headline : job.title }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ isSpotlight ? spotlight.advertiser : job.company }}
        </p>
      </div>
      <p class="text-xs text-muted-foreground shrink-0">
        {{ formatDate(item.data.created_at) }}
      </p>
    </div>

    <!-- Content Preview -->
    <div class="text-sm space-y-1 text-muted-foreground">
      <template v-if="isSpotlight">
        <p><span class="text-foreground font-medium">Tagline:</span> {{ spotlight.tagline }}</p>
        <p><span class="text-foreground font-medium">Description:</span> {{ spotlight.description }}</p>
        <p><span class="text-foreground font-medium">CTA:</span> {{ spotlight.cta_text }}</p>
        <p><span class="text-foreground font-medium">URL:</span>
          <a :href="spotlight.cta_url" target="_blank" class="text-primary hover:underline">
            {{ spotlight.cta_url }}
          </a>
        </p>
      </template>
      <template v-else>
        <p><span class="text-foreground font-medium">Location:</span> {{ job.location }}</p>
        <p><span class="text-foreground font-medium">Clearance:</span> {{ job.clearance }}</p>
        <p><span class="text-foreground font-medium">Salary:</span> {{ job.salary }}</p>
        <p><span class="text-foreground font-medium">Pitch:</span> {{ job.pitch }}</p>
        <p><span class="text-foreground font-medium">Apply URL:</span>
          <a :href="job.apply_url" target="_blank" class="text-primary hover:underline">
            {{ job.apply_url }}
          </a>
        </p>
      </template>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <Button size="sm" @click="handleApprove">
        <Icon name="mdi:check" class="w-4 h-4 mr-1" />
        Approve
      </Button>
      <Dialog v-model:open="showRejectDialog">
        <DialogTrigger as-child>
          <Button variant="destructive" size="sm">
            <Icon name="mdi:close" class="w-4 h-4 mr-1" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ad</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this ad. This will be visible to the advertiser.
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <Textarea
              v-model="rejectionReason"
              placeholder="Enter rejection reason..."
              class="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" @click="showRejectDialog = false">Cancel</Button>
            <Button
              variant="destructive"
              :disabled="!rejectionReason.trim()"
              @click="handleReject"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
