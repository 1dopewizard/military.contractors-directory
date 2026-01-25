/**
 * @file Admin update placement endpoint
 * @route PATCH /api/admin/placements/:id
 * @description Update placement status and details (admin or recruiter) (Drizzle-backed)
 */

import { z } from 'zod'
import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

const updateSchema = z.object({
  status: z.enum([
    'identified', 'contacted', 'interested', 'submitted',
    'interviewing', 'offered', 'placed', 'declined', 'withdrawn'
  ]).optional(),
  jobId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  placementDate: z.number().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Placement ID is required'
    })
  }

  const body = await readBody(event)

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const updates = parsed.data

  const db = getDb()

  try {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.jobId !== undefined) updateData.jobId = updates.jobId
    if (updates.companyId !== undefined) updateData.companyId = updates.companyId
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.placementDate !== undefined) {
      updateData.placementDate = updates.placementDate ? new Date(updates.placementDate) : null
    }

    await db
      .update(schema.placement)
      .set(updateData)
      .where(eq(schema.placement.id, id))

    // Fetch updated placement with job info
    const [result] = await db
      .select({
        placement: schema.placement,
        job: schema.job,
      })
      .from(schema.placement)
      .leftJoin(schema.job, eq(schema.job.id, schema.placement.jobId))
      .where(eq(schema.placement.id, id))
      .limit(1)

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Placement not found'
      })
    }

    const { placement, job } = result

    return {
      success: true,
      placement: {
        id: placement.id,
        candidate_email: placement.candidateEmail,
        job_id: placement.jobId,
        job_title: job?.title ?? null,
        company: job?.company ?? null,
        status: placement.status,
        notes: placement.notes,
        placement_date: placement.placementDate?.toISOString() ?? null,
        created_at: placement.createdAt?.toISOString() ?? null,
        updated_at: placement.updatedAt?.toISOString() ?? null,
      }
    }
  } catch (error) {
    console.error('Failed to update placement:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update placement'
    })
  }
})
