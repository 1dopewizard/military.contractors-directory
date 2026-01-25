/**
 * @file Admin placements list endpoint
 * @route GET /api/admin/placements
 * @description List all placements with candidate and job info (admin or recruiter) (Drizzle-backed)
 */

import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const query = getQuery(event)
  const status = query.status as string | undefined

  const db = getDb()

  try {
    // Build query with optional status filter
    let placementsQuery = db
      .select({
        placement: schema.placement,
        job: schema.job,
      })
      .from(schema.placement)
      .leftJoin(schema.job, eq(schema.job.id, schema.placement.jobId))
      .orderBy(desc(schema.placement.createdAt))

    if (status) {
      placementsQuery = placementsQuery.where(eq(schema.placement.status, status)) as typeof placementsQuery
    }

    const results = await placementsQuery

    // Transform to expected format
    const placements = results.map(({ placement, job }) => ({
      id: placement.id,
      candidate_email: placement.candidateEmail,
      job_id: placement.jobId,
      job_title: job?.title ?? null,
      company: job?.company ?? null,
      status: placement.status,
      notes: placement.notes,
      created_at: placement.createdAt?.toISOString() ?? null,
      updated_at: placement.updatedAt?.toISOString() ?? null,
    }))

    return {
      placements
    }
  } catch (error) {
    console.error('Failed to fetch placements:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch placements'
    })
  }
})
