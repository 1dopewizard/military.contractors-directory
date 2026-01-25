/**
 * @file Submit interview experience API endpoint
 * @description Creates a new interview experience
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'

const submitSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  mosCode: z.string().min(1, 'MOS code is required'),
  mosId: z.string().optional(),
  roleTitle: z.string().min(1, 'Role title is required'),
  interviewDate: z.number().min(1, 'Interview date is required'),
  processDescription: z.string().min(10, 'Process description is required'),
  questionsAsked: z.array(z.string()).min(1, 'At least one question is required'),
  tips: z.string().min(10, 'Tips are required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  outcome: z.enum(['OFFER', 'REJECTED', 'GHOSTED', 'WITHDREW']),
  timelineWeeks: z.number().min(0),
  submittedBy: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const data = parsed.data

  try {
    const [newExperience] = await db.insert(schema.interviewExperience).values({
      companyId: data.companyId,
      mosCode: data.mosCode.toUpperCase(),
      mosId: data.mosId || null,
      roleTitle: data.roleTitle,
      interviewDate: new Date(data.interviewDate),
      processDescription: data.processDescription,
      questionsAsked: data.questionsAsked,
      tips: data.tips,
      difficulty: data.difficulty,
      outcome: data.outcome,
      timelineWeeks: data.timelineWeeks,
      verificationStatus: 'PENDING',
      submittedBy: data.submittedBy || null,
      helpfulCount: 0,
    }).returning({ id: schema.interviewExperience.id })

    if (!newExperience) {
      throw new Error('Failed to create interview experience')
    }

    return {
      success: true,
      id: newExperience.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to submit interview experience: ${message}`,
    })
  }
})
