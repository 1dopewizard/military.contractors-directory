<!--
  @file Employer Profile Form Component
  @description Edit contractor profile details
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Props {
  profile: {
    contractor: {
      id: string
      name: string
      slug: string
      description: string | null
      headquarters: string | null
      employeeCount: string | null
      website: string | null
      careersUrl: string | null
      linkedinUrl: string | null
      logoUrl: string | null
    } | null
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updated: []
}>()

const isSubmitting = ref(false)

const form = reactive({
  description: props.profile.contractor?.description || '',
  headquarters: props.profile.contractor?.headquarters || '',
  employeeCount: props.profile.contractor?.employeeCount || '',
  website: props.profile.contractor?.website || '',
  careersUrl: props.profile.contractor?.careersUrl || '',
  linkedinUrl: props.profile.contractor?.linkedinUrl || '',
})

// Reset form when profile changes
watch(() => props.profile, (newProfile) => {
  if (newProfile?.contractor) {
    form.description = newProfile.contractor.description || ''
    form.headquarters = newProfile.contractor.headquarters || ''
    form.employeeCount = newProfile.contractor.employeeCount || ''
    form.website = newProfile.contractor.website || ''
    form.careersUrl = newProfile.contractor.careersUrl || ''
    form.linkedinUrl = newProfile.contractor.linkedinUrl || ''
  }
}, { deep: true })

const saveProfile = async () => {
  isSubmitting.value = true

  try {
    const { error } = await useFetch('/api/profile-manager/profile', {
      method: 'PATCH',
      body: form,
    })

    if (error.value) {
      throw new Error(error.value.message || 'Failed to save profile')
    }

    toast.success('Profile updated successfully')
    emit('updated')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save profile'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

const characterCount = computed(() => ({
  description: form.description.length,
  descriptionMax: 2000,
}))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold mb-1">Edit Profile</h2>
      <p class="text-sm text-muted-foreground">
        Update your company information and links
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="saveProfile">
      <!-- Logo Section -->
      <Card class="p-6">
        <h3 class="font-medium mb-4">Company Logo</h3>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
            <img 
              v-if="profile.contractor?.logoUrl" 
              :src="profile.contractor.logoUrl" 
              :alt="profile.contractor?.name"
              class="w-full h-full object-contain rounded-lg"
            />
            <Icon v-else name="mdi:image-outline" class="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" disabled>
              <Icon name="mdi:upload" class="w-4 h-4 mr-1.5" />
              Upload Logo
            </Button>
            <p class="text-xs text-muted-foreground mt-1">
              PNG or SVG, max 2MB. Contact support to update your logo.
            </p>
          </div>
        </div>
      </Card>

      <!-- Basic Info -->
      <Card class="p-6 space-y-4">
        <h3 class="font-medium">Basic Information</h3>

        <div class="space-y-2">
          <Label for="description">Company Description</Label>
          <Textarea
            id="description"
            v-model="form.description"
            :maxlength="characterCount.descriptionMax"
            placeholder="Tell potential candidates about your company, culture, and mission..."
            class="min-h-[150px]"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>A compelling description helps attract top talent</span>
            <span>{{ characterCount.description }}/{{ characterCount.descriptionMax }}</span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              v-model="form.headquarters"
              placeholder="e.g., Bethesda, MD"
            />
          </div>
          <div class="space-y-2">
            <Label for="employeeCount">Employee Count</Label>
            <Input
              id="employeeCount"
              v-model="form.employeeCount"
              placeholder="e.g., 45,000"
            />
          </div>
        </div>
      </Card>

      <!-- Links -->
      <Card class="p-6 space-y-4">
        <h3 class="font-medium">Links</h3>

        <div class="space-y-2">
          <Label for="website">Company Website</Label>
          <div class="relative">
            <Icon name="mdi:web" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="website"
              v-model="form.website"
              type="url"
              placeholder="https://www.company.com"
              class="pl-10"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="careersUrl">Careers Page</Label>
          <div class="relative">
            <Icon name="mdi:briefcase-outline" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="careersUrl"
              v-model="form.careersUrl"
              type="url"
              placeholder="https://careers.company.com"
              class="pl-10"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="linkedinUrl">LinkedIn</Label>
          <div class="relative">
            <Icon name="mdi:linkedin" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="linkedinUrl"
              v-model="form.linkedinUrl"
              type="url"
              placeholder="https://www.linkedin.com/company/..."
              class="pl-10"
            />
          </div>
        </div>
      </Card>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <Button type="submit" :disabled="isSubmitting">
          <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  </div>
</template>
