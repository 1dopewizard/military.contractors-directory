/**
 * @file Dynamic sitemap URL source
 * @route GET /api/__sitemap__/urls
 * @description Generates dynamic sitemap URLs for companies, jobs, and MOS codes (Drizzle-backed)
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, desc } from 'drizzle-orm'

interface SitemapUrl {
  loc: string
  lastmod?: string | null
  changefreq?: string
  priority?: number
}

export default defineEventHandler(async () => {
  const db = getDb()
  const baseUrl = 'https://military.contractors'

  try {
    const urls: SitemapUrl[] = []

    // Add companies
    const companies = await db
      .select({
        slug: schema.company.slug,
        updatedAt: schema.company.updatedAt,
      })
      .from(schema.company)
      .orderBy(desc(schema.company.updatedAt))

    for (const company of companies) {
      urls.push({
        loc: `${baseUrl}/contractors/${company.slug}`,
        lastmod: company.updatedAt?.toISOString() ?? null,
        changefreq: 'weekly',
        priority: 0.8,
      })
    }

    // Add active jobs
    const jobs = await db
      .select({
        id: schema.job.id,
        slug: schema.job.slug,
        updatedAt: schema.job.updatedAt,
      })
      .from(schema.job)
      .where(eq(schema.job.isActive, true))
      .orderBy(desc(schema.job.updatedAt))
      .limit(5000) // Limit to keep sitemap manageable

    for (const job of jobs) {
      const jobPath = job.slug || job.id
      urls.push({
        loc: `${baseUrl}/jobs/${jobPath}`,
        lastmod: job.updatedAt?.toISOString() ?? null,
        changefreq: 'daily',
        priority: 0.7,
      })
    }

    // Add MOS codes
    const mosCodes = await db
      .select({
        code: schema.mosCode.code,
        branch: schema.mosCode.branch,
        updatedAt: schema.mosCode.updatedAt,
      })
      .from(schema.mosCode)
      .orderBy(desc(schema.mosCode.updatedAt))

    for (const mos of mosCodes) {
      urls.push({
        loc: `${baseUrl}/mos/${mos.code}`,
        lastmod: mos.updatedAt?.toISOString() ?? null,
        changefreq: 'monthly',
        priority: 0.6,
      })
    }

    // Add bases
    const bases = await db
      .select({
        slug: schema.base.slug,
        updatedAt: schema.base.updatedAt,
      })
      .from(schema.base)
      .where(eq(schema.base.isActive, true))
      .orderBy(desc(schema.base.updatedAt))

    for (const base of bases) {
      urls.push({
        loc: `${baseUrl}/bases/${base.slug}`,
        lastmod: base.updatedAt?.toISOString() ?? null,
        changefreq: 'monthly',
        priority: 0.5,
      })
    }

    return urls
  } catch (error) {
    console.error('Sitemap generation error:', error)
    // Return empty array on error to not break sitemap
    return []
  }
})
