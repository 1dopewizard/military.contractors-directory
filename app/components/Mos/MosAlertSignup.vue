<!--
  @file MOS job alert signup component with placement consent
  @usage <MosAlertSignup :mos-code="'25B'" :mos-title="'IT Specialist'" />
  @description Email capture form for MOS-matched job alerts with optional placement services
-->

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useLocalStorage } from '@vueuse/core'

const props = defineProps<{
  mosCode: string
  mosTitle?: string
  branch?: string
  inDialog?: boolean
}>()

const emit = defineEmits<{
  success: []
}>()

const logger = useLogger('MosAlertSignup')
const { subscribe, loading } = useJobAlerts()

// Form state
const email = ref('')
const locationPreference = ref('')
const clearanceLevel = ref('')
const errorMessage = ref<string | null>(null)

// Placement consent fields
const placementConsent = ref(false)
const phone = ref('')
const militaryStatus = ref('')
const etsDate = ref('')
const willingToRelocate = ref(false)

// OCONUS-specific fields
const preferredTheaters = ref<string[]>([])
const clearanceStatus = ref('')
const polygraphType = ref('')
const hasValidPassport = ref(false)
const willingToDeployIn30Days = ref(false)

// Persist subscribed MOS codes in localStorage to show success state across re-renders
const subscribedMosCodes = useLocalStorage<string[]>('job-alert-subscriptions', [])

const isAlreadySubscribed = computed(() => {
  return subscribedMosCodes.value.includes(props.mosCode)
})

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const isValidPhone = computed(() => {
  if (!placementConsent.value) return true
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone.value.replace(/\s/g, ''))
})

const canSubmit = computed(() => {
  if (!email.value.trim() || !isValidEmail.value || loading.value) return false
  if (placementConsent.value && !phone.value.trim()) return false
  if (placementConsent.value && !isValidPhone.value) return false
  return true
})

const onSubmit = async () => {
  if (!canSubmit.value) return
  
  errorMessage.value = null

  const payload: Parameters<typeof subscribe>[0] = {
    email: email.value.trim(),
    clearance_level: clearanceLevel.value && clearanceLevel.value !== 'any' ? clearanceLevel.value : undefined,
    location_preference: locationPreference.value && locationPreference.value !== 'any' ? locationPreference.value.toUpperCase() as 'OCONUS' | 'REMOTE' : undefined,
    branch: props.branch,
    mos_codes: [props.mosCode],
    frequency: 'DAILY',
    include_similar_mos: true,
    // Placement fields
    placement_consent: placementConsent.value,
    phone: placementConsent.value ? phone.value.trim() : undefined,
    military_status: placementConsent.value && militaryStatus.value ? militaryStatus.value as 'active_duty' | 'reserve' | 'veteran' | 'transitioning' : undefined,
    ets_date: placementConsent.value && etsDate.value ? etsDate.value : undefined,
    willing_to_relocate: placementConsent.value ? willingToRelocate.value : undefined,
    // OCONUS-specific fields
    preferred_theaters: placementConsent.value && preferredTheaters.value.length > 0 ? preferredTheaters.value as ('CENTCOM' | 'EUCOM' | 'INDOPACOM' | 'AFRICOM' | 'SOUTHCOM')[] : undefined,
    clearance_status: placementConsent.value && clearanceStatus.value ? clearanceStatus.value as 'active' | 'inactive_transferable' | 'inactive_expired' | 'in_progress' | 'never_held' : undefined,
    polygraph_type: placementConsent.value && polygraphType.value ? polygraphType.value as 'none' | 'ci_poly' | 'full_scope' | 'lifestyle' : undefined,
    has_valid_passport: placementConsent.value ? hasValidPassport.value : undefined,
    willing_to_deploy_30_days: placementConsent.value ? willingToDeployIn30Days.value : undefined
  }

  const result = await subscribe(payload)

  if (result.success) {
    // Persist this MOS code as subscribed
    if (!subscribedMosCodes.value.includes(props.mosCode)) {
      subscribedMosCodes.value = [...subscribedMosCodes.value, props.mosCode]
    }
    
    // Show success toast
    const message = placementConsent.value 
      ? `You're subscribed and we'll be in touch about placement opportunities!`
      : `Daily job alerts for ${props.mosCode} will be sent to ${email.value}`
    
    toast.success('You\'re subscribed!', {
      description: message,
      duration: 5000
    })
    
    logger.info({ email: email.value, mosCode: props.mosCode, placementConsent: placementConsent.value }, 'User subscribed to job alerts')
    
    // Clear form
    email.value = ''
    locationPreference.value = ''
    clearanceLevel.value = ''
    placementConsent.value = false
    phone.value = ''
    militaryStatus.value = ''
    etsDate.value = ''
    willingToRelocate.value = false
    preferredTheaters.value = []
    clearanceStatus.value = ''
    polygraphType.value = ''
    hasValidPassport.value = false
    willingToDeployIn30Days.value = false
    
    emit('success')
  } else {
    errorMessage.value = result.message
    toast.error('Subscription failed', {
      description: result.message,
      duration: 4000
    })
  }
}

