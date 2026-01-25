#!/usr/bin/env npx tsx
/**
 * @file MOS Classification Pipeline Script
 * @description Classify MOS codes into categories (IT_CYBER, INTELLIGENCE, etc.) using Vercel AI SDK.
 *
 * This script processes UNCLASSIFIED MOS records and assigns them to one of the
 * following categories based on their name and description:
 *
 *   - IT_CYBER: IT, cybersecurity, signals, networks, computer systems
 *   - INTELLIGENCE: Intel analysis, SIGINT, counterintelligence
 *   - COMMUNICATIONS: Radio, satellite, telecommunications
 *   - COMBAT: Infantry, armor, artillery, combat arms
 *   - LOGISTICS: Supply chain, transportation, maintenance management
 *   - MEDICAL: Healthcare, medical services, dental
 *   - AVIATION: Aircraft operations, flight crew, aviation maintenance
 *   - ENGINEERING: Civil, electrical, mechanical engineering
 *   - SUPPORT: Admin, legal, chaplain, finance, HR, other support
 *
 * Features:
 *   - Batch processing with Vercel AI SDK's `generateObject`
 *   - Structured output with Zod schema validation
 *   - Real-time progress logging to Convex
 *   - Dry run mode for testing
 *   - Statistics reporting
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts --batch-size=30
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts --branch=army
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts --stats
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-classify.ts --limit=100
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
// Constants & Types
// ============================================

/**
 * Valid MOS categories matching Convex schema
 */
const MOS_CATEGORIES = [
  'IT_CYBER',
  'INTELLIGENCE',
  'COMMUNICATIONS',
  'COMBAT',
  'LOGISTICS',
  'MEDICAL',
  'AVIATION',
  'ENGINEERING',
  'SUPPORT',
] as const

type MosCategory = (typeof MOS_CATEGORIES)[number]

/**
 * Valid military branches
 */
const BRANCHES = ['army', 'navy', 'air_force', 'marine_corps', 'coast_guard', 'space_force'] as const
type Branch = (typeof BRANCHES)[number]

/**
 * MOS record from Convex
 */
interface MosRecord {
  _id: Id<'mosCodes'>
  branch: Branch
  code: string
  name: string
  description?: string
  mosCategory?: MosCategory | 'UNCLASSIFIED'
}

/**
 * Classification result for a single MOS
 */
interface ClassificationResult {
  code: string
  category: MosCategory
  confidence: number
}

// ============================================
// Zod Schemas for AI SDK
// ============================================

/**
 * Schema for single MOS classification
 */
