<!--
  @file Salary submission page
  @route /salaries/submit
  @description Multi-step form for submitting salary reports to the community intel platform.
               Requires authentication. Form flow: Company → Role → Salary Details → MOS → Confirm
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { ClearanceLevel, EmploymentType, SalaryReportInput } from '@/app/types/community.types'
import type { Company } from '@/app/types/company.types'

const logger = useLogger('SalariesSubmitPage')
const router = useRouter()
const { isAuthenticated, isAuthReady, userId, userEmail } = useAuth()
const { submitSalaryReport } = useSalaryReports()
const { getAllCompanies, allCompanies, searchCompanies } = useCompanies()
const { loadProfile, userId: profileUserId } = useUserProfile()

// SEO
useHead({
  title: 'Share Salary | Contribute Intel | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Help fellow veterans by sharing your salary data anonymously. Your contribution helps the community make better career decisions.'
    }
  ]
})

// Multi-step form state
const currentStep = ref(1)
const totalSteps = 5
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submissionError = ref<string | null>(null)
const createdReportId = ref<string | null>(null)

// Company search state
const companySearchQuery = ref('')
const filteredCompanies = ref<Company[]>([])
const showCompanyDropdown = ref(false)

// Clearance options
const clearanceOptions: { value: ClearanceLevel; label: string }[] = [
  { value: 'NONE', label: 'No Clearance Required' },
  { value: 'PUBLIC_TRUST', label: 'Public Trust' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'TOP_SECRET', label: 'Top Secret' },
  { value: 'TS_SCI', label: 'TS/SCI' },
  { value: 'TS_SCI_POLY', label: 'TS/SCI with Polygraph' },
]

// Employment type options
const employmentOptions: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'CONTRACT', label: 'Contract (1099)' },
  { value: 'CONTRACT_TO_HIRE', label: 'Contract-to-Hire' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'INTERN', label: 'Internship' },
]

// Location options
const locationOptions = [
  'Northern Virginia',
  'Washington DC',
  'San Diego, CA',
  'Tampa, FL',
  'Colorado Springs, CO',
  'Huntsville, AL',
  'San Antonio, TX',
  'Fort Meade, MD',
  'Hawaii',
  'Remote',
  'OCONUS - Germany',
  'OCONUS - Japan',
  'OCONUS - South Korea',
  'OCONUS - Middle East',
  'Other',
]

// Years experience options
const experienceOptions = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 4, label: '4 years' },
  { value: 5, label: '5 years' },
  { value: 6, label: '6-7 years' },
  { value: 8, label: '8-10 years' },
  { value: 11, label: '11-15 years' },
  { value: 16, label: '16-20 years' },
  { value: 21, label: '20+ years' },
]

// Form schema
const salaryFormSchema = toTypedSchema(
  z.object({
    // Step 1: Company
    companyId: z.string().min(1, 'Please select a company'),
    companyName: z.string().optional(), // For display only
    
    // Step 2: Role
    roleTitle: z.string().min(2, 'Role title is required').max(100, 'Role title must be under 100 characters'),
    
    // Step 3: Salary Details
    baseSalary: z.number({ required_error: 'Base salary is required', invalid_type_error: 'Please enter a valid salary' })
      .min(20000, 'Salary must be at least $20,000')
      .max(500000, 'Salary must be under $500,000'),
    signingBonus: z.number().min(0).max(200000).optional(),
    clearanceLevel: z.enum(['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI', 'TS_SCI_POLY'], {
      required_error: 'Please select a clearance level'
    }),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONTRACT_TO_HIRE', 'INTERN'], {
      required_error: 'Please select employment type'
    }),
    yearsExperience: z.number({ required_error: 'Please select your experience level' }).min(0).max(50),
    location: z.string().min(2, 'Please select or enter a location'),
    isOconus: z.boolean(),
    
    // Step 4: MOS (optional)
    mosCode: z.string().max(10).optional(),
  })
)

