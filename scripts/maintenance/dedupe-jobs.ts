/**
 * Deduplicate jobs in Convex
 *
 * Removes duplicate jobs based on externalId + sourceSite combination.
 * Keeps the oldest job in each duplicate group.
 *
 * Usage:
 *   # From apps/contractors directory:
 *   # Dry run (preview what would be deleted)
 *   npx tsx scripts/dedupe-jobs.ts --dry-run
 *
 *   # Actually delete duplicates
 *   npx tsx scripts/dedupe-jobs.ts
 *
 * Requires:
 *   - CONVEX_SELF_HOSTED_URL or CONVEX_URL in environment
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing CONVEX_SELF_HOSTED_URL or CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || args.includes("-n");

  console.log("=".repeat(60));
  console.log("Job Deduplication");
  console.log("=".repeat(60));
  console.log();
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(
    `Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE (will delete duplicates)"}`,
  );
  console.log();

  // Step 1: Find duplicates
  console.log("Finding duplicate jobs...");
  const duplicateInfo = await client.query(api.admin.findDuplicateJobs, {});

  console.log();
  console.log("Current state:");
  console.log(`  Total jobs: ${duplicateInfo.totalJobs}`);
  console.log(
    `  Unique externalId+sourceSite keys: ${duplicateInfo.uniqueKeys}`,
  );
  console.log(`  Duplicate jobs to remove: ${duplicateInfo.duplicateCount}`);
  console.log(
    `  Expected count after dedup: ${duplicateInfo.expectedAfterDedup}`,
  );
  console.log();

  if (duplicateInfo.duplicateCount === 0) {
    console.log("No duplicates found. Nothing to do.");
    return;
  }

  // Show some duplicate examples
  console.log(
    `Found ${duplicateInfo.duplicateGroups.length} duplicate groups:`,
  );
  for (const group of duplicateInfo.duplicateGroups.slice(0, 5)) {
    console.log(`\n  Key: ${group.key} (${group.count} copies)`);
    for (const job of group.jobs) {
      console.log(`    - ${job._id}: "${job.title}" @ ${job.company}`);
    }
  }

  if (duplicateInfo.duplicateGroups.length > 5) {
    console.log(
      `\n  ... and ${duplicateInfo.duplicateGroups.length - 5} more groups`,
    );
  }

  console.log();

  // Step 2: Run deduplication
  console.log("Running deduplication...");
  const result = await client.mutation(api.admin.deduplicateJobs, { dryRun });

  console.log();
  console.log("Result:");
  console.log(`  Mode: ${result.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Jobs before: ${result.totalJobs}`);
  console.log(`  Jobs deleted: ${result.deletedCount}`);
  console.log(`  Jobs remaining: ${result.keptCount}`);

  if (dryRun) {
    console.log();
    console.log(
      "This was a dry run. Run without --dry-run to actually delete duplicates.",
    );
  } else {
    console.log();
    console.log("Deduplication complete!");
  }
}

main().catch(console.error);
