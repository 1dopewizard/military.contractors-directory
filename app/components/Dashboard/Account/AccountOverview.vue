<!--
  @file AccountOverview.vue
  @description Account dashboard overview with profile info and quick actions
-->
<script setup lang="ts">
const emit = defineEmits<{
  setTab: [tabId: string]
}>()

const { profile, displayName, userId } = useUserProfile()

// Profile completion percentage
const profileCompletion = computed(() => {
  if (!profile.value) return 0
  const fields = [
    profile.value.branch,
    profile.value.mosCode,
    profile.value.clearanceLevel,
    profile.value.yearsExperience !== undefined,
  ]
  const completed = fields.filter(Boolean).length
  return Math.round((completed / fields.length) * 100)
})
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome & Profile Completion -->
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Welcome back, {{ displayName }}</h2>
        <p class="text-muted-foreground text-sm mt-1">
          Manage your account settings and profile
        </p>
      </div>

      <!-- Profile Completion Bar -->
      <div 
        v-if="profileCompletion < 100"
        class="p-4 bg-primary/5 border border-primary/10"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-foreground">Profile completion</span>
          <span class="text-sm font-mono text-primary">{{ profileCompletion }}%</span>
        </div>
        <div class="h-2 bg-muted overflow-hidden">
          <div 
            class="h-full bg-primary transition-all duration-500"
            :style="{ width: `${profileCompletion}%` }"
          />
        </div>
        <Button 
          variant="link" 
          class="mt-2 p-0 h-auto text-xs"
          @click="emit('setTab', 'profile')"
        >
          Complete your profile →
        </Button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/contractors">
            <Icon name="mdi:domain" class="w-4 h-4 mr-2" />
            Browse Contractors
          </NuxtLink>
        </Button>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/top-defense-contractors">
            <Icon name="mdi:trophy-outline" class="w-4 h-4 mr-2" />
            Top 100 Contractors
          </NuxtLink>
        </Button>
        <Button variant="ghost" size="sm" @click="emit('setTab', 'profile')">
          <Icon name="mdi:account-edit-outline" class="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </div>

    <!-- Account Info -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Account</h3>
      <div class="space-y-2 text-sm">
        <div class="flex items-center justify-between py-2 border-b border-border">
          <span class="text-muted-foreground">Display Name</span>
          <span class="font-medium">{{ displayName }}</span>
        </div>
        <div v-if="profile?.branch" class="flex items-center justify-between py-2 border-b border-border">
          <span class="text-muted-foreground">Branch</span>
          <span class="font-medium">{{ profile.branch }}</span>
        </div>
        <div v-if="profile?.clearanceLevel" class="flex items-center justify-between py-2 border-b border-border">
          <span class="text-muted-foreground">Clearance</span>
          <span class="font-medium">{{ profile.clearanceLevel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
