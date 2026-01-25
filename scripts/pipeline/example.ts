#!/usr/bin/env npx tsx
/**
 * Example Pipeline Script
 * 
 * This demonstrates how to create a pipeline script using the framework.
 * Use this as a template for implementing new scripts.
 * 
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/example.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/example.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/example.ts --limit=5
 */

import {
  runPipelineCLI,
  defineScript,
  replaceScriptHandler,
  registerPlaceholderScripts,
  type PipelineContext,
} from '../../lib/pipeline'

/**
 * Example pipeline handler
 * 
 * This demonstrates:
 * - Logging at different levels
 * - Progress reporting
 * - Checking for cancellation
 * - Handling dry run mode
 * - Processing items in batches
 */
async function exampleHandler(ctx: PipelineContext): Promise<void> {
  const { log, progress, options, isCancelled } = ctx
  const { dryRun, batchSize = 10, limit } = options

  log.info('Starting example pipeline script')
  log.debug('Debug messages are useful for development')

  // Simulate fetching items to process
  const totalItems = limit || 25
  const items = Array.from({ length: totalItems }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }))

  log.info(`Found ${items.length} items to process`)

  // Process items in batches
  let processed = 0
  const results: { id: number; success: boolean }[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    // Check for cancellation before each batch
    if (await isCancelled()) {
      log.warn('Pipeline was cancelled, stopping...')
      break
    }

    const batch = items.slice(i, i + batchSize)
    log.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`)

    for (const item of batch) {
      // Report progress
      await progress({
        current: processed + 1,
        total: items.length,
        item: item.name,
        phase: 'processing',
      })

      // Simulate processing time
      await sleep(100)

      // Example: conditional logic based on dry run
      if (dryRun) {
        log.debug(`[DRY RUN] Would process ${item.name}`)
      } else {
        // In a real script, this is where you'd do actual work:
        // - Call Convex mutations
        // - Make AI API calls
        // - Transform data
        log.debug(`Processed ${item.name}`)
      }

      results.push({ id: item.id, success: true })
      processed++
    }

    // Small delay between batches (rate limiting for APIs)
    if (i + batchSize < items.length) {
      await sleep(200)
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  log.info('Processing complete')
  log.info(`  Total: ${results.length}`)
  log.info(`  Successful: ${successful}`)
  log.info(`  Failed: ${failed}`)

  if (dryRun) {
    log.warn('This was a DRY RUN - no changes were persisted')
  }

  log.success('Example pipeline completed!')
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ===========================================
// Main Entry Point
// ===========================================

// For demonstration, we'll register this as a temporary script
// In a real implementation, you'd add the script to the registry types

async function main(): Promise<void> {
  // Initialize the registry with placeholder scripts
  registerPlaceholderScripts()

  // Replace the placeholder handler with our implementation
  // Note: 'mos-validate' is used here as an example
  // In practice, each script would have its own file
  replaceScriptHandler('mos-validate', exampleHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-validate')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
