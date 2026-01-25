/**
 * @file Admin update recruiter endpoint
 * @route PATCH /api/admin/recruiters/:id
 * @description Update recruiter status or info (admin only) (Drizzle-backed)
 */

import { z } from 'zod'
import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

const updateSchema = z.object({
  accessLevel: z.string().optional(),
  expiresAt: z.number().optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recruiter ID is required'
    })
  }

  const body = await readBody(event)

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid update data'
    })
  }

  const db = getDb()

  try {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    
    if (parsed.data.accessLevel !== undefined) updateData.accessLevel = parsed.data.accessLevel
    if (parsed.data.expiresAt !== undefined) updateData.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    await db
      .update(schema.recruiterAccess)
      .set(updateData)
      .where(eq(schema.recruiterAccess.id, id))

    // Fetch updated recruiter
    const [updated] = await db
      .select()
      .from(schema.recruiterAccess)
      .where(eq(schema.recruiterAccess.id, id))
      .limit(1)

    return {
      success: true,
      recruiter: updated ? {
        id: updated.id,
        email: updated.email,
        access_level: updated.accessLevel,
        is_active: updated.isActive,
        expires_at: updated.expiresAt?.toISOString() ?? null,
        created_at: updated.createdAt?.toISOString() ?? null,
        updated_at: updated.updatedAt?.toISOString() ?? null,
      } : null
    }
  } catch (error) {
    console.error('Failed to update recruiter:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update recruiter'
    })
  }
})
