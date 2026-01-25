#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Seed Mock Jobs Data
 * 
 * Uses Vercel AI SDK with gpt-4o to generate realistic OCONUS defense contractor
 * job listings, then inserts them into libSQL/Drizzle.
 * 
 * Usage:
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-jobs.ts
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-jobs.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-jobs.ts --replace
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-jobs.ts --count=100
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-jobs.ts --category=IT_CYBER
 * 
 * Requires:
 *   - OPENAI_API_KEY or NUXT_OPENAI_API_KEY
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, and, like } from 'drizzle-orm'
import { resolve } from 'path'
import * as schema from '../../server/database/schema'

// ===========================================
// Configuration
// ===========================================

const dbPath = resolve(process.cwd(), 'server/database/app.db')
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY or NUXT_OPENAI_API_KEY')
  process.exit(1)
}

// Set the API key for the OpenAI SDK
process.env.OPENAI_API_KEY = OPENAI_API_KEY

// Create libSQL client and Drizzle instance
const client = createClient({ url: `file:${dbPath}` })
const db = drizzle(client, { schema })

// Defaults
const DEFAULT_JOB_COUNT = 50
const BATCH_SIZE = 10 // Generate in batches to avoid token limits

// ===========================================
// Schemas
// ===========================================

const TheaterSchema = z.enum(['CENTCOM', 'EUCOM', 'INDOPACOM', 'AFRICOM', 'SOUTHCOM'])

const ClearanceLevelSchema = z.enum(['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS/SCI'])

const PolygraphSchema = z.enum(['NONE', 'CI', 'FS'])

const SenioritySchema = z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'PRINCIPAL'])

const EmploymentTypeSchema = z.enum(['FULL_TIME', 'CONTRACT', 'CONTRACT_TO_HIRE'])

const SponsorCategorySchema = z.enum(['WILL_SPONSOR', 'ELIGIBLE_TO_OBTAIN', 'ACTIVE_ONLY', 'NOT_SPECIFIED'])

const LocationTypeSchema = z.enum(['ONSITE', 'DEPLOYED'])

const DomainTagSchema = z.enum(['IT', 'CYBER', 'INTEL', 'COMMS', 'EW', 'SECURITY', 'SATCOM', 'ISR'])

const BenefitSchema = z.enum([
  'HEALTH', 'DENTAL', 'VISION', 'RETIREMENT_401K', 'BONUS', 'RELOCATION',
  'PER_DIEM', 'HOUSING', 'HARDSHIP_PAY', 'TRANSPORTATION', 'TUITION_REIMBURSEMENT'
])

const EducationLevelSchema = z.enum(['HS', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'NONE'])

const ShiftSchema = z.enum(['DAY', 'NIGHT', 'ROTATING', 'FLEX', 'NOT_STATED'])

const ContractTypeSchema = z.enum(['PRIME', 'SUBCONTRACT', 'DIRECT_HIRE'])

// Structured data schemas
const LocationDataSchema = z.object({
  type: LocationTypeSchema,
  city: z.string(),
  country: z.string(),
  isoCountry: z.string(),
  region: z.literal('OCONUS'),
  theater: TheaterSchema,
  siteNameOrBase: z.string().nullable(),
  travelPercent: z.number().nullable(),
})

const ClearanceDataSchema = z.object({
  level: ClearanceLevelSchema,
  polygraph: PolygraphSchema,
  activeRequired: z.boolean(),
  usCitizenshipRequired: z.boolean(),
  sponsorAvailable: z.boolean().nullable(),
})

const CompensationDataSchema = z.object({
  rateType: z.literal('SALARY'),
  currency: z.literal('USD'),
  min: z.number(),
  max: z.number(),
  period: z.literal('year'),
  normalizedAnnualUSD: z.number(),
  benefits: z.array(BenefitSchema),
  perDiemDailyUSD: z.number().nullable(),
  housingProvided: z.boolean().nullable(),
  hardshipEligible: z.boolean().nullable(),
})

const EducationSchema = z.object({
  level: EducationLevelSchema,
  fields: z.array(z.string()).nullable(),
  acceptsEquivalency: z.boolean(),
})

