#!/usr/bin/env npx tsx
/**
 * @file Marine Corps COOL MOS Scraper
 * @description Scrape Marine Corps MOS data from COOL (Credentialing Opportunities On-Line) API
 *
 * Source: https://www.cool.osd.mil/usmc/moc/index.html
 *
 * This script uses the COOL public API to efficiently fetch all USMC MOS data
 * without browser automation. The API provides structured JSON data directly.
 *
 * Categories covered:
 * - Enlisted: MOS (E)
 * - Officer: MOS (O)
 * - Warrant Officer: MOS (W)
 *
 * Per MOS we capture:
 *   - branch       ("marine_corps")
 *   - code         (e.g., 0311, 0302, 0306)
 *   - name         (job title)
 *   - rank         (enlisted, officer, warrant_officer)
 *   - source_url   (full detail page URL)
 *   - description  (text from the MOS detail API)
 *   - externalId   (internal COOL ID)
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-marines.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-marines.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-marines.ts --category=enlisted
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-marines.ts --export-json
 */

import {
  HttpApiMilitaryScraper,
  type MosRawData,
  type PersonnelCategory,
  runPipelineCLI,
  replaceScriptHandler,
  registerPlaceholderScripts,
  createPipelineClient,
  cleanHtmlSnippet,
} from '../../lib/pipeline'

// ============================================
// Types
// ============================================

/**
 * Raw response from COOL API
 */
interface CoolApiResponse {
  moc_id?: string
  moc_code?: string
  moc_title?: string
  moc_full_title?: string
  moc_key?: string
  moc_personnelcategory?: string
  moc_codetype?: string
  moc_description?: string
  moc_summarypage?: string
  moc_cred_count?: string
  moc_url?: string
}

// ============================================
// Constants
// ============================================

/**
 * COOL API endpoint (AWS API Gateway -> S3 Select)
 */
const COOL_API_BASE = 'https://0ikdu2qdaj.execute-api.us-east-1.amazonaws.com/v1/getcooldata'

/**
 * S3 datafile for USMC MOC data
 */
const USMC_MOC_DATAFILE = 'cool/usmc/usmc_moc.json'

/**
 * S3 Select expression to get all Marine Corps MOS entries (excluding DUTY types)
 */
const LIST_ALL_QUERY = `
select s.*
from s3object[*].usmc_moc[*] s
where s.moc_codetype = 'MOS'
`

/**
 * Personnel category mappings from COOL API codes
 */
const PERSONNEL_CATEGORY_MAP: Record<string, PersonnelCategory> = {
  E: 'enlisted',
  O: 'officer',
  W: 'warrant_officer',
}

// ============================================
// Marine Corps COOL Scraper Implementation
// ============================================

/**
 * Scraper for Marine Corps COOL (Credentialing Opportunities On-Line) API
 *
 * Marines use 4-digit MOS codes (e.g., 0311 for Infantry Rifleman,
 * 0302 for Infantry Officer).
 */
class MarinesCoolScraper extends HttpApiMilitaryScraper {
  readonly siteId = 'usmc-cool'
  readonly siteName = 'Marine Corps COOL'
  readonly branch = 'marine_corps' as const
  readonly apiBaseUrl = COOL_API_BASE

  // Optional filters from CLI args
  private categoryFilter?: PersonnelCategory
  private exportJson = false

  /**
   * Set filters from pipeline args
   */
  setFilters(args: Record<string, unknown> = {}): void {
    if (args.category && typeof args.category === 'string') {
      const cat = args.category.toLowerCase()
      if (['enlisted', 'officer', 'warrant_officer'].includes(cat)) {
        this.categoryFilter = cat as PersonnelCategory
      }
    }
    if (args.exportJson === 'true' || args.exportJson === true) {
      this.exportJson = true
    }
  }

