/**
 * @file GET /api/market-snapshot
 * @description Data-driven market snapshot for MOS search results (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, sql, inArray, ne, isNotNull } from 'drizzle-orm'

export interface MarketSnapshotResponse {
  stats: {
    jobCount: number
    salaryRange: { min: number; max: number } | null
    medianSalary: number | null
    locationDistribution: { CONUS: number; OCONUS: number; Remote: number }
    topCompanies: Array<{ name: string; count: number }>
    topCerts: string[]
    clearanceDistribution: Record<string, number>
  }
  mosProfile: {
    code: string
    name: string
    branch: string
    category: string | null
    civilianRoles: string[]
  } | null
  mosCode: string
  filtersApplied: Record<string, string>
}

export default defineEventHandler(async (event): Promise<MarketSnapshotResponse> => {
  const query = getQuery(event)
  const mosCode = ((query.mos_code as string) || '').toUpperCase().trim()
  const location = (query.location as string) || 'ANY'
  const clearance = (query.clearance as string) || 'ANY'

  if (!mosCode) {
    throw createError({
      statusCode: 400,
      message: 'mos_code is required',
    })
  }

  const db = getDb()

  try {
    // Get MOS profile
    const [mos] = await db
      .select()
      .from(schema.mosCode)
      .where(eq(schema.mosCode.code, mosCode))
      .limit(1)

    if (!mos) {
      throw createError({
        statusCode: 404,
        message: `MOS code ${mosCode} not found`,
      })
    }

    // Get jobs mapped to this MOS
    const jobMappings = await db
      .select({ jobId: schema.jobMosMapping.jobId })
      .from(schema.jobMosMapping)
      .where(eq(schema.jobMosMapping.mosId, mos.id))

    const jobIds = jobMappings.map(j => j.jobId)

    if (jobIds.length === 0) {
      // No jobs mapped to this MOS
      return {
        stats: {
          jobCount: 0,
          salaryRange: null,
          medianSalary: null,
          locationDistribution: { CONUS: 0, OCONUS: 0, Remote: 0 },
          topCompanies: [],
          topCerts: [],
          clearanceDistribution: {},
        },
        mosProfile: {
          code: mos.code,
          name: mos.name,
          branch: mos.branch,
          category: mos.mosCategory,
          civilianRoles: (mos.civilianRoles as string[]) || [],
        },
        mosCode,
        filtersApplied: { location, clearance },
      }
    }

    // Build job filter conditions
    const jobConditions = [
      eq(schema.job.isActive, true),
      inArray(schema.job.id, jobIds),
    ]

    if (location !== 'ANY') {
      if (location === 'OCONUS') {
        jobConditions.push(eq(schema.job.isOconus, true))
      } else if (location === 'CONUS') {
        jobConditions.push(eq(schema.job.isOconus, false))
      } else if (location === 'REMOTE') {
        jobConditions.push(eq(schema.job.locationType, 'REMOTE'))
      }
    }

    if (clearance !== 'ANY') {
      jobConditions.push(eq(schema.job.clearanceRequired, clearance))
    }

    // Get filtered jobs
    const jobs = await db
      .select()
      .from(schema.job)
      .where(and(...jobConditions))

    // Calculate stats
    const jobCount = jobs.length

    // Salary range
    const salariesMin = jobs.filter(j => j.salaryMin).map(j => j.salaryMin!)
    const salariesMax = jobs.filter(j => j.salaryMax).map(j => j.salaryMax!)
    const salaryRange = salariesMin.length > 0 && salariesMax.length > 0
      ? { min: Math.min(...salariesMin), max: Math.max(...salariesMax) }
      : null

    // Median salary (use max salary for calculation)
    const allSalaries = salariesMax.sort((a, b) => a - b)
    const medianSalary = allSalaries.length > 0
      ? allSalaries[Math.floor(allSalaries.length / 2)]
      : null

    // Location distribution
    const locationDistribution = {
      CONUS: jobs.filter(j => j.isOconus === false).length,
      OCONUS: jobs.filter(j => j.isOconus === true).length,
      Remote: jobs.filter(j => j.locationType === 'REMOTE').length,
    }

    // Top companies
    const companyCount = new Map<string, number>()
    jobs.forEach(job => {
      const company = job.company || 'Unknown'
      companyCount.set(company, (companyCount.get(company) || 0) + 1)
    })
    const topCompanies = Array.from(companyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Clearance distribution
    const clearanceDistribution: Record<string, number> = {}
    jobs.forEach(job => {
      const clearanceLevel = job.clearanceRequired || 'NONE'
      clearanceDistribution[clearanceLevel] = (clearanceDistribution[clearanceLevel] || 0) + 1
    })

    // Top certs from MOS profile
    const topCerts = (mos.recommendedCertsContract as string[]) || 
                     (mos.commonCerts as string[]) || []

    return {
      stats: {
        jobCount,
        salaryRange,
        medianSalary,
        locationDistribution,
        topCompanies,
        topCerts: topCerts.slice(0, 5),
        clearanceDistribution,
      },
      mosProfile: {
        code: mos.code,
        name: mos.name,
        branch: mos.branch,
        category: mos.mosCategory,
        civilianRoles: (mos.civilianRoles as string[]) || [],
      },
      mosCode,
      filtersApplied: { location, clearance },
    }
  } catch (error) {
    // Re-throw HTTP errors
    if ((error as { statusCode?: number })?.statusCode) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to get market snapshot: ${message}`,
    })
  }
})
