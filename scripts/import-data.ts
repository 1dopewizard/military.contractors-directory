/**
 * @file Import JSON exports to libSQL
 * @description Migrates data from JSON exports to the new libSQL database
 *
 * Usage: cd apps/contractors && npx tsx scripts/import-data.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Import all schema tables
import * as schema from "./server/database/schema";

// Debug: check what's exported
console.log("Schema keys:", Object.keys(schema));
console.log("Theater defined:", !!schema.theater);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const DATA_DIR = path.resolve(__dirname, "./scripts/migration/data");
const DB_PATH = path.resolve(__dirname, "./server/database/app.db");

console.log("Config:");
console.log(`  DATA_DIR: ${DATA_DIR}`);
console.log(`  DB_PATH: ${DB_PATH}`);

const client = createClient({ url: `file:${DB_PATH}` });
const db = drizzle(client, { schema });

// ============================================================
// Helper Functions
// ============================================================

function readJsonFile<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️  File not found: ${filename}`);
    return [];
  }
  const data = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(data) as T[];
}

function parseTimestamp(
  value: string | number | null | undefined,
): Date | null {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

function generateId(): string {
  return crypto.randomUUID();
}

// ID mapping for foreign key resolution
const idMaps = {
  companies: new Map<string, string>(),
  jobs: new Map<string, string>(),
  mosCodes: new Map<string, string>(),
  bases: new Map<string, string>(),
  theaters: new Map<string, string>(),
  campaigns: new Map<string, string>(),
};

// ============================================================
// Import Functions
// ============================================================

async function importTheaters() {
  console.log("\n📍 Importing theaters...");
  const data = readJsonFile<Record<string, unknown>>("theaters.json");

  if (data.length === 0) {
    // Create default theaters if no data
    const defaultTheaters = [
      { code: "CENTCOM", name: "US Central Command", region: "Middle East" },
      { code: "EUCOM", name: "US European Command", region: "Europe" },
      {
        code: "INDOPACOM",
        name: "US Indo-Pacific Command",
        region: "Asia-Pacific",
      },
      { code: "AFRICOM", name: "US Africa Command", region: "Africa" },
      {
        code: "NORTHCOM",
        name: "US Northern Command",
        region: "North America",
      },
      {
        code: "SOUTHCOM",
        name: "US Southern Command",
        region: "South America",
      },
    ];

    for (const t of defaultTheaters) {
      const id = generateId();
      await db.insert(schema.theater).values({
        id,
        code: t.code,
        name: t.name,
        region: t.region,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      idMaps.theaters.set(t.code, id);
    }
    console.log(`  ✅ Created ${defaultTheaters.length} default theaters`);
    return;
  }

  let count = 0;
  for (const row of data) {
    const id = generateId();
    const oldId = (row.id as string) || (row.code as string);

    await db.insert(schema.theater).values({
      id,
      code: row.code as string,
      name: row.name as string,
      description: row.description as string | undefined,
      region: row.region as string | undefined,
      countries: row.countries as string[] | undefined,
      majorBases: row.major_bases as string[] | undefined,
      jobCount: row.job_count as number | undefined,
      avgSalaryMin: row.avg_salary_min as number | undefined,
      avgSalaryMax: row.avg_salary_max as number | undefined,
      isActive: row.is_active !== false,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.theaters.set(oldId, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} theaters`);
}

async function importBases() {
  console.log("\n🏛️ Importing bases...");
  const data = readJsonFile<Record<string, unknown>>("bases.json");

  let count = 0;
  for (const row of data) {
    const id = generateId();
    const oldId = row.id as string;

    const coords = row.coordinates as
      | { lat?: number; lng?: number }
      | undefined;

    await db.insert(schema.base).values({
      id,
      slug: row.slug as string,
      name: row.name as string,
      theaterCode: row.theater_code as string | undefined,
      country: row.country as string,
      city: row.city as string | undefined,
      description: row.description as string | undefined,
      jobCount: row.job_count as number | undefined,
      coordinatesLat: coords?.lat,
      coordinatesLng: coords?.lng,
      isActive: row.is_active !== false,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.bases.set(oldId, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} bases`);
}

async function importCompanies() {
  console.log("\n🏢 Importing companies...");
  const data = readJsonFile<Record<string, unknown>>("companies.json");

  let count = 0;
  for (const row of data) {
    const id = generateId();
    const oldId = row.id as string;

    await db.insert(schema.company).values({
      id,
      slug: row.slug as string,
      name: row.name as string,
      summary: row.summary as string,
      description: row.description as string | undefined,
      logoUrl: row.logo_url as string | undefined,
      websiteUrl: row.website_url as string | undefined,
      careersUrl: row.careers_url as string | undefined,
      headquarters: row.headquarters as string | undefined,
      employeeCount: row.employee_count as string | undefined,
      foundedYear: row.founded_year as number | undefined,
      stockSymbol: row.stock_symbol as string | undefined,
      domains: row.domains as string[] | undefined,
      theaters: row.theaters as string[] | undefined,
      isPrimeContractor: Boolean(row.is_prime_contractor),
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.companies.set(oldId, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} companies`);
}

async function importMosCodes() {
  console.log("\n🎖️ Importing MOS codes...");

  // Try unified mos_codes.json first
  let data = readJsonFile<Record<string, unknown>>("mos_codes.json");

  if (data.length === 0) {
    // Fallback to branch-specific files
    const branches = ["army", "navy", "airforce", "coastguard", "spaceforce"];
    for (const branch of branches) {
      const branchData = readJsonFile<Record<string, unknown>>(
        `mos_codes_${branch}.json`,
      );
      data.push(...branchData);
    }
  }

  let count = 0;
  for (const row of data) {
    const id = generateId();
    const oldId = (row.id as string) || `${row.branch}-${row.code}`;

    await db.insert(schema.mosCode).values({
      id,
      branch: row.branch as string,
      code: row.code as string,
      name: row.name as string,
      rank: row.rank as string,
      description: row.description as string | undefined,
      sourceUrl: (row.source_url as string) || "unknown",
      mosCategory: row.mos_category as string | undefined,
      summarizedDescription: row.summarized_description as string | undefined,
      source: row.source as string | undefined,
      coreSkills: row.core_skills as string[] | undefined,
      toolsPlatforms: row.tools_platforms as string[] | undefined,
      missionDomains: row.mission_domains as string[] | undefined,
      environments: row.environments as string[] | undefined,
      civilianRoles: row.civilian_roles as string[] | undefined,
      roleFamilies: row.role_families as string[] | undefined,
      companyArchetypes: row.company_archetypes as string[] | undefined,
      clearanceProfile: row.clearance_profile as
        | Record<string, unknown>
        | undefined,
      deploymentProfile: row.deployment_profile as
        | Record<string, unknown>
        | undefined,
      seniorityDistribution: row.seniority_distribution as
        | Record<string, unknown>
        | undefined,
      payBandHint: row.pay_band_hint as string | undefined,
      commonCerts: row.common_certs as string[] | undefined,
      recommendedCertsContract: row.recommended_certs_contract as
        | string[]
        | undefined,
      trainingPaths: row.training_paths as string[] | undefined,
      jobCountTotal: row.job_count_total as number | undefined,
      jobCountOconus: row.job_count_oconus as number | undefined,
      jobCountConus: row.job_count_conus as number | undefined,
      enrichmentVersion: row.enrichment_version as number | undefined,
      lastEnrichedAt: parseTimestamp(row.last_enriched_at as string),
      embedding: row.embedding as number[] | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.mosCodes.set(oldId, id);
    idMaps.mosCodes.set(`${row.branch}-${row.code}`, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} MOS codes`);
}

async function importJobs() {
  console.log("\n💼 Importing jobs...");
  const data = readJsonFile<Record<string, unknown>>("jobs.json");

  let count = 0;
  for (const row of data) {
    const id = generateId();
    const oldId = row.id as string;

    const oldCompanyId = row.company_id as string | undefined;
    const companyId = oldCompanyId
      ? idMaps.companies.get(oldCompanyId)
      : undefined;

    await db.insert(schema.job).values({
      id,
      title: row.title as string,
      company: row.company as string,
      companyId,
      location: row.location as string,
      locationType: row.location_type as string | undefined,
      salaryMin: row.salary_min as number | undefined,
      salaryMax: row.salary_max as number | undefined,
      currency: row.currency as string | undefined,
      description: row.description as string,
      snippet: row.snippet as string | undefined,
      requirements: row.requirements as string[] | undefined,
      clearanceRequired: row.clearance_required as string | undefined,
      featured: Boolean(row.featured),
      postedAt: parseTimestamp(row.posted_at as string),
      expiresAt: parseTimestamp(row.expires_at as string),
      status: row.status as string | undefined,
      sponsorCategory: row.sponsor_category as string | undefined,
      isOconus: Boolean(row.is_oconus),
      isActive: row.is_active !== false,
      theater: row.theater as string | undefined,
      sourceSite: row.source_site as string | undefined,
      externalId: row.external_id as string | undefined,
      slug: row.slug as string | undefined,
      seniority: row.seniority as string | undefined,
      employmentType: row.employment_type as string | undefined,
      sourceType: row.source_type as string | undefined,
      priority: row.priority as number | undefined,
      featuredImpressions: row.featured_impressions as number | undefined,
      locationData: row.location_data as Record<string, unknown> | undefined,
      clearanceData: row.clearance_data as Record<string, unknown> | undefined,
      compensationData: row.compensation_data as
        | Record<string, unknown>
        | undefined,
      qualificationsData: row.qualifications_data as
        | Record<string, unknown>
        | undefined,
      contractData: row.contract_data as Record<string, unknown> | undefined,
      responsibilitiesData: row.responsibilities_data as string[] | undefined,
      toolsTech: row.tools_tech as string[] | undefined,
      complianceData: row.compliance_data as
        | Record<string, unknown>
        | undefined,
      postingData: row.posting_data as Record<string, unknown> | undefined,
      militaryMapping: row.military_mapping as
        | Record<string, unknown>
        | undefined,
      domainTags: row.domain_tags as string[] | undefined,
      sourceData: row.source_data as Record<string, unknown> | undefined,
      employerData: row.employer_data as Record<string, unknown> | undefined,
      approvalDecision: row.approval_decision as string | undefined,
      approvalConfidence: row.approval_confidence as number | undefined,
      approvalReasoning: row.approval_reasoning as string | undefined,
      approvalFlags: row.approval_flags as string[] | undefined,
      embedding: row.embedding as number[] | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.jobs.set(oldId, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} jobs`);
}

async function importCompanyMos() {
  console.log("\n🔗 Importing company-MOS mappings...");
  const data = readJsonFile<Record<string, unknown>>("company_mos.json");

  let count = 0;
  let skipped = 0;

  // Process in batches for large datasets
  const batchSize = 500;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const row of batch) {
      const oldCompanyId = row.company_id as string;
      const oldMosId = row.mos_id as string;

      const companyId = idMaps.companies.get(oldCompanyId);
      const mosId = idMaps.mosCodes.get(oldMosId);

      if (!companyId || !mosId) {
        skipped++;
        continue;
      }

      await db.insert(schema.companyMos).values({
        id: generateId(),
        companyId,
        mosId,
        jobCount: row.job_count as number | undefined,
        matchScore: row.match_score as number | undefined,
        strength: row.strength as string | undefined,
        typicalRoles: row.typical_roles as string[] | undefined,
        typicalClearance: row.typical_clearance as string | undefined,
        source: row.source as string | undefined,
        confidence: row.confidence as string | undefined,
        createdAt: parseTimestamp(row.created_at as string) || new Date(),
        updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
      });
      count++;
    }

    if (i % 5000 === 0 && i > 0) {
      console.log(`  ... processed ${i}/${data.length}`);
    }
  }
  console.log(
    `  ✅ Imported ${count} company-MOS mappings (skipped ${skipped})`,
  );
}

async function importJobMosMappings() {
  console.log("\n🔗 Importing job-MOS mappings...");
  const data = readJsonFile<Record<string, unknown>>("job_mos_mappings.json");

  let count = 0;
  let skipped = 0;

  for (const row of data) {
    const oldJobId = row.job_id as string;
    const oldMosId = row.mos_id as string;

    const jobId = idMaps.jobs.get(oldJobId);
    const mosId = idMaps.mosCodes.get(oldMosId);

    if (!jobId || !mosId) {
      skipped++;
      continue;
    }

    await db.insert(schema.jobMosMapping).values({
      id: generateId(),
      jobId,
      mosId,
      matchScore: row.match_score as number | undefined,
      mappingSource: row.mapping_source as string | undefined,
      explanation: row.explanation as string | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
    });
    count++;
  }
  console.log(`  ✅ Imported ${count} job-MOS mappings (skipped ${skipped})`);
}

async function importCampaigns() {
  console.log("\n📢 Importing campaigns...");
  const data = readJsonFile<Record<string, unknown>>("campaigns.json");

  let count = 0;
  let skipped = 0;
  for (const row of data) {
    // Skip rows missing required fields
    if (!row.name || !row.type || !row.status) {
      skipped++;
      continue;
    }

    const id = generateId();
    const oldId = row.id as string;

    await db.insert(schema.campaign).values({
      id,
      name: row.name as string,
      type: row.type as string,
      status: row.status as string,
      budget: row.budget as number | undefined,
      spent: row.spent as number | undefined,
      startDate: parseTimestamp(row.start_date as string),
      endDate: parseTimestamp(row.end_date as string),
      targetingRules: row.targeting_rules as
        | Record<string, unknown>
        | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });

    idMaps.campaigns.set(oldId, id);
    count++;
  }
  console.log(`  ✅ Imported ${count} campaigns (skipped ${skipped} invalid)`);
}

async function importFeaturedEmployers() {
  console.log("\n⭐ Importing featured employers...");
  const data = readJsonFile<Record<string, unknown>>("featured_employers.json");

  let count = 0;
  let skipped = 0;

  for (const row of data) {
    const oldCompanyId = row.company_id as string;
    const companyId = idMaps.companies.get(oldCompanyId);

    if (!companyId) {
      skipped++;
      continue;
    }

    await db.insert(schema.featuredEmployer).values({
      id: generateId(),
      companyId,
      tagline: row.tagline as string | undefined,
      displayOrder: row.display_order as number | undefined,
      startsAt: parseTimestamp(row.starts_at as string) || new Date(),
      endsAt:
        parseTimestamp(row.ends_at as string) ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isPinned: Boolean(row.is_pinned),
      impressions: row.impressions as number | undefined,
      clicks: row.clicks as number | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });
    count++;
  }
  console.log(`  ✅ Imported ${count} featured employers (skipped ${skipped})`);
}

async function importSponsoredAds() {
  console.log("\n📣 Importing sponsored ads...");
  const data = readJsonFile<Record<string, unknown>>("sponsored_ads.json");

  let count = 0;
  for (const row of data) {
    await db.insert(schema.sponsoredAd).values({
      id: generateId(),
      advertiser: row.advertiser as string,
      tagline: row.tagline as string | undefined,
      headline: row.headline as string,
      description: row.description as string | undefined,
      ctaText: row.cta_text as string | undefined,
      ctaUrl: row.cta_url as string | undefined,
      status: row.status as string,
      startsAt: parseTimestamp(row.starts_at as string),
      endsAt: parseTimestamp(row.ends_at as string),
      impressions: row.impressions as number | undefined,
      clicks: row.clicks as number | undefined,
      priority: row.priority as number | undefined,
      industries: row.industries as string[] | undefined,
      matchedMosCodes: row.matched_mos_codes as string[] | undefined,
      embedding: row.embedding as number[] | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });
    count++;
  }
  console.log(`  ✅ Imported ${count} sponsored ads`);
}

async function importSponsoredJobs() {
  console.log("\n📣 Importing sponsored jobs...");
  const data = readJsonFile<Record<string, unknown>>("sponsored_jobs.json");

  let count = 0;
  for (const row of data) {
    await db.insert(schema.sponsoredJob).values({
      id: generateId(),
      title: row.title as string,
      company: row.company as string,
      location: row.location as string,
      clearance: row.clearance as string | undefined,
      salary: row.salary as string | undefined,
      pitch: row.pitch as string | undefined,
      applyUrl: row.apply_url as string,
      status: row.status as string,
      locationType: row.location_type as string | undefined,
      sponsorCategory: row.sponsor_category as string | undefined,
      startsAt: parseTimestamp(row.starts_at as string),
      endsAt: parseTimestamp(row.ends_at as string),
      impressions: row.impressions as number | undefined,
      clicks: row.clicks as number | undefined,
      priority: row.priority as number | undefined,
      matchedMosCodes: row.matched_mos_codes as string[] | undefined,
      embedding: row.embedding as number[] | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });
    count++;
  }
  console.log(`  ✅ Imported ${count} sponsored jobs`);
}

async function importJobAlertSubscriptions() {
  console.log("\n🔔 Importing job alert subscriptions...");
  const data = readJsonFile<Record<string, unknown>>(
    "job_alert_subscriptions.json",
  );

  let count = 0;
  for (const row of data) {
    await db.insert(schema.jobAlertSubscription).values({
      id: generateId(),
      email: row.email as string,
      keywords: row.keywords as string[] | undefined,
      locations: row.locations as string[] | undefined,
      clearanceLevels: row.clearance_levels as string[] | undefined,
      mosCodes: row.mos_codes as string[] | undefined,
      frequency: row.frequency as string | undefined,
      isActive: row.is_active !== false,
      lastSentAt: parseTimestamp(row.last_sent_at as string),
      unsubscribeToken: row.unsubscribe_token as string | undefined,
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
      updatedAt: parseTimestamp(row.updated_at as string) || new Date(),
    });
    count++;
  }
  console.log(`  ✅ Imported ${count} job alert subscriptions`);
}

async function importRecruiterAccess() {
  console.log("\n👥 Importing recruiter access...");
  const data = readJsonFile<Record<string, unknown>>("recruiter_access.json");

  let count = 0;
  let skipped = 0;
  for (const row of data) {
    // Skip rows missing required fields
    if (!row.email || !row.access_level) {
      skipped++;
      continue;
    }

    await db.insert(schema.recruiterAccess).values({
      id: generateId(),
      email: row.email as string,
      accessLevel: row.access_level as string,
      expiresAt: parseTimestamp(row.expires_at as string),
      createdAt: parseTimestamp(row.created_at as string) || new Date(),
    });
    count++;
  }
  console.log(
    `  ✅ Imported ${count} recruiter access records (skipped ${skipped} invalid)`,
  );
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("\n🚀 Starting libSQL data migration...");
  console.log(`   Source: ${DATA_DIR}`);
  console.log(`   Target: ${DB_PATH}`);

  try {
    await importTheaters();
    await importBases();
    await importCompanies();
    await importMosCodes();
    await importJobs();
    await importCompanyMos();
    await importJobMosMappings();
    await importCampaigns();
    await importFeaturedEmployers();
    await importSponsoredAds();
    await importSponsoredJobs();
    await importJobAlertSubscriptions();
    await importRecruiterAccess();

    console.log("\n✅ Migration complete!");

    console.log("\n📊 Summary:");
    console.log(`   Theaters: ${idMaps.theaters.size}`);
    console.log(`   Bases: ${idMaps.bases.size}`);
    console.log(`   Companies: ${idMaps.companies.size}`);
    console.log(`   MOS Codes: ${idMaps.mosCodes.size}`);
    console.log(`   Jobs: ${idMaps.jobs.size}`);
    console.log(`   Campaigns: ${idMaps.campaigns.size}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
