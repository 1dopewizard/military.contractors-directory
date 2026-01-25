/**
 * @file Interview experiences list API endpoint
 * @description Returns paginated interview experiences with filters
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, desc, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0
  const companyId = query.companyId as string | undefined
  const mosCode = query.mosCode as string | undefined
  const difficulty = query.difficulty as string | undefined
  const outcome = query.outcome as string | undefined
  const sort = (query.sort as string) || 'recent'

  const db = getDb()

  try {
    const whereConditions = []

    if (companyId) {
      whereConditions.push(eq(schema.interviewExperience.companyId, companyId))
    }
    if (mosCode) {
      whereConditions.push(eq(schema.interviewExperience.mosCode, mosCode.toUpperCase()))
    }
    if (difficulty) {
      whereConditions.push(eq(schema.interviewExperience.difficulty, difficulty))
    }
    if (outcome) {
      whereConditions.push(eq(schema.interviewExperience.outcome, outcome))
    }

    // Only show verified experiences by default
    whereConditions.push(eq(schema.interviewExperience.verificationStatus, 'VERIFIED'))

    const orderBy = sort === 'helpful'
      ? desc(schema.interviewExperience.helpfulCount)
      : desc(schema.interviewExperience.createdAt)

    const experiences = await db
      .select({
        id: schema.interviewExperience.id,
        companyId: schema.interviewExperience.companyId,
        companyName: schema.company.name,
        mosCode: schema.interviewExperience.mosCode,
        roleTitle: schema.interviewExperience.roleTitle,
        interviewDate: schema.interviewExperience.interviewDate,
        processDescription: schema.interviewExperience.processDescription,
        questionsAsked: schema.interviewExperience.questionsAsked,
        tips: schema.interviewExperience.tips,
        difficulty: schema.interviewExperience.difficulty,
        outcome: schema.interviewExperience.outcome,
        timelineWeeks: schema.interviewExperience.timelineWeeks,
        helpfulCount: schema.interviewExperience.helpfulCount,
        createdAt: schema.interviewExperience.createdAt,
      })
      .from(schema.interviewExperience)
      .leftJoin(schema.company, eq(schema.interviewExperience.companyId, schema.company.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(schema.interviewExperience)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    return {
      experiences: experiences.map((e) => ({
        id: e.id,
        companyId: e.companyId,
        companyName: e.companyName || 'Unknown Company',
        mosCode: e.mosCode,
        roleTitle: e.roleTitle,
        interviewDate: e.interviewDate ? new Date(e.interviewDate).toISOString() : null,
        processDescription: e.processDescription,
        questionsAsked: e.questionsAsked || [],
        tips: e.tips,
        difficulty: e.difficulty,
        outcome: e.outcome,
        timelineWeeks: e.timelineWeeks,
        helpfulCount: e.helpfulCount,
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
      })),
      total,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch interview experiences: ${message}`,
    })
  }
})
