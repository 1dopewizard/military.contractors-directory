/**
 * @file GET /api/stats/homepage
 * @description Returns aggregate stats for homepage social proof display
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'

export interface HomepageStatsResponse {
  activeJobs: number
  companies: number
}

export default defineEventHandler(async (): Promise<HomepageStatsResponse> => {
  const db = getDb()

  try {
    // Count active jobs
    const [jobsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.job)
      .where(
        and(
          eq(schema.job.isActive, true),
          eq(schema.job.status, 'ACTIVE')
        )
      )

    // Count companies
    const [companiesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.company)

    return {
      activeJobs: jobsResult?.count ?? 0,
      companies: companiesResult?.count ?? 0,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch stats: ${message}`,
    })
  }
})
