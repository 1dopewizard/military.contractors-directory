<!--
  @file JobExpressInterest.vue
  @description Express Interest flow for job placements - captures candidate interest and profile
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'

const props = defineProps<{
  jobId: string
  jobTitle: string
  company: string
}>()

const emit = defineEmits<{
  success: []
}>()

const logger = useLogger('JobExpressInterest')

const isOpen = ref(false)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const formSubmitted = ref(false)

// Resume upload
const resumeFile = ref<File | null>(null)
const resumePath = ref<string | null>(null)
const isUploadingResume = ref(false)
const resumeError = ref<string | null>(null)

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    name: z.string().optional(),
    militaryStatus: z.string().optional(),
    notes: z.string().optional()
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
    phone: '',
    name: '',
    militaryStatus: '',
    notes: ''
  },
  validateOnMount: false
})

const militaryStatusOptions = [
  { value: 'active_duty', label: 'Active Duty' },
  { value: 'reserve', label: 'Reserve/Guard' },
  { value: 'transitioning', label: 'Transitioning' },
  { value: 'veteran', label: 'Veteran' }
]

// Handle resume file selection
const handleResumeSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  resumeError.value = null
  resumeFile.value = null
  resumePath.value = null
  
  if (!file) return
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    resumeError.value = 'Please upload a PDF, DOC, or DOCX file'
    return
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    resumeError.value = 'File must be under 5MB'
    return
  }
  
  resumeFile.value = file
}

// Upload resume to storage
const uploadResume = async (email: string): Promise<string | null> => {
  if (!resumeFile.value) return null
  
  isUploadingResume.value = true
  resumeError.value = null
  
  try {
    const formData = new FormData()
    formData.append('file', resumeFile.value)
    formData.append('email', email)
    
    const response = await $fetch<{ success: boolean; path: string }>('/api/job-alerts/upload-resume', {
      method: 'POST',
      body: formData
    })
    
    return response.path
  } catch (err: any) {
    resumeError.value = err.data?.statusMessage || 'Failed to upload resume'
    return null
  } finally {
    isUploadingResume.value = false
  }
}

const handleSubmit = async () => {
  formSubmitted.value = true
  const { valid } = await form.validate()
  if (!valid) return

  isSubmitting.value = true

  try {
    const values = form.values
    
    // Upload resume if provided
    let uploadedResumePath: string | null = null
    if (resumeFile.value && values.email) {
      uploadedResumePath = await uploadResume(values.email)
      if (resumeError.value) {
        isSubmitting.value = false
        return
      }
    }
    
    await $fetch('/api/jobs/express-interest', {
      method: 'POST',
      body: {
        job_id: props.jobId,
        email: values.email,
        phone: values.phone,
        name: values.name || undefined,
        military_status: values.militaryStatus || undefined,
        notes: values.notes || undefined,
        resume_path: uploadedResumePath || undefined
      }
    })

    isSuccess.value = true
    logger.info({ jobId: props.jobId, email: values.email, hasResume: !!uploadedResumePath }, 'Express interest submitted')
    
    toast.success('Interest submitted!', {
      description: 'We\'ll review your profile and reach out soon.'
    })

    emit('success')
  } catch (err: any) {
    logger.error({ error: err }, 'Failed to submit interest')
    toast.error('Submission failed', {
      description: err.data?.statusMessage || 'Please try again.'
    })
  } finally {
    isSubmitting.value = false
  }
}

