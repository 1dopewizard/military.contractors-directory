#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Generate Mock Contractor Data
 *
 * Uses GPT-5.1 to generate realistic mock data for 48 U.S. defense contractors
 * from the Defense News Top 100 list. Outputs JSON file for seeding.
 *
 * Usage:
 *   npx tsx scripts/seed/generate-mock-contractors.ts
 *   npx tsx scripts/seed/generate-mock-contractors.ts --dry-run
 *   npx tsx scripts/seed/generate-mock-contractors.ts --limit=5
 *
 * Requires:
 *   - OPENAI_API_KEY or NUXT_OPENAI_API_KEY
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ===========================================
// Configuration
// ===========================================

const TOP_100_FILE = resolve(
  process.cwd(),
  "docs/top_100_defense_contractors.md",
);
const OUTPUT_FILE = resolve(
  process.cwd(),
  "scripts/seed/mock-contractors.json",
);
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY or NUXT_OPENAI_API_KEY");
  process.exit(1);
}

// Set the API key for the OpenAI SDK
process.env.OPENAI_API_KEY = OPENAI_API_KEY;

// Specialty taxonomy from plan
const SPECIALTIES = [
  {
    slug: "aerospace-defense",
    name: "Aerospace & Defense",
    description: "Aircraft, missiles, satellites",
  },
  {
    slug: "cybersecurity-it",
    name: "Cybersecurity & IT",
    description: "Cyber, IT services, cloud",
  },
  {
    slug: "intelligence-analytics",
    name: "Intelligence & Analytics",
    description: "Intel, data analytics, AI/ML",
  },
  {
    slug: "land-systems",
    name: "Land Systems",
    description: "Vehicles, weapons, munitions",
  },
  {
    slug: "naval-maritime",
    name: "Naval & Maritime",
    description: "Ships, submarines, maritime systems",
  },
  {
    slug: "space-systems",
    name: "Space Systems",
    description: "Satellites, launch, space tech",
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    description: "Consulting, engineering services",
  },
  {
    slug: "logistics-support",
    name: "Logistics & Support",
    description: "Base ops, supply chain, MRO",
  },
  {
    slug: "electronics-sensors",
    name: "Electronics & Sensors",
    description: "Sensors, communications, EW",
  },
  {
    slug: "research-development",
    name: "Research & Development",
    description: "FFRDCs, labs, R&D",
  },
];

// U.S. companies from Top 100 (48 total) - normalized for matching
const US_COMPANIES = [
  "Lockheed Martin",
  "RTX",
  "Northrop Grumman",
  "General Dynamics",
  "Boeing",
  "L3Harris",
  "Leidos",
  "HII",
  "Amentum",
  "Booz Allen Hamilton",
  "CACI",
  "GE Aerospace",
  "Honeywell",
  "KBR",
  "Advanced Technology International",
  "Peraton",
  "Parsons",
  "SpaceX",
  "V2X",
  "SAIC", // SAIC = Science Applications International Corporation
  "Textron",
  "TransDigm",
  "Bechtel",
  "Oshkosh",
  "BWX Technologies",
  "Viasat",
  "Sierra Nevada",
  "Parker Hannifin",
  "Curtiss-Wright",
  "Amphenol",
  "Palantir",
  "MITRE",
  "Moog",
  "ManTech",
  "HEICO",
  "Howmet Aerospace",
  "Aerospace Corporation",
  "Keysight",
  "TTM Technologies",
  "Teledyne",
  "StandardAero",
  "Kratos",
  "Spirit AeroSystems",
  "Anduril",
  "M1 Support Services",
  "Mercury Systems",
  "AM General",
  "Hexcel",
];

// Normalize company name for matching (remove common suffixes, parentheticals, etc.)
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, "") // Remove parentheticals like "(SAIC)"
    .replace(
      /\s*,\s*(inc|corp|corporation|ltd|llc|technologies|solutions|services)\s*\.?$/i,
      "",
    ) // Remove suffixes
    .replace(/\s*the\s+/i, "") // Remove "The" prefix
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// ===========================================
// Schemas
// ===========================================

const ContractorDataSchema = z.object({
  slug: z
    .string()
    .describe('URL-safe version of company name (e.g., "lockheed-martin")'),
  description: z
    .string()
    .min(200)
    .describe("2-3 paragraphs about the company, what they do, their history"),
  headquarters: z
    .string()
    .describe(
      'Headquarters location (e.g., "Bethesda, Maryland" or "Falls Church, Virginia")',
    ),
  founded: z.number().int().min(1800).max(2025).describe("Year founded"),
  employeeCount: z
    .string()
    .describe('Approximate employee count (e.g., "45,000" or "~120,000")'),
  website: z.string().url().describe("Official website URL"),
  linkedinUrl: z
    .string()
    .url()
    .nullable()
    .describe("LinkedIn company page URL (or null if not available)"),
  wikipediaUrl: z
    .string()
    .url()
    .nullable()
    .describe("Wikipedia article URL (or null if not available)"),
  stockTicker: z
    .string()
    .nullable()
    .describe(
      'Stock ticker symbol if public (e.g., "LMT", "RTX") or null if private',
    ),
  isPublic: z.boolean().describe("Whether the company is publicly traded"),
  specialties: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      '1-3 specialty slugs from the taxonomy (e.g., ["aerospace-defense", "space-systems"])',
    ),
  keyProducts: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe(
      '3-5 notable products/programs (e.g., ["F-35 Lightning II", "THAAD"])',
    ),
  notableContracts: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe(
      '2-3 major contract wins or programs (e.g., ["F-35 Production Contract", "Space Force GPS"])',
    ),
});

