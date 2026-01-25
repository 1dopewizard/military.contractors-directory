#!/usr/bin/env npx tsx
/**
 * @file MOS Enrichment Pipeline Script
 * @description Multi-pass LLM enrichment of MOS records using Vercel AI SDK.
 *
 * This script enriches IT_CYBER, INTELLIGENCE, and COMMUNICATIONS MOS records
 * with structured ontology data across 4 passes:
 *
 *   Pass 1 - Core Profile:
 *     - core_skills (5-20 technical/soft skills)
 *     - tools_platforms (3-15 software/hardware)
 *     - mission_domains (1-5 operational focus areas)
 *     - environments (1-5 work locations)
 *     - civilian_roles (5-20 equivalent job titles)
 *     - role_families (1-3 job categories)
 *     - company_archetypes (1-3 employer types)
 *     - common_certs (0-10 certifications)
 *
 *   Pass 2 - Clearance & Deployment:
 *     - clearance_profile (typical min/target, SCI likelihood)
 *     - deployment_profile (OCONUS/hardship likelihood, common theaters)
 *
 *   Pass 3 - Career & Pay:
 *     - seniority_distribution (entry/mid/senior percentages)
 *     - pay_band_hint (LOW/MEDIUM/HIGH)
 *
 *   Pass 4 - Training & Pathways:
 *     - recommended_certs_contract (DoD 8570/8140 certs)
 *     - training_paths (starter/growth paths)
 *
 * Features:
 *   - Structured JSON output with Vercel AI SDK's `generateObject`
 *   - Zod schema validation for controlled vocabularies
 *   - Batch processing with rate limiting
 *   - Pass-specific execution (--pass=1,2,3,4)
 *   - Real-time progress logging to Convex
 *   - Dry run mode for testing
 *   - Statistics reporting
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts --batch-size=10
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts --pass=1
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts --stats
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-enrich.ts --limit=50
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import {
  runPipelineCLI,
  replaceScriptHandler,
  registerPlaceholderScripts,
  createPipelineClient,
  type PipelineContext,
} from '../../lib/pipeline'
import { api } from '../../convex/_generated/api'
import type { Id, Doc } from '../../convex/_generated/dataModel'

// ============================================
// Constants & Controlled Vocabularies
// ============================================

const TARGET_MOS_CATEGORIES = ['IT_CYBER', 'INTELLIGENCE', 'COMMUNICATIONS'] as const

const MISSION_DOMAINS = [
  'COMMUNICATIONS',
  'CYBER',
  'INTELLIGENCE',
  'NETWORK_OPERATIONS',
  'INFORMATION_ASSURANCE',
  'SYSTEMS_ADMINISTRATION',
  'DATA_CENTER_OPS',
  'SIGNALS',
  'ELECTRONIC_WARFARE',
  'CRYPTOLOGY',
] as const

const ENVIRONMENTS = [
  'DEPLOYED',
  'GARRISON',
  'SHIPBOARD',
  'DATA_CENTER',
  'OFFICE',
  'SCIF',
  'NOC',
  'SOC',
  'COMMAND_CENTER',
] as const

const ROLE_FAMILIES = [
  'NETWORK_ENGINEERING',
  'SYSTEMS_ADMIN',
  'CYBER_SECURITY',
  'HELP_DESK',
  'INTELLIGENCE',
  'COMMS',
  'DATABASE_ADMIN',
  'CLOUD_ENGINEERING',
  'SECURITY_OPERATIONS',
  'PENETRATION_TESTING',
  'SOFTWARE_DEVELOPMENT',
  'IT_MANAGEMENT',
  'INFORMATION_ASSURANCE',
  'ELECTRONIC_WARFARE',
] as const

const COMPANY_ARCHETYPES = [
  'BIG_PRIME',
  'SUBCONTRACTOR',
  'MSP',
  'GOV_CIVIL_SERVICE',
  'OEM_VENDOR',
] as const

const CLEARANCE_BANDS = ['NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI', 'TS_SCI_POLY'] as const
const LIKELIHOODS = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const
const THEATER_CODES = ['CENTCOM', 'EUCOM', 'INDOPACOM', 'AFRICOM', 'NORTHCOM', 'SOUTHCOM'] as const
const PAY_BANDS = ['LOW', 'MEDIUM', 'HIGH'] as const

const ENRICHMENT_VERSION = 1

// ============================================
// Types
// ============================================

interface MosRecord {
  _id: Id<'mosCodes'>
  branch: string
  code: string
  name: string
  rank: string
  description?: string
  coreSkills?: string[]
  enrichmentVersion?: number
}

interface EnrichmentUpdate {
  mosId: Id<'mosCodes'>
  data: Record<string, unknown>
}

// ============================================
// Zod Schemas for AI SDK
// ============================================

// Pass 1: Core Profile Schema (lenient - accepts strings, validated server-side)
const CoreProfileSchema = z.object({
  code: z.string(),
  core_skills: z.array(z.string()).min(1).max(25),
  tools_platforms: z.array(z.string()).min(1).max(20),
  mission_domains: z.array(z.string()).min(1).max(10),
  environments: z.array(z.string()).min(1).max(10),
  civilian_roles: z.array(z.string()).min(1).max(25),
  role_families: z.array(z.string()).min(1).max(5),
  company_archetypes: z.array(z.string()).min(1).max(5),
  common_certs: z.array(z.string()).min(0).max(15),
})

const CoreProfileResponseSchema = z.object({
  profiles: z.array(CoreProfileSchema),
})

// Pass 2: Clearance & Deployment Schema
const ClearanceProfileSchema = z.object({
  typical_min: z.enum(CLEARANCE_BANDS),
  typical_target: z.enum(CLEARANCE_BANDS),
  sci_exposure_likelihood: z.enum(LIKELIHOODS),
})

const DeploymentProfileSchema = z.object({
  oconus_likelihood: z.enum(LIKELIHOODS),
  hardship_likelihood: z.enum(LIKELIHOODS),
  common_theaters: z.array(z.enum(THEATER_CODES)).min(0).max(6),
})

const ClearanceDeploymentSchema = z.object({
  code: z.string(),
  clearance_profile: ClearanceProfileSchema,
  deployment_profile: DeploymentProfileSchema,
})

const ClearanceDeploymentResponseSchema = z.object({
  profiles: z.array(ClearanceDeploymentSchema),
})

// Pass 3: Career & Pay Schema
const SeniorityDistributionSchema = z.object({
  entry_level: z.number().min(0).max(1),
  mid_level: z.number().min(0).max(1),
  senior: z.number().min(0).max(1),
})

const CareerPaySchema = z.object({
  code: z.string(),
  seniority_distribution: SeniorityDistributionSchema,
  pay_band_hint: z.enum(PAY_BANDS),
})

const CareerPayResponseSchema = z.object({
  profiles: z.array(CareerPaySchema),
})

// Pass 4: Training & Pathways Schema
const TrainingPathsSchema = z.object({
  starter: z.array(z.string()).min(1).max(5),
  growth: z.array(z.string()).min(1).max(5),
})

const TrainingSchema = z.object({
  code: z.string(),
  recommended_certs_contract: z.array(z.string()).min(1).max(10),
  training_paths: TrainingPathsSchema,
})

const TrainingResponseSchema = z.object({
  profiles: z.array(TrainingSchema),
})

// ============================================
// System Prompts
// ============================================

const CORE_PROFILE_SYSTEM_PROMPT = `You are a military-to-civilian career translator specializing in IT and Cybersecurity roles. Your task is to enrich Military Occupational Specialties (MOS/AFSC/Rating) with structured ontology data.

For each MOS, provide:
1. core_skills (5-20): Technical and soft skills this MOS develops
2. tools_platforms (3-15): Software, hardware, systems commonly used
3. mission_domains (1-5): **MILITARY OPERATIONAL FOCUS** - What this MOS does in the military context
4. environments (1-5): **WORK LOCATIONS** - Where this MOS typically operates
5. civilian_roles (5-20): Equivalent civilian/contractor job titles
6. role_families (1-3): **CIVILIAN JOB CATEGORIES** - What civilian job families this MOS maps to
7. company_archetypes (1-3): Types of employers that hire this MOS
8. common_certs (0-10): Certifications commonly held

**CONTROLLED VOCABULARIES - USE EXACT SPELLING:**

mission_domains (MILITARY mission focus):
${MISSION_DOMAINS.map((d) => `- ${d}`).join('\n')}

environments (WORK locations):
${ENVIRONMENTS.map((e) => `- ${e}`).join('\n')}

role_families (CIVILIAN job categories):
${ROLE_FAMILIES.map((r) => `- ${r}`).join('\n')}

company_archetypes:
${COMPANY_ARCHETYPES.map((c) => `- ${c}`).join('\n')}

**CRITICAL RULES:**
1. mission_domains = MILITARY mission focus (e.g., CYBER, INTELLIGENCE, SIGNALS)
2. role_families = CIVILIAN job categories (e.g., SYSTEMS_ADMIN, NETWORK_ENGINEERING)
3. environments = WORK locations (e.g., SCIF, DATA_CENTER, COMMAND_CENTER)
4. DO NOT MIX THESE! They are completely different concepts!
5. USE FULL TERMS: "SYSTEMS_ADMINISTRATION" not "SYSTEMS_ADMIN" in mission_domains
6. "SECURITY_OPERATIONS" is a role_family, NOT a mission_domain
7. "COMMAND_CENTER" is an environment, NOT a mission_domain

Focus on IT/Cyber contractor relevance. Be specific about tools (e.g., "Splunk SIEM" not just "SIEM tools").

Return a JSON object with a "profiles" array containing enrichment for each MOS code provided.`

const CLEARANCE_DEPLOYMENT_SYSTEM_PROMPT = `You are a military career advisor specializing in security clearances and deployments for IT/Cyber roles.

For each MOS, provide:
1. clearance_profile:
   - typical_min: Minimum clearance typically required. From: ${CLEARANCE_BANDS.join(', ')}
   - typical_target: Common/target clearance level. From: ${CLEARANCE_BANDS.join(', ')}
   - sci_exposure_likelihood: Likelihood of SCI access. From: ${LIKELIHOODS.join(', ')}

2. deployment_profile:
   - oconus_likelihood: Likelihood of overseas deployment. From: ${LIKELIHOODS.join(', ')}
   - hardship_likelihood: Likelihood of hardship tour. From: ${LIKELIHOODS.join(', ')}
   - common_theaters (0-6): Common deployment areas. From: ${THEATER_CODES.join(', ')}

Consider the IT/Cyber nature of these roles - many are garrison-based but some deploy to support tactical operations.

Return a JSON object with a "profiles" array.`

const CAREER_PAY_SYSTEM_PROMPT = `You are a defense contractor compensation analyst specializing in IT/Cyber roles.

For each MOS transitioning to contractor work, provide:
1. seniority_distribution: Percentage of contractor roles at each level (must sum to ~1.0)
   - entry_level: 0.0-1.0 (E1-E4 equivalent, 0-4 years)
   - mid_level: 0.0-1.0 (E5-E6 equivalent, 4-10 years)
   - senior: 0.0-1.0 (E7+ equivalent, 10+ years)

2. pay_band_hint: Typical contractor pay band. From: ${PAY_BANDS.join(', ')}
   - LOW: $50k-$80k
   - MEDIUM: $80k-$120k
   - HIGH: $120k-$200k+

Consider clearance requirements and specialized skills when estimating pay bands.

Return a JSON object with a "profiles" array.`

const TRAINING_PATHS_SYSTEM_PROMPT = `You are a career transition advisor for military IT/Cyber professionals moving to defense contractor roles.

For each MOS, provide:
1. recommended_certs_contract (1-10): Certifications recommended for defense contractor roles
   - Focus on DoD 8570/8140 compliance (Security+, CISSP, CEH, etc.)
   - Include vendor certs relevant to the specialty (AWS, Cisco, Microsoft, etc.)
   
2. training_paths:
   - starter (1-5): Entry-level training/certs to begin contractor career
   - growth (1-5): Advanced training/certs for career progression

Be specific: "CompTIA Security+" not "security certification".

Return a JSON object with a "profiles" array.`

// ============================================
// Core Functions
// ============================================

/**
 * Build a prompt listing MOS records for enrichment
 */