const QualificationsDataSchema = z.object({
  yearsExperienceMin: z.number(),
  education: EducationSchema,
  required: z.array(z.string()),
  preferred: z.array(z.string()).nullable(),
  certs: z.array(z.string()).nullable(),
  languages: z.array(z.string()).nullable(),
})

const ContractDataSchema = z.object({
  type: ContractTypeSchema,
  programOrMission: z.string().nullable(),
  vehicleOrIDIQ: z.string().nullable(),
  durationMonths: z.number().nullable(),
})

const ComplianceDataSchema = z.object({
  itar: z.boolean().nullable(),
  drugTest: z.boolean().nullable(),
  backgroundCheck: z.boolean().nullable(),
})

const PostingDataSchema = z.object({
  shift: ShiftSchema,
})

const MilitaryMappingSchema = z.object({
  service: z.array(z.string()).nullable(),
  mos: z.array(z.string()).nullable(),
  afsc: z.array(z.string()).nullable(),
  billetKeywords: z.array(z.string()).nullable(),
})

const GeneratedJobSchema = z.object({
  title: z.string(),
  companySlug: z.string(),
  location: z.string(),
  description: z.string().max(268),
  snippet: z.string().max(200),
  requirements: z.array(z.string()),
  clearanceRequired: z.string(),
  locationType: LocationTypeSchema,
  salaryMin: z.number(),
  salaryMax: z.number(),
  theater: TheaterSchema,
  sponsorCategory: SponsorCategorySchema,
  seniority: SenioritySchema,
  employmentType: EmploymentTypeSchema,
  postedDaysAgo: z.number().min(1).max(30),
  // Structured data
  locationData: LocationDataSchema,
  clearanceData: ClearanceDataSchema,
  compensationData: CompensationDataSchema,
  qualificationsData: QualificationsDataSchema,
  contractData: ContractDataSchema,
  responsibilitiesData: z.array(z.string()),
  toolsTech: z.array(z.string()),
  domainTags: z.array(DomainTagSchema),
  complianceData: ComplianceDataSchema,
  postingData: PostingDataSchema,
  militaryMapping: MilitaryMappingSchema,
})

const GeneratedJobBatchSchema = z.object({
  entries: z.array(GeneratedJobSchema),
})

type GeneratedJob = z.infer<typeof GeneratedJobSchema>

// ===========================================
// Data Configuration
// ===========================================

const TOP_COMPANIES = [
  'leidos', 'caci', 'mantech', 'booz-allen', 'saic', 'peraton',
  'northrop-grumman', 'lockheed-martin', 'raytheon', 'general-dynamics',
  'gdit', 'l3harris', 'bae-systems', 'kbr', 'amentum', 'v2x',
  'fluor', 'parsons', 'jacobs'
]

const JOB_CATEGORIES = ['IT_CYBER', 'INTELLIGENCE', 'COMMUNICATIONS'] as const

// ===========================================
// Generation Functions
// ===========================================

