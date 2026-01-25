/**
 * @file Helpful vote API endpoint
 * @description Records or removes a helpful vote
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'

const voteSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  targetType: z.enum(['salary', 'interview']),
  targetId: z.string().min(1, 'Target ID is required'),
  action: z.enum(['add', 'remove']).default('add'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const { userId, targetType, targetId, action } = parsed.data

  try {
    // Check if vote already exists
    const existingVote = await db.query.helpfulVote.findFirst({
      where: and(
        eq(schema.helpfulVote.userId, userId),
        eq(schema.helpfulVote.targetType, targetType),
        eq(schema.helpfulVote.targetId, targetId)
      ),
    })

    if (action === 'add') {
      if (existingVote) {
        return { success: false, error: 'Already voted' }
      }

      // Add vote
      await db.insert(schema.helpfulVote).values({
        userId,
        targetType,
        targetId,
      })

      // Increment helpful count on target
      if (targetType === 'salary') {
        await db
          .update(schema.salaryReport)
          .set({ helpfulCount: sql`${schema.salaryReport.helpfulCount} + 1` })
          .where(eq(schema.salaryReport.id, targetId))
      } else {
        await db
          .update(schema.interviewExperience)
          .set({ helpfulCount: sql`${schema.interviewExperience.helpfulCount} + 1` })
          .where(eq(schema.interviewExperience.id, targetId))
      }

      return { success: true }
    } else {
      // Remove vote
      if (!existingVote) {
        return { success: false, error: 'Vote not found' }
      }

      await db.delete(schema.helpfulVote).where(eq(schema.helpfulVote.id, existingVote.id))

      // Decrement helpful count on target
      if (targetType === 'salary') {
        await db
          .update(schema.salaryReport)
          .set({ helpfulCount: sql`MAX(0, ${schema.salaryReport.helpfulCount} - 1)` })
          .where(eq(schema.salaryReport.id, targetId))
      } else {
        await db
          .update(schema.interviewExperience)
          .set({ helpfulCount: sql`MAX(0, ${schema.interviewExperience.helpfulCount} - 1)` })
          .where(eq(schema.interviewExperience.id, targetId))
      }

      return { success: true }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to process vote: ${message}`,
    })
  }
})
