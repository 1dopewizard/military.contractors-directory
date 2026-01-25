<!--
  @file Community/InterviewExperienceForm.vue
  @description Multi-step form for submitting interview experiences with validation
  @usage <InterviewExperienceForm @submit="handleSubmit" @cancel="handleCancel" />
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type {
  InterviewExperienceInput,
  InterviewDifficulty,
  InterviewOutcome,
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
  (e: 'submit', input: InterviewExperienceInput): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
})

const emit = defineEmits<Emits>()

// Multi-step form
const currentStep = ref(1)
const totalSteps = 4

// Options data
const difficultyOptions: { value: InterviewDifficulty; label: string; description: string }[] = [
  { value: 'EASY', label: 'Easy', description: 'Straightforward questions, friendly atmosphere' },
  { value: 'MEDIUM', label: 'Medium', description: 'Some challenging questions, standard process' },
  { value: 'HARD', label: 'Hard', description: 'Difficult questions, rigorous evaluation' },
]

const outcomeOptions: { value: InterviewOutcome; label: string; icon: string }[] = [
  { value: 'OFFER', label: 'Received Offer', icon: 'mdi:check-circle' },
  { value: 'REJECTED', label: 'Rejected', icon: 'mdi:close-circle' },
  { value: 'GHOSTED', label: 'Ghosted (No Response)', icon: 'mdi:ghost' },
  { value: 'WITHDREW', label: 'Withdrew Application', icon: 'mdi:account-arrow-left' },
]

// Form validation schema
const interviewExperienceSchema = toTypedSchema(
  z.object({
    // Step 1: Company & Role
    companyId: z.string().min(1, 'Please select a company'),
    roleTitle: z
      .string()
      .min(2, 'Role title must be at least 2 characters')
      .max(100, 'Role title too long'),
    interviewDate: z.coerce.date({ message: 'Please select interview date' }),

    // Step 2: Your Background
    mosCode: z
      .string()
      .min(1, 'MOS code is required')
      .max(10, 'MOS code too long')
      .regex(/^[A-Za-z0-9]+$/, 'MOS code should only contain letters and numbers'),

    // Step 3: Interview Process
    processDescription: z
      .string()
      .min(50, 'Please provide more detail about the process (min 50 characters)')
      .max(2000, 'Process description too long'),
    questionsAsked: z.array(z.string().min(5, 'Question must be at least 5 characters')).default([]),
    tips: z
      .string()
      .min(20, 'Please provide some tips for others (min 20 characters)')
      .max(1000, 'Tips too long'),
    timelineWeeks: z.coerce
      .number({ message: 'Enter timeline in weeks' })
      .min(1, 'Timeline must be at least 1 week')
      .max(52, 'Timeline cannot exceed 52 weeks'),

    // Step 4: Outcome
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    outcome: z.enum(['OFFER', 'REJECTED', 'GHOSTED', 'WITHDREW']),
  })
)

// Form instance
const form = useForm({
  validationSchema: interviewExperienceSchema,
  initialValues: {
    companyId: props.initialCompanyId || '',
    roleTitle: '',
    interviewDate: undefined as Date | undefined,
    mosCode: props.initialMosCode || '',
    processDescription: '',
    questionsAsked: [] as string[],
    tips: '',
    timelineWeeks: undefined as number | undefined,
    difficulty: 'MEDIUM' as InterviewDifficulty,
    outcome: undefined as InterviewOutcome | undefined,
  },
  validateOnMount: false,
})

// Track form submission attempt
const formSubmitted = ref(false)

// Contractors for dropdown
const contractors = ref<Contractor[]>([])
const contractorsLoading = ref(false)
const contractorSearchQuery = ref('')

// Questions management
const newQuestion = ref('')
const questionError = ref('')

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

// Questions array from form
const questions = computed(() => form.values.questionsAsked || [])