const SYSTEM_PROMPT = `You are generating realistic OCONUS (overseas) defense contractor job listings.

## CRITICAL: ALL JOBS MUST BE OCONUS (OVERSEAS)
Every job MUST be located outside the continental United States.
- region: ALWAYS "OCONUS"
- locationType: ONSITE or DEPLOYED (never Remote)
- theater: ALWAYS specify one of EUCOM, INDOPACOM, CENTCOM, AFRICOM, or SOUTHCOM

## Company Slugs (use EXACT slugs)
${TOP_COMPANIES.join(', ')}

## Location Distribution (ALL OCONUS)
- 35% EUCOM: Germany (Stuttgart, Ramstein, Wiesbaden), UK, Italy, Spain
- 30% INDOPACOM: South Korea (Camp Humphreys, Osan), Japan (Yokosuka, Yokota, Kadena), Guam
- 25% CENTCOM: Kuwait (Camp Arifjan), Qatar (Al Udeid), Bahrain, UAE
- 7% AFRICOM: Djibouti (Camp Lemonnier), Kenya
- 3% SOUTHCOM: Honduras (Soto Cano)

## OCONUS Salary Guidelines (includes overseas allowances)
| Level | Clearance | Base + Allowances |
|-------|-----------|-------------------|
| JUNIOR | Secret | $85K-$125K |
| MID | TS | $125K-$180K |
| SENIOR | TS/SCI | $180K-$250K |
| LEAD | TS/SCI | $230K-$320K |

## Clearance Distribution
- 5% None
- 15% Secret
- 40% Top Secret
- 35% TS/SCI
- 5% TS/SCI with Poly

## Seniority Distribution
- 15% JUNIOR (0-2 years)
- 35% MID (3-5 years)
- 35% SENIOR (6-10 years)
- 10% LEAD (10+ years)
- 5% MANAGER/DIRECTOR

## Domain Tags (1-3 per job)
IT, CYBER, INTEL, COMMS, EW, SECURITY, SATCOM, ISR

## OCONUS Benefits
ALL jobs: HOUSING, TRANSPORTATION, PER_DIEM, RELOCATION, HEALTH, DENTAL, VISION, RETIREMENT_401K
Hazard zones (CENTCOM, AFRICOM): HARDSHIP_PAY

## Rules
1. description: 2-3 sentences, MAX 268 characters
2. snippet: 1 sentence summary, MAX 200 characters
3. requirements: 5-8 bullet points, MAX 80 chars each
4. responsibilitiesData: 5-8 action-verb duties, MAX 80 chars each
5. toolsTech: relevant tools/technologies
6. clearanceRequired: human-readable ("Secret", "Top Secret", "TS/SCI", "TS/SCI with Poly")
7. qualificationsData.certs: include relevant certs (Security+, CISSP, etc.)
8. Vary companies, locations, seniority, and clearance levels`

async function generateJobBatch(
  count: number,
  category?: string
): Promise<GeneratedJob[]> {
  console.log(`  Generating ${count} jobs${category ? ` (${category})` : ''}...`)

  const categoryInstruction = category
    ? `\n\nFocus on **${category}** jobs for this batch.`
    : '\n\nInclude a mix of IT_CYBER, INTELLIGENCE, and COMMUNICATIONS jobs.'

  // NOTE: Always use gpt-5.1 for seeding scripts - do not downgrade to gpt-4o
  const { object } = await generateObject({
    model: openai('gpt-5.1'),
    schema: GeneratedJobBatchSchema,
    system: SYSTEM_PROMPT,
    prompt: `Generate ${count} unique OCONUS defense contractor job listings with rich structured data.${categoryInstruction}

Each job should have realistic:
- Title and company from the company list
- OCONUS location matching the theater distribution
- Salary range appropriate for seniority and clearance
- 5-8 requirements and responsibilities
- Relevant tools/tech and certifications
- Domain tags matching the job focus

Ensure variety across companies, theaters, seniority levels, and clearance requirements.`,
  })

  console.log(`  Generated ${object.entries.length} jobs`)
  return object.entries
}

async function generateAllJobs(
  total: number,
  category?: string
): Promise<GeneratedJob[]> {
  const allJobs: GeneratedJob[] = []
  let remaining = total

  while (remaining > 0) {
    const batchSize = Math.min(remaining, BATCH_SIZE)
    const batch = await generateJobBatch(batchSize, category)
    allJobs.push(...batch)
    remaining -= batch.length

    if (remaining > 0) {
      await sleep(500) // Small delay between batches
    }
  }

  return allJobs
}

// ===========================================
// Insertion Functions
// ===========================================

