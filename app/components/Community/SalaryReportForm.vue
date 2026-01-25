<!--
  @file Community/SalaryReportForm.vue
  @description Multi-step form for submitting salary reports with validation
  @usage <SalaryReportForm @submit="handleSubmit" @cancel="handleCancel" />
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { 
  SalaryReportInput, 
  ClearanceLevel, 
  EmploymentType 
} from '@/app/types/community.types'
import type { Contractor } from '@/app/composables/useContractors'

interface Props {
  /** Whether form submission is in progress */
  isSubmitting?: boolean
  /** Pre-fill MOS code */
  initialMosCode?: string
  /** Pre-fill company ID */
  initialCompanyId?: string
}

interface Emits {
  (e: 'submit', input: SalaryReportInput): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
})

const emit = defineEmits<Emits>()

// Multi-step form
const currentStep = ref(1)
const totalSteps = 3

// Options data
const clearanceLevels: { value: ClearanceLevel; label: string }[] = [
  { value: 'NONE', label: 'No Clearance Required' },
  { value: 'PUBLIC_TRUST', label: 'Public Trust' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'TOP_SECRET', label: 'Top Secret' },
  { value: 'TS_SCI', label: 'TS/SCI' },
  { value: 'TS_SCI_POLY', label: 'TS/SCI + Polygraph' },
]

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CONTRACT_TO_HIRE', label: 'Contract to Hire' },
  { value: 'INTERN', label: 'Internship' },
]

const locationRegions = [
  'Northern Virginia',
  'Washington DC',
  'Maryland',
  'San Antonio, TX',
  'Tampa, FL',
  'Colorado Springs, CO',
  'San Diego, CA',
  'Huntsville, AL',
  'Fort Meade, MD',
  'Remote (CONUS)',
  'Germany',
  'Japan',
  'Korea',
  'Middle East',
  'Other OCONUS',
]

// Form validation schema
const salaryReportSchema = toTypedSchema(
  z.object({
    // Step 1: MOS & Company
    mosCode: z.string().min(1, 'MOS code is required').max(10, 'MOS code too long')
      .regex(/^[A-Za-z0-9]+$/, 'MOS code should only contain letters and numbers'),
    companyId: z.string().min(1, 'Please select a company'),
    
    // Step 2: Compensation
    baseSalary: z.coerce.number({ message: 'Enter a valid salary' })
      .min(20000, 'Salary must be at least $20,000')
      .max(500000, 'Salary cannot exceed $500,000'),
    signingBonus: z.coerce.number().min(0).max(100000).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONTRACT_TO_HIRE', 'INTERN']),
    
    // Step 3: Details
    location: z.string().min(1, 'Location is required'),
    clearanceLevel: z.enum(['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI', 'TS_SCI_POLY']),
    yearsExperience: z.coerce.number({ message: 'Enter years of experience' })
      .min(0, 'Years must be 0 or more')
      .max(50, 'Years cannot exceed 50'),
    isOconus: z.boolean(),
  })
)

// Form instance
const form = useForm({
  validationSchema: salaryReportSchema,
  initialValues: {
    mosCode: props.initialMosCode || '',
    companyId: props.initialCompanyId || '',
    baseSalary: undefined as number | undefined,
    signingBonus: undefined as number | undefined,
    employmentType: 'FULL_TIME' as EmploymentType,
    location: '',
    clearanceLevel: 'SECRET' as ClearanceLevel,
    yearsExperience: undefined as number | undefined,
    isOconus: false,
  },
  validateOnMount: false,
})

// Track form submission attempt (to show validation errors)
const formSubmitted = ref(false)

// Contractors for dropdown
const contractors = ref<Contractor[]>([])
const contractorsLoading = ref(false)
const contractorSearchQuery = ref('')

// Fetch contractors
const { getAllContractors } = useContractors()

onMounted(async () => {
  contractorsLoading.value = true
  try {
    contractors.value = await getAllContractors()
  } finally {
    contractorsLoading.value = false
  }
})

