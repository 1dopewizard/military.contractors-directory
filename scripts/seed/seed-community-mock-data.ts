#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Seed Community Intel Mock Data
 * 
 * Uses Vercel AI SDK with gpt-5.1 to generate realistic salary reports
 * and interview experiences, then inserts them into libSQL/Drizzle.
 * 
 * Usage:
 *   cd apps/contractors && npx tsx scripts/seed/seed-community-mock-data.ts
 *   cd apps/contractors && npx tsx scripts/seed/seed-community-mock-data.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/seed/seed-community-mock-data.ts --replace
 *   cd apps/contractors && npx tsx scripts/seed/seed-community-mock-data.ts --salaries-only
 *   cd apps/contractors && npx tsx scripts/seed/seed-community-mock-data.ts --interviews-only
 * 
 * Requires:
 *   - OPENAI_API_KEY or NUXT_OPENAI_API_KEY
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, isNull } from 'drizzle-orm'
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
const DEFAULT_SALARY_COUNT = 55
const DEFAULT_INTERVIEW_COUNT = 35
const BATCH_SIZE = 10 // Generate in batches to avoid token limits

// ===========================================
// Schemas
// ===========================================

const ClearanceLevelSchema = z.enum([
  'NONE',
  'PUBLIC_TRUST', 
  'SECRET',
  'TOP_SECRET',
  'TS_SCI',
  'TS_SCI_POLY'
])

const EmploymentTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'CONTRACT_TO_HIRE',
  'INTERN'
])

const InterviewDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD'])

const InterviewOutcomeSchema = z.enum(['OFFER', 'REJECTED', 'GHOSTED', 'WITHDREW'])

const SalaryReportSchema = z.object({
  mosCode: z.string().describe('MOS code (e.g., "25B", "35F", "17C")'),
  companySlug: z.string().describe('Company slug from: leidos, caci, mantech, booz-allen, saic, peraton, northrop-grumman, lockheed-martin, raytheon, general-dynamics, gdit, l3harris, bae-systems, kbr, amentum, v2x, fluor, parsons, jacobs'),
  location: z.string().describe('Location (e.g., "Northern Virginia", "Fort Meade, Maryland", "Stuttgart, Germany")'),
  baseSalary: z.number().min(40000).max(300000).describe('Annual base salary in USD'),
  signingBonus: z.number().nullable().describe('Signing bonus if any, or null'),
  clearanceLevel: ClearanceLevelSchema,
  yearsExperience: z.number().min(0).max(30).describe('Years of relevant experience'),
  employmentType: EmploymentTypeSchema,
  isOconus: z.boolean().describe('Whether position is overseas (OCONUS)'),
  helpfulCount: z.number().min(0).max(25).describe('Random helpful vote count'),
})

const InterviewExperienceSchema = z.object({
  companySlug: z.string().describe('Company slug from the list'),
  mosCode: z.string().describe('MOS code of the interviewee'),
  roleTitle: z.string().describe('Job title interviewed for (e.g., "Network Engineer III", "Intelligence Analyst")'),
  processDescription: z.string().describe('2-4 sentences describing the interview process'),
  questionsAsked: z.array(z.string()).min(2).max(10).describe('2-4 questions asked during the interview'),
  tips: z.string().describe('Actionable advice for others (2-3 sentences)'),
  difficulty: InterviewDifficultySchema,
  outcome: InterviewOutcomeSchema,
  timelineWeeks: z.number().min(1).max(12).describe('Total process length in weeks'),
  helpfulCount: z.number().min(0).max(25).describe('Random helpful vote count'),
})

const SalaryReportBatchSchema = z.object({
  entries: z.array(SalaryReportSchema)
})

const InterviewExperienceBatchSchema = z.object({
  entries: z.array(InterviewExperienceSchema)
})

type SalaryReport = z.infer<typeof SalaryReportSchema>
type InterviewExperience = z.infer<typeof InterviewExperienceSchema>

// ===========================================
// Data Configuration
// ===========================================

const TOP_COMPANIES = [
  'leidos', 'caci', 'mantech', 'booz-allen', 'saic', 'peraton',
  'northrop-grumman', 'lockheed-martin', 'raytheon', 'general-dynamics',
  'gdit', 'l3harris', 'bae-systems', 'kbr', 'amentum', 'v2x',
  'fluor', 'parsons', 'jacobs'
]

const TOP_MOS_CODES = [
  '25B', '25U', '35F', '35N', '17C', '25S', '25Q', '35T',
  '35M', '35P', '25W', '94F', '35L', '35S', '25D'
]