const resetAndClose = () => {
  form.resetForm()
  isSuccess.value = false
  formSubmitted.value = false
  resumeFile.value = null
  resumePath.value = null
  resumeError.value = null
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" class="w-full gap-2">
        <Icon name="mdi:account-plus-outline" class="w-4 h-4" />
        Let Us Submit You
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Express Interest</DialogTitle>
        <DialogDescription>
          Let us submit your profile to {{ company }} for the {{ jobTitle }} position.
        </DialogDescription>
      </DialogHeader>

      <!-- Success State -->
      <div v-if="isSuccess" class="py-8 text-center">
        <Icon name="mdi:check-circle" class="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">Interest Submitted!</h3>
        <p class="text-sm text-muted-foreground mb-6">
          We've received your interest in this position. We'll review your profile and reach out to discuss next steps.
        </p>
        <Button variant="ghost" @click="resetAndClose">Close</Button>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4 py-2">
        <p class="text-sm text-muted-foreground">
          Provide your details and we'll handle the application process. No job board spam — just a direct submission on your behalf.
        </p>

        <div class="space-y-1.5">
          <Label for="email" class="text-xs">Email *</Label>
          <Input
            id="email"
            :model-value="form.values.email"
            @update:model-value="(v) => form.setFieldValue('email', String(v))"
            type="email"
            placeholder="your@email.com"
          />
          <p v-if="formSubmitted && form.errors.value.email" class="text-xs text-destructive">
            {{ form.errors.value.email }}
          </p>
        </div>

        <div class="space-y-1.5">
          <Label for="phone" class="text-xs">Phone *</Label>
          <Input
            id="phone"
            :model-value="form.values.phone"
            @update:model-value="(v) => form.setFieldValue('phone', String(v))"
            type="tel"
            placeholder="(555) 123-4567"
          />
          <p v-if="formSubmitted && form.errors.value.phone" class="text-xs text-destructive">
            {{ form.errors.value.phone }}
          </p>
        </div>

        <div class="space-y-1.5">
          <Label for="name" class="text-xs">Name</Label>
          <Input
            id="name"
            :model-value="form.values.name"
            @update:model-value="(v) => form.setFieldValue('name', String(v))"
            placeholder="Your name"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="militaryStatus" class="text-xs">Military Status</Label>
          <Select
            :model-value="form.values.militaryStatus"
            @update:model-value="(v) => form.setFieldValue('militaryStatus', String(v || ''))"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in militaryStatusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="notes" class="text-xs">Anything else we should know?</Label>
          <Textarea
            id="notes"
            :model-value="form.values.notes"
            @update:model-value="(v) => form.setFieldValue('notes', String(v))"
            placeholder="Availability, salary expectations, questions..."
            class="min-h-[80px]"
          />
        </div>

        <!-- Resume Upload -->
        <div class="space-y-1.5">
          <Label class="text-xs">Resume (optional)</Label>
          <p class="text-[11px] text-muted-foreground -mt-0.5">Upload your resume to strengthen your application</p>
          <div class="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              @change="handleResumeSelect"
            />
            <div 
              :class="[
                'border-2 border-dashed rounded-md p-3 text-center transition-colors',
                resumeFile ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-muted-foreground/50'
              ]"
            >
              <div v-if="resumeFile" class="flex items-center justify-center gap-2 text-sm">
                <Icon name="mdi:file-document-check" class="w-4 h-4 text-green-600" />
                <span class="text-green-600 font-medium truncate max-w-[200px]">{{ resumeFile.name }}</span>
              </div>
              <div v-else class="text-xs text-muted-foreground">
                <Icon name="mdi:upload" class="w-4 h-4 mx-auto mb-1" />
                <p>Click to upload PDF, DOC, or DOCX</p>
                <p class="text-[10px]">Max 5MB</p>
              </div>
            </div>
          </div>
          <p v-if="resumeError" class="text-xs text-destructive">{{ resumeError }}</p>
        </div>

        <div class="flex gap-2 pt-2">
          <Button type="button" variant="ghost" class="flex-1" @click="resetAndClose">
            Cancel
          </Button>
          <Button type="submit" class="flex-1" :disabled="isSubmitting">
            <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
            Submit Interest
          </Button>
        </div>

        <p class="text-[10px] text-muted-foreground text-center">
          By submitting, you consent to us representing you to employers.
        </p>
      </form>
    </DialogContent>
  </Dialog>
</template>
