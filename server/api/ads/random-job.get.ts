/**
 * @file Random sponsored job API endpoint
 * @description Returns a random active sponsored job with optional contextual matching
 */

import { db, schema } from '@/server/utils/db'
import { eq, and, lte, gte, sql, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const mosCode = query.mosCode as string | undefined
  const locationType = query.locationType as string | undefined
  const clearance = query.clearance as string | undefined

  try {
    const now = Date.now()

    // Build where conditions
    const whereConditions = [
      eq(schema.sponsoredJob.status, 'active'),
      lte(schema.sponsoredJob.startsAt, now),
      gte(schema.sponsoredJob.endsAt, now),
    ]

    // Try contextual matching first if context provided
    if (mosCode || locationType || clearance) {
      const contextConditions = [...whereConditions]
      
      if (mosCode) {
        // Check if MOS code is in matchedMosCodes array
        contextConditions.push(
          sql`EXISTS (SELECT 1 FROM json_each(${schema.sponsoredJob.matchedMosCodes}) WHERE json_each.value = ${mosCode})`
        )
      }
      if (locationType) {
        contextConditions.push(eq(schema.sponsoredJob.locationType, locationType))
      }
      if (clearance) {
        contextConditions.push(eq(schema.sponsoredJob.clearance, clearance))
      }

      const contextualJobs = await db
        .select()
        .from(schema.sponsoredJob)
        .where(and(...contextConditions))
        .orderBy(sql`RANDOM()`)
        .limit(1)

      if (contextualJobs.length > 0) {
        const job = contextualJobs[0]
        return formatJob(job)
      }
    }

    // Fallback to any active job
    const jobs = await db
      .select()
      .from(schema.sponsoredJob)
      .where(and(...whereConditions))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    if (jobs.length === 0) {
      return null
    }

    return formatJob(jobs[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch random job: ${message}`,
    })
  }
})

function formatJob(job: typeof schema.sponsoredJob.$inferSelect) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    locationType: job.locationType,
    clearance: job.clearance,
    sponsorCategory: job.sponsorCategory,
    salary: job.salary,
    pitch: job.pitch,
    applyUrl: job.applyUrl,
    status: job.status,
    startsAt: job.startsAt ? new Date(job.startsAt).toISOString() : null,
    endsAt: job.endsAt ? new Date(job.endsAt).toISOString() : null,
    impressions: job.impressions || 0,
    clicks: job.clicks || 0,
    matchedMosCodes: job.matchedMosCodes || [],
    priority: job.priority,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  }
}
