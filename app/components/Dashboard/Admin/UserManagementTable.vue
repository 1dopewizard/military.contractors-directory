<script setup lang="ts">
interface User {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_admin: boolean | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const logger = useLogger("UserManagementTable");

const users = ref<User[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");

const loadUsers = async () => {
  try {
    isLoading.value = true;
    const response = await $fetch<{ users: User[] }>("/api/admin/users");
    users.value = response.users || [];
    logger.info({ count: users.value.length }, "Users loaded");
  } catch (err) {
    logger.error({ error: err }, "Failed to load users");
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (user) =>
      user.email?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query),
  );
});

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Search & Stats -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <Icon
          name="mdi:magnify"
          class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search by email or name..."
          class="h-9 pl-10"
        />
      </div>
      <span class="text-muted-foreground shrink-0 text-xs">
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
        <Icon name="mdi:account-off-outline" class="h-6 w-6" />
      </EmptyMedia>
      <EmptyTitle class="text-base">No users found</EmptyTitle>
    </Empty>

    <!-- Users List -->
    <div v-else class="divide-border/30 divide-y">
      <div
        v-for="user in filteredUsers"
        :key="user.user_id"
        class="py-3 first:pt-0"
      >
        <div class="flex items-center gap-4">
          <!-- User Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{{
                user.display_name || "No name"
              }}</span>
              <Badge
                v-if="user.is_admin"
                variant="default"
                class="text-[10px]"
                >Admin</Badge
              >
              <Badge
                v-else-if="user.role && user.role !== 'user'"
                variant="outline"
                class="text-[10px]"
                >{{ user.role }}</Badge
              >
            </div>
            <p class="text-muted-foreground text-xs">{{ user.email }}</p>
          </div>

          <!-- Last login -->
          <span
            class="text-muted-foreground hidden w-32 shrink-0 text-right text-xs sm:inline"
          >
            Last login: {{ formatDate(user.last_login_at) }}
          </span>
          <!-- Created date -->
          <span class="text-muted-foreground w-20 shrink-0 text-right text-xs">
            {{ formatDate(user.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
