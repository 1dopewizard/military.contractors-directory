#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Seed Mock Contributors for Community Leaderboard
 *
 * Creates mock contributor users with realistic names and avatars,
 * then links existing unassigned mock submissions to them.
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/seed/seed-contributors.ts
 *   cd apps/contractors && npx tsx scripts/seed/seed-contributors.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/seed/seed-contributors.ts --clear
 *   cd apps/contractors && npx tsx scripts/seed/seed-contributors.ts --count=15
 *
 * Note: Run seed-community-mock-data.ts first to have submissions available to link.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, isNull, sql } from "drizzle-orm";
import { resolve } from "path";
import * as schema from "../../server/database/schema";

// ===========================================
// Configuration
// ===========================================

const dbPath = resolve(process.cwd(), "server/database/app.db");

// Create libSQL client and Drizzle instance
const client = createClient({ url: `file:${dbPath}` });
const db = drizzle(client, { schema });

// Defaults
const DEFAULT_CONTRIBUTOR_COUNT = 12;
const MOCK_EMAIL_DOMAIN = "@mock.military.contractors";

// ===========================================
// Mock Contributor Data
// ===========================================

// Realistic veteran-style display names (first name + last initial)
const MOCK_NAMES = [
  "Mike T.",
  "Sarah K.",
  "James R.",
  "Amanda L.",
  "Chris M.",
  "Jessica B.",
  "David W.",
  "Emily C.",
  "Ryan H.",
  "Nicole P.",
  "Brandon S.",
  "Megan D.",
  "Kevin O.",
  "Ashley N.",
  "Justin F.",
  "Stephanie G.",
  "Matthew V.",
  "Rachel A.",
  "Andrew J.",
  "Lauren E.",
  "Daniel Z.",
  "Brittany Y.",
  "Joshua Q.",
  "Kayla I.",
  "Tyler X.",
];

/**
 * Generate a Dicebear avatar URL based on seed
 * Using "initials" style for clean, professional look
 */
