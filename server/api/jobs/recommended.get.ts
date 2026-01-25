/**
 * @file Recommended jobs endpoint
 * @route GET /api/jobs/recommended
 * @description Fetch recommended jobs based on user's viewed MOS history or recent jobs
 */

import { db, schema } from '@/server/utils/db'
import { getServerUser } from '@/server/utils/better-auth'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await getServerUser(event)
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 6, 20)

  try {
    let jobs: any[] = []
    let source = 'recent'

    // If user is authenticated, try to get personalized recommendations
    if (user?.id) {
      // Get user's viewed MOS codes
      const viewedMos = await db.query.viewedMos.findMany({
        where: eq(schema.viewedMos.userId, user.id),
        with: {
          mosCode: {
            columns: { code: true },
          },
        },
        orderBy: desc(schema.viewedMos.viewedAt),
        limit: 5,
      })

      const mosCodes = viewedMos
        .map(vm => vm.mosCode?.code)
        .filter(Boolean) as string[]

      if (mosCodes.length > 0) {
        // Get jobs mapped to user's viewed MOS codes
        const jobMappings = await db.query.jobMosMapping.findMany({
          where: inArray(schema.jobMosMapping.mosId, 
            db.select({ id: schema.mosCode.id })
              .from(schema.mosCode)
              .where(inArray(schema.mosCode.code, mosCodes))
          ),
          with: {
            job: {
              with: {
                companyRef: true,
              },
            },
            mosCode: true,
          },
          limit: limit * 2, // Get more to dedupe
        })

        // Dedupe jobs and add match reason
        const seenIds = new Set<string>()
        const uniqueJobs: any[] = []

        for (const mapping of jobMappings) {
          if (!mapping.job || seenIds.has(mapping.job.id)) continue
          if (mapping.job.status !== 'ACTIVE') continue
          
          seenIds.add(mapping.job.id)
          uniqueJobs.push({
            ...mapping.job,
            match_reason: `Matches your interest in ${mapping.mosCode?.code || 'your MOS'}`,
          })

          if (uniqueJobs.length >= limit) break
        }

        if (uniqueJobs.length > 0) {
          jobs = uniqueJobs
          source = 'personalized'
        }
      }
    }

    // Fallback: get recent active jobs
    if (jobs.length === 0) {
      const recentJobs = await db.query.job.findMany({
        where: eq(schema.job.status, 'ACTIVE'),
        with: {
          companyRef: true,
        },
        orderBy: desc(schema.job.postedAt),
        limit,
      })
      jobs = recentJobs
      source = 'recent'
    }

    // Transform to API response format
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.companyRef?.name || job.company,
      company_id: job.companyId,
      location: job.location,
      location_type: job.locationType,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      currency: job.currency || 'USD',
      clearance_required: job.clearanceRequired,
      snippet: job.snippet,
      posted_at: job.postedAt instanceof Date 
        ? job.postedAt.toISOString() 
        : job.postedAt,
      created_at: job.createdAt instanceof Date 
        ? job.createdAt.toISOString() 
        : job.createdAt,
      featured: job.featured,
      slug: job.slug,
      is_oconus: job.isOconus,
      match_reason: job.match_reason || null,
    }))

    return {
      jobs: transformedJobs,
      source,
    }
  } catch (error) {
    console.error('Failed to fetch recommended jobs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recommended jobs',
    })
  }
})
