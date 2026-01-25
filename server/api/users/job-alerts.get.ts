/**
 * @file User job alerts endpoint
 * @route GET /api/users/job-alerts
 * @description Fetch job alert subscriptions for a user
 */

import { db, schema } from '@/server/utils/db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  try {
    const alerts = await db.query.jobAlertSubscription.findMany({
      where: eq(schema.jobAlertSubscription.email, email.toLowerCase()),
      orderBy: desc(schema.jobAlertSubscription.createdAt),
    })

    return alerts.map(alert => ({
      id: alert.id,
      email: alert.email,
      isActive: alert.isActive,
      frequency: alert.frequency,
      keywords: alert.keywords as string[] | null,
      locations: alert.locations as string[] | null,
      clearanceLevels: alert.clearanceLevels as string[] | null,
      mosCodes: alert.mosCodes as string[] | null,
      lastSentAt: alert.lastSentAt instanceof Date 
        ? alert.lastSentAt.toISOString() 
        : alert.lastSentAt,
      createdAt: alert.createdAt instanceof Date 
        ? alert.createdAt.toISOString() 
        : alert.createdAt,
    }))
  } catch (error) {
    console.error('Failed to fetch job alerts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch job alerts',
    })
  }
})