type ContractorData = z.infer<typeof ContractorDataSchema>;

interface CompanyFromList {
  rank: number;
  name: string;
  country: string;
  totalRevenue: number; // in USD
  defenseRevenue: number; // in USD
  defenseRevenuePercent: number; // percentage
}

interface GeneratedContractor extends CompanyFromList, ContractorData {}

// ===========================================
// Parsing Functions
// ===========================================

function parseTop100Markdown(): CompanyFromList[] {
  const content = readFileSync(TOP_100_FILE, "utf-8");
  const lines = content.split("\n");

  const companies: CompanyFromList[] = [];

  // Skip header lines and find the table
  let inTable = false;
  for (const line of lines) {
    if (line.includes("| This Year's Rank |")) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;

    // Skip separator lines
    if (line.startsWith("|--") || line.trim() === "") continue;

    // Parse table row
    const parts = line
      .split("|")
      .map((p) => p.trim())
      .filter((p) => p);
    if (parts.length < 9) continue;

    const rank = parseInt(parts[0]);
    const name = parts[2];
    const country = parts[3];
    const totalRevenueStr = parts[4].replace(/[^0-9.]/g, "");
    const defenseRevenueStr = parts[5].replace(/[^0-9.]/g, "");
    const defenseRevenuePercentStr = parts[8].replace(/[^0-9.]/g, ""); // Column 8 is "2024 Revenue From Defense"

    if (isNaN(rank) || !name || !country) continue;

    const totalRevenue = parseFloat(totalRevenueStr);
    const defenseRevenue = parseFloat(defenseRevenueStr);
    const defenseRevenuePercent = parseFloat(defenseRevenuePercentStr);

    companies.push({
      rank,
      name,
      country,
      totalRevenue,
      defenseRevenue,
      defenseRevenuePercent,
    });
  }

  return companies;
}

function filterUSCompanies(companies: CompanyFromList[]): CompanyFromList[] {
  return companies.filter((c) => {
    // First check if country is U.S.
    if (c.country !== "U.S.") return false;

    // Normalize both names for comparison
    const normalizedName = normalizeCompanyName(c.name);

    return US_COMPANIES.some((usName) => {
      const normalizedUS = normalizeCompanyName(usName);
      // Check if either name contains the other (handles variations)
      // Also check if the original name contains the US company name (for acronyms)
      return (
        normalizedName.includes(normalizedUS) ||
        normalizedUS.includes(normalizedName) ||
        c.name.toLowerCase().includes(usName.toLowerCase()) ||
        usName.toLowerCase().includes(c.name.toLowerCase().split("(")[0].trim())
      );
    });
  });
}

// ===========================================
// Generation Functions
// ===========================================

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SYSTEM_PROMPT = `You are generating realistic mock data for a defense contractor directory.

Use your knowledge of real defense contractors to create plausible data. The data should be realistic and based on actual company information where possible.

## Specialty Taxonomy
${SPECIALTIES.map((s) => `- ${s.slug}: ${s.name} - ${s.description}`).join("\n")}

## Output Requirements
- Description: 2-3 paragraphs about what the company does, their history, and their role in defense
- Headquarters: Realistic city and state based on the company's actual location
- Founded: Actual founding year if known, otherwise realistic estimate
- Employee count: Realistic approximate number (e.g., "45,000" or "~120,000")
- URLs: Use actual URLs if you know them, otherwise create plausible ones
- Stock ticker: Use actual ticker if public company, null if private
- Specialties: Select 1-3 specialties that best match the company's focus (use exact slugs from taxonomy)
- Key products: 3-5 notable products/programs the company is known for
- Notable contracts: 2-3 major contract wins or ongoing programs

Be accurate and realistic. If you know actual data about the company, use it. If not, create plausible data that matches the company's size and focus.`;