const locationOptions = [
  { value: 'any', label: 'Any location' },
  { value: 'oconus', label: 'OCONUS only' },
  { value: 'remote', label: 'Remote only' }
]

const clearanceLevels = [
  { value: 'any', label: 'Any clearance' },
  { value: 'none', label: 'None required' },
  { value: 'secret', label: 'Secret' },
  { value: 'top-secret', label: 'Top Secret' },
  { value: 'ts-sci', label: 'TS/SCI' }
]

const militaryStatusOptions = [
  { value: 'active_duty', label: 'Active Duty' },
  { value: 'reserve', label: 'Reserve/Guard' },
  { value: 'transitioning', label: 'Transitioning' },
  { value: 'veteran', label: 'Veteran' }
]

const theaterOptions = [
  { value: 'CENTCOM', label: 'CENTCOM (Middle East)' },
  { value: 'EUCOM', label: 'EUCOM (Europe)' },
  { value: 'INDOPACOM', label: 'INDOPACOM (Asia-Pacific)' },
  { value: 'AFRICOM', label: 'AFRICOM (Africa)' },
  { value: 'SOUTHCOM', label: 'SOUTHCOM (Americas)' }
]

const clearanceStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive_transferable', label: 'Inactive (Transferable)' },
  { value: 'inactive_expired', label: 'Inactive (Expired)' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'never_held', label: 'Never Held' }
]

const polygraphOptions = [
  { value: 'none', label: 'None' },
  { value: 'ci_poly', label: 'CI Polygraph' },
  { value: 'full_scope', label: 'Full Scope' },
  { value: 'lifestyle', label: 'Lifestyle' }
]

const toggleTheater = (theater: string) => {
  if (preferredTheaters.value.includes(theater)) {
    preferredTheaters.value = preferredTheaters.value.filter(t => t !== theater)
  } else {
    preferredTheaters.value = [...preferredTheaters.value, theater]
  }
}
</script>