async function insertJob(job: GeneratedJob): Promise<string> {
  // Look up company by slug
  const company = await db.query.company.findFirst({
    where: eq(schema.company.slug, job.companySlug)
  })

  if (!company) {
    throw new Error(`Company with slug "${job.companySlug}" not found`)
  }

  const now = new Date()
  const postedAt = new Date(now.getTime() - job.postedDaysAgo * 24 * 60 * 60 * 1000)
  const id = crypto.randomUUID()
  const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 8)}`

  await db.insert(schema.job).values({
    id,
    title: job.title,
    company: company.name,
    companyId: company.id,
    location: job.location,
    locationType: job.locationType,
    description: job.description,
    snippet: job.snippet,
    requirements: job.requirements,
    clearanceRequired: job.clearanceRequired,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: 'USD',
    theater: job.theater,
    isOconus: true,
    sponsorCategory: job.sponsorCategory,
    seniority: job.seniority,
    employmentType: job.employmentType,
    status: 'ACTIVE',
    isActive: true,
    slug,
    sourceType: 'admin_created',
    postedAt,
    // Structured data
    locationData: {
      ...job.locationData,
      state: null,
    },
    clearanceData: job.clearanceData,
    compensationData: job.compensationData,
    qualificationsData: job.qualificationsData,
    contractData: job.contractData,
    responsibilitiesData: job.responsibilitiesData,
    toolsTech: job.toolsTech,
    domainTags: job.domainTags,
    complianceData: job.complianceData,
    postingData: job.postingData,
    militaryMapping: job.militaryMapping,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

async function clearMockJobs(): Promise<{ deleted: number }> {
  // Delete all jobs with sourceType 'admin_created'
  const mockJobs = await db.query.job.findMany({
    where: eq(schema.job.sourceType, 'admin_created')
  })

  let deleted = 0
  for (const job of mockJobs) {
    await db.delete(schema.job).where(eq(schema.job.id, job.id))
    deleted++
  }

  return { deleted }
}

// ===========================================
// Utilities
// ===========================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(): {
  dryRun: boolean
  replace: boolean
  count: number
  category?: string
} {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    replace: args.includes('--replace'),
    count: parseInt(args.find((a) => a.startsWith('--count='))?.split('=')[1] || '') || DEFAULT_JOB_COUNT,
    category: args.find((a) => a.startsWith('--category='))?.split('=')[1] as typeof JOB_CATEGORIES[number] | undefined,
  }
}

// ===========================================
// Main
// ===========================================

async function main() {
  const { dryRun, replace, count, category } = parseArgs()

  console.log('='.repeat(60))
  console.log('Mock Jobs Data Generator')
  console.log('='.repeat(60))
  console.log()
  console.log(`Database: ${dbPath}`)
  console.log(`Dry Run: ${dryRun}`)
  console.log(`Replace: ${replace}`)
  console.log(`Count: ${count}`)
  console.log(`Category: ${category ?? 'mixed'}`)
  console.log()

  // Clear existing mock data if --replace flag is set
  if (replace && !dryRun) {
    console.log('Clearing existing mock jobs...')
    const { deleted } = await clearMockJobs()
    console.log(`  Deleted ${deleted} mock jobs`)
    console.log()
  }

  // Generate jobs
  console.log(`Generating ${count} mock jobs...`)
  const jobs = await generateAllJobs(count, category)
  console.log()

  if (dryRun) {
    console.log('[DRY RUN] Sample jobs:')
    for (const job of jobs.slice(0, 5)) {
      console.log(`  ${job.title} @ ${job.companySlug}`)
      console.log(`    ${job.location} (${job.theater}) - ${job.clearanceRequired}`)
      console.log(`    $${job.salaryMin.toLocaleString()}-$${job.salaryMax.toLocaleString()} | ${job.seniority}`)
    }
    if (jobs.length > 5) {
      console.log(`  ... and ${jobs.length - 5} more`)
    }
  } else {
    console.log('Inserting jobs...')
    let inserted = 0
    for (const job of jobs) {
      try {
        await insertJob(job)
        inserted++
        if (inserted % 10 === 0) {
          console.log(`  Inserted ${inserted}/${jobs.length} jobs`)
        }
      } catch (error) {
        console.error(`  Failed to insert job "${job.title}":`, error)
      }
    }
    console.log(`  Total inserted: ${inserted}/${jobs.length} jobs`)
  }

  console.log()
  console.log('='.repeat(60))
  console.log('Complete!')
  console.log('='.repeat(60))
  
  // Clean up
  client.close()
}

main().catch(console.error)
