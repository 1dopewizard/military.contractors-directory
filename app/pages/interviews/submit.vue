<!--
  @file Interview experience submission page
  @route /interviews/submit
  @description Multi-step form for submitting interview experiences to the community intel platform.
               Requires authentication. Form flow: Company → MOS Background → Process → Outcome
-->

<script setup lang="ts">
import type { InterviewExperienceInput } from '@/app/types/community.types'

const logger = useLogger('InterviewsSubmitPage')
const router = useRouter()
const { isAuthenticated, isAuthReady } = useAuth()
const { submitInterview } = useInterviewExperiences()
const { loadProfile, userId: profileUserId } = useUserProfile()

// SEO
useHead({
  title: 'Share Interview Experience | Contribute Intel | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Help fellow veterans by sharing your interview experience. Describe the process, questions asked, and tips for others preparing for similar interviews.',
    },
  ],
})

// Submission state
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submissionError = ref<string | null>(null)
const createdExperienceId = ref<string | null>(null)

/**
 * Handle form submission from InterviewExperienceForm component
 */
const handleSubmit = async (input: InterviewExperienceInput) => {
  if (!profileUserId.value) {
    submissionError.value = 'Please sign in to submit your interview experience'
    return
  }

  isSubmitting.value = true
  submissionError.value = null

  try {
    const result = await submitInterview({
      ...input,
      submittedBy: profileUserId.value,
    })

    if (result.success) {
      logger.info({ experienceId: result.id }, 'Interview experience submitted successfully')
      createdExperienceId.value = result.id || null
      isSuccess.value = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      logger.error({ error: result.error }, 'Failed to submit interview experience')
      submissionError.value = result.error || 'Failed to submit interview experience'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, 'Error submitting interview experience')
    submissionError.value = message
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Handle form cancel - navigate back to interviews
 */
const handleCancel = () => {
  router.push('/interviews')
}

// Auth redirect
watch([isAuthReady, isAuthenticated], ([ready, authenticated]) => {
  if (ready && !authenticated) {
    router.push(`/auth/login?redirect=${encodeURIComponent('/interviews/submit')}`)
  }
})

// Load user profile on mount to get Convex user ID
onMounted(async () => {
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
        <NuxtLink to="/interviews" class="hover:text-primary transition-colors">Interviews</NuxtLink>
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
            Please sign in to share your interview experience with the community.
          </p>
          <Button as-child>
            <NuxtLink :to="`/auth/login?redirect=${encodeURIComponent('/interviews/submit')}`">
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
                Your interview experience has been submitted successfully. It will be reviewed 
                and made visible to the community shortly.
              </p>
            </div>

            <div class="pt-4 space-y-3">
              <p class="text-sm text-muted-foreground">Help spread the word</p>
              <div class="flex flex-wrap justify-center gap-3">
                <Button variant="outline" size="sm" as-child>
                  <a 
                    :href="`https://twitter.com/intent/tweet?text=I%20just%20shared%20my%20interview%20experience%20on%20military.contractors%20to%20help%20fellow%20veterans%20prepare.%20Check%20it%20out!&url=https://military.contractors/interviews`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="mdi:twitter" class="w-4 h-4 mr-1.5" />
                    Share on X
                  </a>
                </Button>
                <Button variant="outline" size="sm" as-child>
                  <a 
                    :href="`https://www.linkedin.com/sharing/share-offsite/?url=https://military.contractors/interviews`"
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
                <NuxtLink to="/interviews">
                  <Icon name="mdi:comment-text-multiple" class="w-4 h-4 mr-1.5" />
                  Browse Interviews
                </NuxtLink>
              </Button>
              <Button variant="ghost" as-child>
                <NuxtLink to="/salaries/submit">
                  <Icon name="mdi:plus" class="w-4 h-4 mr-1.5" />
                  Share Salary Data
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
          <h1 class="text-2xl font-bold text-foreground mb-2">Share Your Interview Experience</h1>
          <p class="text-muted-foreground">
            Help fellow veterans prepare by sharing your interview process, 
            questions asked, and tips for success.
          </p>
        </div>

        <!-- Error Message (if any) -->
        <div 
          v-if="submissionError" 
          class="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2"
        >
          <Icon name="mdi:alert-circle" class="w-4 h-4 mt-0.5 shrink-0" />
          {{ submissionError }}
        </div>

        <!-- Form Card -->
        <Card>
          <CardContent class="p-6 sm:p-8">
            <InterviewExperienceForm
              :is-submitting="isSubmitting"
              @submit="handleSubmit"
              @cancel="handleCancel"
            />
          </CardContent>
        </Card>

        <!-- Privacy Notice -->
        <div class="mt-6 text-sm text-muted-foreground bg-primary/5 border border-primary/20 p-4">
          <p class="flex items-start gap-2">
            <Icon name="mdi:shield-check" class="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong class="text-foreground">Your privacy is protected.</strong> 
              Your submission is anonymous — your name and email are never displayed 
              with your interview experience.
            </span>
          </p>
        </div>

        <!-- Bottom CTA -->
        <div class="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already contributed? 
            <NuxtLink to="/interviews" class="text-primary hover:underline">
              Browse interview experiences
            </NuxtLink>
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