<template>
  <Card :class="['border-none', inDialog ? 'bg-transparent shadow-none' : 'bg-sidebar']">
    <CardContent :class="inDialog ? 'p-0' : 'p-4'">
      <!-- Success State (persisted) -->
      <div v-if="isAlreadySubscribed" class="text-center py-2">
        <Icon name="mdi:check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p class="text-sm font-medium text-foreground mb-1">You're subscribed!</p>
        <p class="text-xs text-muted-foreground">
          Daily {{ mosCode }} alerts are on their way.
        </p>
        <p class="text-[10px] text-muted-foreground/60 mt-2">
          Manage via link in your emails
        </p>
      </div>

      <!-- Signup Form -->
      <form v-else @submit.prevent="onSubmit" class="space-y-3">
        <div v-if="!inDialog" class="flex items-center gap-2 mb-3">
          <Icon name="mdi:bell-ring-outline" class="w-4 h-4 text-primary shrink-0" />
          <span class="text-sm font-medium text-foreground">Get {{ mosCode }} job alerts</span>
        </div>

        <p v-if="!inDialog" class="text-xs text-muted-foreground">
          New {{ mosTitle || mosCode }} positions delivered to your inbox daily.
        </p>

        <!-- Email Field -->
        <div>
          <Input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="h-9 text-sm"
            required
          />
          <p v-if="email && !isValidEmail" class="text-xs text-destructive mt-1">
            Please enter a valid email
          </p>
        </div>

        <!-- Location Preference -->
        <Select v-model="locationPreference">
          <SelectTrigger class="h-9 text-sm">
            <SelectValue placeholder="Location preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="loc in locationOptions" :key="loc.value" :value="loc.value">
              {{ loc.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Clearance Level -->
        <Select v-model="clearanceLevel">
          <SelectTrigger class="h-9 text-sm">
            <SelectValue placeholder="Clearance level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="level in clearanceLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Placement Consent Checkbox -->
        <div class="pt-2 border-t border-border/50">
          <div class="flex items-start gap-2">
            <Checkbox 
              id="placement-consent" 
              v-model:checked="placementConsent"
              class="mt-0.5"
            />
            <label for="placement-consent" class="text-xs text-muted-foreground cursor-pointer leading-tight">
              I'd like <span class="text-foreground font-medium">military.contractors</span> to represent me to employers for placement opportunities
            </label>
          </div>
        </div>

        <!-- Conditional Placement Fields -->
        <template v-if="placementConsent">
          <div class="space-y-3 pt-2 border-t border-border/30">
            <p class="text-xs text-muted-foreground">
              Help us match you with the right opportunities:
            </p>

            <!-- Phone (Required when consent) -->
            <div>
              <Input
                v-model="phone"
                type="tel"
                placeholder="Phone number *"
                class="h-9 text-sm"
                required
              />
              <p v-if="phone && !isValidPhone" class="text-xs text-destructive mt-1">
                Please enter a valid phone number
              </p>
            </div>

            <!-- Military Status -->
            <Select v-model="militaryStatus">
              <SelectTrigger class="h-9 text-sm">
                <SelectValue placeholder="Military status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="status in militaryStatusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- ETS Date -->
            <div>
              <Input
                v-model="etsDate"
                type="date"
                placeholder="ETS/Separation date"
                class="h-9 text-sm"
              />
              <p class="text-[10px] text-muted-foreground mt-1">
                ETS/Separation date (if applicable)
              </p>
            </div>

            <!-- Willing to Relocate -->
            <div class="flex items-center gap-2">
              <Checkbox 
                id="willing-relocate" 
                v-model:checked="willingToRelocate"
              />
              <label for="willing-relocate" class="text-xs text-muted-foreground cursor-pointer">
                Willing to relocate for the right opportunity
              </label>
            </div>

            <!-- OCONUS Section -->
            <div class="pt-3 mt-3 border-t border-border/30 space-y-3">
              <p class="text-xs font-medium text-foreground">OCONUS Preferences</p>

              <!-- Preferred Theaters -->
              <div>
                <p class="text-xs text-muted-foreground mb-2">Preferred theaters:</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="theater in theaterOptions"
                    :key="theater.value"
                    type="button"
                    class="text-xs px-2 py-1 border transition-colors"
                    :class="preferredTheaters.includes(theater.value) 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted/50 border-border hover:border-primary/50'"
                    @click="toggleTheater(theater.value)"
                  >
                    {{ theater.value }}
                  </button>
                </div>
              </div>

              <!-- Clearance Status -->
              <Select v-model="clearanceStatus">
                <SelectTrigger class="h-9 text-sm">
                  <SelectValue placeholder="Clearance status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="status in clearanceStatusOptions" :key="status.value" :value="status.value">
                    {{ status.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Polygraph Type -->
              <Select v-model="polygraphType">
                <SelectTrigger class="h-9 text-sm">
                  <SelectValue placeholder="Polygraph type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="poly in polygraphOptions" :key="poly.value" :value="poly.value">
                    {{ poly.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Valid Passport -->
              <div class="flex items-center gap-2">
                <Checkbox 
                  id="valid-passport" 
                  v-model:checked="hasValidPassport"
                />
                <label for="valid-passport" class="text-xs text-muted-foreground cursor-pointer">
                  I have a valid US passport
                </label>
              </div>

              <!-- Deploy in 30 Days -->
              <div class="flex items-center gap-2">
                <Checkbox 
                  id="deploy-30" 
                  v-model:checked="willingToDeployIn30Days"
                />
                <label for="deploy-30" class="text-xs text-muted-foreground cursor-pointer">
                  Willing to deploy within 30 days
                </label>
              </div>
            </div>
          </div>
        </template>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-xs text-destructive">
          {{ errorMessage }}
        </p>

        <!-- Submit Button -->
        <Button type="submit" class="w-full h-9 text-sm" :disabled="!canSubmit">
          <Spinner v-if="loading" class="w-4 h-4 mr-2" />
          <Icon v-else name="mdi:email-outline" class="w-4 h-4 mr-2" />
          {{ placementConsent ? 'Subscribe & Join Talent Pool' : 'Subscribe' }}
        </Button>

        <p class="text-[10px] text-muted-foreground/70 text-center">
          {{ placementConsent ? 'We respect your privacy. Unsubscribe anytime.' : 'Unsubscribe anytime. No spam.' }}
        </p>
      </form>
    </CardContent>
  </Card>
</template>
