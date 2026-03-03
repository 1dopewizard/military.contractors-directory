import { getDb, schema } from "@/server/utils/db";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl =
    config.public.siteUrl || "https://military.contractors";

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/companies", priority: "0.9", changefreq: "daily" },
    { loc: "/insights", priority: "0.9", changefreq: "daily" },
    { loc: "/for-companies", priority: "0.7", changefreq: "monthly" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/contact", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  ];

  // Insights pages
  const insightsPages = [
    { loc: "/insights/defense-hiring-surge-2026", priority: "0.8", changefreq: "weekly" },
    { loc: "/insights/contractors-hiring-now", priority: "0.8", changefreq: "weekly" },
    { loc: "/insights/mos-demand-middle-east", priority: "0.8", changefreq: "weekly" },
    { loc: "/insights/contractor-pay-tax-guide", priority: "0.8", changefreq: "weekly" },
  ];

  // Dynamic contractor pages
  let contractorPages: Array<{ loc: string; priority: string; changefreq: string }> = [];
  let specialtyPages: Array<{ loc: string; priority: string; changefreq: string }> = [];
  let locationPages: Array<{ loc: string; priority: string; changefreq: string }> = [];

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
    ...insightsPages,
    ...contractorPages,
    ...specialtyPages,
    ...locationPages,
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
