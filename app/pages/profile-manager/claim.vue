<!--
  @file Claim Profile Page
  @description Allows users to search and claim a contractor profile
-->
<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth']
})

useHead({
  title: 'Claim Your Profile | military.contractors',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const { isAuthReady, userEmail } = useAuth()

// State
const searchQuery = ref('')
const searchResults = ref<Array<{
  id: string
  name: string
  slug: string
  headquarters: string | null
  logoUrl: string | null
}>>([])
const isSearching = ref(false)
const selectedContractor = ref<typeof searchResults.value[0] | null>(null)
const step = ref<'search' | 'verify' | 'success'>('search')
const selectedTier = ref<'claimed' | 'premium'>('claimed')
const verificationMethod = ref<'email_domain' | 'manual'>('manual')
const isSubmitting = ref(false)

interface ContractorsResponse {
  contractors: typeof searchResults.value
  total: number
}

// Debounced search
const debouncedSearch = useDebounceFn(async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const response = await $fetch<ContractorsResponse>('/api/contractors', {
      params: {
        q: searchQuery.value,
        limit: 10,
      },
    })
    searchResults.value = response?.contractors || []
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    isSearching.value = false
  }
}, 300)

watch(searchQuery, debouncedSearch)

const selectContractor = (contractor: typeof searchResults.value[0]) => {
  selectedContractor.value = contractor
  step.value = 'verify'
}

const submitClaim = async () => {
  if (!selectedContractor.value) return

  isSubmitting.value = true
  try {
    await $fetch('/api/profile-manager/claim', {
      method: 'POST',
      body: {
        contractorId: selectedContractor.value.id,
        verificationMethod: verificationMethod.value,
        tier: selectedTier.value,
      },
    })

    step.value = 'success'
    toast.success('Claim submitted successfully!')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit claim'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  if (step.value === 'verify') {
    step.value = 'search'
    selectedContractor.value = null
  }
}

// Check if user's email domain matches company
const emailDomain = computed(() => {
  if (!userEmail.value) return null
  const parts = userEmail.value.split('@')
  return parts.length === 2 ? parts[1] : null
})
</script>

