import { getDb, schema } from "@/server/utils/db";
import { rankingPresets, topicPresets } from "@/server/utils/intelligence";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl || "https://military.contractors";

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/explorer", priority: "0.9", changefreq: "daily" },
    { loc: "/companies", priority: "0.9", changefreq: "daily" },
    { loc: "/compare", priority: "0.7", changefreq: "weekly" },
    { loc: "/agencies", priority: "0.8", changefreq: "daily" },
    { loc: "/for-companies", priority: "0.7", changefreq: "monthly" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/contact", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  ];

  // Dynamic contractor pages
  let contractorPages: Array<{
    loc: string;
    priority: string;
    changefreq: string;
  }> = [];
  let specialtyPages: Array<{
    loc: string;
    priority: string;
    changefreq: string;
  }> = [];
  let locationPages: Array<{
    loc: string;
    priority: string;
    changefreq: string;
  }> = [];
  const rankingPages = rankingPresets.map((preset) => ({
    loc: `/rankings/${preset.slug}`,
    priority: "0.8",
    changefreq: "daily",
  }));
  const topicPages = topicPresets.map((topic) => ({
    loc: `/topics/${topic.slug}`,
    priority: "0.7",
    changefreq: "daily",
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
    priority: "0.7",
    changefreq: "daily",
  }));
  const categoryPages = [
    "/categories/naics/541512",
    "/categories/naics/336414",
    "/categories/naics/336611",
    "/categories/psc/1410",
    "/categories/psc/5840",
    "/categories/psc/D399",
  ].map((loc) => ({
    loc,
    priority: "0.6",
    changefreq: "weekly",
  }));

  try {
    const db = getDb();

    const contractors = db
      .select({ slug: schema.contractor.slug })
      .from(schema.contractor)
      .all();

    contractorPages = contractors.map((c) => ({
      loc: `/companies/${c.slug}`,
      priority: "0.7",
      changefreq: "weekly",
    }));

    const specialties = db
      .select({ slug: schema.specialty.slug })
      .from(schema.specialty)
      .all();

    specialtyPages = specialties.map((s) => ({
      loc: `/companies/specialty/${s.slug}`,
      priority: "0.6",
      changefreq: "weekly",
    }));

    // Location pages from distinct states
    const locations = db
      .selectDistinct({ state: schema.contractorLocation.state })
      .from(schema.contractorLocation)
      .all();

    locationPages = locations
      .filter((l) => l.state)
      .map((l) => ({
        loc: `/companies/location/${l.state!.toLowerCase().replace(/\s+/g, "-")}`,
        priority: "0.6",
        changefreq: "weekly",
      }));
  } catch {
    // If DB not available, just return static pages
  }

  const allPages = [
    ...staticPages,
    ...contractorPages,
    ...specialtyPages,
    ...locationPages,
    ...agencyPages,
    ...rankingPages,
    ...topicPages,
    ...categoryPages,
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
