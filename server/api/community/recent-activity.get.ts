/**
 * @file Recent community activity API endpoint
 * @description Returns recent salary reports and interview experiences
 */

import { getDb, schema } from '@/server/utils/db'
import { desc, eq } from 'drizzle-orm'

export interface RecentSalaryActivity {
  type: 'salary'
  id: string
  mosCode: string
  companyName: string
  companySlug: string | null
  location: string
  baseSalary: number
  signingBonus?: number
  clearanceLevel: string
  helpfulCount: number
  createdAt: number
}

export interface RecentInterviewActivity {
  type: 'interview'
  id: string
  mosCode: string
  roleTitle: string
  companyName: string
  companySlug: string | null
  outcome: string
  difficulty: string
  timelineWeeks: number
  helpfulCount: number
  createdAt: number
}

export type RecentActivity = RecentSalaryActivity | RecentInterviewActivity

export default defineEventHandler(async (event): Promise<RecentActivity[]> => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 20)

  const db = getDb()

  try {
    // Fetch recent salary reports with company info
    const recentSalaries = await db
      .select({
        id: schema.salaryReport.id,
        mosCode: schema.salaryReport.mosCode,
        companyName: schema.company.name,
        companySlug: schema.company.slug,
        location: schema.salaryReport.location,
        baseSalary: schema.salaryReport.baseSalary,
        signingBonus: schema.salaryReport.signingBonus,
        clearanceLevel: schema.salaryReport.clearanceLevel,
        helpfulCount: schema.salaryReport.helpfulCount,
        createdAt: schema.salaryReport.createdAt,
      })
      .from(schema.salaryReport)
      .leftJoin(schema.company, eq(schema.salaryReport.companyId, schema.company.id))
      .orderBy(desc(schema.salaryReport.createdAt))
      .limit(limit)

    // Fetch recent interview experiences with company info
    const recentInterviews = await db
      .select({
        id: schema.interviewExperience.id,
        mosCode: schema.interviewExperience.mosCode,
        roleTitle: schema.interviewExperience.roleTitle,
        companyName: schema.company.name,
        companySlug: schema.company.slug,
        outcome: schema.interviewExperience.outcome,
        difficulty: schema.interviewExperience.difficulty,
        timelineWeeks: schema.interviewExperience.timelineWeeks,
        helpfulCount: schema.interviewExperience.helpfulCount,
        createdAt: schema.interviewExperience.createdAt,
      })
      .from(schema.interviewExperience)
      .leftJoin(schema.company, eq(schema.interviewExperience.companyId, schema.company.id))
      .orderBy(desc(schema.interviewExperience.createdAt))
      .limit(limit)

    // Combine and sort by date
    const combined: RecentActivity[] = [
      ...recentSalaries.map((s): RecentSalaryActivity => ({
        type: 'salary',
        id: s.id,
        mosCode: s.mosCode,
        companyName: s.companyName || 'Unknown Company',
        companySlug: s.companySlug || null,
        location: s.location,
        baseSalary: s.baseSalary,
        signingBonus: s.signingBonus ?? undefined,
        clearanceLevel: s.clearanceLevel,
        helpfulCount: s.helpfulCount,
        createdAt: s.createdAt ? s.createdAt.getTime() : Date.now(),
      })),
      ...recentInterviews.map((i): RecentInterviewActivity => ({
        type: 'interview',
        id: i.id,
        mosCode: i.mosCode,
        roleTitle: i.roleTitle,
        companyName: i.companyName || 'Unknown Company',
        companySlug: i.companySlug || null,
        outcome: i.outcome,
        difficulty: i.difficulty,
        timelineWeeks: i.timelineWeeks,
        helpfulCount: i.helpfulCount,
        createdAt: i.createdAt ? i.createdAt.getTime() : Date.now(),
      })),
    ]

    // Sort by date descending and limit
    combined.sort((a, b) => b.createdAt - a.createdAt)
    return combined.slice(0, limit)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch recent activity: ${message}`,
    })
  }
})
