/**
 * @file Admin delete recruiter endpoint
 * @route DELETE /api/admin/recruiters/:id
 * @description Remove recruiter access (admin only) (Drizzle-backed)
 */

import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recruiter ID is required'
    })
  }

  const db = getDb()

  try {
    await db
      .delete(schema.recruiterAccess)
      .where(eq(schema.recruiterAccess.id, id))

    return {
      success: true
    }
  } catch (error) {
    console.error('Failed to delete recruiter:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove recruiter'
    })
  }
})