function buildMosPrompt(records: MosRecord[]): string {
  return records
    .map((rec) => {
      const descPreview = (rec.description || 'No description').replace(/\n/g, ' ').slice(0, 500)
      return `- Code: ${rec.code} | Branch: ${rec.branch} | Name: ${rec.name} | Rank: ${rec.rank}\n  Description: ${descPreview}`
    })
    .join('\n\n')
}

/**
 * Fetch MOS records for enrichment
 */
async function fetchMosForEnrichment(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  options: {
    limit?: number
    passNum?: number
  } = {}
): Promise<MosRecord[]> {
  const { limit, passNum } = options

  log.info('Fetching MOS records for enrichment...')

  // Fetch MOS codes from target categories
  const records: MosRecord[] = []

  for (const category of TARGET_MOS_CATEGORIES) {
    const categoryMos = await convex.query(api.mos.getByCategory, {
      category,
      limit: 5000,
    })
    records.push(...(categoryMos as MosRecord[]))
  }

  // For pass 1, filter to unenriched records (no core_skills)
  let candidates = records
  if (passNum === 1) {
    candidates = records.filter((m) => !m.coreSkills || m.coreSkills.length === 0)
  }

  // Apply limit
  if (limit) {
    candidates = candidates.slice(0, limit)
  }

  log.info(`Found ${candidates.length} MOS records for enrichment`)

  return candidates
}

