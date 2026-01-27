/**
 * @file Dynamic sitemap URL source
 * @route GET /api/__sitemap__/urls
 * @description Generates dynamic sitemap URLs for contractors, specialties, and static pages
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

    // Add contractors
    const contractors = await db
      .select({
        slug: schema.contractor.slug,
        updatedAt: schema.contractor.updatedAt,
      })
      .from(schema.contractor)
      .orderBy(desc(schema.contractor.updatedAt))

    for (const contractor of contractors) {
      urls.push({
        loc: `${baseUrl}/contractors/${contractor.slug}`,
        lastmod: contractor.updatedAt?.toISOString() ?? null,
        changefreq: 'weekly',
        priority: 0.8,
      })
    }

    // Add specialties
    const specialties = await db
      .select({
        slug: schema.specialty.slug,
        updatedAt: schema.specialty.updatedAt,
      })
      .from(schema.specialty)
      .orderBy(desc(schema.specialty.updatedAt))

    for (const specialty of specialties) {
      urls.push({
        loc: `${baseUrl}/contractors/specialty/${specialty.slug}`,
        lastmod: specialty.updatedAt?.toISOString() ?? null,
        changefreq: 'monthly',
        priority: 0.7,
      })
    }

    // Add static SEO pages
    urls.push({
      loc: `${baseUrl}/for-companies`,
      changefreq: 'monthly',
      priority: 0.6,
    })

    // Add bases (if they exist)
    try {
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
    } catch {
      // Bases table may not exist, skip
    }

    return urls
  } catch (error) {
    console.error('Sitemap generation error:', error)
    // Return empty array on error to not break sitemap
    return []
  }
})