// Filtered contractors for search
const filteredContractors = computed(() => {
  if (!contractorSearchQuery.value) return contractors.value
  const query = contractorSearchQuery.value.toLowerCase()
  return contractors.value.filter((c) => c.name.toLowerCase().includes(query))
})

// Selected contractor name
const selectedContractorName = computed(() => {
  const contractor = contractors.value.find((c) => c.id === form.values.companyId)
  return contractor?.name || ''
})

// Step validation
const isStep1Valid = computed(() => {
  return !!form.values.mosCode && !!form.values.companyId
})

const isStep2Valid = computed(() => {
  return typeof form.values.baseSalary === 'number' && 
         form.values.baseSalary >= 20000 &&
         !!form.values.employmentType
})

const isStep3Valid = computed(() => {
  return !!form.values.location && 
         !!form.values.clearanceLevel &&
         typeof form.values.yearsExperience === 'number' &&
         form.values.yearsExperience >= 0
})

// Navigation
const goToStep = (step: number) => {
  if (step < currentStep.value) {
    currentStep.value = step
    return
  }
  
  // Validate current step before advancing
  if (currentStep.value === 1 && !isStep1Valid.value) {
    formSubmitted.value = true
    return
  }
  if (currentStep.value === 2 && !isStep2Valid.value) {
    formSubmitted.value = true
    return
  }
  
  currentStep.value = step
}

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    goToStep(currentStep.value + 1)
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Submit handler
const handleSubmit = async () => {
  formSubmitted.value = true
  const { valid } = await form.validate()
  
  if (!valid) {
    // Go back to first invalid step
    if (!isStep1Valid.value) {
      currentStep.value = 1
    } else if (!isStep2Valid.value) {
      currentStep.value = 2
    } else if (!isStep3Valid.value) {
      currentStep.value = 3
    }
    return
  }
  
  const values = form.values
  const input: SalaryReportInput = {
    mosCode: values.mosCode!.toUpperCase(),
    companyId: values.companyId!,
    baseSalary: values.baseSalary!,
    signingBonus: values.signingBonus || undefined,
    employmentType: values.employmentType!,
    location: values.location!,
    clearanceLevel: values.clearanceLevel!,
    yearsExperience: values.yearsExperience!,
    isOconus: values.isOconus!,
  }
  
  emit('submit', input)
}

