<!--
  @file employers/index.vue
  @description Employer job submission page with URL/paste extraction and preview
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'

useHead({
  title: 'For Employers | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Post defense contractor jobs for free and reach cleared military veterans. Feature your listings for maximum visibility with instant MOS matching.'
    }
  ]
})

// Types
interface MosMatch {
  code: string
  name: string
  branch: string
  similarity: number
}

interface JobEducation {
  level?: string
  fields?: string[]
  acceptsEquivalency?: boolean
}

interface JobQualifications {
  certs?: string[]
  required?: string[]
  preferred?: string[]
  languages?: string[]
  licenses?: string[]
  education?: JobEducation
  yearsExperienceMin?: number
}

interface JobCompensation {
  benefits?: string[]
  perDiemDailyUSD?: number
  housingProvided?: boolean
  hardshipEligible?: boolean
}

interface ExtractedJob {
  title: string
  company: string
  location: string
  location_type?: string | null
  theater?: string | null
  clearance_required?: string | null
  clearance_level?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_display?: string | null
  description: string
  snippet?: string | null
  requirements?: string[]  // Legacy flat field
  responsibilities?: string[]
  qualifications?: JobQualifications  // Rich qualifications structure
  compensation?: JobCompensation  // Benefits & compensation details
  tools_tech?: string[]
  domain_tags?: string[]
  employment_type?: string | null
  seniority?: string | null
  source_url?: string | null
  external_id?: string | null
  embedding_text?: string | null
  matched_mos_codes?: MosMatch[]
}

// Phone formatting utilities
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/

// Form schema
const formSchema = toTypedSchema(
  z.object({
    companyName: z.string().min(2, 'Company name is required'),
    contactName: z.string().min(2, 'Your name is required'),
    contactEmail: z.string().email('Please enter a valid email'),
    contactPhone: z.string()
      .transform(val => val.trim())
      .refine(val => val === '' || phoneRegex.test(val), {
        message: 'Please enter a valid phone number'
      })
      .optional(),
    sourceType: z.enum(['url', 'paste']),
    jobUrl: z.string().url('Please enter a valid URL').optional(),
    jobContent: z.string().min(100, 'Please paste at least 100 characters').optional(),
  }).refine(
    (data) => {
      if (data.sourceType === 'url') return !!data.jobUrl
      if (data.sourceType === 'paste') return !!data.jobContent
      return false
    },
    { message: 'Please provide a job URL or paste the job description', path: ['jobUrl'] }
  )
)

const handlePhoneInput = (value: string | number) => {
  const formatted = formatPhoneNumber(String(value))
  form.setFieldValue('contactPhone', formatted)
}

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    sourceType: 'url' as const,
    jobUrl: '',
    jobContent: '',
  },
  validateOnMount: false
})

// State
const isPreviewLoading = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const previewJob = ref<ExtractedJob | null>(null)
const previewError = ref<string | null>(null)
const previewConfirmed = ref(false)
const formSubmitted = ref(false)

// Submitted job state (for success screen)
const submittedJob = ref<{
  id: string
  slug: string
  autoApproved: boolean
} | null>(null)

// Featured upgrade modal state
const showFeaturedModal = ref(false)
const isFeaturedRequesting = ref(false)

// Computed
const canPreview = computed(() => {
  if (form.values.sourceType === 'url') {
    return !!form.values.jobUrl && form.values.jobUrl.length > 10
  }
  return !!form.values.jobContent && form.values.jobContent.length >= 100
})

const canSubmit = computed(() => {
  return previewJob.value && previewConfirmed.value && !isSubmitting.value
})

