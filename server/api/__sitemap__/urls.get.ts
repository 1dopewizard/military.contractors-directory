/**
 * @file Dynamic sitemap URL source
 * @route GET /api/__sitemap__/urls
 * @description Generates dynamic sitemap URLs for canonical contractor directory pages
 */

import { getDb, schema } from "@/server/utils/db";
import { rankingPresets } from "@/server/utils/intelligence";
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
    const urls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/`,
        changefreq: "daily",
        priority: 1,
      },
    ];

    // Add canonical grouped contractor profiles. Alias slugs are intentionally
    // omitted so search engines consolidate on one profile URL per contractor.
    const contractors = await db
      .select({
        slug: schema.contractorDirectoryGroup.slug,
        updatedAt: schema.contractorDirectoryGroup.updatedAt,
      })
      .from(schema.contractorDirectoryGroup)
      .orderBy(desc(schema.contractorDirectoryGroup.updatedAt));

    for (const contractor of contractors) {
      urls.push({
        loc: `${baseUrl}/${contractor.slug}`,
        lastmod: contractor.updatedAt?.toISOString() ?? null,
        changefreq: "daily",
        priority: 0.8,
      });
    }

    for (const preset of rankingPresets) {
      urls.push({
        loc: `${baseUrl}/rankings/${preset.slug}`,
        changefreq: "weekly",
        priority: 0.4,
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
        changefreq: "weekly",
        priority: 0.4,
      });
    }

    return urls;
  } catch {
    return [];
  }
});
