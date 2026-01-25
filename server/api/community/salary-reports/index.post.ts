/**
 * @file Submit salary report API endpoint
 * @description Creates a new salary report
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'

const submitSchema = z.object({
  mosCode: z.string().min(1, 'MOS code is required'),
  mosId: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  baseSalary: z.number().min(1, 'Base salary is required'),
  signingBonus: z.number().optional(),
  clearanceLevel: z.enum(['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI', 'TS_SCI_POLY']),
  yearsExperience: z.number().min(0),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONTRACT_TO_HIRE', 'INTERN']),
  isOconus: z.boolean().default(false),
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
    const [newReport] = await db.insert(schema.salaryReport).values({
      mosCode: data.mosCode.toUpperCase(),
      mosId: data.mosId || null,
      companyId: data.companyId,
      location: data.location,
      baseSalary: data.baseSalary,
      signingBonus: data.signingBonus || null,
      clearanceLevel: data.clearanceLevel,
      yearsExperience: data.yearsExperience,
      employmentType: data.employmentType,
      isOconus: data.isOconus,
      verificationStatus: 'PENDING',
      submittedBy: data.submittedBy || null,
      helpfulCount: 0,
    }).returning({ id: schema.salaryReport.id })

    if (!newReport) {
      throw new Error('Failed to create salary report')
    }

    return {
      success: true,
      id: newReport.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to submit salary report: ${message}`,
    })
  }
})