const LOCATIONS = [
  'Northern Virginia', 'Washington, DC Metro', 'Fort Meade, Maryland',
  'San Antonio, Texas', 'Tampa, Florida', 'Colorado Springs, Colorado',
  'Huntsville, Alabama', 'San Diego, California', 'Augusta, Georgia',
  'El Paso, Texas', 'Stuttgart, Germany', 'Ramstein, Germany',
  'Camp Humphreys, South Korea', 'Yokota AB, Japan', 'Camp Arifjan, Kuwait'
]


// ===========================================
// Generation Functions
// ===========================================

const SALARY_SYSTEM_PROMPT = `You are generating realistic salary report data for a community intel platform focused on defense contractor jobs.

These reports represent anonymous submissions from veterans and cleared professionals sharing their compensation data.

## Company Slugs (use EXACT slugs)
${TOP_COMPANIES.join(', ')}

## MOS Codes (focus on these high-volume codes)
${TOP_MOS_CODES.join(', ')}

## Locations
${LOCATIONS.join(', ')}

## Salary Guidelines by Category & Clearance
| MOS Category | Clearance | 0-2 yrs | 3-5 yrs | 6-10 yrs | 10+ yrs |
|--------------|-----------|---------|---------|----------|---------|
| IT_CYBER (25B, 25U, 17C) | Secret | $65K-$85K | $85K-$110K | $105K-$135K | $130K-$165K |
| IT_CYBER (25B, 25U, 17C) | TS/SCI | $80K-$105K | $100K-$130K | $125K-$160K | $155K-$200K |
| IT_CYBER (25B, 25U, 17C) | TS/SCI+Poly | $95K-$125K | $120K-$155K | $150K-$190K | $180K-$240K |
| INTELLIGENCE (35F, 35N, 35M) | TS/SCI | $75K-$100K | $95K-$125K | $120K-$155K | $150K-$195K |
| INTELLIGENCE (35F, 35N, 35M) | TS/SCI+Poly | $90K-$120K | $115K-$150K | $145K-$185K | $175K-$230K |
| COMMUNICATIONS (25S, 25Q, 25W) | Secret | $55K-$75K | $75K-$95K | $90K-$115K | $110K-$140K |

## Rules
1. Salaries should reflect REALISTIC market rates
2. 70% CONUS locations, 30% OCONUS
3. OCONUS pays 10-25% more
4. 25% of reports should include signing bonuses ($5K-$25K)
5. 85% FULL_TIME, 10% CONTRACT, 5% other
6. Helpful counts: random 0-25
7. Each entry should feel like a real person's data point
8. Vary companies - don't cluster on one`

const INTERVIEW_SYSTEM_PROMPT = `You are generating realistic interview experience data for a community intel platform.

These reports represent anonymous submissions from veterans sharing their interview experiences.

## Company Slugs (use EXACT slugs)
${TOP_COMPANIES.join(', ')}

## MOS Codes
${TOP_MOS_CODES.join(', ')}

## Typical Interview Processes
### Large Primes (Leidos, CACI, Booz Allen)
1. Recruiter phone screen (15-30 min)
2. Hiring manager technical interview (45-60 min)
3. Panel interview with team (30-60 min)
Timeline: 2-4 weeks

### Mid-size Contractors
1. Phone screen with recruiter
2. Technical interview with hiring manager
Timeline: 1-3 weeks

## Rules
1. Process descriptions: 2-4 sentences, realistic flow
2. Questions: specific to MOS/role
3. Tips: actionable, company-specific
4. Outcome distribution: ~60% OFFER, ~25% REJECTED, ~10% GHOSTED, ~5% WITHDREW
5. Difficulty: ~20% EASY, ~60% MEDIUM, ~20% HARD
6. Timeline should match company size
7. Helpful counts: random 0-20`

async function generateSalaryReportBatch(count: number): Promise<SalaryReport[]> {
  console.log(`  Generating ${count} salary reports...`)
  
  // NOTE: Always use gpt-5.1 for seeding scripts - do not downgrade to gpt-4o
  const { object } = await generateObject({
    model: openai('gpt-5.1'),
    schema: SalaryReportBatchSchema,
    system: SALARY_SYSTEM_PROMPT,
    prompt: `Generate ${count} unique, realistic salary reports for defense contractors. Vary companies, MOS codes, locations, and experience levels. Include signing bonuses for ~25% of reports.`,
  })

  console.log(`  Generated ${object.entries.length} salary reports`)
  return object.entries
}