/**
 * Pass 1: Core Profile Enrichment
 */
async function enrichPass1CoreProfile(
  records: MosRecord[],
  log: PipelineContext['log']
): Promise<EnrichmentUpdate[]> {
  if (records.length === 0) return []

  const userPrompt = `Enrich the following ${records.length} IT/Cyber Military Occupational Specialties with core profile data:

${buildMosPrompt(records)}

Return a JSON object: {"profiles": [{code, core_skills, tools_platforms, mission_domains, environments, civilian_roles, role_families, company_archetypes, common_certs}, ...]}`

  try {
    const result = await generateObject({
      model: openai('gpt-5.1'),
      schema: CoreProfileResponseSchema,
      system: CORE_PROFILE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.2,
    })

    // Map codes back to IDs
    const codeToRecord = new Map(records.map((r) => [r.code, r]))
    const updates: EnrichmentUpdate[] = []

    for (const profile of result.object.profiles) {
      const record = codeToRecord.get(profile.code)
      if (record) {
        updates.push({
          mosId: record._id,
          data: {
            coreSkills: profile.core_skills,
            toolsPlatforms: profile.tools_platforms,
            missionDomains: profile.mission_domains,
            environments: profile.environments,
            civilianRoles: profile.civilian_roles,
            roleFamilies: profile.role_families,
            companyArchetypes: profile.company_archetypes,
            commonCerts: profile.common_certs,
          },
        })
      } else {
        log.warn(`Pass 1: Could not match code ${profile.code} to input records`)
      }
    }

    log.info(`Pass 1: Successfully enriched ${updates.length}/${records.length} records`)
    return updates
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Pass 1 failed: ${message}`)
    return []
  }
}

/**
 * Pass 2: Clearance & Deployment Enrichment
 */
async function enrichPass2ClearanceDeployment(
  records: MosRecord[],
  log: PipelineContext['log']
): Promise<EnrichmentUpdate[]> {
  if (records.length === 0) return []

  const userPrompt = `Provide clearance and deployment profiles for the following ${records.length} IT/Cyber MOSes:

${buildMosPrompt(records)}

Return a JSON object: {"profiles": [{code, clearance_profile: {typical_min, typical_target, sci_exposure_likelihood}, deployment_profile: {oconus_likelihood, hardship_likelihood, common_theaters}}, ...]}`

  try {
    const result = await generateObject({
      model: openai('gpt-5.1'),
      schema: ClearanceDeploymentResponseSchema,
      system: CLEARANCE_DEPLOYMENT_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.2,
    })

    const codeToRecord = new Map(records.map((r) => [r.code, r]))
    const updates: EnrichmentUpdate[] = []

    for (const profile of result.object.profiles) {
      const record = codeToRecord.get(profile.code)
      if (record) {
        updates.push({
          mosId: record._id,
          data: {
            clearanceProfile: {
              typical_min: profile.clearance_profile.typical_min,
              typical_target: profile.clearance_profile.typical_target,
              sci_exposure_likelihood: profile.clearance_profile.sci_exposure_likelihood,
            },
            deploymentProfile: {
              oconus_likelihood: profile.deployment_profile.oconus_likelihood,
              hardship_likelihood: profile.deployment_profile.hardship_likelihood,
              common_theaters: profile.deployment_profile.common_theaters,
            },
          },
        })
      } else {
        log.warn(`Pass 2: Could not match code ${profile.code} to input records`)
      }
    }

    log.info(`Pass 2: Successfully enriched ${updates.length}/${records.length} records`)
    return updates
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Pass 2 failed: ${message}`)
    return []
  }
}

