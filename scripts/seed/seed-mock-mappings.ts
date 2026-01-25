#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Seed Mock Job-MOS Mappings
 * 
 * Uses Vercel AI SDK with gpt-4o to generate job-to-MOS mappings for existing
 * jobs, then inserts them into libSQL/Drizzle.
 * 
 * Usage:
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-mappings.ts
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-mappings.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-mappings.ts --replace
 *   cd apps/contractors && npx tsx scripts/seed/seed-mock-mappings.ts --job-limit=50
 * 
 * Requires:
 *   - OPENAI_API_KEY or NUXT_OPENAI_API_KEY
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, and, inArray } from 'drizzle-orm'
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
const DEFAULT_JOB_LIMIT = 100
const JOBS_PER_BATCH = 15 // Process jobs in batches for LLM

// ===========================================
// Types
// ===========================================

interface JobSummary {
  id: string
  title: string
  company: string
  description: string
  clearanceRequired?: string | null
  domainTags?: string[] | null
  toolsTech?: string[] | null
}

interface MosCodeSummary {
  code: string
  name: string
  branch: string
  mosCategory?: string | null
  coreSkills?: string[] | null
  civilianRoles?: string[] | null
}

// ===========================================
// Schemas
// ===========================================

const MatchStrengthSchema = z.enum(['STRONG', 'MEDIUM', 'WEAK'])

const GeneratedMappingSchema = z.object({
  jobIndex: z.number().describe('Index of the job in the provided list (0-based)'),
  mosCode: z.string().describe('MOS code from the valid MOS list'),
  matchStrength: MatchStrengthSchema.describe('Match strength: STRONG (0.85-1.0), MEDIUM (0.65-0.84), WEAK (0.45-0.64)'),
  confidenceScore: z.number().min(0.45).max(1.0).describe('Confidence score 0.45-1.0'),
  mappingReason: z.string().describe('1-2 sentence explanation of why this MOS fits this job'),
})

const GeneratedMappingBatchSchema = z.object({
  entries: z.array(GeneratedMappingSchema),
})

type GeneratedMapping = z.infer<typeof GeneratedMappingSchema>

// ===========================================
// Data Fetching
// ===========================================

async function fetchActiveJobs(limit: number): Promise<JobSummary[]> {
  const jobs = await db.query.job.findMany({
    where: eq(schema.job.status, 'ACTIVE'),
    limit: Math.min(limit, 200),
  })

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description,
    clearanceRequired: job.clearanceRequired,
    domainTags: job.domainTags,
    toolsTech: job.toolsTech,
  }))
}

async function fetchMosCodes(): Promise<MosCodeSummary[]> {
  // Fetch MOS codes from the three target categories
  const categories = ['IT_CYBER', 'INTELLIGENCE', 'COMMUNICATIONS']
  
  const mosCodes = await db.query.mosCode.findMany({
    where: inArray(schema.mosCode.mosCategory, categories),
    limit: 300,
  })

  return mosCodes.map((mos) => ({
    code: mos.code,
    name: mos.name,
    branch: mos.branch,
    mosCategory: mos.mosCategory,
    coreSkills: mos.coreSkills,
    civilianRoles: mos.civilianRoles,
  }))
}

// ===========================================
// Generation Functions
// ===========================================

const SYSTEM_PROMPT = `You are generating job-to-MOS mappings for a veteran career platform.

## Match Strength Guidelines

**STRONG (confidence 0.85-1.0):**
- Direct skill overlap (e.g., 25B → Systems Administrator)
- Same domain (e.g., 17C → Cyber Security Analyst)
- Military-to-civilian role translation is obvious

**MEDIUM (confidence 0.65-0.84):**
- Related skills that transfer well
- Adjacent domain (e.g., 35F Intel Analyst → Data Analyst)
- Some additional training may be needed

**WEAK (confidence 0.45-0.64):**
- Transferable soft skills (leadership, operations)
- General military experience relevant
- Significant upskilling required

## Rules
- Each job should have 2-5 MOS mappings
- Include 1-2 STRONG, 1-2 MEDIUM, 0-1 WEAK per job
- Cross-reference skills, clearances, and domains
- Write concise mapping reasons (1-2 sentences)
- Only use MOS codes from the provided valid list
- Consider clearance levels and technical requirements

Return a JSON object with an "entries" array of mappings.`

