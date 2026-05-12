import { getDb, schema } from "@/server/utils/db";
import { rankingPresets } from "@/server/utils/intelligence";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl || "https://military.contractors";

  // Static pages, weighted toward the directory-first v1 surface.
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/contact", priority: "0.4", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  ];

  let contractorPages: Array<{
    loc: string;
    priority: string;
    changefreq: string;
  }> = [];

  const rankingPages = rankingPresets.map((preset) => ({
    loc: `/rankings/${preset.slug}`,
    priority: "0.4",
    changefreq: "weekly",
  }));
  const agencyPages = [
    "department-of-defense",
    "department-of-the-army",
    "department-of-the-navy",
    "department-of-the-air-force",
    "defense-logistics-agency",
    "defense-information-systems-agency",
    "defense-intelligence-agency",
  ].map((slug) => ({
    loc: `/agencies/${slug}`,
    priority: "0.4",
    changefreq: "weekly",
  }));

  try {
    const db = getDb();

    const contractors = await db
      .select({ slug: schema.contractorDirectoryGroup.slug })
      .from(schema.contractorDirectoryGroup)
      .all();

    contractorPages = contractors.map((contractor) => ({
      loc: `/${contractor.slug}`,
      priority: "0.8",
      changefreq: "daily",
    }));
  } catch {
    // If DB is not available, return static pages only.
  }

  const allPages = [
    ...staticPages,
    ...contractorPages,
    ...agencyPages,
    ...rankingPages,
  ];

  const urls = allPages
    .map(
      (page) => `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  setResponseHeader(event, "content-type", "application/xml");
  setResponseHeader(event, "cache-control", "public, max-age=3600");
  return xml;
});