const form = useForm({
  validationSchema: salaryFormSchema,
  initialValues: {
    companyId: '',
    companyName: '',
    roleTitle: '',
    baseSalary: undefined as number | undefined,
    signingBonus: undefined as number | undefined,
    clearanceLevel: undefined as ClearanceLevel | undefined,
    employmentType: 'FULL_TIME' as EmploymentType,
    yearsExperience: undefined as number | undefined,
    location: '',
    isOconus: false,
    mosCode: '',
  },
  validateOnMount: false,
})

// Watch location to auto-detect OCONUS
watch(() => form.values.location, (location) => {
  if (location?.startsWith('OCONUS')) {
    form.setFieldValue('isOconus', true)
  } else if (location && !location.startsWith('OCONUS')) {
    form.setFieldValue('isOconus', false)
  }
})

// Company search
const handleCompanySearch = async (query: string) => {
  companySearchQuery.value = query
  if (!query.trim()) {
    filteredCompanies.value = allCompanies.value.slice(0, 10)
    return
  }
  
  const results = await searchCompanies(query)
  filteredCompanies.value = results.slice(0, 15)
}

const selectCompany = (company: Company) => {
  form.setFieldValue('companyId', company.id)
  form.setFieldValue('companyName', company.name)
  companySearchQuery.value = company.name
  showCompanyDropdown.value = false
}

const clearCompany = () => {
  form.setFieldValue('companyId', '')
  form.setFieldValue('companyName', '')
  companySearchQuery.value = ''
}

// Step validation
const validateCurrentStep = async (): Promise<boolean> => {
  switch (currentStep.value) {
    case 1:
      return !!form.values.companyId
    case 2:
      const roleResult = await form.validateField('roleTitle')
      return roleResult.valid
    case 3:
      const salaryResult = await form.validateField('baseSalary')
      const clearanceResult = await form.validateField('clearanceLevel')
      const employmentResult = await form.validateField('employmentType')
      const experienceResult = await form.validateField('yearsExperience')
      const locationResult = await form.validateField('location')
      return salaryResult.valid && clearanceResult.valid && employmentResult.valid && experienceResult.valid && locationResult.valid
    case 4:
      // MOS is optional, always valid
      return true
    case 5:
      // Confirm step
      return true
    default:
      return true
  }
}