// Add a question
const addQuestion = () => {
  const q = newQuestion.value.trim()
  if (!q) {
    questionError.value = 'Please enter a question'
    return
  }
  if (q.length < 5) {
    questionError.value = 'Question must be at least 5 characters'
    return
  }
  if (questions.value.length >= 10) {
    questionError.value = 'Maximum 10 questions allowed'
    return
  }

  const updated = [...questions.value, q]
  form.setFieldValue('questionsAsked', updated)
  newQuestion.value = ''
  questionError.value = ''
}

// Remove a question
const removeQuestion = (index: number) => {
  const updated = questions.value.filter((_, i) => i !== index)
  form.setFieldValue('questionsAsked', updated)
}

// Step validation
const isStep1Valid = computed(() => {
  return !!form.values.companyId && !!form.values.roleTitle && !!form.values.interviewDate
})

const isStep2Valid = computed(() => {
  return !!form.values.mosCode
})

const isStep3Valid = computed(() => {
  return (
    !!form.values.processDescription &&
    form.values.processDescription.length >= 50 &&
    !!form.values.tips &&
    form.values.tips.length >= 20 &&
    typeof form.values.timelineWeeks === 'number' &&
    form.values.timelineWeeks >= 1
  )
})

const isStep4Valid = computed(() => {
  return !!form.values.difficulty && !!form.values.outcome
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
  if (currentStep.value === 3 && !isStep3Valid.value) {
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

// Step labels
const stepLabels = ['Company & Role', 'Your Background', 'Interview Details', 'Outcome']

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
    } else if (!isStep4Valid.value) {
      currentStep.value = 4
    }
    return
  }

  const values = form.values
  const input: InterviewExperienceInput = {
    companyId: values.companyId!,
    roleTitle: values.roleTitle!,
    interviewDate: values.interviewDate!.getTime(),
    mosCode: values.mosCode!.toUpperCase(),
    processDescription: values.processDescription!,
    questionsAsked: values.questionsAsked || [],
    tips: values.tips!,
    timelineWeeks: values.timelineWeeks!,
    difficulty: values.difficulty!,
    outcome: values.outcome!,
  }

  emit('submit', input)
}