async function generateInterviewExperienceBatch(count: number): Promise<InterviewExperience[]> {
  console.log(`  Generating ${count} interview experiences...`)
  
  // NOTE: Always use gpt-5.1 for seeding scripts - do not downgrade to gpt-4o
  const { object } = await generateObject({
    model: openai('gpt-5.1'),
    schema: InterviewExperienceBatchSchema,
    system: INTERVIEW_SYSTEM_PROMPT,
    prompt: `Generate ${count} unique, realistic interview experience reports for defense contractors. Vary companies, outcomes, difficulties, and roles. Make questions specific to the MOS/role combination.`,
  })

  console.log(`  Generated ${object.entries.length} interview experiences`)
  return object.entries
}

async function generateAllSalaryReports(total: number): Promise<SalaryReport[]> {
  const allReports: SalaryReport[] = []
  let remaining = total

  while (remaining > 0) {
    const batchSize = Math.min(remaining, BATCH_SIZE)
    const batch = await generateSalaryReportBatch(batchSize)
    allReports.push(...batch)
    remaining -= batch.length
    
    if (remaining > 0) {
      await sleep(500) // Small delay between batches
    }
  }

  return allReports
}

async function generateAllInterviewExperiences(total: number): Promise<InterviewExperience[]> {
  const allExperiences: InterviewExperience[] = []
  let remaining = total

  while (remaining > 0) {
    const batchSize = Math.min(remaining, BATCH_SIZE)
    const batch = await generateInterviewExperienceBatch(batchSize)
    allExperiences.push(...batch)
    remaining -= batch.length
    
    if (remaining > 0) {
      await sleep(500)
    }
  }

  return allExperiences
}

// ===========================================
// Insertion Functions
// ===========================================

