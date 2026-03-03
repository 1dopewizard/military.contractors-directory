#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Seed Contractor Data
 *
 * Imports mock contractor data from mock-contractors.json into the database.
 * Seeds specialties, contractors, contractor-specialty relationships, and locations.
 *
 * Usage:
 *   npx tsx scripts/seed/seed-contractors.ts
 *   npx tsx scripts/seed/seed-contractors.ts --dry-run
 *   npx tsx scripts/seed/seed-contractors.ts --clear
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as schema from "../../server/database/schema";

// ===========================================
// Configuration
// ===========================================

const dbPath = resolve(process.cwd(), "server/database/app.db");
const MOCK_DATA_FILE = resolve(
  process.cwd(),
  "scripts/seed/all-contractors.json",
);

// Create libSQL client and Drizzle instance
const client = createClient({ url: `file:${dbPath}` });
const db = drizzle(client, { schema });

// Specialty taxonomy from plan
const SPECIALTIES = [
  {
    slug: "aerospace-defense",
    name: "Aerospace & Defense",
    description: "Aircraft, missiles, satellites",
    icon: "mdi:airplane",
  },
  {
    slug: "cybersecurity-it",
    name: "Cybersecurity & IT",
    description: "Cyber, IT services, cloud",
    icon: "mdi:shield-lock",
  },
  {
    slug: "intelligence-analytics",
    name: "Intelligence & Analytics",
    description: "Intel, data analytics, AI/ML",
    icon: "mdi:chart-box",
  },
  {
    slug: "land-systems",
    name: "Land Systems",
    description: "Vehicles, weapons, munitions",
    icon: "mdi:tank",
  },
  {
    slug: "naval-maritime",
    name: "Naval & Maritime",
    description: "Ships, submarines, maritime systems",
    icon: "mdi:ship-wheel",
  },
  {
    slug: "space-systems",
    name: "Space Systems",
    description: "Satellites, launch, space tech",
    icon: "mdi:rocket-launch",
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    description: "Consulting, engineering services",
    icon: "mdi:briefcase",
  },
  {
    slug: "logistics-support",
    name: "Logistics & Support",
    description: "Base ops, supply chain, MRO",
    icon: "mdi:truck-delivery",
  },
  {
    slug: "electronics-sensors",
    name: "Electronics & Sensors",
    description: "Sensors, communications, EW",
    icon: "mdi:radar",
  },
  {
    slug: "research-development",
    name: "Research & Development",
    description: "FFRDCs, labs, R&D",
    icon: "mdi:flask",
  },
];

interface MockContractor {
  rank: number;
  name: string;
  country: string;
  totalRevenue: number;
  defenseRevenue: number;
  defenseRevenuePercent: number;
  slug: string;
  description: string;
  headquarters: string;
  founded: number;
  employeeCount: string;
  website: string;
  careersUrl: string;
  linkedinUrl: string | null;
  wikipediaUrl: string | null;
  stockTicker: string | null;
  isPublic: boolean;
  specialties: string[];
  keyProducts: string[];
  notableContracts: string[];
}

// ===========================================
// Parsing Functions
// ===========================================

/**
 * Parse headquarters string (e.g., "Bethesda, Maryland") into city and state
 */
function parseHeadquarters(hq: string): {
  city: string | null;
  state: string | null;
} {
  const parts = hq.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return {
      city: parts[0] || null,
      state: parts[1] || null,
    };
  }
  return { city: hq || null, state: null };
}

// ===========================================
// Seed Functions
// ===========================================

async function seedSpecialties(dryRun: boolean): Promise<Map<string, string>> {
  const specialtyMap = new Map<string, string>();

  console.log("Seeding specialties...");

  for (const specialty of SPECIALTIES) {
    if (dryRun) {
      console.log(
        `  [DRY RUN] Would insert: ${specialty.slug} - ${specialty.name}`,
      );
      specialtyMap.set(specialty.slug, "mock-id");
      continue;
    }

    // Check if specialty already exists
    const existing = await db.query.specialty.findFirst({
      where: eq(schema.specialty.slug, specialty.slug),
    });

    if (existing) {
      console.log(`  ⊙ Skipping ${specialty.slug} (already exists)`);
      specialtyMap.set(specialty.slug, existing.id);
      continue;
    }

    const [inserted] = await db
      .insert(schema.specialty)
      .values({
        slug: specialty.slug,
        name: specialty.name,
        description: specialty.description,
        icon: specialty.icon,
      })
      .returning({ id: schema.specialty.id });

    console.log(`  ✓ Inserted ${specialty.slug}`);
    specialtyMap.set(specialty.slug, inserted.id);
  }

  return specialtyMap;
}

