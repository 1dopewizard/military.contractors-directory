#!/usr/bin/env npx tsx
/**
 * @file MOS Embedding Generation Pipeline Script
 * @description Generate vector embeddings for enriched MOS records using Vercel AI SDK.
 *
 * Embeddings are stored in the `embedding` field (float64 array, 1536 dimensions)
 * for vector similarity search. Only processes IT_CYBER, INTELLIGENCE, and
 * COMMUNICATIONS MOS codes that have been enriched (have core_skills).
 *
 * Embedding text is built from:
 *   - branch, code, name, description
 *   - core_skills, civilian_roles (from enrichment)
 *
 * Features:
 *   - Batch embedding generation with Vercel AI SDK's `embed` and `embedMany`
 *   - Real-time progress logging to Convex
 *   - Dry run mode for testing
 *   - Regenerate mode to update existing embeddings
 *   - Statistics reporting
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts --batch-size=50
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts --regenerate
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts --stats
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-embed.ts --limit=100
 */

import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
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
 * Target MOS categories for embedding (IT/Cyber focused)
 */
const TARGET_MOS_CATEGORIES = ['IT_CYBER', 'INTELLIGENCE', 'COMMUNICATIONS'] as const

/**
 * OpenAI embedding model
 */
const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Embedding dimensions (matches Convex vector index)
 */
const EMBEDDING_DIMENSIONS = 1536

/**
 * MOS record from Convex with enrichment data
 */
interface MosRecordForEmbedding {
  _id: Id<'mosCodes'>
  branch: string
  code: string
  name: string
  description?: string
  mosCategory?: string
  coreSkills?: string[]
  civilianRoles?: string[]
  embedding?: number[]
}

// ============================================
// Core Functions
// ============================================

/**
 * Build embedding text from MOS data
 */
function buildEmbeddingText(record: MosRecordForEmbedding): string {
  const parts = [
    `Branch: ${record.branch}`,
    `Code: ${record.code}`,
    `Name: ${record.name}`,
  ]

  if (record.description) {
    parts.push(`Description: ${record.description.slice(0, 500)}`)
  }

  if (record.coreSkills && record.coreSkills.length > 0) {
    parts.push(`Core Skills: ${record.coreSkills.slice(0, 15).join(', ')}`)
  }

  if (record.civilianRoles && record.civilianRoles.length > 0) {
    parts.push(`Civilian Roles: ${record.civilianRoles.slice(0, 15).join(', ')}`)
  }

  return parts.join('. ')
}

/**
 * Fetch enriched MOS records that need embeddings from Convex
 */
async function fetchMosForEmbedding(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  options: {
    regenerate?: boolean
    limit?: number
  } = {}
): Promise<MosRecordForEmbedding[]> {
  const { regenerate, limit } = options

  log.info('Fetching enriched MOS records for embedding generation...')

  // Fetch MOS codes from target categories
  const records: MosRecordForEmbedding[] = []

  for (const category of TARGET_MOS_CATEGORIES) {
    const categoryMos = await convex.query(api.mos.getByCategory, {
      category,
      limit: 5000,
    })
    records.push(...(categoryMos as MosRecordForEmbedding[]))
  }

  // Filter to enriched records (have core_skills)
  let enriched = records.filter((m) => m.coreSkills && m.coreSkills.length > 0)

  // Unless regenerate mode, only include records without embeddings
  if (!regenerate) {
    enriched = enriched.filter((m) => !m.embedding || m.embedding.length === 0)
  }

  // Apply limit
  if (limit) {
    enriched = enriched.slice(0, limit)
  }

  log.info(`Found ${enriched.length} MOS records for embedding generation`)

  return enriched
}

/**
 * Generate embeddings for a batch of MOS records
 */
async function generateEmbeddingsBatch(
  records: MosRecordForEmbedding[],
  log: PipelineContext['log']
): Promise<Map<Id<'mosCodes'>, number[]>> {
  const results = new Map<Id<'mosCodes'>, number[]>()

  if (records.length === 0) {
    return results
  }

  // Build texts for embedding
  const texts = records.map((rec) => buildEmbeddingText(rec))

  try {
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL, { dimensions: EMBEDDING_DIMENSIONS }),
      values: texts,
    })

    // Map embeddings back to record IDs
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const embedding = embeddings[i]
      if (record && embedding) {
        results.set(record._id, embedding)
      }
    }

    log.debug(`Generated ${results.size} embeddings`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Embedding generation failed: ${message}`)
  }

  return results
}

/**
 * Update MOS embedding in Convex
 */
async function updateMosEmbedding(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  mosId: Id<'mosCodes'>,
  embedding: number[],
  dryRun: boolean
): Promise<boolean> {
  if (dryRun) {
    log.debug(`[DRY RUN] Would update MOS ID ${mosId} with embedding (${embedding.length} dims)`)
    return true
  }

  try {
    await convex.mutation(api.mos.updateEmbedding, {
      id: mosId,
      embedding,
    })
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Failed to update embedding for MOS ID ${mosId}: ${message}`)
    return false
  }
}