<template>
  <ClientOnly>
    <!-- Auth loading state -->
    <div v-if="!isAuthReady" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <Spinner class="w-8 h-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>

    <div v-else class="min-h-screen py-12">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">Claim Your Company Profile</h1>
        <p class="text-muted-foreground">
          Search for your company and verify ownership to manage your profile
        </p>
      </div>

      <!-- Step 1: Search -->
      <Card v-if="step === 'search'" class="p-6">
        <div class="space-y-6">
          <div>
            <Label for="search">Search for your company</Label>
            <div class="relative mt-2">
              <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="search"
                v-model="searchQuery"
                placeholder="Enter company name..."
                class="pl-10"
              />
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="isSearching" class="flex justify-center py-8">
            <Spinner class="w-6 h-6 text-muted-foreground" />
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-2">
            <p class="text-sm text-muted-foreground">Select your company:</p>
            <div class="divide-y border rounded-lg">
              <button
                v-for="contractor in searchResults"
                :key="contractor.id"
                class="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                @click="selectContractor(contractor)"
              >
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <img 
                    v-if="contractor.logoUrl" 
                    :src="contractor.logoUrl" 
                    :alt="contractor.name"
                    class="w-full h-full object-contain rounded"
                  />
                  <span v-else class="text-sm font-semibold text-muted-foreground">
                    {{ contractor.name?.charAt(0) }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ contractor.name }}</p>
                  <p v-if="contractor.headquarters" class="text-sm text-muted-foreground truncate">
                    {{ contractor.headquarters }}
                  </p>
                </div>
                <Icon name="mdi:chevron-right" class="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div v-else-if="searchQuery.length >= 2" class="text-center py-8 text-muted-foreground">
            <Icon name="mdi:office-building-outline" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No companies found matching "{{ searchQuery }}"</p>
            <p class="text-sm mt-1">Try a different search term</p>
          </div>
        </div>
      </Card>

      <!-- Step 2: Verify -->
      <Card v-else-if="step === 'verify'" class="p-6">
        <div class="space-y-6">
          <Button variant="ghost" size="sm" class="-ml-2" @click="goBack">
            <Icon name="mdi:arrow-left" class="w-4 h-4 mr-1" />
            Back to search
          </Button>

          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <img 
                v-if="selectedContractor?.logoUrl" 
                :src="selectedContractor.logoUrl" 
                :alt="selectedContractor.name"
                class="w-full h-full object-contain rounded-lg"
              />
              <span v-else class="text-2xl font-bold text-muted-foreground">
                {{ selectedContractor?.name?.charAt(0) }}
              </span>
            </div>
            <div>
              <h2 class="text-xl font-bold">{{ selectedContractor?.name }}</h2>
              <p v-if="selectedContractor?.headquarters" class="text-sm text-muted-foreground">
                {{ selectedContractor.headquarters }}
              </p>
            </div>
          </div>

          <Separator />

          <!-- Verification Method -->
          <div class="space-y-4">
            <Label>Verification Method</Label>
            <RadioGroup v-model="verificationMethod" class="space-y-3">
              <div class="flex items-start space-x-3">
                <RadioGroupItem id="manual" value="manual" />
                <div class="grid gap-1">
                  <Label for="manual" class="font-medium cursor-pointer">Manual Review</Label>
                  <p class="text-sm text-muted-foreground">
                    Our team will verify your employment and approve your claim within 2-3 business days.
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <RadioGroupItem id="email_domain" value="email_domain" />
                <div class="grid gap-1">
                  <Label for="email_domain" class="font-medium cursor-pointer">
                    Email Domain Verification
                    <Badge v-if="emailDomain" variant="outline" class="ml-2">
                      @{{ emailDomain }}
                    </Badge>
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    Instantly verify using your company email address (if your email domain matches).
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <!-- Tier Selection -->
          <div class="space-y-4">
            <Label>Select Your Plan</Label>
            <div class="grid gap-4 sm:grid-cols-2">
              <button
                :class="[
                  'p-4 border rounded-lg text-left transition-colors',
                  selectedTier === 'claimed' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                ]"
                @click="selectedTier = 'claimed'"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold">Claimed</span>
                  <span class="text-lg font-bold">$149<span class="text-sm font-normal text-muted-foreground">/mo</span></span>
                </div>
                <ul class="text-sm text-muted-foreground space-y-1">
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Verified badge
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Edit profile & links
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Why Work Here section
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Basic analytics
                  </li>
                </ul>
              </button>

              <button
                :class="[
                  'p-4 border rounded-lg text-left transition-colors relative',
                  selectedTier === 'premium' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                ]"
                @click="selectedTier = 'premium'"
              >
                <Badge class="absolute -top-2 -right-2 bg-amber-500 text-white">Popular</Badge>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold">Premium</span>
                  <span class="text-lg font-bold">$399<span class="text-sm font-normal text-muted-foreground">/mo</span></span>
                </div>
                <ul class="text-sm text-muted-foreground space-y-1">
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Everything in Claimed
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Spotlight content block
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Employee testimonials
                  </li>
                  <li class="flex items-center gap-1">
                    <Icon name="mdi:check" class="w-4 h-4 text-green-600" /> Priority in search
                  </li>
                </ul>
              </button>
            </div>
          </div>

          <Button class="w-full" size="lg" :disabled="isSubmitting" @click="submitClaim">
            <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
            Submit Claim Request
          </Button>
        </div>
      </Card>

      <!-- Step 3: Success -->
      <Card v-else-if="step === 'success'" class="p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Icon name="mdi:check" class="w-8 h-8 text-green-600" />
        </div>
        <h2 class="text-2xl font-bold mb-2">Claim Submitted!</h2>
        <p class="text-muted-foreground mb-6">
          Your claim for <strong>{{ selectedContractor?.name }}</strong> has been submitted for review.
          <template v-if="verificationMethod === 'manual'">
            Our team will verify your request within 2-3 business days.
          </template>
          <template v-else>
            We'll verify your email domain and activate your account shortly.
          </template>
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          You'll receive an email notification once your claim is approved.
        </p>
        <Button as-child>
          <NuxtLink to="/">Return to Home</NuxtLink>
        </Button>
      </Card>
    </div>
  </div>
  </ClientOnly>
</template>
