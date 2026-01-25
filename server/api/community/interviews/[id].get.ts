/**
 * @file Single interview experience API endpoint
 * @description Returns a single interview experience by ID
 */

import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Interview experience ID is required',
    })
  }

  try {
    const experience = await db.query.interviewExperience.findFirst({
      where: eq(schema.interviewExperience.id, id),
    })

    if (!experience) {
      throw createError({
        statusCode: 404,
        message: `Interview experience ${id} not found`,
      })
    }

    // Get company name
    const company = experience.companyId
      ? await db.query.company.findFirst({
          where: eq(schema.company.id, experience.companyId),
        })
      : null

    return {
      id: experience.id,
      companyId: experience.companyId,
      companyName: company?.name || 'Unknown Company',
      mosCode: experience.mosCode,
      roleTitle: experience.roleTitle,
      interviewDate: experience.interviewDate ? new Date(experience.interviewDate).toISOString() : null,
      processDescription: experience.processDescription,
      questionsAsked: experience.questionsAsked || [],
      tips: experience.tips,
      difficulty: experience.difficulty,
      outcome: experience.outcome,
      timelineWeeks: experience.timelineWeeks,
      verificationStatus: experience.verificationStatus,
      helpfulCount: experience.helpfulCount,
      createdAt: experience.createdAt ? new Date(experience.createdAt).toISOString() : null,
      updatedAt: experience.updatedAt ? new Date(experience.updatedAt).toISOString() : null,
    }
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch interview experience: ${message}`,
    })
  }
})
