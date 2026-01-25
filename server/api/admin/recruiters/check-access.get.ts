/**
 * @file Check recruiter access endpoint
 * @route GET /api/admin/recruiters/check-access
 * @description Check if an email has recruiter access
 */

import { db, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = (query.email as string)?.toLowerCase()

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  try {
    const recruiterAccess = await db.query.recruiterAccess.findFirst({
      where: and(
        eq(schema.recruiterAccess.email, email),
        eq(schema.recruiterAccess.isActive, true)
      ),
    })

    return {
      hasAccess: !!recruiterAccess,
      role: recruiterAccess?.role || null,
    }
  } catch (error) {
    console.error('Failed to check recruiter access:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check recruiter access',
    })
  }
})
