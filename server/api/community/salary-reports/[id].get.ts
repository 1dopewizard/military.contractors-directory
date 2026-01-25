/**
 * @file Single salary report API endpoint
 * @description Returns a single salary report by ID
 */

import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Salary report ID is required',
    })
  }

  try {
    const report = await db.query.salaryReport.findFirst({
      where: eq(schema.salaryReport.id, id),
    })

    if (!report) {
      throw createError({
        statusCode: 404,
        message: `Salary report ${id} not found`,
      })
    }

    // Get company name
    const company = report.companyId
      ? await db.query.company.findFirst({
          where: eq(schema.company.id, report.companyId),
        })
      : null

    return {
      id: report.id,
      mosCode: report.mosCode,
      companyId: report.companyId,
      companyName: company?.name || 'Unknown Company',
      location: report.location,
      baseSalary: report.baseSalary,
      signingBonus: report.signingBonus,
      clearanceLevel: report.clearanceLevel,
      yearsExperience: report.yearsExperience,
      employmentType: report.employmentType,
      isOconus: report.isOconus,
      verificationStatus: report.verificationStatus,
      helpfulCount: report.helpfulCount,
      createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : null,
      updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : null,
    }
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch salary report: ${message}`,
    })
  }
})
