/**
 * @file Check vote status API endpoint
 * @description Checks if a user has voted on a target
 */

import { db, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId as string
  const targetType = query.targetType as string
  const targetId = query.targetId as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId is required',
    })
  }

  if (!targetType) {
    throw createError({
      statusCode: 400,
      message: 'targetType is required',
    })
  }

  if (!targetId) {
    throw createError({
      statusCode: 400,
      message: 'targetId is required',
    })
  }

  try {
    const existingVote = await db.query.helpfulVote.findFirst({
      where: and(
        eq(schema.helpfulVote.userId, userId),
        eq(schema.helpfulVote.targetType, targetType),
        eq(schema.helpfulVote.targetId, targetId)
      ),
    })

    return { hasVoted: !!existingVote }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to check vote status: ${message}`,
    })
  }
})