// Navigation
const nextStep = async () => {
  const isValid = await validateCurrentStep()
  if (isValid && currentStep.value < totalSteps) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToStep = async (step: number) => {
  // Can only go back, or forward if current step is valid
  if (step < currentStep.value) {
    currentStep.value = step
  } else if (step > currentStep.value) {
    const isValid = await validateCurrentStep()
    if (isValid) {
      currentStep.value = step
    }
  }
}

// Submit handler
const handleSubmit = async () => {
  const { valid } = await form.validate()
  if (!valid) {
    logger.warn('Form validation failed')
    return
  }

  if (!profileUserId.value) {
    submissionError.value = 'Please sign in to submit your salary report'
    return
  }

  isSubmitting.value = true
  submissionError.value = null

  try {
    const input: SalaryReportInput = {
      mosCode: form.values.mosCode || 'N/A',
      companyId: form.values.companyId!,
      location: form.values.location!,
      baseSalary: form.values.baseSalary!,
      signingBonus: form.values.signingBonus || undefined,
      clearanceLevel: form.values.clearanceLevel!,
      yearsExperience: form.values.yearsExperience!,
      employmentType: form.values.employmentType!,
      isOconus: form.values.isOconus!,
      submittedBy: profileUserId.value,
    }

    const result = await submitSalaryReport(input)

    if (result.success) {
      logger.info({ reportId: result.id }, 'Salary report submitted successfully')
      createdReportId.value = result.id || null
      isSuccess.value = true
    } else {
      logger.error({ error: result.error }, 'Failed to submit salary report')
      submissionError.value = result.error || 'Failed to submit salary report'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, 'Error submitting salary report')
    submissionError.value = message
  } finally {
    isSubmitting.value = false
  }
}

// Format salary for display
const formatSalary = (amount: number | undefined) => {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Computed
const stepTitles = ['Company', 'Role', 'Compensation', 'Background', 'Review']

const selectedCompanyName = computed(() => {
  if (form.values.companyName) return form.values.companyName
  const company = allCompanies.value.find(c => c.id === form.values.companyId)
  return company?.name || ''
})

const clearanceLabelMap: Record<ClearanceLevel, string> = {
  'NONE': 'No Clearance',
  'PUBLIC_TRUST': 'Public Trust',
  'SECRET': 'Secret',
  'TOP_SECRET': 'Top Secret',
  'TS_SCI': 'TS/SCI',
  'TS_SCI_POLY': 'TS/SCI + Poly',
}

const employmentLabelMap: Record<EmploymentType, string> = {
  'FULL_TIME': 'Full-Time',
  'PART_TIME': 'Part-Time',
  'CONTRACT': 'Contract',
  'CONTRACT_TO_HIRE': 'Contract-to-Hire',
  'INTERN': 'Internship',
}

// Auth redirect
watch([isAuthReady, isAuthenticated], ([ready, authenticated]) => {
  if (ready && !authenticated) {
    // Redirect to login with return URL
    router.push(`/auth/login?redirect=${encodeURIComponent('/salaries/submit')}`)
  }
})

// Load companies and profile on mount
onMounted(async () => {
  if (allCompanies.value.length === 0) {
    await getAllCompanies()
  }
  filteredCompanies.value = allCompanies.value.slice(0, 10)
  
  // Load user profile to get Convex user ID
  if (isAuthenticated.value) {
    await loadProfile()
  }
})
</script>

<template>
  <div class="min-h-full">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl py-8">
      <!-- Breadcrumb -->
      <nav class="text-sm text-muted-foreground mb-6">
        <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
        <span class="mx-2">/</span>
        <NuxtLink to="/salaries" class="hover:text-primary transition-colors">Salaries</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-foreground">Share</span>
      </nav>

      <!-- Auth Loading State -->
      <div v-if="!isAuthReady" class="flex flex-col items-center justify-center py-16 space-y-4">
        <Spinner class="w-8 h-8" />
        <p class="text-muted-foreground">Loading...</p>
      </div>

      <!-- Not Authenticated (shouldn't show long, will redirect) -->
      <Card v-else-if="!isAuthenticated" class="border-primary/30">
        <CardContent class="p-8 text-center space-y-4">
          <Icon name="mdi:account-lock" class="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 class="text-xl font-semibold">Sign in Required</h2>
          <p class="text-muted-foreground">
            Please sign in to share your salary information with the community.
          </p>
          <Button as-child>
            <NuxtLink :to="`/auth/login?redirect=${encodeURIComponent('/salaries/submit')}`">
              Sign In
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>

      <!-- Success State -->
      <template v-else-if="isSuccess">
        <Card class="border-primary/30 bg-primary/5">
          <CardContent class="p-8 text-center space-y-6">
            <div class="w-16 h-16 bg-primary/20 flex items-center justify-center mx-auto">
              <Icon name="mdi:check-circle" class="w-10 h-10 text-primary" />
            </div>
            
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-foreground">Thank You!</h2>
              <p class="text-muted-foreground max-w-md mx-auto">
                Your salary report has been submitted successfully. It will be reviewed and 
                made visible to the community shortly.
              </p>
            </div>

            <div class="pt-4 space-y-3">
              <p class="text-sm text-muted-foreground">Help spread the word</p>
              <div class="flex flex-wrap justify-center gap-3">
                <Button variant="outline" size="sm" as-child>
                  <a 
                    :href="`https://twitter.com/intent/tweet?text=I%20just%20shared%20my%20salary%20on%20military.contractors%20to%20help%20fellow%20veterans%20make%20better%20career%20decisions.%20Check%20it%20out!&url=https://military.contractors/salaries`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="mdi:twitter" class="w-4 h-4 mr-1.5" />
                    Share on X
                  </a>
                </Button>
                <Button variant="outline" size="sm" as-child>
                  <a 
                    :href="`https://www.linkedin.com/sharing/share-offsite/?url=https://military.contractors/salaries`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="mdi:linkedin" class="w-4 h-4 mr-1.5" />
                    Share on LinkedIn
                  </a>
                </Button>
              </div>
            </div>

            <Separator class="my-6" />

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <Button as-child>
                <NuxtLink to="/salaries">
                  <Icon name="mdi:chart-bar" class="w-4 h-4 mr-1.5" />
                  Browse Salaries
                </NuxtLink>
              </Button>
              <Button variant="ghost" as-child>
                <NuxtLink to="/interviews/submit">
                  <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
                  Share Interview Experience
                </NuxtLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </template>

      <!-- Form -->
      <template v-else>
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-foreground mb-2">Share Your Salary</h1>
          <p class="text-muted-foreground">
            Help fellow veterans by anonymously sharing your compensation data. 
            Your information helps the community negotiate better offers.
          </p>
        </div>

        <!-- Progress Steps -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <template v-for="(title, index) in stepTitles" :key="index">
              <button
                type="button"
                class="flex flex-col items-center gap-1.5 group"
                :class="[
                  currentStep > index + 1 ? 'cursor-pointer' : '',
                  currentStep < index + 1 ? 'pointer-events-none' : '',
                ]"
                @click="goToStep(index + 1)"
              >
                <div
                  class="w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors"
                  :class="[
                    currentStep === index + 1 ? 'bg-primary text-primary-foreground' : '',
                    currentStep > index + 1 ? 'bg-primary/20 text-primary' : '',
                    currentStep < index + 1 ? 'bg-muted text-muted-foreground' : '',
                  ]"
                >
                  <Icon v-if="currentStep > index + 1" name="mdi:check" class="w-4 h-4" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span 
                  class="text-xs hidden sm:block"
                  :class="currentStep === index + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'"
                >
                  {{ title }}
                </span>
              </button>
              <div 
                v-if="index < stepTitles.length - 1"
                class="flex-1 h-0.5 mx-2"
                :class="currentStep > index + 1 ? 'bg-primary/30' : 'bg-muted'"
              />
            </template>
          </div>
        </div>

        <!-- Form Card -->
        <Card>
          <CardContent class="p-6 sm:p-8">
            <form @submit.prevent="handleSubmit">
              <!-- Step 1: Company -->
              <div v-show="currentStep === 1" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold mb-1">Which company?</h2>
                  <p class="text-sm text-muted-foreground mb-6">
                    Select the company where you received this compensation.
                  </p>
                </div>

                <div class="space-y-2">
                  <Label class="text-sm">Company *</Label>
                  <div class="relative">
                    <InputGroup>
                      <InputGroupAddon>
                        <Icon name="mdi:domain" class="w-4 h-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <Input
                        v-model="companySearchQuery"
                        placeholder="Search for a company..."
                        @input="(e) => handleCompanySearch((e.target as HTMLInputElement).value)"
                        @focus="showCompanyDropdown = true"
                        class="pr-10"
                      />
                    </InputGroup>
                    <button
                      v-if="form.values.companyId"
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      @click="clearCompany"
                    >
                      <Icon name="mdi:close" class="w-4 h-4" />
                    </button>
                  </div>
                  
                  <!-- Company Dropdown -->
                  <div 
                    v-if="showCompanyDropdown && filteredCompanies.length > 0"
                    class="absolute z-50 w-full max-w-[calc(100%-3rem)] sm:max-w-[544px] mt-1 bg-popover border border-border max-h-60 overflow-auto"
                  >
                    <button
                      v-for="company in filteredCompanies"
                      :key="company.id"
                      type="button"
                      class="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-3"
                      :class="{ 'bg-primary/10': form.values.companyId === company.id }"
                      @click="selectCompany(company)"
                    >
                      <div class="w-8 h-8 bg-muted flex items-center justify-center shrink-0">
                        <Icon name="mdi:domain" class="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium truncate">{{ company.name }}</p>
                        <p v-if="company.headquarters" class="text-xs text-muted-foreground truncate">
                          {{ company.headquarters }}
                        </p>
                      </div>
                      <Icon 
                        v-if="form.values.companyId === company.id"
                        name="mdi:check" 
                        class="w-4 h-4 text-primary ml-auto shrink-0" 
                      />
                    </button>
                  </div>

                  <!-- Selected Company Display -->
                  <div 
                    v-if="form.values.companyId && selectedCompanyName" 
                    class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20"
                  >
                    <div class="w-10 h-10 bg-primary/20 flex items-center justify-center">
                      <Icon name="mdi:domain" class="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p class="font-medium">{{ selectedCompanyName }}</p>
                      <p class="text-xs text-muted-foreground">Selected company</p>
                    </div>
                    <Icon name="mdi:check-circle" class="w-5 h-5 text-primary ml-auto" />
                  </div>

                  <p v-if="form.errors.value.companyId" class="text-xs text-destructive">
                    {{ form.errors.value.companyId }}
                  </p>
                </div>

                <div class="text-sm text-muted-foreground bg-muted/30 p-4">
                  <p class="flex items-start gap-2">
                    <Icon name="mdi:information-outline" class="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Can't find your company? 
                      <a href="mailto:hello@military.contractors" class="text-primary hover:underline">
                        Let us know
                      </a>
                      and we'll add it.
                    </span>
                  </p>
                </div>
              </div>

              <!-- Step 2: Role -->
              <div v-show="currentStep === 2" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold mb-1">What role?</h2>
                  <p class="text-sm text-muted-foreground mb-6">
                    Enter your job title or role at {{ selectedCompanyName || 'the company' }}.
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="roleTitle" class="text-sm">Job Title / Role *</Label>
                  <Input
                    id="roleTitle"
                    :model-value="form.values.roleTitle"
                    @update:model-value="(v) => form.setFieldValue('roleTitle', String(v))"
                    placeholder="e.g., Senior Systems Engineer, Cyber Analyst III"
                    maxlength="100"
                  />
                  <div class="flex justify-between">
                    <p v-if="form.errors.value.roleTitle" class="text-xs text-destructive">
                      {{ form.errors.value.roleTitle }}
                    </p>
                    <p class="text-[10px] text-muted-foreground ml-auto">
                      {{ form.values.roleTitle?.length || 0 }}/100
                    </p>
                  </div>
                </div>

                <div class="text-sm text-muted-foreground bg-muted/30 p-4">
                  <p class="flex items-start gap-2">
                    <Icon name="mdi:lightbulb-outline" class="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Use your official job title if possible. This helps others find 
                      salaries for similar roles.
                    </span>
                  </p>
                </div>
              </div>

              <!-- Step 3: Salary Details -->
              <div v-show="currentStep === 3" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold mb-1">Compensation Details</h2>
                  <p class="text-sm text-muted-foreground mb-6">
                    Share your salary information. All data is kept anonymous.
                  </p>
                </div>

                <!-- Base Salary -->
                <div class="space-y-2">
                  <Label for="baseSalary" class="text-sm">Base Annual Salary (USD) *</Label>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <Input
                      id="baseSalary"
                      type="number"
                      :model-value="form.values.baseSalary"
                      @update:model-value="(v) => form.setFieldValue('baseSalary', v ? Number(v) : undefined)"
                      placeholder="125000"
                      min="20000"
                      max="500000"
                    />
                  </InputGroup>
                  <p v-if="form.errors.value.baseSalary" class="text-xs text-destructive">
                    {{ form.errors.value.baseSalary }}
                  </p>
                </div>

                <!-- Signing Bonus -->
                <div class="space-y-2">
                  <Label for="signingBonus" class="text-sm">Signing Bonus (Optional)</Label>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <Input
                      id="signingBonus"
                      type="number"
                      :model-value="form.values.signingBonus"
                      @update:model-value="(v) => form.setFieldValue('signingBonus', v ? Number(v) : undefined)"
                      placeholder="15000"
                      min="0"
                      max="200000"
                    />
                  </InputGroup>
                </div>

                <Separator />

                <!-- Clearance Level -->
                <div class="space-y-2">
                  <Label class="text-sm">Clearance Level Required *</Label>
                  <Select 
                    :model-value="form.values.clearanceLevel" 
                    @update:model-value="(v) => form.setFieldValue('clearanceLevel', v as ClearanceLevel)"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clearance level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="option in clearanceOptions" 
                        :key="option.value" 
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="form.errors.value.clearanceLevel" class="text-xs text-destructive">
                    {{ form.errors.value.clearanceLevel }}
                  </p>
                </div>

                <!-- Employment Type -->
                <div class="space-y-2">
                  <Label class="text-sm">Employment Type *</Label>
                  <Select 
                    :model-value="form.values.employmentType" 
                    @update:model-value="(v) => form.setFieldValue('employmentType', v as EmploymentType)"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="option in employmentOptions" 
                        :key="option.value" 
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="form.errors.value.employmentType" class="text-xs text-destructive">
                    {{ form.errors.value.employmentType }}
                  </p>
                </div>

                <!-- Years Experience -->
                <div class="space-y-2">
                  <Label class="text-sm">Years of Experience *</Label>
                  <Select 
                    :model-value="form.values.yearsExperience?.toString()" 
                    @update:model-value="(v) => form.setFieldValue('yearsExperience', Number(v))"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="option in experienceOptions" 
                        :key="option.value" 
                        :value="option.value.toString()"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="form.errors.value.yearsExperience" class="text-xs text-destructive">
                    {{ form.errors.value.yearsExperience }}
                  </p>
                </div>

                <!-- Location -->
                <div class="space-y-2">
                  <Label class="text-sm">Location *</Label>
                  <Select 
                    :model-value="form.values.location" 
                    @update:model-value="(v) => form.setFieldValue('location', String(v))"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="location in locationOptions" 
                        :key="location" 
                        :value="location"
                      >
                        {{ location }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="form.errors.value.location" class="text-xs text-destructive">
                    {{ form.errors.value.location }}
                  </p>
                </div>

                <!-- OCONUS Toggle (if Other or custom) -->
                <div v-if="form.values.location === 'Other'" class="flex items-center gap-3">
                  <Switch
                    :checked="form.values.isOconus"
                    @update:checked="(v) => form.setFieldValue('isOconus', v)"
                  />
                  <Label class="text-sm cursor-pointer">This is an OCONUS (overseas) position</Label>
                </div>
              </div>

              <!-- Step 4: MOS (Optional) -->
              <div v-show="currentStep === 4" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold mb-1">Your Background (Optional)</h2>
                  <p class="text-sm text-muted-foreground mb-6">
                    Adding your MOS helps veterans with similar backgrounds find relevant salary data.
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="mosCode" class="text-sm">MOS / AFSC / Rating Code</Label>
                  <Input
                    id="mosCode"
                    :model-value="form.values.mosCode"
                    @update:model-value="(v) => form.setFieldValue('mosCode', String(v).toUpperCase())"
                    placeholder="e.g., 25B, 17C, 1N4"
                    maxlength="10"
                    class="uppercase"
                  />
                  <p class="text-xs text-muted-foreground">
                    Enter your military occupation code if applicable
                  </p>
                </div>

                <div class="text-sm text-muted-foreground bg-muted/30 p-4">
                  <p class="flex items-start gap-2">
                    <Icon name="mdi:shield-star-outline" class="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      This field is optional. Skip it if your military background isn't relevant 
                      to this position or if you prefer not to share.
                    </span>
                  </p>
                </div>
              </div>

              <!-- Step 5: Review -->
              <div v-show="currentStep === 5" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold mb-1">Review Your Submission</h2>
                  <p class="text-sm text-muted-foreground mb-6">
                    Please review your information before submitting.
                  </p>
                </div>

                <div class="space-y-4">
                  <!-- Company & Role -->
                  <div class="p-4 bg-muted/30 space-y-3">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="text-xs text-muted-foreground uppercase tracking-wider">Company</p>
                        <p class="font-semibold">{{ selectedCompanyName }}</p>
                      </div>
                      <Button variant="ghost" size="sm" class="h-7 text-xs" @click="goToStep(1)">
                        Edit
                      </Button>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                      <p class="font-medium">{{ form.values.roleTitle }}</p>
                    </div>
                  </div>

                  <!-- Compensation -->
                  <div class="p-4 bg-muted/30 space-y-3">
                    <div class="flex justify-between items-start">
                      <p class="text-xs text-muted-foreground uppercase tracking-wider">Compensation</p>
                      <Button variant="ghost" size="sm" class="h-7 text-xs" @click="goToStep(3)">
                        Edit
                      </Button>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-muted-foreground">Base Salary</p>
                        <p class="text-xl font-bold text-primary">{{ formatSalary(form.values.baseSalary) }}</p>
                      </div>
                      <div v-if="form.values.signingBonus">
                        <p class="text-xs text-muted-foreground">Signing Bonus</p>
                        <p class="font-semibold">{{ formatSalary(form.values.signingBonus) }}</p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2 pt-2">
                      <Badge variant="secondary">
                        {{ clearanceLabelMap[form.values.clearanceLevel!] }}
                      </Badge>
                      <Badge variant="outline">
                        {{ employmentLabelMap[form.values.employmentType!] }}
                      </Badge>
                      <Badge variant="outline">
                        {{ experienceOptions.find(o => o.value === form.values.yearsExperience)?.label }} exp
                      </Badge>
                    </div>
                  </div>

                  <!-- Location -->
                  <div class="p-4 bg-muted/30 space-y-2">
                    <div class="flex justify-between items-start">
                      <p class="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                      <Button variant="ghost" size="sm" class="h-7 text-xs" @click="goToStep(3)">
                        Edit
                      </Button>
                    </div>
                    <p class="font-medium flex items-center gap-2">
                      <Icon :name="form.values.isOconus ? 'mdi:earth' : 'mdi:map-marker'" class="w-4 h-4" />
                      {{ form.values.location }}
                      <Badge v-if="form.values.isOconus" variant="secondary" class="text-xs">OCONUS</Badge>
                    </p>
                  </div>

                  <!-- MOS -->
                  <div v-if="form.values.mosCode" class="p-4 bg-muted/30 space-y-2">
                    <div class="flex justify-between items-start">
                      <p class="text-xs text-muted-foreground uppercase tracking-wider">Background</p>
                      <Button variant="ghost" size="sm" class="h-7 text-xs" @click="goToStep(4)">
                        Edit
                      </Button>
                    </div>
                    <p class="font-medium flex items-center gap-2">
                      <Icon name="mdi:shield-account" class="w-4 h-4" />
                      {{ form.values.mosCode }}
                    </p>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="submissionError" class="p-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
                  <Icon name="mdi:alert-circle" class="w-4 h-4 mt-0.5 shrink-0" />
                  {{ submissionError }}
                </div>

                <!-- Privacy Notice -->
                <div class="text-sm text-muted-foreground bg-primary/5 border border-primary/20 p-4">
                  <p class="flex items-start gap-2">
                    <Icon name="mdi:shield-check" class="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span>
                      <strong class="text-foreground">Your privacy is protected.</strong> 
                      Your submission is anonymous — your name and email are never displayed 
                      with your salary report.
                    </span>
                  </p>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex items-center justify-between pt-8 border-t border-border/50 mt-8">
                <Button
                  v-if="currentStep > 1"
                  type="button"
                  variant="ghost"
                  @click="prevStep"
                >
                  <Icon name="mdi:chevron-left" class="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div v-else />

                <Button
                  v-if="currentStep < totalSteps"
                  type="button"
                  @click="nextStep"
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
                  {{ isSubmitting ? 'Submitting...' : 'Submit Salary Report' }}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <!-- Bottom CTA -->
        <div class="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already contributed? 
            <NuxtLink to="/salaries" class="text-primary hover:underline">
              Browse salary reports
            </NuxtLink>
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