// Format date for display
const formatDate = (date: Date | undefined) => {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Progress indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-muted-foreground">Step {{ currentStep }} of {{ totalSteps }}</span>
        <span class="text-sm text-muted-foreground">
          {{ stepLabels[currentStep - 1] }}
        </span>
      </div>
      <div class="flex gap-1">
        <div
          v-for="step in totalSteps"
          :key="step"
          class="flex-1 h-1 transition-colors"
          :class="[step <= currentStep ? 'bg-primary' : 'bg-muted']"
        />
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Company & Role -->
      <div v-show="currentStep === 1" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Company & Position</h2>
          <p class="text-sm text-muted-foreground">
            Which company did you interview with and for what role?
          </p>
        </div>

        <!-- Contractor Selection -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Company *</Label>

          <!-- Search input -->
          <div class="relative">
            <Icon
              name="mdi:magnify"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input v-model="contractorSearchQuery" placeholder="Search contractors..." class="pl-10 h-10" />
          </div>

          <!-- Contractor list -->
          <div class="border border-border/40 max-h-48 overflow-y-auto">
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
              <Icon v-if="form.values.companyId === contractor.id" name="mdi:check" class="w-5 h-5 text-primary" />
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

        <!-- Role Title -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Position Title *</Label>
          <Input
            :model-value="form.values.roleTitle"
            @update:model-value="(v) => form.setFieldValue('roleTitle', String(v))"
            placeholder="e.g., Network Engineer III, Cybersecurity Analyst"
            class="h-12"
          />
          <p v-if="formSubmitted && form.errors.value.roleTitle" class="text-xs text-destructive">
            {{ form.errors.value.roleTitle }}
          </p>
        </div>

        <!-- Interview Date -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">When did you interview? *</Label>
          <Input
            type="month"
            :model-value="
              form.values.interviewDate
                ? form.values.interviewDate.toISOString().slice(0, 7)
                : ''
            "
            @update:model-value="
              (v: string | number) => {
                const date = new Date(String(v) + '-01')
                form.setFieldValue('interviewDate', date)
              }
            "
            class="h-10 w-48"
          />
          <p v-if="formSubmitted && form.errors.value.interviewDate" class="text-xs text-destructive">
            {{ form.errors.value.interviewDate }}
          </p>
        </div>
      </div>

      <!-- Step 2: Your Background -->
      <div v-show="currentStep === 2" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Your Background</h2>
          <p class="text-sm text-muted-foreground">
            What military background did you bring to this interview?
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
            Your military occupational specialty code at the time of interview
          </p>
        </div>
      </div>

      <!-- Step 3: Interview Process -->
      <div v-show="currentStep === 3" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Interview Details</h2>
          <p class="text-sm text-muted-foreground">
            Describe the interview process to help others prepare.
          </p>
        </div>

        <!-- Process Description -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Interview Process *</Label>
          <Textarea
            :model-value="form.values.processDescription"
            @update:model-value="(v) => form.setFieldValue('processDescription', String(v))"
            placeholder="Describe the interview stages (phone screen, technical interview, panel, etc.), who you met with, and how the process flowed..."
            rows="5"
            class="resize-none"
          />
          <div class="flex justify-between">
            <p v-if="formSubmitted && form.errors.value.processDescription" class="text-xs text-destructive">
              {{ form.errors.value.processDescription }}
            </p>
            <p class="text-xs text-muted-foreground ml-auto">
              {{ (form.values.processDescription || '').length }} / 2000
            </p>
          </div>
        </div>

        <!-- Questions Asked -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">
            Questions Asked (Optional, up to 10)
          </Label>

          <!-- Existing questions -->
          <div v-if="questions.length > 0" class="space-y-2 mb-3">
            <div
              v-for="(question, idx) in questions"
              :key="idx"
              class="flex items-start gap-2 p-3 bg-muted/30 border border-border/30"
            >
              <Icon name="mdi:comment-question-outline" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span class="flex-1 text-sm">{{ question }}</span>
              <button type="button" class="text-muted-foreground hover:text-destructive" @click="removeQuestion(idx)">
                <Icon name="mdi:close" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Add question input -->
          <div class="flex gap-2">
            <Input
              v-model="newQuestion"
              placeholder="Add a question they asked..."
              class="flex-1"
              @keydown.enter.prevent="addQuestion"
            />
            <Button type="button" variant="outline" size="sm" :disabled="questions.length >= 10" @click="addQuestion">
              <Icon name="mdi:plus" class="w-4 h-4" />
            </Button>
          </div>
          <p v-if="questionError" class="text-xs text-destructive">{{ questionError }}</p>
          <p class="text-xs text-muted-foreground">
            {{ questions.length }}/10 questions added
          </p>
        </div>

        <!-- Tips -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Tips & Advice *</Label>
          <Textarea
            :model-value="form.values.tips"
            @update:model-value="(v) => form.setFieldValue('tips', String(v))"
            placeholder="What advice would you give to someone interviewing for a similar position at this company?"
            rows="3"
            class="resize-none"
          />
          <div class="flex justify-between">
            <p v-if="formSubmitted && form.errors.value.tips" class="text-xs text-destructive">
              {{ form.errors.value.tips }}
            </p>
            <p class="text-xs text-muted-foreground ml-auto">
              {{ (form.values.tips || '').length }} / 1000
            </p>
          </div>
        </div>

        <!-- Timeline -->
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Total Process Duration *</Label>
          <div class="flex items-center gap-2">
            <Input
              type="number"
              :model-value="(form.values.timelineWeeks as number | undefined) ?? ''"
              @update:model-value="(v: string | number) => form.setFieldValue('timelineWeeks', Number(v))"
              placeholder="2"
              class="h-10 w-24"
              min="1"
              max="52"
            />
            <span class="text-sm text-muted-foreground">weeks</span>
          </div>
          <p v-if="formSubmitted && form.errors.value.timelineWeeks" class="text-xs text-destructive">
            {{ form.errors.value.timelineWeeks }}
          </p>
          <p class="text-xs text-muted-foreground">
            From initial application to final decision
          </p>
        </div>
      </div>

      <!-- Step 4: Outcome -->
      <div v-show="currentStep === 4" class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-foreground">Interview Outcome</h2>
          <p class="text-sm text-muted-foreground">
            How difficult was the interview and what was the result?
          </p>
        </div>

        <!-- Difficulty -->
        <div class="space-y-3">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Interview Difficulty *</Label>
          <div class="grid gap-3">
            <button
              v-for="option in difficultyOptions"
              :key="option.value"
              type="button"
              class="p-4 text-left border transition-colors"
              :class="[
                form.values.difficulty === option.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border hover:bg-muted/50',
              ]"
              @click="form.setFieldValue('difficulty', option.value)"
            >
              <div class="font-medium">{{ option.label }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ option.description }}</div>
            </button>
          </div>
        </div>

        <!-- Outcome -->
        <div class="space-y-3">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Outcome *</Label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="option in outcomeOptions"
              :key="option.value"
              type="button"
              class="p-4 text-left border transition-colors flex items-center gap-3"
              :class="[
                form.values.outcome === option.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border hover:bg-muted/50',
              ]"
              @click="form.setFieldValue('outcome', option.value)"
            >
              <Icon :name="option.icon" class="w-5 h-5 shrink-0" />
              <span class="font-medium text-sm">{{ option.label }}</span>
            </button>
          </div>
          <p v-if="formSubmitted && form.errors.value.outcome" class="text-xs text-destructive">
            {{ form.errors.value.outcome }}
          </p>
        </div>

        <!-- Summary Preview -->
        <div class="p-4 bg-muted/30 border border-border/40 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">Experience Summary</h3>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div class="text-muted-foreground">Company</div>
            <div class="font-medium">{{ selectedContractorName || '—' }}</div>

            <div class="text-muted-foreground">Position</div>
            <div class="font-medium">{{ form.values.roleTitle || '—' }}</div>

            <div class="text-muted-foreground">Interview Date</div>
            <div class="font-medium">{{ formatDate(form.values.interviewDate as Date | undefined) }}</div>

            <div class="text-muted-foreground">MOS Code</div>
            <div class="font-mono font-medium">{{ form.values.mosCode || '—' }}</div>

            <div class="text-muted-foreground">Duration</div>
            <div class="font-medium">
              {{ form.values.timelineWeeks ? `${form.values.timelineWeeks} weeks` : '—' }}
            </div>

            <div class="text-muted-foreground">Difficulty</div>
            <div class="font-medium">
              {{ difficultyOptions.find((d) => d.value === form.values.difficulty)?.label || '—' }}
            </div>

            <div class="text-muted-foreground">Outcome</div>
            <div class="font-medium">
              {{ outcomeOptions.find((o) => o.value === form.values.outcome)?.label || '—' }}
            </div>

            <div class="text-muted-foreground">Questions Shared</div>
            <div class="font-medium">{{ questions.length }}</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between pt-8 border-t border-border/30 mt-8">
        <Button v-if="currentStep > 1" type="button" variant="ghost" @click="prevStep">
          <Icon name="mdi:chevron-left" class="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button v-else type="button" variant="ghost" @click="emit('cancel')">
          Cancel
        </Button>

        <Button
          v-if="currentStep < totalSteps"
          type="button"
          @click="nextStep"
          :disabled="
            (currentStep === 1 && !isStep1Valid) ||
            (currentStep === 2 && !isStep2Valid) ||
            (currentStep === 3 && !isStep3Valid)
          "
        >
          Continue
          <Icon name="mdi:chevron-right" class="w-4 h-4 ml-1" />
        </Button>
        <Button v-else type="submit" :disabled="isSubmitting">
          <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
          {{ isSubmitting ? 'Submitting...' : 'Submit Experience' }}
        </Button>
      </div>
    </form>
  </div>
</template>
