#!/usr/bin/env npx tsx
/**
 * @file MOS Summary Generation Pipeline Script
 * @description Generate AI-powered summarized descriptions for MOS records using Vercel AI SDK.
 *
 * This script processes MOS records that have descriptions but lack summaries,
 * generating concise, informative summaries (max 268 characters, 1-3 sentences).
 *
 * Features:
 *   - Concurrent processing within batches using Promise.all
 *   - Structured text generation with Vercel AI SDK's `generateText`
 *   - Real-time progress logging to Convex
 *   - Dry run mode for testing
 *   - Force mode to regenerate existing summaries
 *   - Statistics reporting
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts --batch-size=20
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts --force
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts --stats
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-summarize.ts --limit=100
 */

import { generateText } from 'ai'
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
 * Maximum characters for summaries (per PRD)
 */
const MAX_SUMMARY_CHARS = 268

/**
 * Maximum sentences in summary
 */
const MAX_SUMMARY_SENTENCES = 3

/**
 * MOS record from Convex
 */
interface MosRecord {
  _id: Id<'mosCodes'>
  code: string
  name: string
  description?: string
  summarizedDescription?: string
}

// ============================================
// Core Functions
// ============================================

/**
 * Fetch MOS records that need summaries from Convex
 */
async function fetchMosForSummary(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  options: {
    force?: boolean
    limit?: number
  } = {}
): Promise<MosRecord[]> {
  const { force, limit } = options

  log.info('Fetching MOS records for summary generation...')

  // Fetch all MOS codes
  const allMos = await convex.query(api.mos.list, { limit: 10000 })

  // Filter to records that have descriptions
  let candidates = allMos.filter((m: Doc<'mosCodes'>) => m.description && m.description.length > 0)

  // Unless force mode, only include records without summaries
  if (!force) {
    candidates = candidates.filter((m: Doc<'mosCodes'>) => !m.summarizedDescription)
  }

  // Apply limit
  if (limit) {
    candidates = candidates.slice(0, limit)
  }

  log.info(`Found ${candidates.length} MOS records for summary generation`)

  return candidates as MosRecord[]
}

/**
 * Generate a summary for a single MOS record
 */
