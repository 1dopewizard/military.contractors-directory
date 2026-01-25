/**
 * @file Approve/reject content
 * @route PATCH /api/admin/content/[id]
 * @description Admin action to approve or reject sponsored content
 */

import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/server/utils/auth'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const db = getDb()
  const contentId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!contentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content ID is required',
    })
  }

  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
    })
  }

  // Get the content
  const [content] = await db
    .select()
    .from(schema.sponsoredContent)
    .where(eq(schema.sponsoredContent.id, contentId))
    .limit(1)

  if (!content) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found',
    })
  }

  if (content.status !== 'pending_review') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content has already been reviewed',
    })
  }

  if (parsed.data.action === 'approve') {
    await db
      .update(schema.sponsoredContent)
      .set({
        status: 'approved',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.sponsoredContent.id, contentId))

    return { success: true, status: 'approved' }
  } else {
    await db
      .update(schema.sponsoredContent)
      .set({
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: parsed.data.reason || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.sponsoredContent.id, contentId))

    return { success: true, status: 'rejected' }
  }
})
