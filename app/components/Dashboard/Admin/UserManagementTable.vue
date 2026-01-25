<script setup lang="ts">
interface User {
  user_id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  branch: string | null
  clearance_level: string | null
  oconus_preference: boolean | null
  preferred_regions: string[] | null
  preferred_theaters: string[] | null
  created_at: string | null
  updated_at: string | null
}

const logger = useLogger('UserManagementTable')

const users = ref<User[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const loadUsers = async () => {
  try {
    isLoading.value = true
    const response = await $fetch<{ users: User[] }>('/api/admin/users')
    users.value = response.users || []
    logger.info({ count: users.value.length }, 'Users loaded')
  } catch (err) {
    logger.error({ error: err }, 'Failed to load users')
    users.value = []
  } finally {
    isLoading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.email?.toLowerCase().includes(query) ||
    user.display_name?.toLowerCase().includes(query)
  )
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Search & Stats -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search by email or name..."
          class="pl-10 h-9"
        />
      </div>
      <span class="text-xs text-muted-foreground shrink-0">
        {{ filteredUsers.length }} of {{ users.length }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner class="size-6" />
    </div>

    <!-- Empty -->
    <Empty v-else-if="filteredUsers.length === 0" class="border">
      <EmptyMedia variant="icon">
        <Icon name="mdi:account-off-outline" class="w-6 h-6" />
      </EmptyMedia>
      <EmptyTitle class="text-base">No users found</EmptyTitle>
    </Empty>

    <!-- Users List -->
    <div v-else class="divide-y divide-border/30">
      <div v-for="user in filteredUsers" :key="user.user_id" class="py-3 first:pt-0">
        <div class="flex items-center gap-4">
          <!-- User Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">{{ user.display_name || 'No name' }}</span>
              <Badge v-if="user.branch" variant="outline" class="text-[10px]">{{ user.branch }}</Badge>
              <Badge v-if="user.clearance_level" variant="secondary" class="text-[10px]">{{ user.clearance_level }}</Badge>
            </div>
            <p class="text-xs text-muted-foreground">{{ user.email }}</p>
          </div>

          <!-- Date -->
          <span class="text-xs text-muted-foreground shrink-0 w-20 text-right">
            {{ formatDate(user.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

