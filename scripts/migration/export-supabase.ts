/**
 * Export Supabase data to JSON for Convex migration
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/export-supabase.ts
 *
 * Requires:
 *   - SUPABASE_URL and SUPABASE_SECRET_KEY in environment
 */

import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Tables to export (in dependency order)
const TABLES_TO_EXPORT = [
  // Reference tables first
  "theaters",
  "bases",

  // Core data
  "companies",
  "mos_codes", // Main MOS codes table with 1,317 rows
  "jobs",

  // Mappings
  "job_mos_mappings",
  "company_mos",
  "mos_job_rankings",
  "mos_stats",

  // Users (profiles reference auth.users which we skip)
  "profiles",
  "user_mos_preferences",
  "saved_jobs",
  "viewed_mos",

  // Campaigns & Ads
  "campaigns",
  "toast_ads",
  "toast_ad_events",
  "sponsored_mos",
  "featured_employers",
  "sponsored_ads",
  "sponsored_jobs",
  "toast_impressions",
  "toast_clicks",

  // CRM
  "job_alert_subscriptions",
  "candidate_activity",
  "placements",
  "employer_contacts",
  "employer_notes",

  // Admin
  "pipeline_jobs",
  "admin_activity_log",
  "recruiter_access",
];

interface ExportResult {
  table: string;
  count: number;
  success: boolean;
  error?: string;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Supabase to Convex Data Export");
  console.log("=".repeat(60));
  console.log();

  // Use project root's scripts/migration/data directory
  const outputDir = join(process.cwd(), "./scripts/migration/data");
  await mkdir(outputDir, { recursive: true });

  const results: ExportResult[] = [];
  const exportData: Record<string, any[]> = {};

  for (const tableName of TABLES_TO_EXPORT) {
    try {
      console.log(`Exporting ${tableName}...`);

      let allRows: any[] = [];
      let offset = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error(`  -> ERROR: ${error.message}`);
          results.push({
            table: tableName,
            count: 0,
            success: false,
            error: error.message,
          });
          break;
        }

        if (!data || data.length === 0) break;

        allRows = allRows.concat(data);
        offset += pageSize;

        if (data.length < pageSize) break;
      }

      if (allRows.length > 0) {
        exportData[tableName] = allRows;
        console.log(`  -> ${allRows.length} rows`);
        results.push({
          table: tableName,
          count: allRows.length,
          success: true,
        });
      } else if (!results.find((r) => r.table === tableName)) {
        results.push({
          table: tableName,
          count: 0,
          success: true,
        });
      }
    } catch (error) {
      console.error(`  -> ERROR: ${error}`);
      results.push({
        table: tableName,
        count: 0,
        success: false,
        error: String(error),
      });
    }
  }

  // Write individual table files
  for (const [tableName, data] of Object.entries(exportData)) {
    const filename = join(outputDir, `${tableName}.json`);
    await writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`Wrote ${filename}`);
  }

  // Write combined export
  const combinedFilename = join(outputDir, "_all_data.json");
  await writeFile(combinedFilename, JSON.stringify(exportData, null, 2));
  console.log(`Wrote combined export: ${combinedFilename}`);

  // Write summary
  console.log();
  console.log("=".repeat(60));
  console.log("Export Summary");
  console.log("=".repeat(60));

  let totalRows = 0;
  for (const result of results) {
    const status = result.success ? "✓" : "✗";
    console.log(`${status} ${result.table}: ${result.count} rows`);
    totalRows += result.count;
  }

  console.log();
  console.log(
    `Total: ${totalRows} rows from ${results.filter((r) => r.success).length}/${results.length} tables`,
  );

  // Write manifest
  const manifest = {
    exportedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tables: results,
    totalRows,
  };
  await writeFile(
    join(outputDir, "_manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

main().catch(console.error);