/**
 * Pass 3: Career & Pay Enrichment
 */
async function enrichPass3CareerPay(
  records: MosRecord[],
  log: PipelineContext['log']
): Promise<EnrichmentUpdate[]> {
  if (records.length === 0) return []

  const userPrompt = `Provide career and pay profiles for the following ${records.length} IT/Cyber MOSes transitioning to contractor roles:

${buildMosPrompt(records)}

Return a JSON object: {"profiles": [{code, seniority_distribution: {entry_level, mid_level, senior}, pay_band_hint}, ...]}`

  try {
    const result = await generateObject({
      model: openai('gpt-5.1'),
      schema: CareerPayResponseSchema,
      system: CAREER_PAY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.2,
    })

    const codeToRecord = new Map(records.map((r) => [r.code, r]))
    const updates: EnrichmentUpdate[] = []

    for (const profile of result.object.profiles) {
      const record = codeToRecord.get(profile.code)
      if (record) {
        updates.push({
          mosId: record._id,
          data: {
            seniorityDistribution: {
              entry_level: profile.seniority_distribution.entry_level,
              mid_level: profile.seniority_distribution.mid_level,
              senior: profile.seniority_distribution.senior,
            },
            payBandHint: profile.pay_band_hint,
          },
        })
      } else {
        log.warn(`Pass 3: Could not match code ${profile.code} to input records`)
      }
    }

    log.info(`Pass 3: Successfully enriched ${updates.length}/${records.length} records`)
    return updates
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Pass 3 failed: ${message}`)
    return []
  }
}

/**
 * Pass 4: Training & Pathways Enrichment
 */
async function enrichPass4Training(
  records: MosRecord[],
  log: PipelineContext['log']
): Promise<EnrichmentUpdate[]> {
  if (records.length === 0) return []

  const userPrompt = `Provide training and certification recommendations for the following ${records.length} IT/Cyber MOSes transitioning to defense contractor roles:

${buildMosPrompt(records)}

Return a JSON object: {"profiles": [{code, recommended_certs_contract, training_paths: {starter, growth}}, ...]}`

  try {
    const result = await generateObject({
      model: openai('gpt-5.1'),
      schema: TrainingResponseSchema,
      system: TRAINING_PATHS_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.2,
    })

    const codeToRecord = new Map(records.map((r) => [r.code, r]))
    const updates: EnrichmentUpdate[] = []

    for (const profile of result.object.profiles) {
      const record = codeToRecord.get(profile.code)
      if (record) {
        // Combine starter and growth into a single trainingPaths array
        const allPaths = [
          ...profile.training_paths.starter,
          ...profile.training_paths.growth,
        ]

        updates.push({
          mosId: record._id,
          data: {
            recommendedCertsContract: profile.recommended_certs_contract,
            trainingPaths: allPaths,
          },
        })
      } else {
        log.warn(`Pass 4: Could not match code ${profile.code} to input records`)
      }
    }

    log.info(`Pass 4: Successfully enriched ${updates.length}/${records.length} records`)
    return updates
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Pass 4 failed: ${message}`)
    return []
  }
}