// Methods
const handlePreview = async () => {
  previewError.value = null
  previewJob.value = null
  previewConfirmed.value = false
  isPreviewLoading.value = true

  try {
    const response = await $fetch<{ success: boolean; job?: ExtractedJob; error?: string }>('/api/employers/preview-job', {
      method: 'POST',
      body: {
        source_type: form.values.sourceType,
        job_url: form.values.sourceType === 'url' ? form.values.jobUrl : undefined,
        job_content: form.values.sourceType === 'paste' ? form.values.jobContent : undefined,
      }
    })

    if (response.success && response.job) {
      previewJob.value = response.job
      toast.success('Job extracted successfully!', {
        description: 'Review the preview below and confirm to submit.'
      })
    } else {
      previewError.value = response.error || 'Failed to extract job data'
      toast.error('Extraction failed', {
        description: previewError.value
      })
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to preview job'
    previewError.value = errorMessage
    toast.error('Preview failed', {
      description: errorMessage
    })
  } finally {
    isPreviewLoading.value = false
  }
}

const handleSubmit = async () => {
  formSubmitted.value = true
  const { valid } = await form.validate()
  if (!valid || !previewJob.value || !previewConfirmed.value) return

  isSubmitting.value = true

  try {
    const response = await $fetch<{
      success: boolean
      job_id: string
      job_slug: string
      status: string
      auto_approved: boolean
      approval: {
        decision: string
        confidence: number
        reasoning: string
        flags: string[]
      }
    }>('/api/employers/submit-job', {
      method: 'POST',
      body: {
        contact_name: form.values.contactName,
        contact_email: form.values.contactEmail,
        contact_phone: form.values.contactPhone || undefined,
        company_name: form.values.companyName,
        source_type: form.values.sourceType,
        job_url: form.values.sourceType === 'url' ? form.values.jobUrl : undefined,
        job_content: form.values.sourceType === 'paste' ? form.values.jobContent : undefined,
        job: previewJob.value,
      }
    })

    if (response.success) {
      isSubmitted.value = true
      submittedJob.value = {
        id: response.job_id,
        slug: response.job_slug,
        autoApproved: response.auto_approved
      }
      if (response.auto_approved) {
        toast.success('Job published!', {
          description: 'Your job is now live and visible to veterans.'
        })
      } else {
        toast.success('Job submitted for review', {
          description: 'Our team will review and publish within 24 hours.'
        })
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit job'
    toast.error('Submission failed', { description: msg })
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.resetForm()
  previewJob.value = null
  previewError.value = null
  previewConfirmed.value = false
  isSubmitted.value = false
  formSubmitted.value = false
  submittedJob.value = null
  showFeaturedModal.value = false
}

// Featured upgrade request handler
const handleFeaturedRequest = async () => {
  if (!submittedJob.value) return
  
  isFeaturedRequesting.value = true
  try {
    const response = await $fetch<{ success: boolean; message?: string }>('/api/employers/request-featured', {
      method: 'POST',
      body: {
        job_id: submittedJob.value.id,
        contact_email: form.values.contactEmail,
        contact_name: form.values.contactName,
        contact_phone: form.values.contactPhone || undefined,
      }
    })

    if (response.success) {
      showFeaturedModal.value = false
      toast.success('Featured request submitted!', {
        description: "We'll contact you within 60 minutes to complete your upgrade."
      })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit featured request'
    toast.error('Request failed', { description: msg })
  } finally {
    isFeaturedRequesting.value = false
  }
}

const formatSalary = (min?: number | null, max?: number | null, display?: string | null) => {
  if (display) return display
  if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
  if (min) return `$${(min / 1000).toFixed(0)}k+`
  if (max) return `Up to $${(max / 1000).toFixed(0)}k`
  return null
}

// Benefit labels with icons (matches job detail page)
const BENEFIT_LABELS: Record<string, { label: string; icon: string }> = {
  HOUSING: { label: 'Housing Provided', icon: 'mdi:home' },
  TRANSPORTATION: { label: 'Transportation', icon: 'mdi:car' },
  BONUS: { label: 'Completion Bonus', icon: 'mdi:cash-plus' },
  TUITION_REIMBURSEMENT: { label: 'Tuition Reimbursement', icon: 'mdi:school' },
  HEALTH: { label: 'Health Insurance', icon: 'mdi:hospital' },
  DENTAL: { label: 'Dental Insurance', icon: 'mdi:tooth' },
  VISION: { label: 'Vision Insurance', icon: 'mdi:eye' },
  RETIREMENT_401K: { label: '401(k)', icon: 'mdi:piggy-bank' },
  RELOCATION: { label: 'Relocation', icon: 'mdi:truck' },
  PER_DIEM: { label: 'Per Diem', icon: 'mdi:cash' },
  HARDSHIP_PAY: { label: 'Hardship Pay', icon: 'mdi:cash-plus' },
}

// Check if preview job has any qualifications data to show
const hasQualificationsData = computed(() => {
  if (!previewJob.value) return false
  const q = previewJob.value.qualifications
  const hasRichQualifications = q && (
    q.education?.level ||
    q.yearsExperienceMin ||
    q.certs?.length ||
    q.languages?.length ||
    q.licenses?.length ||
    q.required?.length ||
    q.preferred?.length
  )
  // Also show if we have legacy requirements field
  const hasLegacyRequirements = previewJob.value.requirements?.length
  return hasRichQualifications || hasLegacyRequirements
})

// Check if preview job has any compensation/benefits data
const hasCompensationData = computed(() => {
  if (!previewJob.value) return false
  const c = previewJob.value.compensation
  return c && (
    c.benefits?.length ||
    c.perDiemDailyUSD ||
    c.housingProvided ||
    c.hardshipEligible
  )
})
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
        <nav class="text-sm text-muted-foreground mb-8">
          <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-foreground">For Employers</span>
        </nav>

        <div class="max-w-2xl">
          <p class="text-xs font-mono uppercase tracking-widest text-primary mb-3">Employer Solutions</p>
          <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Reach cleared veterans actively seeking contractor positions.
          </h1>
          <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
            Post your job for free and get instant MOS matching. Upgrade to a Featured Listing for maximum visibility across our platform.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <Button size="lg" as-child>
              <a href="#submit-job">
                Post a Job Free
              </a>
            </Button>
            <Button size="lg" variant="outline" as-child>
              <a href="#submit-job">
                Get Featured
              </a>
            </Button>
          </div>
          <p class="text-xs text-muted-foreground mt-4">
            Free job posting · MOS-matched candidates · Featured Listings for premium visibility
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="space-y-16">

        <!-- How It Works -->
        <section class="border-t border-border/50 pt-12">
          <h2 class="text-lg font-bold text-foreground mb-8">How it works</h2>
          
          <div class="grid md:grid-cols-3 gap-8 md:gap-12">
            <div class="relative">
              <div class="flex items-center gap-4 mb-4">
                <span class="text-4xl font-bold text-primary/20">01</span>
                <h3 class="font-semibold text-lg">Submit Your Job</h3>
              </div>
              <p class="text-muted-foreground">
                Paste a URL or job description. We extract the details, match to relevant MOS codes, and publish for free.
              </p>
            </div>
            
            <div class="relative">
              <div class="flex items-center gap-4 mb-4">
                <span class="text-4xl font-bold text-primary/20">02</span>
                <h3 class="font-semibold text-lg">Reach Veterans</h3>
              </div>
              <p class="text-muted-foreground">
                Your job appears in MOS-matched searches, job alerts, and theater pages — reaching veterans with the exact skills you need.
              </p>
            </div>
            
            <div class="relative">
              <div class="flex items-center gap-4 mb-4">
                <span class="text-4xl font-bold text-primary/20">03</span>
                <h3 class="font-semibold text-lg">Get Featured</h3>
              </div>
              <p class="text-muted-foreground">
                Upgrade to a Featured Listing for homepage placement, priority positioning, and a highlighted job card that stands out.
              </p>
            </div>
          </div>
        </section>

        <!-- Pricing Section -->
        <section class="border-t border-border/50 pt-12">
          <div class="text-center mb-10">
            <h2 class="text-lg font-bold text-foreground mb-2">Boost Your Visibility</h2>
            <p class="text-muted-foreground">Choose the right plan for your hiring needs</p>
          </div>

          <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <!-- Free Listing -->
            <Card class="relative">
              <CardHeader class="pb-4">
                <CardTitle class="text-base">Free Listing</CardTitle>
                <div class="mt-2">
                  <span class="text-3xl font-bold">$0</span>
                  <span class="text-muted-foreground text-sm ml-1">/ until filled</span>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <ul class="space-y-2.5 text-sm">
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>MOS-matched distribution</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Appears in search results</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Included in job alert emails</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>AI-powered approval</span>
                  </li>
                </ul>
                <Button variant="outline" class="w-full mt-6" as-child>
                  <a href="#submit-job">Post Free Job</a>
                </Button>
              </CardContent>
            </Card>

            <!-- Featured Listing -->
            <Card class="relative border-primary">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default" class="text-[10px]">Recommended</Badge>
              </div>
              <CardHeader class="pb-4">
                <CardTitle class="text-base">Featured Listing</CardTitle>
                <div class="mt-2">
                  <span class="text-3xl font-bold">$99</span>
                  <span class="text-muted-foreground text-sm ml-1">/ 30 days</span>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <ul class="space-y-2.5 text-sm">
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Everything in Free, plus:</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:star" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span class="font-medium">Homepage placement</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:star" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span class="font-medium">Priority in search results</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:star" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span class="font-medium">Highlighted job card</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <Icon name="mdi:chart-line" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Impression & click analytics</span>
                  </li>
                </ul>
                <Button class="w-full mt-6" as-child>
                  <a href="#submit-job">Get Featured</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- Submit Job Form -->
        <section id="submit-job" class="border-t border-border/50 pt-12 scroll-mt-8">
          <div class="grid lg:grid-cols-2 gap-12">
        
        <!-- Left: Form -->
        <div>
          <!-- Success State -->
          <Card v-if="isSubmitted" class="border-green-500/50">
            <CardContent class="p-8 text-center">
              <Icon name="mdi:check-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 class="text-xl font-semibold mb-2">
                {{ submittedJob?.autoApproved ? 'Job Published!' : 'Job Submitted!' }}
              </h2>
              <p class="text-muted-foreground mb-4">
                {{ submittedJob?.autoApproved 
                  ? 'Your job is now live and visible to veterans.' 
                  : 'Your job has been submitted for review and will be published within 24 hours.' 
                }}
              </p>
              
              <!-- View Job Link -->
              <NuxtLink 
                v-if="submittedJob?.slug"
                :to="`/jobs/${submittedJob.slug}`"
                class="text-primary hover:underline text-sm inline-flex items-center gap-1 mb-6"
              >
                <Icon name="mdi:open-in-new" class="w-4 h-4" />
                View your job listing
              </NuxtLink>

              <!-- Featured Upgrade CTA -->
              <div class="bg-primary/5 border border-primary/20 p-4 mb-6 text-left">
                <div class="flex items-start gap-3">
                  <Icon name="mdi:star" class="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 class="font-semibold text-sm mb-1">Upgrade to Featured Listing</h3>
                    <p class="text-xs text-muted-foreground mb-3">
                      Get homepage placement and priority positioning for just $99/30 days.
                    </p>
                    <Button size="sm" @click="showFeaturedModal = true">
                      Request Featured Status
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="ghost" @click="resetForm">
                Submit Another Job
              </Button>
            </CardContent>
          </Card>

          <!-- Form -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Contact Info Section -->
            <div class="space-y-4">
              <h2 class="text-lg font-semibold text-foreground">Contact Information</h2>
              
              <div class="grid sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <Label for="companyName" class="text-xs">Company Name *</Label>
                  <Input 
                    id="companyName"
                    :model-value="form.values.companyName"
                    @update:model-value="(v) => form.setFieldValue('companyName', String(v))"
                    placeholder="Acme Defense"
                    autocomplete="organization"
                  />
                  <p v-if="formSubmitted && form.errors.value.companyName" class="text-xs text-destructive">
                    {{ form.errors.value.companyName }}
                  </p>
                </div>
                <div class="space-y-1.5">
                  <Label for="contactName" class="text-xs">Your Name *</Label>
                  <Input 
                    id="contactName"
                    :model-value="form.values.contactName"
                    @update:model-value="(v) => form.setFieldValue('contactName', String(v))"
                    placeholder="Jane Smith"
                    autocomplete="name"
                  />
                  <p v-if="formSubmitted && form.errors.value.contactName" class="text-xs text-destructive">
                    {{ form.errors.value.contactName }}
                  </p>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <Label for="contactEmail" class="text-xs">Email *</Label>
                  <Input 
                    id="contactEmail"
                    :model-value="form.values.contactEmail"
                    @update:model-value="(v) => form.setFieldValue('contactEmail', String(v))"
                    type="email"
                    inputmode="email"
                    placeholder="jane@acme.com"
                    autocomplete="email"
                  />
                  <p v-if="formSubmitted && form.errors.value.contactEmail" class="text-xs text-destructive">
                    {{ form.errors.value.contactEmail }}
                  </p>
                </div>
                <div class="space-y-1.5">
                  <Label for="contactPhone" class="text-xs">Phone</Label>
                  <Input 
                    id="contactPhone"
                    :model-value="form.values.contactPhone"
                    @update:model-value="handlePhoneInput"
                    type="tel"
                    inputmode="tel"
                    placeholder="(555) 123-4567"
                    autocomplete="tel"
                    maxlength="14"
                  />
                  <p v-if="formSubmitted && form.errors.value.contactPhone" class="text-xs text-destructive">
                    {{ form.errors.value.contactPhone }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Job Source Section -->
            <div class="space-y-4 border-t border-border/50 pt-6">
              <h2 class="text-lg font-semibold text-foreground">Job Details</h2>
              <p class="text-sm text-muted-foreground">
                Provide your job posting URL or paste the description directly.
              </p>

              <RadioGroup
                :model-value="form.values.sourceType"
                @update:model-value="(v) => form.setFieldValue('sourceType', v as 'url' | 'paste')"
                class="flex gap-4"
              >
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="source-url" />
                  <Label for="source-url" class="cursor-pointer">Job URL</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="paste" id="source-paste" />
                  <Label for="source-paste" class="cursor-pointer">Paste Description</Label>
                </div>
              </RadioGroup>

              <!-- URL Input -->
              <div v-if="form.values.sourceType === 'url'" class="space-y-1.5">
                <Label for="jobUrl" class="text-xs">Job Posting URL *</Label>
                <Input 
                  id="jobUrl"
                  :model-value="form.values.jobUrl"
                  @update:model-value="(v) => form.setFieldValue('jobUrl', String(v))"
                  type="url"
                  placeholder="https://careers.yourcompany.com/jobs/123"
                />
                <p class="text-[10px] text-muted-foreground">
                  We'll scrape and extract the job details automatically.
                </p>
              </div>

              <!-- Paste Input -->
              <div v-else class="space-y-1.5">
                <Label for="jobContent" class="text-xs">Job Description *</Label>
                <Textarea 
                  id="jobContent"
                  :model-value="form.values.jobContent"
                  @update:model-value="(v) => form.setFieldValue('jobContent', String(v))"
                  placeholder="Paste the full job description here..."
                  class="min-h-[200px]"
                />
                <p class="text-[10px] text-muted-foreground">
                  {{ form.values.jobContent?.length || 0 }} / 100 minimum characters
                </p>
              </div>

              <!-- Preview Button -->
              <Button 
                type="button" 
                variant="secondary" 
                :disabled="!canPreview || isPreviewLoading"
                @click="handlePreview"
                class="w-full"
              >
                <Spinner v-if="isPreviewLoading" class="w-4 h-4 mr-2" />
                <Icon v-else name="mdi:eye" class="w-4 h-4 mr-2" />
                Preview Job
              </Button>

              <!-- Preview Error -->
              <Alert v-if="previewError" variant="destructive">
                <Icon name="mdi:alert-circle" class="h-4 w-4" />
                <AlertDescription>{{ previewError }}</AlertDescription>
              </Alert>
            </div>

            <!-- Submit Section (only after preview) -->
            <div v-if="previewJob" class="space-y-4 border-t border-border/50 pt-6">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="confirmPreview" 
                  :checked="previewConfirmed"
                  @update:checked="previewConfirmed = $event"
                />
                <Label for="confirmPreview" class="text-sm cursor-pointer">
                  I confirm the preview looks correct
                </Label>
              </div>

              <Button 
                type="submit" 
                class="w-full" 
                :disabled="!canSubmit"
              >
                <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                Submit Job
              </Button>

              <p class="text-[10px] text-muted-foreground text-center">
                Free posting. Upgrade to Featured Listing for homepage visibility.
              </p>
            </div>
          </form>
        </div>

        <!-- Right: Preview -->
        <div>
          <div class="lg:sticky lg:top-24">
            <h2 class="text-lg font-semibold text-foreground mb-4">Preview</h2>

            <!-- Empty Preview State -->
            <Card v-if="!previewJob && !isPreviewLoading" class="border-dashed bg-sidebar">
              <CardContent class="p-8 text-center">
                <Icon name="mdi:file-document-outline" class="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p class="text-muted-foreground">
                  Enter a job URL or paste a description, then click "Preview Job" to see extracted details.
                </p>
              </CardContent>
            </Card>

            <!-- Loading State -->
            <Card v-else-if="isPreviewLoading">
              <CardContent class="p-8 text-center">
                <Spinner class="w-8 h-8 mx-auto mb-4 text-primary" />
                <p class="text-muted-foreground">
                  Extracting job details...
                </p>
                <p class="text-xs text-muted-foreground/60 mt-2">
                  This may take 10-20 seconds for URL scraping.
                </p>
              </CardContent>
            </Card>

            <!-- Preview Card - Matches Job Details Page Format Exactly -->
            <Card v-else-if="previewJob" class="border-primary/50 bg-sidebar">
              <CardHeader class="pb-2">
                <Badge variant="soft" class="w-fit mb-3">Preview</Badge>
              </CardHeader>
              <CardContent class="space-y-6">
                <!-- Job Header (matches job details page) -->
                <div class="pb-4 border-b border-border/30">
                  <h1 class="text-xl font-bold text-foreground mb-2">
                    {{ previewJob.title }}
                  </h1>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                    <div class="flex items-center gap-2">
                      <Icon name="mdi:domain" class="w-4 h-4" />
                      <span class="text-foreground font-medium">{{ previewJob.company }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Icon name="mdi:map-marker" class="w-4 h-4" />
                      {{ previewJob.location }}
                    </div>
                    <div v-if="previewJob.theater" class="flex items-center gap-2">
                      <Icon name="mdi:earth" class="w-4 h-4" />
                      {{ previewJob.theater }}
                    </div>
                  </div>
                  <!-- Summary -->
                  <p v-if="previewJob.snippet || previewJob.description" class="text-sm text-muted-foreground leading-relaxed">
                    {{ previewJob.snippet || previewJob.description }}
                  </p>
                </div>

                <!-- Responsibilities (numbered list like job details page) -->
                <section v-if="previewJob.responsibilities?.length">
                  <h2 class="text-base font-bold text-foreground mb-3">Responsibilities</h2>
                  <ul class="grid grid-cols-1 gap-2">
                    <li
                      v-for="(resp, index) in previewJob.responsibilities"
                      :key="index"
                      class="flex items-start gap-2 text-xs text-foreground/90"
                    >
                      <div class="mt-0.5 w-4 h-4 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span class="text-[9px] font-bold">{{ index + 1 }}</span>
                      </div>
                      <span class="leading-relaxed">{{ resp }}</span>
                    </li>
                  </ul>
                </section>

                <Separator v-if="hasQualificationsData" class="bg-border/30" />

                <!-- Qualifications (matches job detail page exactly) -->
                <section v-if="hasQualificationsData">
                  <h2 class="text-base font-bold text-foreground mb-4">Qualifications</h2>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Education & Experience -->
                    <div v-if="previewJob.qualifications?.education?.level || previewJob.qualifications?.yearsExperienceMin" class="space-y-2">
                      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Education & Experience</h3>
                      <div class="space-y-1.5">
                        <p v-if="previewJob.qualifications?.education?.level" class="flex items-start gap-2 text-xs">
                          <Icon name="mdi:school" class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>
                            {{ previewJob.qualifications.education.level }} degree
                            <span v-if="previewJob.qualifications.education.fields?.length" class="text-muted-foreground">
                              in {{ previewJob.qualifications.education.fields.join(', ') }}
                            </span>
                          </span>
                        </p>
                        <p v-if="previewJob.qualifications?.yearsExperienceMin" class="flex items-center gap-2 text-xs">
                          <Icon name="mdi:briefcase-clock" class="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{{ previewJob.qualifications.yearsExperienceMin }}+ years of experience</span>
                        </p>
                        <p v-if="previewJob.qualifications?.education?.acceptsEquivalency" class="text-[10px] text-muted-foreground pl-5">
                          * Equivalent experience may substitute
                        </p>
                      </div>
                    </div>

                    <!-- Certifications -->
                    <div v-if="previewJob.qualifications?.certs?.length" class="space-y-2">
                      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certifications</h3>
                      <div class="flex flex-wrap gap-1.5">
                        <Badge v-for="cert in previewJob.qualifications.certs" :key="cert" variant="soft" class="text-[10px]">
                          {{ cert }}
                        </Badge>
                      </div>
                    </div>

                    <!-- Languages -->
                    <div v-if="previewJob.qualifications?.languages?.length" class="space-y-2">
                      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Languages</h3>
                      <div class="flex flex-wrap gap-1.5">
                        <Badge v-for="lang in previewJob.qualifications.languages" :key="lang" variant="soft" class="text-[10px]">
                          {{ lang }}
                        </Badge>
                      </div>
                    </div>

                    <!-- Licenses -->
                    <div v-if="previewJob.qualifications?.licenses?.length" class="space-y-2">
                      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Licenses</h3>
                      <div class="flex flex-wrap gap-1.5">
                        <Badge v-for="license in previewJob.qualifications.licenses" :key="license" variant="soft" class="text-[10px]">
                          {{ license }}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <!-- Required Qualifications -->
                  <div v-if="previewJob.qualifications?.required?.length" class="mt-4 space-y-2">
                    <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Required</h3>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      <li
                        v-for="(req, index) in previewJob.qualifications.required"
                        :key="index"
                        class="flex items-start gap-2 text-xs text-foreground/90"
                      >
                        <Icon name="mdi:check-circle" class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{{ req }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Legacy requirements fallback (if no rich qualifications) -->
                  <div v-else-if="previewJob.requirements?.length && !previewJob.qualifications?.required?.length" class="mt-4 space-y-2">
                    <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Required</h3>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      <li
                        v-for="(req, index) in previewJob.requirements"
                        :key="index"
                        class="flex items-start gap-2 text-xs text-foreground/90"
                      >
                        <Icon name="mdi:check-circle" class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{{ req }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Preferred Qualifications -->
                  <div v-if="previewJob.qualifications?.preferred?.length" class="mt-4 space-y-2">
                    <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preferred</h3>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      <li
                        v-for="(pref, index) in previewJob.qualifications.preferred"
                        :key="index"
                        class="flex items-start gap-2 text-xs text-foreground/70"
                      >
                        <Icon name="mdi:plus-circle-outline" class="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{{ pref }}</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <Separator v-if="previewJob.tools_tech?.length || previewJob.domain_tags?.length" class="bg-border/30" />

                <!-- Tools & Tech / Domain (matches job detail page) -->
                <section v-if="previewJob.tools_tech?.length || previewJob.domain_tags?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="previewJob.tools_tech?.length" class="space-y-2">
                    <h2 class="text-base font-bold text-foreground">Tools & Tech</h2>
                    <div class="flex flex-wrap gap-1.5">
                      <Badge v-for="tool in previewJob.tools_tech" :key="tool" variant="soft" class="text-[10px]">
                        {{ tool }}
                      </Badge>
                    </div>
                  </div>
                  <div v-if="previewJob.domain_tags?.length" class="space-y-2">
                    <h2 class="text-base font-bold text-foreground">Domain</h2>
                    <div class="flex flex-wrap gap-1.5">
                      <Badge v-for="tag in previewJob.domain_tags" :key="tag" variant="soft" class="text-[10px]">
                        {{ tag }}
                      </Badge>
                    </div>
                  </div>
                </section>

                <Separator v-if="hasCompensationData" class="bg-border/30" />

                <!-- Benefits & Compensation (matches job detail page) -->
                <section v-if="hasCompensationData">
                  <h2 class="text-base font-bold text-foreground mb-3">Benefits & Compensation</h2>
                  <div class="grid grid-cols-2 gap-3">
                    <div v-for="benefit in previewJob.compensation?.benefits" :key="benefit" class="flex items-center gap-2 text-xs">
                      <Icon :name="BENEFIT_LABELS[benefit]?.icon || 'mdi:check'" class="w-3.5 h-3.5 text-primary shrink-0" />
                      <span class="text-foreground">{{ BENEFIT_LABELS[benefit]?.label || benefit }}</span>
                    </div>
                    <div v-if="previewJob.compensation?.perDiemDailyUSD" class="flex items-center gap-2 text-xs">
                      <Icon name="mdi:cash" class="w-3.5 h-3.5 text-primary shrink-0" />
                      <span class="text-foreground">${{ previewJob.compensation.perDiemDailyUSD }}/day per diem</span>
                    </div>
                    <div v-if="previewJob.compensation?.housingProvided" class="flex items-center gap-2 text-xs">
                      <Icon name="mdi:home" class="w-3.5 h-3.5 text-primary shrink-0" />
                      <span class="text-foreground">Housing provided</span>
                    </div>
                    <div v-if="previewJob.compensation?.hardshipEligible" class="flex items-center gap-2 text-xs">
                      <Icon name="mdi:shield-star" class="w-3.5 h-3.5 text-primary shrink-0" />
                      <span class="text-foreground">Hardship pay eligible</span>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>

            <!-- Info Box -->
            <div class="mt-6 space-y-3 text-sm text-muted-foreground">
              <div class="flex items-start gap-3">
                <Icon name="mdi:lightning-bolt" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span><strong>Instant publishing</strong> for known defense contractors</span>
              </div>
              <div class="flex items-start gap-3">
                <Icon name="mdi:account-search" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span><strong>MOS matching</strong> shows job to relevant veterans</span>
              </div>
              <div class="flex items-start gap-3">
                <Icon name="mdi:star" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span><strong>Featured Listings</strong> for homepage & priority placement</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section class="border-t border-border/50 pt-12">
          <div class="text-center max-w-xl mx-auto">
            <h2 class="text-lg font-bold text-foreground mb-3">Questions?</h2>
            <p class="text-muted-foreground mb-6">
              Have questions about posting jobs or Featured Listings? We're here to help you reach qualified cleared candidates.
            </p>
            <a 
              href="mailto:employers@military.contractors" 
              class="text-primary hover:underline font-mono text-sm"
            >
              employers@military.contractors
            </a>
          </div>
        </section>

      </div>
    </div>

    <!-- Featured Upgrade Modal -->
    <Dialog v-model:open="showFeaturedModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Featured Listing</DialogTitle>
          <DialogDescription>
            Get maximum visibility for your job posting
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Pricing -->
          <div class="bg-primary/5 border border-primary/20 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold">Featured Listing</span>
              <span class="text-xl font-bold">$99</span>
            </div>
            <p class="text-xs text-muted-foreground">30 days of premium visibility</p>
          </div>

          <!-- Benefits -->
          <div class="space-y-2">
            <p class="text-sm font-medium">What you get:</p>
            <ul class="space-y-1.5 text-sm text-muted-foreground">
              <li class="flex items-center gap-2">
                <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                Homepage placement
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                Priority in search results
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                Highlighted job card styling
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check" class="w-4 h-4 text-primary" />
                Impression & click analytics
              </li>
            </ul>
          </div>

          <!-- Contact Info Confirmation -->
          <div class="space-y-2 pt-2 border-t border-border/50">
            <p class="text-xs text-muted-foreground">We'll contact you at:</p>
            <div class="text-sm">
              <p class="font-medium">{{ form.values.contactName }}</p>
              <p class="text-muted-foreground">{{ form.values.contactEmail }}</p>
              <p v-if="form.values.contactPhone" class="text-muted-foreground">{{ form.values.contactPhone }}</p>
            </div>
          </div>

          <!-- Notice -->
          <p class="text-xs text-muted-foreground bg-muted/50 p-3">
            <Icon name="mdi:clock-outline" class="w-4 h-4 inline-block mr-1 align-text-bottom" />
            We'll reach out within 60 minutes to complete your upgrade.
          </p>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" @click="showFeaturedModal = false">
            Cancel
          </Button>
          <Button @click="handleFeaturedRequest" :disabled="isFeaturedRequesting">
            <Spinner v-if="isFeaturedRequesting" class="w-4 h-4 mr-2" />
            Request Featured Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
