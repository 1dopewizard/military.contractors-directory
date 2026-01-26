<!--
  @file Employer Content Manager Component
  @description Manage benefits, programs, spotlight, and testimonials
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

interface Props {
  profile: {
    tier: string
    id: string
  }
}

const props = defineProps<Props>()

const isPremium = computed(() => props.profile.tier === 'premium' || props.profile.tier === 'enterprise')

interface Benefit {
  id: string
  icon: string
  title: string
  description: string
  sortOrder: number
}

interface Program {
  id: string
  name: string
  category: string | null
  description: string | null
  sortOrder: number
}

// Fetch benefits
const { data: benefits, refresh: refreshBenefits } = await useFetch<Benefit[]>('/api/profile-manager/benefits')

// Fetch programs
const { data: programs, refresh: refreshPrograms } = await useFetch<Program[]>('/api/profile-manager/programs')

// Editing state
const editingBenefit = ref<any>(null)
const editingProgram = ref<any>(null)
const showBenefitDialog = ref(false)
const showProgramDialog = ref(false)

// Benefit form
const benefitForm = reactive({
  id: undefined as string | undefined,
  icon: 'mdi:star-outline',
  title: '',
  description: '',
  sortOrder: 0,
})

// Program form
const programForm = reactive({
  id: undefined as string | undefined,
  name: '',
  category: '',
  description: '',
  sortOrder: 0,
})

const openBenefitDialog = (benefit?: any) => {
  if (benefit) {
    benefitForm.id = benefit.id
    benefitForm.icon = benefit.icon
    benefitForm.title = benefit.title
    benefitForm.description = benefit.description
    benefitForm.sortOrder = benefit.sortOrder
  } else {
    benefitForm.id = undefined
    benefitForm.icon = 'mdi:star-outline'
    benefitForm.title = ''
    benefitForm.description = ''
    benefitForm.sortOrder = (benefits.value?.length || 0)
  }
  showBenefitDialog.value = true
}

const openProgramDialog = (program?: any) => {
  if (program) {
    programForm.id = program.id
    programForm.name = program.name
    programForm.category = program.category || ''
    programForm.description = program.description || ''
    programForm.sortOrder = program.sortOrder
  } else {
    programForm.id = undefined
    programForm.name = ''
    programForm.category = ''
    programForm.description = ''
    programForm.sortOrder = (programs.value?.length || 0)
  }
  showProgramDialog.value = true
}

const saveBenefit = async () => {
  try {
    const { error } = await useFetch('/api/profile-manager/benefits', {
      method: 'POST',
      body: benefitForm,
    })

    if (error.value) {
      throw new Error(error.value.message)
    }

    toast.success(benefitForm.id ? 'Benefit updated' : 'Benefit added')
    showBenefitDialog.value = false
    await refreshBenefits()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save benefit')
  }
}

const deleteBenefit = async (id: string) => {
  if (!confirm('Are you sure you want to delete this benefit?')) return

  try {
    const { error } = await useFetch(`/api/profile-manager/benefits/${id}`, {
      method: 'DELETE',
    })

    if (error.value) {
      throw new Error(error.value.message)
    }

    toast.success('Benefit deleted')
    await refreshBenefits()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete benefit')
  }
}

const saveProgram = async () => {
  try {
    const { error } = await useFetch('/api/profile-manager/programs', {
      method: 'POST',
      body: programForm,
    })

    if (error.value) {
      throw new Error(error.value.message)
    }

    toast.success(programForm.id ? 'Program updated' : 'Program added')
    showProgramDialog.value = false
    await refreshPrograms()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save program')
  }
}

const deleteProgram = async (id: string) => {
  if (!confirm('Are you sure you want to delete this program?')) return

  try {
    const { error } = await useFetch(`/api/profile-manager/programs/${id}`, {
      method: 'DELETE',
    })

    if (error.value) {
      throw new Error(error.value.message)
    }

    toast.success('Program deleted')
    await refreshPrograms()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete program')
  }
}