/**
 * Run all enrichment passes on a batch
 */
async function enrichBatch(
  records: MosRecord[],
  log: PipelineContext['log'],
  passes: number[]
): Promise<Map<Id<'mosCodes'>, Record<string, unknown>>> {
  const allUpdates = new Map<Id<'mosCodes'>, Record<string, unknown>>()

  // Initialize empty updates for all records
  for (const rec of records) {
    allUpdates.set(rec._id, {})
  }

  // Pass 1: Core Profile
  if (passes.includes(1)) {
    log.info('Running Pass 1: Core Profile...')
    const updates = await enrichPass1CoreProfile(records, log)
    for (const { mosId, data } of updates) {
      allUpdates.set(mosId, { ...allUpdates.get(mosId), ...data })
    }
    await sleep(1000)
  }

  // Pass 2: Clearance & Deployment
  if (passes.includes(2)) {
    log.info('Running Pass 2: Clearance & Deployment...')
    const updates = await enrichPass2ClearanceDeployment(records, log)
    for (const { mosId, data } of updates) {
      allUpdates.set(mosId, { ...allUpdates.get(mosId), ...data })
    }
    await sleep(1000)
  }

  // Pass 3: Career & Pay
  if (passes.includes(3)) {
    log.info('Running Pass 3: Career & Pay...')
    const updates = await enrichPass3CareerPay(records, log)
    for (const { mosId, data } of updates) {
      allUpdates.set(mosId, { ...allUpdates.get(mosId), ...data })
    }
    await sleep(1000)
  }

  // Pass 4: Training & Pathways
  if (passes.includes(4)) {
    log.info('Running Pass 4: Training & Pathways...')
    const updates = await enrichPass4Training(records, log)
    for (const { mosId, data } of updates) {
      allUpdates.set(mosId, { ...allUpdates.get(mosId), ...data })
    }
  }

  return allUpdates
}

