<!--
  @file AccountProfile.vue
  @description Profile editing form for account settings
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

const { 
  displayName, 
  email, 
  avatarUrl, 
  profile, 
  loading, 
  updateProfile, 
  updateDisplayName 
} = useUserProfile()
const { user } = useAuth()

// Form state
const isEditing = ref(false)
const isSaving = ref(false)
const formData = ref({
  name: '',
  branch: '',
  mosCode: '',
  clearanceLevel: '',
  yearsExperience: undefined as number | undefined,
  openToOconus: false,
  desiredSalaryMin: undefined as number | undefined,
  desiredSalaryMax: undefined as number | undefined,
})

// Initialize form data
watch([user, profile], () => {
  formData.value = {
    name: user.value?.name || displayName.value || '',
    branch: profile.value?.branch || 'not_specified',
    mosCode: profile.value?.mosCode || '',
    clearanceLevel: profile.value?.clearanceLevel || 'not_specified',
    yearsExperience: profile.value?.yearsExperience,
    openToOconus: profile.value?.openToOconus || false,
    desiredSalaryMin: profile.value?.desiredSalaryMin,
    desiredSalaryMax: profile.value?.desiredSalaryMax,
  }
}, { immediate: true })

// Helper to convert 'not_specified' to undefined for storage
const toStorageValue = (value: string) => 
  value && value !== 'not_specified' ? value : undefined

const handleSave = async () => {
  isSaving.value = true
  try {
    // Update display name if changed
    if (formData.value.name !== displayName.value) {
      await updateDisplayName(formData.value.name)
    }
    
    // Update profile
    await updateProfile({
      branch: toStorageValue(formData.value.branch),
      mosCode: formData.value.mosCode || undefined,
      clearanceLevel: toStorageValue(formData.value.clearanceLevel),
      yearsExperience: formData.value.yearsExperience,
      openToOconus: formData.value.openToOconus,
      desiredSalaryMin: formData.value.desiredSalaryMin,
      desiredSalaryMax: formData.value.desiredSalaryMax,
    })
    
    isEditing.value = false
    toast.success('Profile updated successfully')
  } catch (error) {
    toast.error('Failed to update profile')
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  // Reset form data
  formData.value = {
    name: user.value?.name || displayName.value || '',
    branch: profile.value?.branch || 'not_specified',
    mosCode: profile.value?.mosCode || '',
    clearanceLevel: profile.value?.clearanceLevel || 'not_specified',
    yearsExperience: profile.value?.yearsExperience,
    openToOconus: profile.value?.openToOconus || false,
    desiredSalaryMin: profile.value?.desiredSalaryMin,
    desiredSalaryMax: profile.value?.desiredSalaryMax,
  }
  isEditing.value = false
}

const clearanceLevels = [
  { value: 'not_specified', label: 'Not specified' },
  { value: 'None', label: 'None' },
  { value: 'Public Trust', label: 'Public Trust' },
  { value: 'Secret', label: 'Secret' },
  { value: 'Top Secret', label: 'Top Secret' },
  { value: 'TS/SCI', label: 'TS/SCI' },
]

const branches = [
  { value: 'not_specified', label: 'Not specified' },
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air_force', label: 'Air Force' },
  { value: 'marine_corps', label: 'Marine Corps' },
  { value: 'coast_guard', label: 'Coast Guard' },
  { value: 'space_force', label: 'Space Force' },
]
</script>

<template>
  <div class="space-y-8">
    <!-- Profile Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <Avatar class="size-16">
          <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="displayName || 'User'" />
          <AvatarFallback class="text-lg bg-primary/10 text-primary">
            {{ (displayName || email || 'U').charAt(0).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 class="text-xl font-semibold text-foreground">{{ displayName }}</h2>
          <p class="text-sm text-muted-foreground">{{ email }}</p>
        </div>
      </div>
      <Button 
        v-if="!isEditing" 
        variant="outline" 
        size="sm"
        @click="isEditing = true"
      >
        <Icon name="mdi:pencil" class="size-4 mr-2" />
        Edit Profile
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
    </div>

    <!-- Profile Form -->
    <div v-else class="space-y-6">
      <!-- Basic Info Section -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Basic Information</h3>
        
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Display Name -->
          <div class="space-y-2">
            <Label for="name">Display Name</Label>
            <Input
              id="name"
              v-model="formData.name"
              :disabled="!isEditing"
              placeholder="Your name"
            />
          </div>

          <!-- Years Experience -->
          <div class="space-y-2">
            <Label for="yearsExperience">Years of Experience</Label>
            <Input
              id="yearsExperience"
              v-model.number="formData.yearsExperience"
              type="number"
              :disabled="!isEditing"
              placeholder="0"
              min="0"
              max="50"
            />
          </div>
        </div>
      </div>

      <!-- Military Background Section -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Military Background</h3>
        
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Branch -->
          <div class="space-y-2">
            <Label for="branch">Military Branch</Label>
            <Select v-model="formData.branch" :disabled="!isEditing">
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="branch in branches" 
                  :key="branch.value" 
                  :value="branch.value"
                >
                  {{ branch.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- MOS Code -->
          <div class="space-y-2">
            <Label for="mosCode">MOS/AFSC/Rating Code</Label>
            <Input
              id="mosCode"
              v-model="formData.mosCode"
              :disabled="!isEditing"
              placeholder="e.g., 25B, 1N4X1"
            />
            <p class="text-xs text-muted-foreground">
              Your military occupational specialty code
            </p>
          </div>
        </div>

        <!-- Clearance -->
        <div class="space-y-2">
          <Label for="clearance">Security Clearance</Label>
          <Select v-model="formData.clearanceLevel" :disabled="!isEditing">
            <SelectTrigger class="sm:w-1/2">
              <SelectValue placeholder="Select clearance level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="level in clearanceLevels" 
                :key="level.value" 
                :value="level.value"
              >
                {{ level.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Job Preferences Section -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Job Preferences</h3>
        
        <!-- OCONUS -->
        <div class="flex items-center gap-3 py-2">
          <Switch
            id="openToOconus"
            v-model:checked="formData.openToOconus"
            :disabled="!isEditing"
          />
          <div>
            <Label for="openToOconus" class="cursor-pointer">
              Open to OCONUS positions
            </Label>
            <p class="text-xs text-muted-foreground">
              Outside Continental United States (overseas) locations
            </p>
          </div>
        </div>

        <!-- Salary Range -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="salaryMin">Minimum Desired Salary</Label>
            <InputGroup>
              <InputGroupAddon position="leading">$</InputGroupAddon>
              <Input
                id="salaryMin"
                v-model.number="formData.desiredSalaryMin"
                type="number"
                :disabled="!isEditing"
                placeholder="75000"
                min="0"
              />
            </InputGroup>
          </div>
          <div class="space-y-2">
            <Label for="salaryMax">Maximum Desired Salary</Label>
            <InputGroup>
              <InputGroupAddon position="leading">$</InputGroupAddon>
              <Input
                id="salaryMax"
                v-model.number="formData.desiredSalaryMax"
                type="number"
                :disabled="!isEditing"
                placeholder="150000"
                min="0"
              />
            </InputGroup>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="isEditing" class="flex gap-2 justify-end pt-4 border-t border-border">
        <Button variant="ghost" @click="handleCancel" :disabled="isSaving">
          Cancel
        </Button>
        <Button @click="handleSave" :disabled="isSaving">
          <Spinner v-if="isSaving" class="size-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  </div>
</template>