// Common icons for benefits
const benefitIcons = [
  'mdi:cash-multiple',
  'mdi:heart-outline',
  'mdi:school-outline',
  'mdi:home-outline',
  'mdi:airplane',
  'mdi:account-group-outline',
  'mdi:trophy-outline',
  'mdi:chart-line',
  'mdi:shield-check-outline',
  'mdi:lightbulb-outline',
  'mdi:clock-outline',
  'mdi:leaf',
]
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold mb-1">Content Management</h2>
      <p class="text-sm text-muted-foreground">
        Add content to make your profile stand out to job seekers
      </p>
    </div>

    <!-- Why Work Here Section -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium">Why Work Here</h3>
          <p class="text-sm text-muted-foreground">
            Highlight 3 key benefits of working at your company
          </p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          :disabled="(benefits?.length || 0) >= 3"
          @click="openBenefitDialog()"
        >
          <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
          Add Benefit
        </Button>
      </div>

      <div v-if="!benefits?.length" class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <Icon name="mdi:star-outline" class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No benefits added yet</p>
        <Button size="sm" variant="ghost" class="mt-2" @click="openBenefitDialog()">
          Add your first benefit
        </Button>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-3">
        <div 
          v-for="benefit in benefits" 
          :key="benefit.id"
          class="p-4 border rounded-lg relative group"
        >
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="icon" variant="ghost" class="h-7 w-7" @click="openBenefitDialog(benefit)">
              <Icon name="mdi:pencil-outline" class="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" class="h-7 w-7 text-destructive" @click="deleteBenefit(benefit.id)">
              <Icon name="mdi:delete-outline" class="w-4 h-4" />
            </Button>
          </div>
          <Icon :name="benefit.icon" class="w-8 h-8 text-primary mb-2" />
          <h4 class="font-medium mb-1">{{ benefit.title }}</h4>
          <p class="text-sm text-muted-foreground">{{ benefit.description }}</p>
        </div>
      </div>
    </Card>

    <!-- Notable Programs Section -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium">Notable Programs</h3>
          <p class="text-sm text-muted-foreground">
            Showcase your key products, services, or programs (max 5)
          </p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          :disabled="(programs?.length || 0) >= 5"
          @click="openProgramDialog()"
        >
          <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
          Add Program
        </Button>
      </div>

      <div v-if="!programs?.length" class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <Icon name="mdi:rocket-launch-outline" class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No programs added yet</p>
        <Button size="sm" variant="ghost" class="mt-2" @click="openProgramDialog()">
          Add your first program
        </Button>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="program in programs" 
          :key="program.id"
          class="flex items-center justify-between p-3 border rounded-lg group"
        >
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-medium">{{ program.name }}</h4>
              <Badge v-if="program.category" variant="outline" class="text-xs">
                {{ program.category }}
              </Badge>
            </div>
            <p v-if="program.description" class="text-sm text-muted-foreground mt-0.5">
              {{ program.description }}
            </p>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" class="h-7 w-7" @click="openProgramDialog(program)">
              <Icon name="mdi:pencil-outline" class="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" class="h-7 w-7 text-destructive" @click="deleteProgram(program.id)">
              <Icon name="mdi:delete-outline" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Premium Features -->
    <Card v-if="!isPremium" class="p-6 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
      <div class="flex items-start gap-4">
        <Icon name="mdi:lock-outline" class="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-semibold mb-1">Premium Features</h3>
          <p class="text-sm text-muted-foreground mb-3">
            Upgrade to Premium to unlock Spotlight content blocks and Employee testimonials.
          </p>
          <Button size="sm" class="bg-amber-500 hover:bg-amber-600 text-white">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </Card>

    <!-- Spotlight (Premium Only) -->
    <Card v-if="isPremium" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-medium">Spotlight Content</h3>
            <Badge class="bg-amber-500/10 text-amber-600">Premium</Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Featured content block displayed prominently on your profile
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
          Create Spotlight
        </Button>
      </div>
      <div class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <Icon name="mdi:spotlight-beam" class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No spotlight content yet</p>
      </div>
    </Card>

    <!-- Testimonials (Premium Only) -->
    <Card v-if="isPremium" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-medium">Employee Testimonials</h3>
            <Badge class="bg-amber-500/10 text-amber-600">Premium</Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Share quotes from employees about their experience
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
          Add Testimonial
        </Button>
      </div>
      <div class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <Icon name="mdi:format-quote-close" class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No testimonials yet</p>
      </div>
    </Card>

    <!-- Benefit Dialog -->
    <Dialog v-model:open="showBenefitDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ benefitForm.id ? 'Edit' : 'Add' }} Benefit</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="saveBenefit">
          <div class="space-y-2">
            <Label>Icon</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="icon in benefitIcons"
                :key="icon"
                type="button"
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center border transition-colors',
                  benefitForm.icon === icon ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                ]"
                @click="benefitForm.icon = icon"
              >
                <Icon :name="icon" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="benefit-title">Title</Label>
            <Input
              id="benefit-title"
              v-model="benefitForm.title"
              maxlength="50"
              placeholder="e.g., Competitive Salary"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="benefit-description">Description</Label>
            <Textarea
              id="benefit-description"
              v-model="benefitForm.description"
              maxlength="150"
              placeholder="Brief description of this benefit..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showBenefitDialog = false">
              Cancel
            </Button>
            <Button type="submit">
              Save Benefit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Program Dialog -->
    <Dialog v-model:open="showProgramDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ programForm.id ? 'Edit' : 'Add' }} Program</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="saveProgram">
          <div class="space-y-2">
            <Label for="program-name">Name</Label>
            <Input
              id="program-name"
              v-model="programForm.name"
              maxlength="100"
              placeholder="e.g., F-35 Lightning II"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="program-category">Category</Label>
            <Input
              id="program-category"
              v-model="programForm.category"
              maxlength="50"
              placeholder="e.g., Combat Aircraft"
            />
          </div>
          <div class="space-y-2">
            <Label for="program-description">Description</Label>
            <Textarea
              id="program-description"
              v-model="programForm.description"
              maxlength="200"
              placeholder="Brief description of this program..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showProgramDialog = false">
              Cancel
            </Button>
            <Button type="submit">
              Save Program
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