function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0ea5e9,8b5cf6,10b981,f59e0b,ef4444&backgroundType=gradientLinear`;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ===========================================
// Database Operations
// ===========================================

interface UnassignedCounts {
  unassignedSalaries: number;
  unassignedInterviews: number;
  total: number;
}

interface LinkResult {
  linkedSalaries: number;
  linkedInterviews: number;
  totalLinked: number;
}

interface ClearResult {
  deletedUsers: number;
  unlinkedSalaries: number;
  unlinkedInterviews: number;
}

async function getUnassignedCounts(): Promise<UnassignedCounts> {
  const salaries = await db.query.salaryReport.findMany({
    where: isNull(schema.salaryReport.submittedBy),
  });

  const interviews = await db.query.interviewExperience.findMany({
    where: isNull(schema.interviewExperience.submittedBy),
  });

  return {
    unassignedSalaries: salaries.length,
    unassignedInterviews: interviews.length,
    total: salaries.length + interviews.length,
  };
}

async function createContributor(
  email: string,
  name: string,
  imageUrl: string,
): Promise<string> {
  const emailLower = email.toLowerCase();
  const now = new Date();

  // Check if user already exists
  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, emailLower),
  });

  if (existing) {
    // Update existing user to be a contributor
    await db
      .update(schema.user)
      .set({
        name,
        image: imageUrl,
        updatedAt: now,
      })
      .where(eq(schema.user.id, existing.id));
    return existing.id;
  }

  // Create new mock contributor
  const id = crypto.randomUUID();
  await db.insert(schema.user).values({
    id,
    email: emailLower,
    name,
    image: imageUrl,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

async function linkSubmissionsToContributor(
  userId: string,
  salaryCount: number,
  interviewCount: number,
): Promise<LinkResult> {
  const now = new Date();

  // Get unassigned salary reports
  const unassignedSalaries = await db.query.salaryReport.findMany({
    where: isNull(schema.salaryReport.submittedBy),
    limit: salaryCount,
  });

  // Get unassigned interview experiences
  const unassignedInterviews = await db.query.interviewExperience.findMany({
    where: isNull(schema.interviewExperience.submittedBy),
    limit: interviewCount,
  });

  // Link salary reports
  for (const report of unassignedSalaries) {
    await db
      .update(schema.salaryReport)
      .set({
        submittedBy: userId,
        updatedAt: now,
      })
      .where(eq(schema.salaryReport.id, report.id));
  }

  // Link interview experiences
  for (const exp of unassignedInterviews) {
    await db
      .update(schema.interviewExperience)
      .set({
        submittedBy: userId,
        updatedAt: now,
      })
      .where(eq(schema.interviewExperience.id, exp.id));
  }

  return {
    linkedSalaries: unassignedSalaries.length,
    linkedInterviews: unassignedInterviews.length,
    totalLinked: unassignedSalaries.length + unassignedInterviews.length,
  };
}

async function clearMockContributors(): Promise<ClearResult> {
  const now = new Date();

  // Find all mock users
  const allUsers = await db.query.user.findMany();
  const mockUsers = allUsers.filter((u) =>
    (u.email as string).endsWith(MOCK_EMAIL_DOMAIN),
  );

  let deletedUsers = 0;
  let unlinkedSalaries = 0;
  let unlinkedInterviews = 0;

  for (const user of mockUsers) {
    const userId = user.id as string;

    // Unlink salary reports
    const salaries = await db.query.salaryReport.findMany({
      where: eq(schema.salaryReport.submittedBy, userId),
    });

    for (const report of salaries) {
      await db
        .update(schema.salaryReport)
        .set({
          submittedBy: undefined,
          updatedAt: now,
        })
        .where(eq(schema.salaryReport.id, report.id as string));
      unlinkedSalaries++;
    }

    // Unlink interview experiences
    const interviews = await db.query.interviewExperience.findMany({
      where: eq(schema.interviewExperience.submittedBy, userId),
    });

    for (const exp of interviews) {
      await db
        .update(schema.interviewExperience)
        .set({
          submittedBy: undefined,
          updatedAt: now,
        })
        .where(eq(schema.interviewExperience.id, exp.id as string));
      unlinkedInterviews++;
    }

    // Delete the mock user
    await db.delete(schema.user).where(eq(schema.user.id, userId));
    deletedUsers++;
  }

  return {
    deletedUsers,
    unlinkedSalaries,
    unlinkedInterviews,
  };
}

// ===========================================
// Generation Logic
// ===========================================

interface ContributorAllocation {
  name: string;
  email: string;
  avatarUrl: string;
  salaries: number;
  interviews: number;
}

/**
 * Calculate weighted allocation of submissions to contributors
 * Top contributors get more submissions (power law distribution)
 */
function calculateAllocations(
  count: number,
  totalSalaries: number,
  totalInterviews: number,
): ContributorAllocation[] {
  // Get shuffled names
  const names = shuffleArray(MOCK_NAMES).slice(
    0,
    Math.min(count, MOCK_NAMES.length),
  );

  // Add numbered names if we need more
  while (names.length < count) {
    names.push(`Contributor ${names.length + 1}`);
  }

  // Generate weighted distribution (power law-ish)
  // First few contributors get more, rest get less
  const weights = names.map((_, i) => Math.max(1, count - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Calculate allocations
  let remainingSalaries = totalSalaries;
  let remainingInterviews = totalInterviews;

  const allocations: ContributorAllocation[] = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const ratio = weights[i] / totalWeight;

    // Allocate proportionally with some randomness
    const baseSalaries = Math.floor(totalSalaries * ratio);
    const baseInterviews = Math.floor(totalInterviews * ratio);

    // Add some variance (0.7x to 1.3x)
    const variance = 0.7 + Math.random() * 0.6;
    let salaries = Math.min(
      remainingSalaries,
      Math.max(1, Math.floor(baseSalaries * variance)),
    );
    let interviews = Math.min(
      remainingInterviews,
      Math.max(0, Math.floor(baseInterviews * variance)),
    );

    // Ensure at least 1 submission per contributor
    if (salaries === 0 && remainingSalaries > 0) {
      salaries = 1;
    }

    remainingSalaries -= salaries;
    remainingInterviews -= interviews;

    // Generate email and avatar
    const emailPrefix = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\./g, "");
    const email = `${emailPrefix}_${i}${MOCK_EMAIL_DOMAIN}`;
    const avatarUrl = getAvatarUrl(`${emailPrefix}_${i}`);

    allocations.push({
      name,
      email,
      avatarUrl,
      salaries,
      interviews,
    });
  }

  return allocations;
}

// ===========================================
// CLI
// ===========================================

function parseArgs(): {
  dryRun: boolean;
  clear: boolean;
  count: number;
} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    clear: args.includes("--clear"),
    count:
      parseInt(
        args.find((a) => a.startsWith("--count="))?.split("=")[1] || "",
      ) || DEFAULT_CONTRIBUTOR_COUNT,
  };
}

// ===========================================
// Main
// ===========================================

async function main() {
  const { dryRun, clear, count } = parseArgs();

  console.log("=".repeat(60));
  console.log("Mock Contributor Generator");
  console.log("=".repeat(60));
  console.log();
  console.log(`Database: ${dbPath}`);
  console.log(`Count: ${count}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Clear First: ${clear}`);
  console.log();

  // Optionally clear existing mock contributors
  if (clear) {
    if (dryRun) {
      console.log("[DRY RUN] Would clear existing mock contributors");
    } else {
      console.log("Clearing existing mock contributors...");
      const result = await clearMockContributors();
      console.log(`  Deleted ${result.deletedUsers} mock users`);
      console.log(`  Unlinked ${result.unlinkedSalaries} salary reports`);
      console.log(
        `  Unlinked ${result.unlinkedInterviews} interview experiences`,
      );
    }
    console.log();
  }

  // Check available unassigned submissions
  const counts = await getUnassignedCounts();
  console.log(`Available unassigned submissions:`);
  console.log(`  Salary reports: ${counts.unassignedSalaries}`);
  console.log(`  Interview experiences: ${counts.unassignedInterviews}`);
  console.log(`  Total: ${counts.total}`);
  console.log();

  if (counts.total === 0) {
    console.log("⚠️  No unassigned submissions available to link!");
    console.log(
      "   Run seed-community-mock-data.ts first to generate submissions.",
    );
    console.log();
    console.log("=".repeat(60));
    client.close();
    return;
  }

  // Calculate allocations
  const allocations = calculateAllocations(
    count,
    counts.unassignedSalaries,
    counts.unassignedInterviews,
  );

  if (dryRun) {
    console.log("[DRY RUN] Would create contributors:");
    for (const alloc of allocations) {
      console.log(
        `  ${alloc.name} (${alloc.email}): ${alloc.salaries} salaries, ${alloc.interviews} interviews`,
      );
    }
    console.log();
    const totalLinked = allocations.reduce(
      (sum, a) => sum + a.salaries + a.interviews,
      0,
    );
    console.log(
      `[DRY RUN] Total: ${allocations.length} contributors, ${totalLinked} submissions linked`,
    );
  } else {
    console.log("Creating contributors and linking submissions...");
    console.log();

    let createdCount = 0;
    let totalLinked = 0;

    for (const alloc of allocations) {
      try {
        // Create user
        const userId = await createContributor(
          alloc.email,
          alloc.name,
          alloc.avatarUrl,
        );
        createdCount++;

        // Link submissions
        const linkResult = await linkSubmissionsToContributor(
          userId,
          alloc.salaries,
          alloc.interviews,
        );
        totalLinked += linkResult.totalLinked;

        console.log(
          `  ✓ ${alloc.name}: ${linkResult.linkedSalaries} salaries, ${linkResult.linkedInterviews} interviews`,
        );
      } catch (error) {
        console.error(`  ✗ Failed to create ${alloc.name}:`, error);
      }
    }

    console.log();
    console.log(`Results:`);
    console.log(`  Created: ${createdCount}/${count} contributors`);
    console.log(`  Linked: ${totalLinked} submissions`);
  }

  console.log();
  console.log("=".repeat(60));
  console.log("Complete!");
  console.log("=".repeat(60));

  // Clean up
  client.close();
}

main().catch(console.error);
