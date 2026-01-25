/**
 * @file Admin create placement endpoint
 * @route POST /api/admin/placements
 * @description Create a new placement record to add candidate to pipeline (admin or recruiter) (Drizzle-backed)
 */

import { z } from 'zod'
import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { nanoid } from 'nanoid'

const createSchema = z.object({
  candidateEmail: z.string().email(),
  jobId: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum([
    'identified', 'contacted', 'interested', 'submitted',
    'interviewing', 'offered', 'placed', 'declined', 'withdrawn'
  ]).default('identified'),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const body = await readBody(event)

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const { candidateEmail, jobId, companyId, status, notes } = parsed.data

  const db = getDb()

  try {
    const id = nanoid()
    const now = new Date()

    await db.insert(schema.placement).values({
      id,
      candidateEmail,
      jobId: jobId ?? null,
      companyId: companyId ?? null,
      status,
      notes: notes ?? null,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      placement: { 
        id, 
        candidate_email: candidateEmail, 
        status, 
        notes,
        created_at: now.toISOString(),
      }
    }
  } catch (error) {
    console.error('Failed to create placement:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create placement'
    })
  }
})