const MosClassificationSchema = z.object({
  code: z.string().describe('The MOS code being classified'),
  category: z
    .enum([
      'IT_CYBER',
      'INTELLIGENCE',
      'COMMUNICATIONS',
      'COMBAT',
      'LOGISTICS',
      'MEDICAL',
      'AVIATION',
      'ENGINEERING',
      'SUPPORT',
    ])
    .describe('The assigned category'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0.0 to 1.0'),
})

/**
 * Schema for batch classification response
 */
const BatchClassificationSchema = z.object({
  classifications: z.array(MosClassificationSchema),
})

// ============================================
// System Prompt
// ============================================

const CLASSIFICATION_SYSTEM_PROMPT = `You are a military occupational specialty (MOS) classifier. Your task is to categorize military jobs into one of nine categories based on their name and description.

Categories and their criteria:

IT_CYBER - Information Technology & Cybersecurity
  - Network administration, systems administration, database management
  - Cybersecurity, information assurance, cyber warfare, cyber operations
  - Signal corps, communications systems when focused on computer/network systems
  - Computer systems, software, data processing, IT support
  - Cryptologic technicians focused on network defense
  - Keywords: network, cyber, IT, computer, data, systems admin, COMSEC, cryptologic (defense)

INTELLIGENCE - Intelligence & Analysis
  - Intelligence analysts, counterintelligence agents
  - SIGINT (signals intelligence), HUMINT (human intelligence), GEOINT
  - Reconnaissance, surveillance
  - Interrogation, debriefing
  - Cryptologic technicians focused on SIGINT collection
  - Keywords: intelligence, intel, counterintel, reconnaissance, surveillance, analyst

COMMUNICATIONS - Communications & Signals
  - Radio operations, satellite communications
  - Telecommunications, signal transmission
  - Communications equipment operation and repair
  - Keywords: radio, satellite, telecommunications, signal, transmission

COMBAT - Combat Arms & Direct Combat
  - Infantry, armor, artillery, cavalry
  - Special operations, rangers, SEALs, force recon
  - Combat engineers (direct combat role)
  - Fire support, mortars, missiles
  - Keywords: infantry, combat, armor, artillery, special operations, tactical

LOGISTICS - Logistics & Supply Chain
  - Supply chain management, inventory, warehousing
  - Transportation, vehicle/equipment distribution
  - Maintenance management (not hands-on repair)
  - Quartermaster, supply specialists
  - Keywords: logistics, supply, transportation, quartermaster, inventory

MEDICAL - Medical & Healthcare
  - Physicians, nurses, medics, corpsmen
  - Dental, veterinary, optometry
  - Medical laboratory, pharmacy, radiology
  - Mental health, counseling
  - Keywords: medical, health, nurse, doctor, dental, pharmacy, medic, corpsman

AVIATION - Aviation & Flight Operations
  - Pilots, flight officers, aircrew
  - Aircraft maintenance, avionics repair
  - Air traffic control, flight operations
  - Unmanned aerial systems (drones)
  - Keywords: aviation, aircraft, flight, pilot, aircrew, avionics, helicopter, fixed-wing

ENGINEERING - Engineering & Construction
  - Civil, electrical, mechanical engineering
  - Construction, facilities management
  - EOD (explosive ordnance disposal) with engineering focus
  - Keywords: engineer, construction, facilities, civil, electrical, mechanical

SUPPORT - Administrative & General Support
  - Human resources, personnel, administration
  - Finance, budget, accounting
  - Legal, JAG, paralegal
  - Chaplain, religious support
  - Public affairs, band, ceremonial
  - Food service, culinary
  - General maintenance not fitting other categories
  - Any role that doesn't clearly fit the above categories
  - Keywords: admin, personnel, finance, legal, chaplain, public affairs, food service

IMPORTANT CLASSIFICATION RULES:
1. Be precise - read the full description before classifying
2. IT_CYBER is for roles that work WITH computer/network systems, not just USE them
3. If a role bridges two categories (e.g., "Intelligence Systems Maintainer"), classify based on the PRIMARY duty
4. When in doubt between SUPPORT and another category, choose the more specific category
5. Aircraft MAINTENANCE goes to AVIATION, not LOGISTICS
6. Equipment/vehicle maintenance (non-aircraft) goes to SUPPORT unless it's maintenance MANAGEMENT (LOGISTICS)
7. Assign a confidence score reflecting how certain the classification is (0.0-1.0)

Return your classifications as a JSON object with a "classifications" array.`

// ============================================
// Core Functions
// ============================================

/**
 * Fetch MOS records that need classification from Convex
 */
async function fetchUnclassifiedMos(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  options: {
    branch?: Branch
    limit?: number
  } = {}
): Promise<MosRecord[]> {
  const { branch, limit } = options

  log.info('Fetching unclassified MOS records from Convex...')

  // Fetch all MOS codes
  // Note: We need to filter client-side since Convex doesn't have a compound index for this
  const allMos = await convex.query(api.mos.list, { limit: 10000 })

  // Filter to unclassified (either UNCLASSIFIED or null/undefined)
  let unclassified = allMos.filter(
    (m: Doc<'mosCodes'>) => !m.mosCategory || m.mosCategory === 'UNCLASSIFIED'
  )

  // Apply branch filter
  if (branch) {
    unclassified = unclassified.filter((m: Doc<'mosCodes'>) => m.branch === branch)
  }

  // Apply limit
  if (limit) {
    unclassified = unclassified.slice(0, limit)
  }

  log.info(`Found ${unclassified.length} unclassified MOS records`)

  return unclassified as MosRecord[]
}

/**
 * Classify a batch of MOS records using Vercel AI SDK
 */
async function classifyBatch(
  records: MosRecord[],
  log: PipelineContext['log']
): Promise<ClassificationResult[]> {
  if (records.length === 0) {
    return []
  }

  // Build the prompt with MOS data
  const mosList = records.map((rec) => {
    const descPreview = (rec.description || 'No description')
      .replace(/\n/g, ' ')
      .slice(0, 500)
    return `- Code: ${rec.code} | Branch: ${rec.branch} | Name: ${rec.name}\n  Description: ${descPreview}`
  })

  const userPrompt = `Classify the following ${records.length} Military Occupational Specialties:

${mosList.join('\n\n')}

Return a JSON object with a "classifications" array containing objects with "code", "category", and "confidence" fields.
Example: {"classifications": [{"code": "25B", "category": "IT_CYBER", "confidence": 0.95}]}`

  try {
    const result = await generateObject({
      model: openai('gpt-5.1'),
      schema: BatchClassificationSchema,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.1,
    })

    log.debug(`Successfully classified ${result.object.classifications.length} MOS records`)
    return result.object.classifications
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Classification failed: ${message}`)
    return []
  }
}

/**
 * Update MOS categories in Convex
 */
async function updateMosCategories(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  classifications: Array<{ mosId: Id<'mosCodes'>; category: MosCategory }>,
  dryRun: boolean
): Promise<number> {
  if (classifications.length === 0) {
    log.info('No classifications to update')
    return 0
  }

  if (dryRun) {
    log.info(`[DRY RUN] Would update ${classifications.length} records`)
    for (const { mosId, category } of classifications.slice(0, 5)) {
      log.debug(`  - ID ${mosId} -> ${category}`)
    }
    if (classifications.length > 5) {
      log.debug(`  ... and ${classifications.length - 5} more`)
    }
    return classifications.length
  }

  let successCount = 0

  for (const { mosId, category } of classifications) {
    try {
      await convex.mutation(api.mos.update, {
        id: mosId,
        mosCategory: category,
      })
      successCount++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`Failed to update MOS ID ${mosId}: ${message}`)
    }
  }

  return successCount
}

/**
 * Get and display classification statistics
 */
async function printStatistics(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log']
): Promise<void> {
  log.info('')
  log.info('=== MOS Category Distribution ===')

  const stats = await convex.query(api.mos.getStats, {})

  const total = stats.total
  const categories = stats.byCategory || {}

  // Sort by count descending
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1])

  for (const [category, count] of sorted) {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
    log.info(`  ${category.padEnd(15)}: ${count} (${pct}%)`)
  }

  log.info(`  ${'TOTAL'.padEnd(15)}: ${total}`)

  // Calculate classified percentage
  const unclassified = categories['UNCLASSIFIED'] || 0
  const classifiedPct = total > 0 ? (((total - unclassified) / total) * 100).toFixed(1) : '0.0'
  log.info('')
  log.info(`Classified: ${classifiedPct}%`)
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Main pipeline handler for MOS classification
 */
async function mosClassifyHandler(ctx: PipelineContext): Promise<void> {
  const { log, options, progress, isCancelled } = ctx
  const { dryRun, batchSize = 50, limit, args = {} } = options

  // Parse additional arguments
  const branch = args.branch as Branch | undefined
  const statsOnly = args.stats === 'true' || args.stats === true

  // Create Convex client
  const convex = createPipelineClient()

  log.info('Starting MOS classification pipeline...')
  if (dryRun) {
    log.warn('Running in DRY RUN mode - no changes will be persisted')
  }

  // Stats only mode
  if (statsOnly) {
    await printStatistics(convex, log)
    return
  }

  // Fetch unclassified records
  const records = await fetchUnclassifiedMos(convex, log, { branch, limit })

  if (records.length === 0) {
    log.info('No unclassified MOS records found')
    await printStatistics(convex, log)
    return
  }

  log.info(`Processing ${records.length} records (batch_size=${batchSize})`)

  // Process in batches
  const totalBatches = Math.ceil(records.length / batchSize)
  const allClassifications: Array<{ mosId: Id<'mosCodes'>; category: MosCategory }> = []

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

    // Classify the batch
    const classifications = await classifyBatch(batch, log)

    // Match classifications back to database IDs
    for (const classification of classifications) {
      const matchedRecord = batch.find((rec) => rec.code === classification.code)
      if (matchedRecord) {
        allClassifications.push({
          mosId: matchedRecord._id,
          category: classification.category,
        })
        log.debug(
          `  ${matchedRecord.branch}/${matchedRecord.code} -> ${classification.category} (${(classification.confidence * 100).toFixed(0)}%)`
        )
      } else {
        log.warn(`Could not match classification for code ${classification.code}`)
      }
    }

    // Report progress
    await progress({
      current: batchNum + 1,
      total: totalBatches,
      phase: 'classifying',
      item: `Batch ${batchNum + 1}/${totalBatches} (${allClassifications.length} classified)`,
    })

    // Rate limiting between batches (avoid hitting API limits)
    if (batchNum < totalBatches - 1) {
      await sleep(1000)
    }
  }

  // Update database
  const updated = await updateMosCategories(convex, log, allClassifications, dryRun)

  // Summary
  log.info('')
  log.info('=== Classification Complete ===')
  log.info(`  Total processed: ${records.length}`)
  log.info(`  Classifications: ${allClassifications.length}`)
  log.info(`  Updated: ${updated}`)
  log.info(`  Skipped: ${records.length - updated}`)

  // Print final statistics
  if (!dryRun) {
    await printStatistics(convex, log)
  }

  log.success('MOS classification pipeline completed!')
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
  replaceScriptHandler('mos-classify', mosClassifyHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-classify')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
