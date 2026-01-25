/**
 * @file Salary reports list API endpoint
 * @description Returns paginated salary reports with filters
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, desc, asc, count, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0
  const companyId = query.companyId as string | undefined
  const mosCode = query.mosCode as string | undefined
  const location = query.location as string | undefined
  const clearanceLevel = query.clearanceLevel as string | undefined
  const sort = (query.sort as string) || 'recent'

  const db = getDb()

  try {
    const whereConditions = []

    if (companyId) {
      whereConditions.push(eq(schema.salaryReport.companyId, companyId))
    }
    if (mosCode) {
      whereConditions.push(eq(schema.salaryReport.mosCode, mosCode.toUpperCase()))
    }
    if (location) {
      whereConditions.push(eq(schema.salaryReport.location, location))
    }
    if (clearanceLevel) {
      whereConditions.push(eq(schema.salaryReport.clearanceLevel, clearanceLevel))
    }

    // Only show verified reports by default
    whereConditions.push(eq(schema.salaryReport.verificationStatus, 'VERIFIED'))

    const orderBy = sort === 'salary' 
      ? desc(schema.salaryReport.baseSalary)
      : sort === 'helpful'
        ? desc(schema.salaryReport.helpfulCount)
        : desc(schema.salaryReport.createdAt)

    const reports = await db
      .select({
        id: schema.salaryReport.id,
        mosCode: schema.salaryReport.mosCode,
        companyId: schema.salaryReport.companyId,
        companyName: schema.company.name,
        location: schema.salaryReport.location,
        baseSalary: schema.salaryReport.baseSalary,
        signingBonus: schema.salaryReport.signingBonus,
        clearanceLevel: schema.salaryReport.clearanceLevel,
        yearsExperience: schema.salaryReport.yearsExperience,
        employmentType: schema.salaryReport.employmentType,
        isOconus: schema.salaryReport.isOconus,
        helpfulCount: schema.salaryReport.helpfulCount,
        createdAt: schema.salaryReport.createdAt,
      })
      .from(schema.salaryReport)
      .leftJoin(schema.company, eq(schema.salaryReport.companyId, schema.company.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(schema.salaryReport)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    // Calculate aggregates
    const aggregatesResult = await db
      .select({
        avgSalary: sql<number>`AVG(${schema.salaryReport.baseSalary})`,
        minSalary: sql<number>`MIN(${schema.salaryReport.baseSalary})`,
        maxSalary: sql<number>`MAX(${schema.salaryReport.baseSalary})`,
        reportCount: count(),
      })
      .from(schema.salaryReport)
      .where(and(...whereConditions))

    const agg = aggregatesResult[0]

    // Calculate clearance breakdown
    const clearanceBreakdownResult = await db
      .select({
        clearanceLevel: schema.salaryReport.clearanceLevel,
        count: count(),
      })
      .from(schema.salaryReport)
      .where(and(...whereConditions))
      .groupBy(schema.salaryReport.clearanceLevel)

    const clearanceBreakdown: Record<string, number> = {}
    for (const row of clearanceBreakdownResult) {
      if (row.clearanceLevel) {
        clearanceBreakdown[row.clearanceLevel] = row.count
      }
    }

    // Calculate experience ranges
    const experienceRangesResult = await db
      .select({
        range: sql<string>`CASE 
          WHEN ${schema.salaryReport.yearsExperience} <= 2 THEN '0-2'
          WHEN ${schema.salaryReport.yearsExperience} <= 5 THEN '3-5'
          WHEN ${schema.salaryReport.yearsExperience} <= 10 THEN '6-10'
          ELSE '10+'
        END`,
        count: count(),
      })
      .from(schema.salaryReport)
      .where(and(...whereConditions))
      .groupBy(sql`CASE 
        WHEN ${schema.salaryReport.yearsExperience} <= 2 THEN '0-2'
        WHEN ${schema.salaryReport.yearsExperience} <= 5 THEN '3-5'
        WHEN ${schema.salaryReport.yearsExperience} <= 10 THEN '6-10'
        ELSE '10+'
      END`)

    const experienceRanges = {
      '0-2': 0,
      '3-5': 0,
      '6-10': 0,
      '10+': 0,
    }
    for (const row of experienceRangesResult) {
      if (row.range && row.range in experienceRanges) {
        experienceRanges[row.range as keyof typeof experienceRanges] = row.count
      }
    }

    // Build SalaryAggregates structure matching the type definition
    const aggregates = agg ? {
      reportCount: agg.reportCount || 0,
      salary: {
        average: Math.round(agg.avgSalary || 0),
        median: Math.round(agg.avgSalary || 0), // Using avg as approximation
        min: agg.minSalary || 0,
        max: agg.maxSalary || 0,
      },
      signingBonus: null, // TODO: Calculate if needed
      clearanceBreakdown,
      experienceRanges,
    } : null

    return {
      reports: reports.map((r) => ({
        _id: r.id,
        id: r.id,
        mosCode: r.mosCode,
        companyId: r.companyId,
        companyName: r.companyName || 'Unknown Company',
        companySlug: null,
        location: r.location,
        baseSalary: r.baseSalary,
        signingBonus: r.signingBonus,
        clearanceLevel: r.clearanceLevel,
        yearsExperience: r.yearsExperience,
        employmentType: r.employmentType,
        isOconus: r.isOconus,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
        updatedAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
        verificationStatus: 'VERIFIED',
      })),
      total,
      aggregates,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch salary reports: ${message}`,
    })
  }
})