function buildMosContext(mosCodes: MosCodeSummary[]): string {
  // Group MOS by category for better organization
  const byCategory: Record<string, string[]> = {}
  for (const mos of mosCodes) {
    const cat = mos.mosCategory ?? 'Other'
    if (!byCategory[cat]) {
      byCategory[cat] = []
    }
    byCategory[cat].push(`${mos.code} (${mos.name})`)
  }

  const lines = Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, codes]) => `**${cat}**: ${codes.join(', ')}`)

  return lines.join('\n')
}

function buildJobsContext(jobs: JobSummary[]): string {
  return jobs
    .map((job, index) => {
      const domains = job.domainTags?.join(', ') || 'N/A'
      const tech = job.toolsTech?.slice(0, 5).join(', ') || 'N/A'
      return `[${index}] **${job.title}** at ${job.company}
   Clearance: ${job.clearanceRequired || 'N/A'}
   Domains: ${domains}
   Tech: ${tech}
   Description: ${job.description.substring(0, 200)}...`
    })
    .join('\n\n')
}

async function generateMappingsBatch(
  jobs: JobSummary[],
  mosCodes: MosCodeSummary[]
): Promise<GeneratedMapping[]> {
  console.log(`  Generating mappings for ${jobs.length} jobs against ${mosCodes.length} MOS codes...`)

  const mosContext = buildMosContext(mosCodes)
  const jobsContext = buildJobsContext(jobs)

  // NOTE: Always use gpt-5.1 for seeding scripts - do not downgrade to gpt-4o
  const { object } = await generateObject({
    model: openai('gpt-5.1'),
    schema: GeneratedMappingBatchSchema,
    system: SYSTEM_PROMPT,
    prompt: `Generate job-to-MOS mappings for the following jobs.

## VALID MOS CODES (use ONLY these exact codes):
${mosContext}

## Jobs to Map (use index number):
${jobsContext}

CRITICAL: You must ONLY use MOS codes from the "VALID MOS CODES" list above. Do NOT invent codes.

For each job (by index), generate 2-5 mappings with:
- jobIndex: The job index from the list (0-based)
- mosCode: The EXACT MOS code from the valid list
- matchStrength: STRONG|MEDIUM|WEAK
- confidenceScore: 0.45-1.0
- mappingReason: Why this MOS fits this job (1-2 sentences)

Generate mappings now.`,
  })

  console.log(`  Generated ${object.entries.length} mappings`)
  return object.entries
}

// ===========================================
// Insertion Functions
// ===========================================

async function insertMapping(
  jobId: string,
  mapping: GeneratedMapping,
  mosCodes: MosCodeSummary[]
): Promise<string | null> {
  // Find MOS by code
  const mosRecord = await db.query.mosCode.findFirst({
    where: eq(schema.mosCode.code, mapping.mosCode.toUpperCase())
  })

  if (!mosRecord) {
    // MOS code not found in database
    return null
  }

  // Calculate match score from strength
  const matchScore = mapping.matchStrength === 'STRONG' 
    ? mapping.confidenceScore
    : mapping.matchStrength === 'MEDIUM'
    ? mapping.confidenceScore * 0.9
    : mapping.confidenceScore * 0.7

  // Check if mapping already exists
  const existing = await db.query.jobMosMapping.findFirst({
    where: and(
      eq(schema.jobMosMapping.jobId, jobId),
      eq(schema.jobMosMapping.mosId, mosRecord.id)
    )
  })

  if (existing) {
    // Update existing mapping
    await db.update(schema.jobMosMapping)
      .set({
        matchScore,
        explanation: mapping.mappingReason,
        mappingSource: 'LLM',
      })
      .where(eq(schema.jobMosMapping.id, existing.id))
    return existing.id
  }

  // Insert new mapping
  const id = crypto.randomUUID()
  await db.insert(schema.jobMosMapping).values({
    id,
    jobId,
    mosId: mosRecord.id,
    matchScore,
    explanation: mapping.mappingReason,
    mappingSource: 'LLM',
    createdAt: new Date(),
  })

  return id
}