  /**
   * Fetch all MOS data from the COOL API
   */
  async fetchData(): Promise<MosRawData[]> {
    const log = this.ctx!.log

    log.info('Fetching Marine Corps MOS data from COOL API...')

    // Build query URL with S3 Select expression
    const params = new URLSearchParams({
      expression: LIST_ALL_QUERY.trim(),
      datafile: USMC_MOC_DATAFILE,
    })

    const url = `${this.apiBaseUrl}?${params.toString()}`
    log.debug(`API URL: ${url.slice(0, 150)}...`)

    try {
      const response = await this.fetch(url)
      const rawData = (await response.json()) as CoolApiResponse[]

      if (!Array.isArray(rawData)) {
        log.error('Unexpected API response format')
        throw new Error('COOL API returned non-array response')
      }

      log.info(`Received ${rawData.length} raw records from API`)

      // Parse and transform records
      const records = this.parseRecords(rawData)
      log.info(`Parsed ${records.length} valid USMC MOS records`)

      // Apply filters
      const filtered = this.categoryFilter
        ? records.filter((r) => r.rank === this.categoryFilter)
        : records

      if (this.categoryFilter) {
        log.info(`Filtered to ${filtered.length} records (category=${this.categoryFilter})`)
      }

      // Log summary by category
      this.logSummary(filtered)

      // Export to JSON if requested
      if (this.exportJson) {
        await this.exportToJson(filtered)
      }

      return filtered
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`Failed to fetch from COOL API: ${message}`)
      throw error
    }
  }

  /**
   * Parse raw API responses into MosRawData records
   */
  private parseRecords(raw: CoolApiResponse[]): MosRawData[] {
    const records: MosRawData[] = []
    const log = this.ctx!.log

    for (const item of raw) {
      const record = this.parseRecord(item)
      if (record) {
        records.push(record)
      }
    }

    // Count records with descriptions
    const withDesc = records.filter((r) => r.description).length
    log.info(`Records with descriptions: ${withDesc}/${records.length}`)

    return records
  }

  /**
   * Parse a single COOL API record into MosRawData
   */
  private parseRecord(raw: CoolApiResponse): MosRawData | null {
    const code = (raw.moc_code ?? '').trim()
    const title = (raw.moc_title ?? '').trim()
    const mocKey = (raw.moc_key ?? '').trim()
    const mocId = raw.moc_id ?? ''

    if (!code || !mocKey) {
      return null
    }

    // Map personnel category
    const personnelCat = (raw.moc_personnelcategory ?? 'E').toUpperCase()
    const rank: PersonnelCategory = PERSONNEL_CATEGORY_MAP[personnelCat] ?? 'enlisted'

    // Build source URL
    const sourceUrl = `https://www.cool.osd.mil/usmc/moc/index.html?moc=${mocKey}&tab=overview`

    // Clean description HTML if present
    let description = (raw.moc_description ?? '').trim()
    if (description.includes('<')) {
      description = cleanHtmlSnippet(description)
    }

    // Parse credential count
    let credentialCount: number | undefined
    if (raw.moc_cred_count) {
      const parsed = parseInt(raw.moc_cred_count, 10)
      if (!isNaN(parsed)) {
        credentialCount = parsed
      }
    }

    return {
      branch: 'marine_corps',
      code: code.toUpperCase(),
      name: title,
      rank,
      description: description || undefined,
      sourceUrl,
      externalId: mocId,
      fullTitle: raw.moc_full_title?.trim(),
      credentialCount,
      source: this.siteId,
      metadata: {
        coolKey: mocKey,
        externalUrl: raw.moc_url?.trim() || undefined,
      },
    }
  }

  /**
   * Log summary statistics by category
   */
  private logSummary(records: MosRawData[]): void {
    const log = this.ctx!.log

    const byRank: Record<string, number> = {}
    for (const record of records) {
      byRank[record.rank] = (byRank[record.rank] ?? 0) + 1
    }

    log.info('')
    log.info('=== Summary ===')
    for (const [rank, count] of Object.entries(byRank).sort()) {
      log.info(`  ${rank}: ${count}`)
    }
  }

  /**
   * Export records to JSON file
   */
  private async exportToJson(records: MosRawData[]): Promise<void> {
    const log = this.ctx!.log
    const fs = await import('fs/promises')
    const path = await import('path')

    const outputPath = path.join(process.cwd(), 'marines-mos-export.json')
    await fs.writeFile(outputPath, JSON.stringify(records, null, 2))
    log.info(`Exported ${records.length} records to ${outputPath}`)
  }
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Pipeline handler for the Marine Corps COOL scraper
 */
async function marinesScrapeHandler(
  ctx: import('../../lib/pipeline').PipelineContext
): Promise<void> {
  const scraper = new MarinesCoolScraper()

  // Set filters from pipeline args
  scraper.setFilters(ctx.options.args ?? {})

  // Create Convex client
  const convex = createPipelineClient()

  // Run the scraper
  const result = await scraper.run(ctx, convex)

  // Log final results
  ctx.log.info('')
  ctx.log.info('=== Final Results ===')
  ctx.log.info(`Total scraped: ${result.totalScraped}`)
  ctx.log.info(`Total inserted: ${result.totalInserted}`)
  ctx.log.info(`Total skipped: ${result.totalSkipped}`)
  ctx.log.info(`Total failed: ${result.totalFailed}`)
  ctx.log.info(`Duration: ${(result.durationMs / 1000).toFixed(2)}s`)

  if (result.errors.length > 0) {
    ctx.log.warn(`Errors (${result.errors.length}):`)
    for (const err of result.errors.slice(0, 5)) {
      ctx.log.warn(`  - ${err}`)
    }
    if (result.errors.length > 5) {
      ctx.log.warn(`  ... and ${result.errors.length - 5} more`)
    }
  }
}

// ============================================
// CLI Entry Point
// ============================================

async function main(): Promise<void> {
  // Initialize the registry with placeholder scripts
  registerPlaceholderScripts()

  // Replace the placeholder handler with our implementation
  replaceScriptHandler('mos-scrape-marines', marinesScrapeHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-scrape-marines')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
