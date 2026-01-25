/**
 * @file Job alerts composable with placement consent support
 * @usage import { useJobAlerts } from '@/composables/useJobAlerts'
 * @description Manages job alert subscriptions for MOS-matched email digests with optional placement services
 */

import { z } from 'zod'

// Validation schema matching the API
const subscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  branch: z.string().optional(),
  clearance_level: z.string().optional(),
  mos_codes: z.array(z.string()).min(1, 'Please select at least one MOS'),
  frequency: z.enum(['DAILY', 'WEEKLY']).default('DAILY'),
  include_similar_mos: z.boolean().default(true),
  location_preference: z.enum(['ANY', 'OCONUS', 'REMOTE']).optional(),
  // Placement consent fields
  placement_consent: z.boolean().optional(),
  phone: z.string().optional(),
  military_status: z.enum(['active_duty', 'reserve', 'veteran', 'transitioning']).optional(),
  ets_date: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  years_experience: z.number().int().min(0).max(50).optional(),
  salary_expectation_min: z.number().int().min(0).optional(),
  salary_expectation_max: z.number().int().min(0).optional(),
  // OCONUS-specific fields
  preferred_theaters: z.array(z.enum(['CENTCOM', 'EUCOM', 'INDOPACOM', 'AFRICOM', 'SOUTHCOM'])).optional(),
  clearance_status: z.enum(['active', 'inactive_transferable', 'inactive_expired', 'in_progress', 'never_held']).optional(),
  polygraph_type: z.enum(['none', 'ci_poly', 'full_scope', 'lifestyle']).optional(),
  has_valid_passport: z.boolean().optional(),
  willing_to_deploy_30_days: z.boolean().optional()
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>

export interface SubscriptionResult {
  success: boolean
  message: string
  isNew?: boolean
  error?: string
}

export const useJobAlerts = () => {
  const logger = useLogger('useJobAlerts')
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Subscribe to job alerts (with optional placement consent)
   */
  const subscribe = async (input: SubscriptionInput): Promise<SubscriptionResult> => {
    loading.value = true
    error.value = null

    // Client-side validation
    const parsed = subscriptionSchema.safeParse(input)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Validation failed'
      error.value = firstError
      loading.value = false
      return { success: false, message: firstError, error: firstError }
    }

    try {
      logger.info({ 
        email: input.email, 
        mosCodes: input.mos_codes, 
        placementConsent: input.placement_consent 
      }, 'Subscribing to job alerts')

      const response = await $fetch<SubscriptionResult>('/api/job-alerts/subscribe', {
        method: 'POST',
        body: parsed.data
      })

      logger.info({ 
        email: input.email, 
        isNew: response.isNew,
        placementConsent: input.placement_consent
      }, 'Subscription successful')
      
      return response
    } catch (err: any) {
      const message = err.data?.statusMessage || err.message || 'Failed to subscribe'
      error.value = message
      logger.error({ error: message }, 'Subscription failed')
      
      return { success: false, message, error: message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Unsubscribe via token (typically called from email link)
   */
  const unsubscribe = async (token: string): Promise<SubscriptionResult> => {
    loading.value = true
    error.value = null

    try {
      logger.info({ token }, 'Unsubscribing from job alerts')

      const response = await $fetch<SubscriptionResult>('/api/job-alerts/unsubscribe', {
        method: 'GET',
        query: { token }
      })

      logger.info('Unsubscribe successful')
      
      return response
    } catch (err: any) {
      const message = err.data?.statusMessage || err.message || 'Failed to unsubscribe'
      error.value = message
      logger.error({ error: message }, 'Unsubscribe failed')
      
      return { success: false, message, error: message }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    subscribe,
    unsubscribe
  }
}
