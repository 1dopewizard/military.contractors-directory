/**
 * @file Dynamic sitemap URL source
 * @route GET /api/__sitemap__/urls
 * @description Generates dynamic sitemap URLs for contractor intelligence pages
 */

import { getDb, schema } from "@/server/utils/db";
import { rankingPresets, topicPresets } from "@/server/utils/intelligence";
import { desc } from "drizzle-orm";

interface SitemapUrl {
  loc: string;
  lastmod?: string | null;
  changefreq?: string;
  priority?: number;
}

export default defineEventHandler(async () => {
  const db = getDb();
  const baseUrl = "https://military.contractors";

  try {
    const urls: SitemapUrl[] = [];

    // Add contractors
    const contractors = await db
      .select({
        slug: schema.contractor.slug,
        updatedAt: schema.contractor.updatedAt,
      })
      .from(schema.contractor)
      .orderBy(desc(schema.contractor.updatedAt));

    for (const contractor of contractors) {
      urls.push({
        loc: `${baseUrl}/companies/${contractor.slug}`,
        lastmod: contractor.updatedAt?.toISOString() ?? null,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // Add specialties
    const specialties = await db
      .select({
        slug: schema.specialty.slug,
        updatedAt: schema.specialty.updatedAt,
      })
      .from(schema.specialty)
      .orderBy(desc(schema.specialty.updatedAt));

    for (const specialty of specialties) {
      urls.push({
        loc: `${baseUrl}/companies/specialty/${specialty.slug}`,
        lastmod: specialty.updatedAt?.toISOString() ?? null,
        changefreq: "monthly",
        priority: 0.7,
      });
    }

    for (const preset of rankingPresets) {
      urls.push({
        loc: `${baseUrl}/rankings/${preset.slug}`,
        changefreq: "daily",
        priority: 0.8,
      });
    }

    for (const topic of topicPresets) {
      urls.push({
        loc: `${baseUrl}/topics/${topic.slug}`,
        changefreq: "daily",
        priority: 0.7,
      });
    }

    for (const agencySlug of [
      "department-of-defense",
      "department-of-the-army",
      "department-of-the-navy",
      "department-of-the-air-force",
      "defense-logistics-agency",
      "defense-information-systems-agency",
      "defense-intelligence-agency",
    ]) {
      urls.push({
        loc: `${baseUrl}/agencies/${agencySlug}`,
        changefreq: "daily",
        priority: 0.7,
      });
    }

    for (const categoryPath of [
      "/categories/naics/541512",
      "/categories/naics/336414",
      "/categories/naics/336611",
      "/categories/psc/1410",
      "/categories/psc/5840",
      "/categories/psc/D399",
    ]) {
      urls.push({
        loc: `${baseUrl}${categoryPath}`,
        changefreq: "weekly",
        priority: 0.6,
      });
    }

    // Add static SEO pages
    urls.push({
      loc: `${baseUrl}/for-companies`,
      changefreq: "monthly",
      priority: 0.6,
    });

    return urls;
  } catch {
    return [];
  }
});
