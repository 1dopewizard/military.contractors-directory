/**
 * @file Featured listing request endpoint for employer intake
 * @route POST /api/employers/request-featured
 * @description Creates a pending featured listing request for admin approval (Drizzle-backed)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const requestFeaturedSchema = z.object({
  jobId: z.string(),
  contactEmail: z.string().email(),
  contactName: z.string().min(2),
  contactPhone: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request
  const parsed = requestFeaturedSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const { jobId, contactEmail, contactName, contactPhone } = parsed.data

  const db = getDb()

  try {
    // Verify the job exists
    const [job] = await db
      .select()
      .from(schema.job)
      .where(eq(schema.job.id, jobId))
      .limit(1)

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    // Check if there's already a pending featured listing for this job
    const [existingListing] = await db
      .select()
      .from(schema.featuredListing)
      .where(
        and(
          eq(schema.featuredListing.jobId, jobId),
          eq(schema.featuredListing.status, 'pending')
        )
      )
      .limit(1)

    if (existingListing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A featured request for this job is already pending'
      })
    }

    // Create pending featured listing
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await db.insert(schema.featuredListing).values({
      id: nanoid(),
      jobId,
      status: 'pending',
      startsAt: now,
      endsAt: thirtyDaysLater,
      displayOrder: 99, // Low priority until approved
      isPinned: false,
      requestData: {
        contactName,
        contactEmail,
        contactPhone,
        requestedAt: now.toISOString(),
      },
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      message: 'Featured listing request submitted successfully'
    }
  } catch (err: unknown) {
    // Re-throw if it's already a createError
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    
    console.error('Featured request error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred'
    })
  }
})
