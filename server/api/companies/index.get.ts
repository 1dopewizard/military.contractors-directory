/**
 * @file Companies list API endpoint
 * @route GET /api/companies
 * @description Returns companies with job counts, sorted by job count descending
 *
 * Query params:
 * - limit: number of companies to return (default: 50)
 * - sort: 'jobs' | 'name' (default: 'jobs')
 */

import { getDb, schema } from '@/server/utils/db'
import { desc, asc, sql } from 'drizzle-orm'

interface CompanyWithStats {
  id: string
  name: string
  slug: string
  summary: string | null
  domains: string[]
  theaters: string[]
  stats: {
    totalJobs: number
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const sort = query.sort === 'name' ? 'name' : 'jobs'

  const db = getDb()

  try {
    // Get companies with job counts using a subquery
    const companies = await db
      .select({
        id: schema.company.id,
        name: schema.company.name,
        slug: schema.company.slug,
        summary: schema.company.summary,
        domains: schema.company.domains,
        theaters: schema.company.theaters,
        jobCount: sql<number>`(
          SELECT COUNT(*) FROM ${schema.job} 
          WHERE ${schema.job.companyId} = ${schema.company.id}
          AND ${schema.job.isActive} = 1
          AND ${schema.job.status} = 'ACTIVE'
        )`.as('job_count'),
      })
      .from(schema.company)
      .orderBy(
        sort === 'name' 
          ? asc(schema.company.name)
          : desc(sql`job_count`)
      )
      .limit(limit)

    // Transform to match expected response format
    const withStats: CompanyWithStats[] = companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      summary: c.summary,
      domains: c.domains ?? [],
      theaters: c.theaters ?? [],
      stats: {
        totalJobs: c.jobCount ?? 0,
      },
    }))

    return withStats
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch companies: ${message}`,
    })
  }
})
