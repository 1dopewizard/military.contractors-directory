/**
 * @file GET /api/stats/homepage
 * @description Returns aggregate stats for homepage social proof display
 */

import { getDb, schema } from '@/server/utils/db'
import { sql } from 'drizzle-orm'

export interface HomepageStatsResponse {
  contractors: number
}

export default defineEventHandler(async (): Promise<HomepageStatsResponse> => {
  const db = getDb()

  try {
    // Count contractors
    const [contractorsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contractor)

    return {
      contractors: contractorsResult?.count ?? 0,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch stats: ${message}`,
    })
  }
})
