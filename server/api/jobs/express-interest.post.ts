/**
 * @file Express interest API endpoint
 * @route POST /api/jobs/express-interest
 * @description Captures candidate interest in a specific job for placement (Drizzle-backed)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const expressInterestSchema = z.object({
  jobId: z.string(),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  name: z.string().optional(),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = expressInterestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const { jobId, email, name, notes, phone } = parsed.data

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

    // Log candidate activity
    await db.insert(schema.candidateActivity).values({
      id: nanoid(),
      email: email.toLowerCase(),
      activityType: 'express_interest',
      entityType: 'job',
      entityId: jobId,
      metadata: {
        jobTitle: job.title,
        company: job.company,
        name,
        phone,
        notes
      },
      createdAt: new Date(),
    })

    return {
      success: true,
      message: 'Interest submitted successfully'
    }
  } catch (error) {
    const err = error as { statusCode?: number }
    if (err.statusCode) throw error

    console.error('Failed to express interest:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record interest'
    })
  }
})