async function clearMockMappings(): Promise<{ deleted: number }> {
  // Delete all mappings with mappingSource 'LLM'
  const mockMappings = await db.query.jobMosMapping.findMany({
    where: eq(schema.jobMosMapping.mappingSource, 'LLM')
  })

  let deleted = 0
  for (const mapping of mockMappings) {
    await db.delete(schema.jobMosMapping).where(eq(schema.jobMosMapping.id, mapping.id))
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
  jobLimit: number
} {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    replace: args.includes('--replace'),
    jobLimit: parseInt(args.find((a) => a.startsWith('--job-limit='))?.split('=')[1] || '') || DEFAULT_JOB_LIMIT,
  }
}

// ===========================================
// Main
// ===========================================

async function main() {
  const { dryRun, replace, jobLimit } = parseArgs()

  console.log('='.repeat(60))
  console.log('Mock Job-MOS Mappings Generator')
  console.log('='.repeat(60))
  console.log()
  console.log(`Database: ${dbPath}`)
  console.log(`Dry Run: ${dryRun}`)
  console.log(`Replace: ${replace}`)
  console.log(`Job Limit: ${jobLimit}`)
  console.log()

  // Clear existing mock mappings if --replace flag is set
  if (replace && !dryRun) {
    console.log('Clearing existing mock mappings...')
    const { deleted } = await clearMockMappings()
    console.log(`  Deleted ${deleted} mock mappings`)
    console.log()
  }

  // Fetch data
  console.log('Fetching MOS codes...')
  const mosCodes = await fetchMosCodes()
  console.log(`  Loaded ${mosCodes.length} MOS codes`)

  console.log('Fetching active jobs...')
  const jobs = await fetchActiveJobs(jobLimit)
  console.log(`  Loaded ${jobs.length} jobs`)
  console.log()

  if (jobs.length === 0) {
    console.log('No jobs to map. Run seed-mock-jobs.ts first.')
    client.close()
    return
  }

  if (mosCodes.length === 0) {
    console.log('No MOS codes found in target categories.')
    client.close()
    return
  }

  // Process jobs in batches
  let totalMappings = 0
  let totalInserted = 0

  for (let i = 0; i < jobs.length; i += JOBS_PER_BATCH) {
    const batchJobs = jobs.slice(i, i + JOBS_PER_BATCH)
    console.log(`Processing batch ${Math.floor(i / JOBS_PER_BATCH) + 1}: ${batchJobs.length} jobs...`)

    const mappings = await generateMappingsBatch(batchJobs, mosCodes)
    totalMappings += mappings.length

    if (dryRun) {
      console.log(`  [DRY RUN] Would insert ${mappings.length} mappings`)
      for (const mapping of mappings.slice(0, 5)) {
        const job = batchJobs[mapping.jobIndex]
        if (job) {
          console.log(`    ${job.title} → ${mapping.mosCode} (${mapping.matchStrength}, ${(mapping.confidenceScore * 100).toFixed(0)}%)`)
        }
      }
      if (mappings.length > 5) {
        console.log(`    ... and ${mappings.length - 5} more`)
      }
    } else {
      // Insert mappings
      let inserted = 0
      for (const mapping of mappings) {
        const job = batchJobs[mapping.jobIndex]
        if (job) {
          const result = await insertMapping(job.id, mapping, mosCodes)
          if (result !== null) {
            inserted++
          }
        }
      }
      totalInserted += inserted
      console.log(`  Inserted ${inserted}/${mappings.length} mappings`)
    }

    // Rate limit between batches
    if (i + JOBS_PER_BATCH < jobs.length) {
      await sleep(1000)
    }
  }

  console.log()
  console.log('='.repeat(60))
  if (dryRun) {
    console.log(`[DRY RUN] Total mappings generated: ${totalMappings}`)
  } else {
    console.log(`Total mappings inserted: ${totalInserted}`)
  }
  console.log('Complete!')
  console.log('='.repeat(60))
  
  // Clean up
  client.close()
}

main().catch(console.error)