/**
 * Get and display embedding statistics
 */
async function printStatistics(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log']
): Promise<void> {
  log.info('')
  log.info('=== MOS Embedding Statistics ===')

  // Fetch all target category MOS codes
  const records: MosRecordForEmbedding[] = []
  for (const category of TARGET_MOS_CATEGORIES) {
    const categoryMos = await convex.query(api.mos.getByCategory, {
      category,
      limit: 5000,
    })
    records.push(...(categoryMos as MosRecordForEmbedding[]))
  }

  const totalTarget = records.length
  const enriched = records.filter((m) => m.coreSkills && m.coreSkills.length > 0)
  const withEmbeddings = records.filter((m) => m.embedding && m.embedding.length > 0)

  const enrichedPct = totalTarget > 0 ? ((enriched.length / totalTarget) * 100).toFixed(1) : '0.0'
  const embeddingPct = totalTarget > 0 ? ((withEmbeddings.length / totalTarget) * 100).toFixed(1) : '0.0'

  log.info(`  Total target category MOSes (IT_CYBER, INTELLIGENCE, COMMUNICATIONS): ${totalTarget}`)
  log.info(`  Enriched (has core_skills): ${enriched.length} (${enrichedPct}%)`)
  log.info(`  With embeddings: ${withEmbeddings.length} (${embeddingPct}%)`)
  log.info(`  Remaining to embed: ${enriched.length - withEmbeddings.length}`)
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Main pipeline handler for MOS embedding generation
 */
async function mosEmbedHandler(ctx: PipelineContext): Promise<void> {
  const { log, options, progress, isCancelled } = ctx
  const { dryRun, batchSize = 50, limit, args = {} } = options

  // Parse additional arguments
  const regenerate = args.regenerate === 'true' || args.regenerate === true || args.r === 'true'
  const statsOnly = args.stats === 'true' || args.stats === true

  // Create Convex client
  const convex = createPipelineClient()

  log.info('Starting MOS embedding generation pipeline...')
  if (dryRun) {
    log.warn('Running in DRY RUN mode - no changes will be persisted')
  }
  if (regenerate) {
    log.info('Regenerate mode enabled - updating existing embeddings')
  }

  // Stats only mode
  if (statsOnly) {
    await printStatistics(convex, log)
    return
  }

  // Fetch records needing embeddings
  const records = await fetchMosForEmbedding(convex, log, { regenerate, limit })

  if (records.length === 0) {
    log.info('No MOS records need embeddings')
    await printStatistics(convex, log)
    return
  }

  log.info(`Processing ${records.length} records (batch_size=${batchSize})`)

  // Process in batches
  const totalBatches = Math.ceil(records.length / batchSize)
  let totalEmbedded = 0
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

    // Generate embeddings for batch
    const embeddings = await generateEmbeddingsBatch(batch, log)

    // Update database with results
    for (const record of batch) {
      const embedding = embeddings.get(record._id)
      if (embedding) {
        const success = await updateMosEmbedding(convex, log, record._id, embedding, dryRun)
        if (success) {
          totalEmbedded++
        } else {
          totalFailed++
        }
      } else {
        totalFailed++
      }
    }

    // Report progress
    await progress({
      current: batchNum + 1,
      total: totalBatches,
      phase: 'embedding',
      item: `Batch ${batchNum + 1}/${totalBatches} (${totalEmbedded} embedded)`,
    })

    // Rate limiting between batches
    if (batchNum < totalBatches - 1) {
      await sleep(500)
    }
  }

  // Summary
  log.info('')
  log.info('=== Embedding Generation Complete ===')
  log.info(`  Total processed: ${records.length}`)
  log.info(`  Embedded: ${totalEmbedded}`)
  log.info(`  Failed: ${totalFailed}`)

  // Print final statistics
  if (!dryRun) {
    await printStatistics(convex, log)
  }

  log.success('MOS embedding generation pipeline completed!')
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
  replaceScriptHandler('mos-embed', mosEmbedHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-embed')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