async function generateSummary(
  record: MosRecord,
  log: PipelineContext['log']
): Promise<string | null> {
  if (!record.description) {
    return null
  }

  const prompt = `Summarize this military occupational specialty in exactly 1-3 sentences.
STRICT REQUIREMENTS:
- Maximum ${MAX_SUMMARY_CHARS} characters total
- Focus on what the role does and key skills
- Write for veterans transitioning to contractor jobs
- No quotes, no bullet points, just flowing sentences

MOS Code: ${record.code}
Title: ${record.name}
Description: ${record.description}

Summary:`

  try {
    const result = await generateText({
      model: openai('gpt-5.1'),
      prompt,
      maxTokens: 100,
      temperature: 0.3,
    })

    let summary = result.text.trim()

    // Enforce character limit
    if (summary.length > MAX_SUMMARY_CHARS) {
      const sentences = summary.split('. ')
      let truncated = ''

      for (const sentence of sentences) {
        const candidate = truncated + (truncated ? '. ' : '') + sentence
        const withPeriod = candidate.endsWith('.') ? candidate : candidate + '.'

        if (withPeriod.length <= MAX_SUMMARY_CHARS) {
          truncated = withPeriod
        } else {
          break
        }
      }

      summary = truncated || summary.slice(0, MAX_SUMMARY_CHARS - 3).trimEnd() + '...'
    }

    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Summary generation failed for ${record.code}: ${message}`)
    return null
  }
}

/**
 * Update MOS summary in Convex
 */
async function updateMosSummary(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log'],
  mosId: Id<'mosCodes'>,
  summary: string,
  dryRun: boolean
): Promise<boolean> {
  if (dryRun) {
    log.debug(`[DRY RUN] Would update MOS ID ${mosId} with summary (${summary.length} chars)`)
    return true
  }

  try {
    await convex.mutation(api.mos.update, {
      id: mosId,
      summarizedDescription: summary,
    })
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(`Failed to update summary for MOS ID ${mosId}: ${message}`)
    return false
  }
}

/**
 * Get and display summary statistics
 */
async function printStatistics(
  convex: ReturnType<typeof createPipelineClient>,
  log: PipelineContext['log']
): Promise<void> {
  log.info('')
  log.info('=== MOS Summary Statistics ===')

  const stats = await convex.query(api.mos.getStats, {})
  const allMos = await convex.query(api.mos.list, { limit: 10000 })

  const withDescription = allMos.filter((m: Doc<'mosCodes'>) => m.description && m.description.length > 0)
  const withSummary = allMos.filter((m: Doc<'mosCodes'>) => m.summarizedDescription && m.summarizedDescription.length > 0)

  const total = stats.total
  const coveragePct = withDescription.length > 0 
    ? ((withSummary.length / withDescription.length) * 100).toFixed(1) 
    : '0.0'

  log.info(`  Total MOS records: ${total}`)
  log.info(`  With description: ${withDescription.length}`)
  log.info(`  With summary: ${withSummary.length} (${coveragePct}%)`)
  log.info(`  Remaining to summarize: ${withDescription.length - withSummary.length}`)
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Main pipeline handler for MOS summary generation
 */
async function mosSummarizeHandler(ctx: PipelineContext): Promise<void> {
  const { log, options, progress, isCancelled } = ctx
  const { dryRun, batchSize = 10, limit, args = {} } = options

  // Parse additional arguments
  const force = args.force === 'true' || args.force === true
  const statsOnly = args.stats === 'true' || args.stats === true

  // Create Convex client
  const convex = createPipelineClient()

  log.info('Starting MOS summary generation pipeline...')
  if (dryRun) {
    log.warn('Running in DRY RUN mode - no changes will be persisted')
  }
  if (force) {
    log.info('Force mode enabled - regenerating all summaries')
  }

  // Stats only mode
  if (statsOnly) {
    await printStatistics(convex, log)
    return
  }

  // Fetch records needing summaries
  const records = await fetchMosForSummary(convex, log, { force, limit })

  if (records.length === 0) {
    log.info('No MOS records need summaries')
    await printStatistics(convex, log)
    return
  }

  log.info(`Processing ${records.length} records (batch_size=${batchSize})`)

  // Process in batches
  const totalBatches = Math.ceil(records.length / batchSize)
  let totalSummarized = 0
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

    // Process batch concurrently
    const results = await Promise.all(
      batch.map(async (record) => {
        try {
          const summary = await generateSummary(record, log)
          return { record, summary, error: null }
        } catch (error) {
          return { record, summary: null, error }
        }
      })
    )

    // Update database with results
    for (const { record, summary, error } of results) {
      if (error) {
        log.error(`Summary failed for ${record.code}: ${error}`)
        totalFailed++
        continue
      }

      if (summary) {
        const success = await updateMosSummary(convex, log, record._id, summary, dryRun)
        if (success) {
          totalSummarized++
          log.debug(`  ${record.code}: "${summary.slice(0, 50)}..."`)
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
      phase: 'summarizing',
      item: `Batch ${batchNum + 1}/${totalBatches} (${totalSummarized} summarized)`,
    })

    // Rate limiting between batches (avoid hitting API limits)
    if (batchNum < totalBatches - 1) {
      await sleep(1000)
    }
  }

  // Summary
  log.info('')
  log.info('=== Summary Generation Complete ===')
  log.info(`  Total processed: ${records.length}`)
  log.info(`  Summarized: ${totalSummarized}`)
  log.info(`  Failed: ${totalFailed}`)

  // Print final statistics
  if (!dryRun) {
    await printStatistics(convex, log)
  }

  log.success('MOS summary generation pipeline completed!')
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
  replaceScriptHandler('mos-summarize', mosSummarizeHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-summarize')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
