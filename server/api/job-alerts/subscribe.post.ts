/**
 * @file Job alert subscription endpoint with placement consent
 * @route POST /api/job-alerts/subscribe
 * @description Handles email subscriptions for MOS-matched job alerts with optional placement services (Drizzle-backed)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Validation schema for subscription request
const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  mosCodes: z.array(z.string()).min(1, 'Please select at least one MOS'),
  frequency: z.string().default('weekly'),
  keywords: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  clearanceLevels: z.array(z.string()).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request body
  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const { 
    email, 
    mosCodes, 
    frequency, 
    keywords,
    locations,
    clearanceLevels
  } = parsed.data

  const db = getDb()

  try {
    // Check if email already exists
    const existing = await db
      .select()
      .from(schema.jobAlertSubscription)
      .where(eq(schema.jobAlertSubscription.email, email.toLowerCase()))
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing subscription
      await db
        .update(schema.jobAlertSubscription)
        .set({
          mosCodes,
          frequency,
          keywords: keywords || [],
          locations: locations || [],
          clearanceLevels: clearanceLevels || [],
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.jobAlertSubscription.email, email.toLowerCase()))

      return {
        success: true,
        message: 'Subscription updated successfully',
        isNew: false
      }
    }

    // Create new subscription
    await db.insert(schema.jobAlertSubscription).values({
      id: nanoid(),
      email: email.toLowerCase(),
      mosCodes,
      frequency,
      keywords: keywords || [],
      locations: locations || [],
      clearanceLevels: clearanceLevels || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return {
      success: true,
      message: 'Successfully subscribed to job alerts',
      isNew: true
    }
  } catch (error) {
    console.error('Failed to create subscription:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create subscription'
    })
  }
})