async function seedContractors(
  contractors: MockContractor[],
  specialtyMap: Map<string, string>,
  dryRun: boolean,
): Promise<void> {
  console.log(`\nSeeding ${contractors.length} contractors...`);

  for (const contractor of contractors) {
    if (dryRun) {
      console.log(
        `  [DRY RUN] Would insert: ${contractor.name} (${contractor.slug})`,
      );
      continue;
    }

    // Check if contractor already exists
    const existing = await db.query.contractor.findFirst({
      where: eq(schema.contractor.slug, contractor.slug),
    });

    if (existing) {
      console.log(`  ⊙ Skipping ${contractor.name} (already exists)`);
      continue;
    }

    // Convert revenue from dollars to billions for storage
    const totalRevenueBillions = contractor.totalRevenue / 1_000_000_000;
    const defenseRevenueBillions = contractor.defenseRevenue / 1_000_000_000;

    // Insert contractor
    const [inserted] = await db
      .insert(schema.contractor)
      .values({
        slug: contractor.slug,
        name: contractor.name,
        description: contractor.description,
        defenseNewsRank: contractor.rank,
        country: contractor.country,
        headquarters: contractor.headquarters,
        founded: contractor.founded,
        employeeCount: contractor.employeeCount,
        website: contractor.website,
        careersUrl: contractor.careersUrl,
        linkedinUrl: contractor.linkedinUrl,
        wikipediaUrl: contractor.wikipediaUrl,
        stockTicker: contractor.stockTicker,
        isPublic: contractor.isPublic,
        totalRevenue: totalRevenueBillions,
        defenseRevenue: defenseRevenueBillions,
        defenseRevenuePercent: contractor.defenseRevenuePercent,
      })
      .returning({ id: schema.contractor.id });

    const contractorId = inserted.id;

    // Link specialties (first one is primary)
    for (let i = 0; i < contractor.specialties.length; i++) {
      const specialtySlug = contractor.specialties[i];
      const specialtyId = specialtyMap.get(specialtySlug);

      if (!specialtyId) {
        console.warn(
          `    ⚠ Warning: Specialty "${specialtySlug}" not found for ${contractor.name}`,
        );
        continue;
      }

      await db.insert(schema.contractorSpecialty).values({
        contractorId,
        specialtyId,
        isPrimary: i === 0, // First specialty is primary
      });
    }

    // Parse and insert headquarters location
    const { city, state } = parseHeadquarters(contractor.headquarters);
    await db.insert(schema.contractorLocation).values({
      contractorId,
      city,
      state,
      country: contractor.country,
      isHeadquarters: true,
    });

    console.log(`  ✓ Inserted ${contractor.name}`);
  }
}

async function clearData(dryRun: boolean): Promise<void> {
  console.log("Clearing existing data...");

  if (dryRun) {
    console.log("  [DRY RUN] Would delete all contractor data");
    return;
  }

  // Delete in order to respect foreign key constraints
  await db.delete(schema.contractorLocation);
  await db.delete(schema.contractorSpecialty);
  await db.delete(schema.contractor);
  // Keep specialties - they're reusable

  console.log("  ✓ Cleared contractor data");
}

// ===========================================
// Main
// ===========================================

function parseArgs(): {
  dryRun: boolean;
  clear: boolean;
} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    clear: args.includes("--clear"),
  };
}

async function main() {
  const { dryRun, clear } = parseArgs();

  console.log("=".repeat(60));
  console.log("Contractor Data Seeder");
  console.log("=".repeat(60));
  console.log();
  console.log(`Input: ${MOCK_DATA_FILE}`);
  console.log(`Database: ${dbPath}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Clear: ${clear}`);
  console.log();

  // Load mock data
  console.log("Loading mock data...");
  const mockDataContent = readFileSync(MOCK_DATA_FILE, "utf-8");
  const contractors: MockContractor[] = JSON.parse(mockDataContent);
  console.log(`  Loaded ${contractors.length} contractors`);
  console.log();

  // Clear if requested
  if (clear) {
    await clearData(dryRun);
    console.log();
  }

  // Seed specialties first
  const specialtyMap = await seedSpecialties(dryRun);
  console.log();

  // Seed contractors
  await seedContractors(contractors, specialtyMap, dryRun);
  console.log();

  console.log("=".repeat(60));
  console.log("Complete!");
  console.log("=".repeat(60));

  // Clean up
  client.close();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
