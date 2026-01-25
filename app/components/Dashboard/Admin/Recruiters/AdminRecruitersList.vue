<!--
  @file AdminRecruitersList.vue
  @description Admin component for managing recruiter access
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Recruiter {
  id: string
  email: string
  name: string | null
  is_active: boolean
  last_active_at: string | null
  created_at: string
}

const logger = useLogger('AdminRecruitersList')

// Data state
const recruiters = ref<Recruiter[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Dialog state
const isInviteDialogOpen = ref(false)
const inviteEmail = ref('')
const inviteName = ref('')
const isInviting = ref(false)

// Confirm dialog state
const confirmDialog = ref<{
  open: boolean
  title: string
  description: string
  action: () => Promise<void>
  loading: boolean
}>({
  open: false,
  title: '',
  description: '',
  action: async () => {},
  loading: false
})

const openConfirmDialog = (title: string, description: string, action: () => Promise<void>) => {
  confirmDialog.value = { open: true, title, description, action, loading: false }
}

const handleConfirm = async () => {
  confirmDialog.value.loading = true
  await confirmDialog.value.action()
  confirmDialog.value.loading = false
  confirmDialog.value.open = false
}

// Fetch recruiters
const fetchRecruiters = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<{ recruiters: Recruiter[] }>('/api/admin/recruiters')
    recruiters.value = response.recruiters
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load recruiters'
    logger.error({ error: err }, 'Failed to fetch recruiters')
  } finally {
    isLoading.value = false
  }
}

// Invite new recruiter
const handleInvite = async () => {
  if (!inviteEmail.value.trim()) return

  isInviting.value = true

  try {
    await $fetch('/api/admin/recruiters', {
      method: 'POST',
      body: {
        email: inviteEmail.value.trim().toLowerCase(),
        name: inviteName.value.trim() || null
      }
    })
    toast.success('Recruiter added successfully')
    isInviteDialogOpen.value = false
    inviteEmail.value = ''
    inviteName.value = ''
    await fetchRecruiters()
  } catch (err: any) {
    toast.error(err.data?.statusMessage || 'Failed to add recruiter')
  } finally {
    isInviting.value = false
  }
}

// Toggle recruiter active status
const toggleActive = async (recruiter: Recruiter) => {
  try {
    await $fetch(`/api/admin/recruiters/${recruiter.id}`, {
      method: 'PATCH',
      body: { is_active: !recruiter.is_active }
    })
    toast.success(recruiter.is_active ? 'Recruiter deactivated' : 'Recruiter activated')
    await fetchRecruiters()
  } catch (err: any) {
    toast.error('Failed to update recruiter status')
  }
}

// Delete recruiter
const deleteRecruiter = (id: string) => {
  openConfirmDialog(
    'Remove Recruiter',
    'This recruiter will lose access immediately. This action cannot be undone.',
    async () => {
      try {
        await $fetch(`/api/admin/recruiters/${id}`, {
          method: 'DELETE'
        })
        toast.success('Recruiter removed')
        await fetchRecruiters()
      } catch (err: any) {
        toast.error('Failed to remove recruiter')
      }
    }
  )
}

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchRecruiters()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Recruiters</h2>
        <p class="text-sm text-muted-foreground">Manage team members with recruiter access</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="fetchRecruiters">
          <Icon name="mdi:refresh" class="w-4 h-4 mr-1" />
          Refresh
        </Button>
        <Button size="sm" @click="isInviteDialogOpen = true">
          <Icon name="mdi:account-plus" class="w-4 h-4 mr-1" />
          Add Recruiter
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="p-6 text-center border-destructive/30">
      <Icon name="mdi:alert-circle-outline" class="w-8 h-8 text-destructive mx-auto mb-2" />
      <p class="text-sm text-destructive">{{ error }}</p>
      <Button variant="ghost" size="sm" class="mt-4" @click="fetchRecruiters">Try Again</Button>
    </Card>

    <!-- Empty -->
    <Empty v-else-if="recruiters.length === 0" class="border">
      <EmptyMedia variant="icon">
        <Icon name="mdi:account-group-outline" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle class="text-base">No recruiters yet</EmptyTitle>
      <EmptyDescription>Add your first recruiter to get started.</EmptyDescription>
      <Button size="sm" class="mt-4" @click="isInviteDialogOpen = true">
        <Icon name="mdi:account-plus" class="w-4 h-4 mr-1.5" />
        Add Recruiter
      </Button>
    </Empty>

    <!-- Recruiters List -->
    <div v-else class="divide-y divide-border/30">
      <div v-for="recruiter in recruiters" :key="recruiter.id" class="py-3 first:pt-0">
        <div class="flex items-center gap-4">
          <!-- Recruiter Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">{{ recruiter.name || recruiter.email }}</span>
              <Badge 
                :variant="recruiter.is_active ? 'default' : 'secondary'" 
                class="text-[10px]"
              >
                {{ recruiter.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
            <p v-if="recruiter.name" class="text-xs text-muted-foreground">{{ recruiter.email }}</p>
            <p class="text-xs text-muted-foreground">
              Last active: {{ formatDate(recruiter.last_active_at) }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0"
              :title="recruiter.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleActive(recruiter)"
            >
              <Icon
                :name="recruiter.is_active ? 'mdi:account-off' : 'mdi:account-check'"
                class="w-4 h-4"
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0 text-destructive"
              title="Remove"
              @click="deleteRecruiter(recruiter.id)"
            >
              <Icon name="mdi:delete-outline" class="w-4 h-4" />
            </Button>
          </div>

          <!-- Date -->
          <span class="text-xs text-muted-foreground shrink-0 w-20 text-right">
            {{ formatDate(recruiter.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Invite Dialog -->
    <Dialog v-model:open="isInviteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recruiter</DialogTitle>
          <DialogDescription>
            Add a team member with recruiter access. They will be able to view candidates, manage
            placements, and contact employers.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleInvite" class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label class="text-xs">Email Address *</Label>
            <Input v-model="inviteEmail" type="email" placeholder="recruiter@company.com" required />
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs">Name (optional)</Label>
            <Input v-model="inviteName" placeholder="John Smith" />
          </div>

          <div class="flex gap-2 pt-2">
            <Button type="button" variant="ghost" class="flex-1" @click="isInviteDialogOpen = false">
              Cancel
            </Button>
            <Button type="submit" class="flex-1" :disabled="isInviting || !inviteEmail.trim()">
              <Spinner v-if="isInviting" class="w-4 h-4 mr-2" />
              Add Recruiter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :loading="confirmDialog.loading"
      variant="destructive"
      confirm-text="Remove"
      @confirm="handleConfirm"
    />
  </div>
</template>