// Format salary for display in preview
const formatSalary = (value: number | undefined) => {
  if (!value) return '—'
  return `$${value.toLocaleString()}`
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Progress indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-muted-foreground">Step {{ currentStep }} of {{ totalSteps }}</span>
        <span class="text-sm text-muted-foreground">
          {{ currentStep === 1 ? 'Background' : currentStep === 2 ? 'Compensation' : 'Details' }}
        </span>
      </div>
      <div class="flex gap-1">
        <div 
          v-for="step in totalSteps" 
          :key="step"
          class="flex-1 h-1 transition-colors"
          :class="[
            step <= currentStep ? 'bg-primary' : 'bg-muted'
          ]"
        />
      </div>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <!-- Step 1: MOS & Company -->
      <div v-show="currentStep === 1" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Your Background</h2>
          <p class="text-sm text-muted-foreground">
            Tell us about your military background and employer.
          </p>
        </div>
        
        <!-- MOS Code -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">MOS / AFSC Code *</Label>
          <Input
            :model-value="form.values.mosCode"
            @update:model-value="(v) => form.setFieldValue('mosCode', String(v).toUpperCase())"
            placeholder="e.g., 25B, 35F, 17C"
            class="h-12 font-mono text-lg uppercase"
            maxlength="10"
          />
          <p v-if="formSubmitted && form.errors.value.mosCode" class="text-xs text-destructive">
            {{ form.errors.value.mosCode }}
          </p>
          <p class="text-xs text-muted-foreground">
            Your military occupational specialty code
          </p>
        </div>
        
        <!-- Contractor Selection -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Employer *</Label>
          
          <!-- Search input -->
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="contractorSearchQuery"
              placeholder="Search contractors..."
              class="pl-10 h-10"
            />
          </div>
          
          <!-- Contractor list -->
          <div class="border border-border/40 max-h-64 overflow-y-auto">
            <div v-if="contractorsLoading" class="p-4 text-center text-muted-foreground">
              <Spinner class="w-5 h-5 mx-auto mb-2" />
              Loading contractors...
            </div>
            <div v-else-if="filteredContractors.length === 0" class="p-4 text-center text-muted-foreground">
              No contractors found
            </div>
            <button
              v-for="contractor in filteredContractors.slice(0, 50)"
              :key="contractor.id"
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border/30 last:border-0"
              :class="{ 'bg-primary/10': form.values.companyId === contractor.id }"
              @click="form.setFieldValue('companyId', contractor.id)"
            >
              <span class="font-medium">{{ contractor.name }}</span>
              <Icon 
                v-if="form.values.companyId === contractor.id" 
                name="mdi:check" 
                class="w-5 h-5 text-primary"
              />
            </button>
          </div>
          
          <p v-if="formSubmitted && form.errors.value.companyId" class="text-xs text-destructive">
            {{ form.errors.value.companyId }}
          </p>
          
          <!-- Selected contractor display -->
          <div v-if="selectedContractorName" class="flex items-center gap-2 text-sm text-primary">
            <Icon name="mdi:check-circle" class="w-4 h-4" />
            Selected: <span class="font-medium">{{ selectedContractorName }}</span>
          </div>
        </div>
      </div>
      
      <!-- Step 2: Compensation -->
      <div v-show="currentStep === 2" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Compensation Details</h2>
          <p class="text-sm text-muted-foreground">
            Share your salary information. All data is anonymized.
          </p>
        </div>
        
        <!-- Base Salary -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Base Annual Salary *</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
            <Input
              type="number"
              :model-value="(form.values.baseSalary as number | undefined) ?? ''"
              @update:model-value="(v: string | number) => form.setFieldValue('baseSalary', Number(v))"
              placeholder="120000"
              class="pl-8 h-12 text-lg"
              min="20000"
              max="500000"
              step="1000"
            />
          </div>
          <p v-if="formSubmitted && form.errors.value.baseSalary" class="text-xs text-destructive">
            {{ form.errors.value.baseSalary }}
          </p>
          <p class="text-xs text-muted-foreground">
            Your gross annual salary before taxes
          </p>
        </div>
        
        <!-- Signing Bonus -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Signing Bonus (Optional)</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
            <Input
              type="number"
              :model-value="(form.values.signingBonus as number | undefined) ?? ''"
              @update:model-value="(v: string | number) => form.setFieldValue('signingBonus', v ? Number(v) : undefined)"
              placeholder="10000"
              class="pl-8 h-10"
              min="0"
              max="100000"
              step="1000"
            />
          </div>
          <p v-if="formSubmitted && form.errors.value.signingBonus" class="text-xs text-destructive">
            {{ form.errors.value.signingBonus }}
          </p>
        </div>
        
        <!-- Employment Type -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Employment Type *</Label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="type in employmentTypes"
              :key="type.value"
              type="button"
              class="px-4 py-3 text-sm font-medium border transition-colors"
              :class="[
                form.values.employmentType === type.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted/50'
              ]"
              @click="form.setFieldValue('employmentType', type.value)"
            >
              {{ type.label }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Step 3: Details -->
      <div v-show="currentStep === 3" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Additional Details</h2>
          <p class="text-sm text-muted-foreground">
            A few more details to help others in similar situations.
          </p>
        </div>
        
        <!-- Location -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Work Location *</Label>
          <Select
            :model-value="(form.values.location as string) || ''"
            @update:model-value="(v: string | number | boolean | Record<string, unknown> | undefined) => form.setFieldValue('location', String(v))"
          >
            <SelectTrigger class="h-10">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="loc in locationRegions" :key="loc" :value="loc">
                {{ loc }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="formSubmitted && form.errors.value.location" class="text-xs text-destructive">
            {{ form.errors.value.location }}
          </p>
        </div>
        
        <!-- OCONUS Toggle -->
        <div class="flex items-center justify-between p-4 border border-border/40 bg-muted/20">
          <div>
            <Label class="text-sm font-medium">OCONUS Position</Label>
            <p class="text-xs text-muted-foreground">Is this position outside the continental United States?</p>
          </div>
          <Switch
            :checked="(form.values.isOconus as boolean) ?? false"
            @update:checked="(v: boolean) => form.setFieldValue('isOconus', v)"
          />
        </div>
        
        <!-- Clearance Level -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Security Clearance *</Label>
          <Select
            :model-value="(form.values.clearanceLevel as string) || ''"
            @update:model-value="(v: string | number | boolean | Record<string, unknown> | undefined) => form.setFieldValue('clearanceLevel', String(v) as ClearanceLevel)"
          >
            <SelectTrigger class="h-10">
              <SelectValue placeholder="Select clearance level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="level in clearanceLevels" :key="level.value" :value="level.value">
                {{ level.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="formSubmitted && form.errors.value.clearanceLevel" class="text-xs text-destructive">
            {{ form.errors.value.clearanceLevel }}
          </p>
        </div>
        
        <!-- Years of Experience -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Years of Experience *</Label>
          <Input
            type="number"
            :model-value="(form.values.yearsExperience as number | undefined) ?? ''"
            @update:model-value="(v: string | number) => form.setFieldValue('yearsExperience', Number(v))"
            placeholder="5"
            class="h-10 w-32"
            min="0"
            max="50"
          />
          <p v-if="formSubmitted && form.errors.value.yearsExperience" class="text-xs text-destructive">
            {{ form.errors.value.yearsExperience }}
          </p>
          <p class="text-xs text-muted-foreground">
            Total years in this role or similar positions
          </p>
        </div>
        
        <!-- Summary Preview -->
        <div class="p-4 bg-muted/30 border border-border/40 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">Report Summary</h3>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div class="text-muted-foreground">MOS Code</div>
            <div class="font-mono font-medium">{{ form.values.mosCode || '—' }}</div>
            
            <div class="text-muted-foreground">Employer</div>
            <div class="font-medium">{{ selectedContractorName || '—' }}</div>
            
            <div class="text-muted-foreground">Base Salary</div>
            <div class="font-medium">{{ formatSalary(form.values.baseSalary as number | undefined) }}</div>
            
            <div v-if="form.values.signingBonus" class="text-muted-foreground">Signing Bonus</div>
            <div v-if="form.values.signingBonus" class="font-medium text-emerald-600">
              +{{ formatSalary(form.values.signingBonus as number | undefined) }}
            </div>
            
            <div class="text-muted-foreground">Location</div>
            <div class="font-medium">
              {{ form.values.location || '—' }}
              <span v-if="form.values.isOconus" class="text-amber-600 ml-1">(OCONUS)</span>
            </div>
            
            <div class="text-muted-foreground">Clearance</div>
            <div class="font-medium">
              {{ clearanceLevels.find(l => l.value === form.values.clearanceLevel)?.label || '—' }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="flex items-center justify-between pt-8 border-t border-border/30 mt-8">
        <Button
          v-if="currentStep > 1"
          type="button"
          variant="ghost"
          @click="prevStep"
        >
          <Icon name="mdi:chevron-left" class="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          v-else
          type="button"
          variant="ghost"
          @click="emit('cancel')"
        >
          Cancel
        </Button>
        
        <Button
          v-if="currentStep < totalSteps"
          type="button"
          @click="nextStep"
          :disabled="(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)"
        >
          Continue
          <Icon name="mdi:chevron-right" class="w-4 h-4 ml-1" />
        </Button>
        <Button
          v-else
          type="submit"
          :disabled="isSubmitting"
        >
          <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
          {{ isSubmitting ? 'Submitting...' : 'Submit Report' }}
        </Button>
      </div>
    </form>
  </div>
</template>