async function insertSalaryReport(report: SalaryReport): Promise<string> {
  // Look up company by slug
  const company = await db.query.company.findFirst({
    where: eq(schema.company.slug, report.companySlug)
  })

  if (!company) {
    throw new Error(`Company with slug "${report.companySlug}" not found`)
  }

  // Look up MOS by code
  const mos = await db.query.mosCode.findFirst({
    where: eq(schema.mosCode.code, report.mosCode.toUpperCase())
  })

  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(schema.salaryReport).values({
    id,
    mosCode: report.mosCode.toUpperCase(),
    mosId: mos?.id,
    companyId: company.id,
    location: report.location,
    baseSalary: report.baseSalary,
    signingBonus: report.signingBonus ?? undefined,
    clearanceLevel: report.clearanceLevel,
    yearsExperience: report.yearsExperience,
    employmentType: report.employmentType,
    isOconus: report.isOconus,
    verificationStatus: 'VERIFIED',
    submittedBy: undefined, // Mock data has no submitter
    helpfulCount: report.helpfulCount,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

async function insertInterviewExperience(experience: InterviewExperience): Promise<string> {
  // Look up company by slug
  const company = await db.query.company.findFirst({
    where: eq(schema.company.slug, experience.companySlug)
  })

  if (!company) {
    throw new Error(`Company with slug "${experience.companySlug}" not found`)
  }

  // Look up MOS by code
  const mos = await db.query.mosCode.findFirst({
    where: eq(schema.mosCode.code, experience.mosCode.toUpperCase())
  })

  const now = new Date()
  const id = crypto.randomUUID()

  // Generate a recent interview date (within last 6 months)
  const interviewDate = new Date(now.getTime() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000))

  await db.insert(schema.interviewExperience).values({
    id,
    companyId: company.id,
    mosCode: experience.mosCode.toUpperCase(),
    mosId: mos?.id,
    roleTitle: experience.roleTitle,
    interviewDate,
    processDescription: experience.processDescription,
    questionsAsked: experience.questionsAsked,
    tips: experience.tips,
    difficulty: experience.difficulty,
    outcome: experience.outcome,
    timelineWeeks: experience.timelineWeeks,
    verificationStatus: 'VERIFIED',
    submittedBy: undefined, // Mock data has no submitter
    helpfulCount: experience.helpfulCount,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

async function clearMockData(): Promise<{ deletedSalaryReports: number; deletedInterviewExperiences: number; deletedHelpfulVotes: number }> {
  // Delete all salary reports (mock data has no submittedBy)
  const salaryReports = await db.query.salaryReport.findMany({
    where: isNull(schema.salaryReport.submittedBy)
  })
  
  let deletedSalaryReports = 0
  for (const report of salaryReports) {
    await db.delete(schema.salaryReport).where(eq(schema.salaryReport.id, report.id as string))
    deletedSalaryReports++
  }

  // Delete all interview experiences (mock data has no submittedBy)
  const interviewExperiences = await db.query.interviewExperience.findMany({
    where: isNull(schema.interviewExperience.submittedBy)
  })
  
  let deletedInterviewExperiences = 0
  for (const exp of interviewExperiences) {
    await db.delete(schema.interviewExperience).where(eq(schema.interviewExperience.id, exp.id as string))
    deletedInterviewExperiences++
  }

  // Delete all helpful votes
  const helpfulVotes = await db.query.helpfulVote.findMany()
  for (const vote of helpfulVotes) {
    await db.delete(schema.helpfulVote).where(eq(schema.helpfulVote.id, vote.id as string))
  }

  return {
    deletedSalaryReports,
    deletedInterviewExperiences,
    deletedHelpfulVotes: helpfulVotes.length,
  }
}

// ===========================================
// Utilities
// ===========================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseArgs(): {
  dryRun: boolean
  replace: boolean
  salariesOnly: boolean
  interviewsOnly: boolean
  salaryCount: number
  interviewCount: number
} {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    replace: args.includes('--replace'),
    salariesOnly: args.includes('--salaries-only'),
    interviewsOnly: args.includes('--interviews-only'),
    salaryCount: parseInt(args.find(a => a.startsWith('--salaries='))?.split('=')[1] || '') || DEFAULT_SALARY_COUNT,
    interviewCount: parseInt(args.find(a => a.startsWith('--interviews='))?.split('=')[1] || '') || DEFAULT_INTERVIEW_COUNT,
  }
}

// ===========================================
// Main
// ===========================================

async function main() {
  const { dryRun, replace, salariesOnly, interviewsOnly, salaryCount, interviewCount } = parseArgs()

  console.log('='.repeat(60))
  console.log('Community Intel Mock Data Generator')
  console.log('='.repeat(60))
  console.log()
  console.log(`Database: ${dbPath}`)
  console.log(`Dry Run: ${dryRun}`)
  console.log(`Replace: ${replace}`)
  console.log()

  // Clear existing mock data if --replace flag is set
  if (replace && !dryRun) {
    console.log('Clearing existing mock data...')
    const deleted = await clearMockData()
    console.log(`  Deleted ${deleted.deletedSalaryReports} salary reports`)
    console.log(`  Deleted ${deleted.deletedInterviewExperiences} interview experiences`)
    console.log()
  }

  // Generate and insert salary reports
  if (!interviewsOnly) {
    console.log(`Generating ${salaryCount} salary reports...`)
    const salaryReports = await generateAllSalaryReports(salaryCount)
    console.log()

    if (dryRun) {
      console.log('[DRY RUN] Sample salary reports:')
      for (const report of salaryReports.slice(0, 5)) {
        console.log(`  ${report.mosCode} @ ${report.companySlug}, ${report.location}: $${report.baseSalary.toLocaleString()} (${report.clearanceLevel})`)
      }
      if (salaryReports.length > 5) {
        console.log(`  ... and ${salaryReports.length - 5} more`)
      }
    } else {
      console.log('Inserting salary reports...')
      let inserted = 0
      for (const report of salaryReports) {
        try {
          await insertSalaryReport(report)
          inserted++
          if (inserted % 10 === 0) {
            console.log(`  Inserted ${inserted}/${salaryReports.length} salary reports`)
          }
        } catch (error) {
          console.error(`  Failed to insert salary report:`, error)
        }
      }
      console.log(`  Total inserted: ${inserted}/${salaryReports.length} salary reports`)
    }
    console.log()
  }

  // Generate and insert interview experiences
  if (!salariesOnly) {
    console.log(`Generating ${interviewCount} interview experiences...`)
    const interviewExperiences = await generateAllInterviewExperiences(interviewCount)
    console.log()

    if (dryRun) {
      console.log('[DRY RUN] Sample interview experiences:')
      for (const exp of interviewExperiences.slice(0, 5)) {
        console.log(`  ${exp.mosCode} @ ${exp.companySlug} - ${exp.roleTitle} (${exp.outcome}, ${exp.difficulty})`)
      }
      if (interviewExperiences.length > 5) {
        console.log(`  ... and ${interviewExperiences.length - 5} more`)
      }
    } else {
      console.log('Inserting interview experiences...')
      let inserted = 0
      for (const exp of interviewExperiences) {
        try {
          await insertInterviewExperience(exp)
          inserted++
          if (inserted % 10 === 0) {
            console.log(`  Inserted ${inserted}/${interviewExperiences.length} interview experiences`)
          }
        } catch (error) {
          console.error(`  Failed to insert interview experience:`, error)
        }
      }
      console.log(`  Total inserted: ${inserted}/${interviewExperiences.length} interview experiences`)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('Complete!')
  console.log('='.repeat(60))
  
  // Clean up
  client.close()
}

main().catch(console.error)