/**
 * Update MOS enrichment data in Convex
 */
async function updateMosEnrichment(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  mosId: Id<'mosCodes'>,
  data: Record<string, unknown>,
  dryRun: boolean
): Promise<boolean> {
  if (Object.keys(data).length === 0) {
    return false
  }

  if (dryRun) {
    log.debug(`[DRY RUN] Would update MOS ID ${mosId} with ${Object.keys(data).length} fields`)
    return true
  }

  try {
    await convex.mutation(api.mos.updateEnrichment, {
      id: mosId,
      enrichmentVersion: ENRICHMENT_VERSION,
      ...data,
    } as any)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Failed to update enrichment for MOS ID ${mosId}: ${message}`)
    return false
  }
}

/**
 * Get and display enrichment statistics
 */
async function printStatistics(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log']
): Promise<void> {
  log.info('')
  log.info('=== MOS Ontology Enrichment Statistics ===')

  // Fetch all target category MOS codes
  const records: MosRecord[] = []
  for (const category of TARGET_MOS_CATEGORIES) {
    const categoryMos = await convex.query(api.mos.getByCategory, {
      category,
      limit: 5000,
    })
    records.push(...(categoryMos as MosRecord[]))
  }

  const totalTarget = records.length
  const enriched = records.filter((m) => m.coreSkills && m.coreSkills.length > 0)

  // Check for embeddings
  const withEmbeddings = records.filter((m: any) => m.embedding && m.embedding.length > 0)

  const enrichedPct = totalTarget > 0 ? ((enriched.length / totalTarget) * 100).toFixed(1) : '0.0'
  const embeddingPct = totalTarget > 0 ? ((withEmbeddings.length / totalTarget) * 100).toFixed(1) : '0.0'

  log.info(`  Total target category MOSes (IT_CYBER, INTELLIGENCE, COMMUNICATIONS): ${totalTarget}`)
  log.info(`  Enriched (has core_skills): ${enriched.length} (${enrichedPct}%)`)
  log.info(`  With embeddings: ${withEmbeddings.length} (${embeddingPct}%)`)
  log.info(`  Remaining to enrich: ${totalTarget - enriched.length}`)
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Main pipeline handler for MOS enrichment
 */
async function mosEnrichHandler(ctx: PipelineContext): Promise<void> {
  const { log, options, progress, isCancelled } = ctx
  const { dryRun, batchSize = 10, limit, args = {} } = options

  // Parse additional arguments
  const statsOnly = args.stats === 'true' || args.stats === true
  const passArg = args.pass as string | undefined

  // Parse which passes to run (default: all 4)
  let passes = [1, 2, 3, 4]
  if (passArg) {
    const parsed = parseInt(passArg)
    if (parsed >= 1 && parsed <= 4) {
      passes = [parsed]
    }
  }

  // Create Convex client
  const convex = createPipelineClient()

  log.info('Starting MOS enrichment pipeline...')
  log.info(`Running passes: ${passes.join(', ')}`)
  if (dryRun) {
    log.warn('Running in DRY RUN mode - no changes will be persisted')
  }

  // Stats only mode
  if (statsOnly) {
    await printStatistics(convex, log)
    return
  }

  // Fetch records needing enrichment
  const records = await fetchMosForEnrichment(convex, log, {
    limit,
    passNum: passes.includes(1) ? 1 : undefined,
  })

  if (records.length === 0) {
    log.info('No MOS records need enrichment')
    await printStatistics(convex, log)
    return
  }

  log.info(`Processing ${records.length} records (batch_size=${batchSize}, passes=${passes.join(',')})`)

  // Process in batches
  const totalBatches = Math.ceil(records.length / batchSize)
  let totalEnriched = 0
  let totalFailed = 0

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    // Check for cancellation
    if (await isCancelled()) {
      log.warn('Pipeline was cancelled, stopping...')
      break
    }

    const startIdx = batchNum * batchSize
    const endIdx = Math.min(startIdx + batchSize, records.length)
    const batch = records.slice(startIdx, endIdx)

    log.info(`Processing batch ${batchNum + 1}/${totalBatches} (${batch.length} records)...`)

    // Run enrichment passes on batch
    const allUpdates = await enrichBatch(batch, log, passes)

    // Write updates to database
    for (const [mosId, data] of allUpdates) {
      if (Object.keys(data).length > 0) {
        const success = await updateMosEnrichment(convex, log, mosId, data, dryRun)
        if (success) {
          totalEnriched++
        } else {
          totalFailed++
        }
      }
    }

    // Report progress
    await progress({
      current: batchNum + 1,
      total: totalBatches,
      phase: 'enriching',
      item: `Batch ${batchNum + 1}/${totalBatches} (${totalEnriched} enriched)`,
    })

    // Rate limiting between batches
    if (batchNum < totalBatches - 1) {
      await sleep(2000)
    }
  }

  // Summary
  log.info('')
  log.info('=== Enrichment Complete ===')
  log.info(`  Total records: ${records.length}`)
  log.info(`  Enriched: ${totalEnriched}`)
  log.info(`  Failed: ${totalFailed}`)

  // Print final statistics
  if (!dryRun) {
    await printStatistics(convex, log)
  }

  log.success('MOS enrichment pipeline completed!')
}

// ============================================
// Utilities
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================
// CLI Entry Point
// ============================================

async function main(): Promise<void> {
  // Initialize the registry with placeholder scripts
  registerPlaceholderScripts()

  // Replace the placeholder handler with our implementation
  replaceScriptHandler('mos-enrich', mosEnrichHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-enrich')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
