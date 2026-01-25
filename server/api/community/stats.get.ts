/**
 * @file Community stats API endpoint
 * @description Returns aggregate community statistics
 */

import { getDb, schema } from '@/server/utils/db'
import { count, eq, sql } from 'drizzle-orm'

export interface CommunityStatsResponse {
  totalSalaryReports: number
  totalInterviewExperiences: number
  totalContributors: number
  totalHelpfulVotes: number
  verifiedSalaryReports: number
  verifiedInterviewExperiences: number
}

export default defineEventHandler(async (): Promise<CommunityStatsResponse> => {
  const db = getDb()

  try {
    // Get salary report counts
    const [totalSalaryResult, verifiedSalaryResult] = await Promise.all([
      db.select({ count: count() }).from(schema.salaryReport),
      db.select({ count: count() }).from(schema.salaryReport).where(eq(schema.salaryReport.verificationStatus, 'VERIFIED')),
    ])

    // Get interview experience counts
    const [totalInterviewResult, verifiedInterviewResult] = await Promise.all([
      db.select({ count: count() }).from(schema.interviewExperience),
      db.select({ count: count() }).from(schema.interviewExperience).where(eq(schema.interviewExperience.verificationStatus, 'VERIFIED')),
    ])

    // Get helpful votes count
    const helpfulVotesResult = await db.select({ count: count() }).from(schema.helpfulVote)

    // Get unique contributors (users who have submitted at least one report)
    const contributorsResult = await db
      .select({ count: sql<number>`count(DISTINCT submittedBy)` })
      .from(schema.salaryReport)
      .where(sql`${schema.salaryReport.submittedBy} IS NOT NULL`)

    return {
      totalSalaryReports: totalSalaryResult[0]?.count || 0,
      totalInterviewExperiences: totalInterviewResult[0]?.count || 0,
      totalContributors: contributorsResult[0]?.count || 0,
      totalHelpfulVotes: helpfulVotesResult[0]?.count || 0,
      verifiedSalaryReports: verifiedSalaryResult[0]?.count || 0,
      verifiedInterviewExperiences: verifiedInterviewResult[0]?.count || 0,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch community stats: ${message}`,
    })
  }
})