async function generateContractorData(
  company: CompanyFromList,
): Promise<ContractorData> {
  console.log(`  Generating data for ${company.name} (#${company.rank})...`);

  // Convert revenue to billions for display
  const totalRevenueBillions = (company.totalRevenue / 1_000_000_000).toFixed(
    2,
  );
  const defenseRevenueBillions = (
    company.defenseRevenue / 1_000_000_000
  ).toFixed(2);

  const prompt = `Generate realistic data for this defense contractor:

Company: ${company.name}
Rank: #${company.rank} on Defense News Top 100 (2025)
Country: ${company.country}
Total Revenue (2024): $${totalRevenueBillions}B
Defense Revenue (2024): $${defenseRevenueBillions}B
Defense Revenue %: ${company.defenseRevenuePercent}%

Generate realistic data including:
- Description (2-3 paragraphs about what they do)
- Headquarters location (city, state)
- Founded year
- Employee count (approximate)
- Website/LinkedIn/Wikipedia URLs
- Stock ticker (if public) or null (if private)
- Primary and secondary specialties from: ${SPECIALTIES.map((s) => s.slug).join(", ")}
- Key products/programs (3-5)
- Notable contracts (2-3)

Return as JSON matching the schema.`;

  const { object } = await generateObject({
    model: openai("gpt-5.4-nano"),
    schema: ContractorDataSchema,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return object;
}

async function loadExistingContractors(): Promise<Set<string>> {
  if (!existsSync(OUTPUT_FILE)) return new Set();
  try {
    const content = readFileSync(OUTPUT_FILE, "utf-8");
    const existing: GeneratedContractor[] = JSON.parse(content);
    return new Set(existing.map((c) => c.name));
  } catch {
    return new Set();
  }
}

async function appendContractor(
  contractor: GeneratedContractor,
): Promise<void> {
  let existing: GeneratedContractor[] = [];
  if (existsSync(OUTPUT_FILE)) {
    try {
      const content = readFileSync(OUTPUT_FILE, "utf-8");
      existing = JSON.parse(content);
    } catch {
      existing = [];
    }
  }

  existing.push(contractor);
  writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2), "utf-8");
}

async function generateAllContractors(
  companies: CompanyFromList[],
  limit?: number,
): Promise<GeneratedContractor[]> {
  const toProcess = limit ? companies.slice(0, limit) : companies;
  const existingNames = await loadExistingContractors();
  const results: GeneratedContractor[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const company = toProcess[i];

    // Skip if already generated
    if (existingNames.has(company.name)) {
      console.log(`  ⊙ Skipping ${company.name} (already generated)`);
      continue;
    }

    try {
      const data = await generateContractorData(company);

      // Ensure slug matches expected format
      const slug = data.slug || createSlug(company.name);

      const contractor: GeneratedContractor = {
        ...company,
        ...data,
        slug,
      };

      // Write incrementally
      await appendContractor(contractor);
      results.push(contractor);

      console.log(`  ✓ Generated ${company.name}`);

      // Small delay between requests to avoid rate limits
      if (i < toProcess.length - 1) {
        await sleep(1000);
      }
    } catch (error) {
      console.error(`  ✗ Failed to generate data for ${company.name}:`, error);
    }
  }

  return results;
}

// ===========================================
// Utilities
// ===========================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): {
  dryRun: boolean;
  limit?: number;
} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    limit: args.find((a) => a.startsWith("--limit="))?.split("=")[1]
      ? parseInt(args.find((a) => a.startsWith("--limit="))!.split("=")[1])
      : undefined,
  };
}

// ===========================================
// Main
// ===========================================

async function main() {
  const { dryRun, limit } = parseArgs();

  console.log("=".repeat(60));
  console.log("Mock Contractor Data Generator");
  console.log("=".repeat(60));
  console.log();
  console.log(`Input: ${TOP_100_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Limit: ${limit ? limit : "all U.S. companies"}`);
  console.log();

  // Parse Top 100 list
  console.log("Parsing Top 100 list...");
  const allCompanies = parseTop100Markdown();
  console.log(`  Found ${allCompanies.length} companies`);

  // Filter to U.S. companies
  console.log("Filtering to U.S. companies...");
  const usCompanies = filterUSCompanies(allCompanies);
  console.log(`  Found ${usCompanies.length} U.S. companies`);
  console.log();

  if (dryRun) {
    console.log("[DRY RUN] Would generate data for:");
    const toShow = limit ? usCompanies.slice(0, limit) : usCompanies;
    for (const company of toShow) {
      console.log(
        `  ${company.name} (#${company.rank}) - $${(company.defenseRevenue / 1_000_000_000).toFixed(2)}B defense revenue`,
      );
    }
    console.log();
    console.log("Run without --dry-run to generate data");
    return;
  }

  // Generate data (writes incrementally)
  console.log(
    `Generating mock data for ${limit ? limit : usCompanies.length} companies...`,
  );
  const contractors = await generateAllContractors(usCompanies, limit);
  console.log();
  console.log(`Generated data for ${contractors.length} contractors`);
  console.log();

  // Final count
  if (existsSync(OUTPUT_FILE)) {
    const finalContent = readFileSync(OUTPUT_FILE, "utf-8");
    const finalContractors: GeneratedContractor[] = JSON.parse(finalContent);
    console.log(`  ✓ Total contractors in file: ${finalContractors.length}`);
  }
  console.log();

  console.log("=".repeat(60));
  console.log("Complete!");
  console.log("=".repeat(60));
}

main().catch(console.error);
