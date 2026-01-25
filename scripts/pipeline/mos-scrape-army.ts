#!/usr/bin/env npx tsx
/**
 * @file Army COOL MOS Scraper
 * @description Scrape Army MOS data from COOL (Credentialing Opportunities On-Line) API
 *
 * Source: https://www.cool.osd.mil/army/moc/index.html
 *
 * This script uses the COOL public API to efficiently fetch all Army MOS data
 * without browser automation. The API provides structured JSON data directly.
 *
 * Categories covered:
 * - Enlisted: MOS + Additional Skills Identifiers (ASI)
 * - Officer: Area of Concentration (AOC)
 * - Warrant Officer: Warrant Officer MOS (WO)
 *
 * Per MOS we capture:
 *   - branch       ("army")
 *   - code         (e.g., 11B, 11A, 150A)
 *   - name         (job title)
 *   - rank         (enlisted, warrant_officer, officer)
 *   - source_url   (full detail page URL)
 *   - description  (text from the MOS detail API)
 *   - externalId   (internal COOL ID)
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-army.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-army.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-army.ts --category=enlisted
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-army.ts --export-json
 */

import {
  HttpApiMilitaryScraper,
  type MosRawData,
  type PersonnelCategory,
  buildCoolUrl,
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

/**
 * Code type from COOL (MOS, ASI, AOC, WO)
 */
type CoolCodeType = 'mos' | 'asi' | 'aoc' | 'wo'

// ============================================
// Constants
// ============================================

/**
 * COOL API endpoint (AWS API Gateway -> S3 Select)
 */
const COOL_API_BASE = 'https://0ikdu2qdaj.execute-api.us-east-1.amazonaws.com/v1/getcooldata'

/**
 * S3 datafile for Army MOC data
 */
const ARMY_MOC_DATAFILE = 'cool/army/army_moc.json'

/**
 * S3 Select expression to get all MOS/AOC/WO/ASI entries
 */
const LIST_ALL_QUERY = `
select s.*
from s3object[*].army_moc[*] s
where s.moc_summarypage = '1'
`

/**
 * Personnel category mappings from COOL API codes
 */
const PERSONNEL_CATEGORY_MAP: Record<string, PersonnelCategory> = {
  E: 'enlisted',
  O: 'officer',
  W: 'warrant_officer',
}

/**
 * Code type mappings from COOL API
 */
const CODE_TYPE_MAP: Record<string, CoolCodeType> = {
  MOS: 'mos',
  ASI: 'asi',
  AOC: 'aoc',
  WO: 'wo',
}

// ============================================
// Army COOL Scraper Implementation
// ============================================

/**
 * Scraper for Army COOL (Credentialing Opportunities On-Line) API
 *
 * This scraper uses the COOL public API which provides structured JSON data
 * via AWS S3 Select queries. Much more efficient than browser scraping.
 */
class ArmyCoolScraper extends HttpApiMilitaryScraper {
  readonly siteId = 'army-cool'
  readonly siteName = 'Army COOL'
  readonly branch = 'army' as const
  readonly apiBaseUrl = COOL_API_BASE

  // Optional filters from CLI args
  private categoryFilter?: PersonnelCategory
  private codeTypeFilter?: CoolCodeType
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
    if (args.codeType && typeof args.codeType === 'string') {
      const ct = args.codeType.toLowerCase()
      if (['mos', 'asi', 'aoc', 'wo'].includes(ct)) {
        this.codeTypeFilter = ct as CoolCodeType
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

    log.info('Fetching Army MOS data from COOL API...')

    // Build query URL with S3 Select expression
    const params = new URLSearchParams({
      expression: LIST_ALL_QUERY.trim(),
      datafile: ARMY_MOC_DATAFILE,
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
      log.info(`Parsed ${records.length} valid MOS records`)

      // Apply filters
      const filtered = this.applyFilters(records)
      if (this.categoryFilter || this.codeTypeFilter) {
        log.info(
          `Filtered to ${filtered.length} records (category=${this.categoryFilter ?? 'all'}, codeType=${this.codeTypeFilter ?? 'all'})`
        )
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

    // Map code type (stored in metadata)
    const codeTypeRaw = (raw.moc_codetype ?? 'MOS').toUpperCase()
    const codeType = CODE_TYPE_MAP[codeTypeRaw] ?? 'mos'

    // Build source URL
    const sourceUrl = buildCoolUrl('army', mocKey)

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
      branch: 'army',
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
        codeType,
        coolKey: mocKey,
        externalUrl: raw.moc_url?.trim() || undefined,
      },
    }
  }

  /**
   * Apply category and code type filters
   */
  private applyFilters(records: MosRawData[]): MosRawData[] {
    let filtered = records

    if (this.categoryFilter) {
      filtered = filtered.filter((r) => r.rank === this.categoryFilter)
    }

    if (this.codeTypeFilter) {
      filtered = filtered.filter((r) => {
        const meta = r.metadata as { codeType?: string } | undefined
        return meta?.codeType === this.codeTypeFilter
      })
    }

    return filtered
  }

  /**
   * Log summary statistics by category
   */
  private logSummary(records: MosRawData[]): void {
    const log = this.ctx!.log

    const byCategory: Record<string, Record<string, number>> = {}

    for (const record of records) {
      const cat = record.rank
      const meta = record.metadata as { codeType?: string } | undefined
      const codeType = meta?.codeType ?? 'mos'

      if (!byCategory[cat]) {
        byCategory[cat] = {}
      }
      byCategory[cat][codeType] = (byCategory[cat][codeType] ?? 0) + 1
    }

    log.info('')
    log.info('=== Summary ===')
    for (const [cat, types] of Object.entries(byCategory).sort()) {
      log.info(`${cat}:`)
      for (const [ct, count] of Object.entries(types).sort()) {
        log.info(`  - ${ct}: ${count}`)
      }
    }
  }

  /**
   * Export records to JSON file
   */
  private async exportToJson(records: MosRawData[]): Promise<void> {
    const log = this.ctx!.log
    const fs = await import('fs/promises')
    const path = await import('path')

    const outputPath = path.join(process.cwd(), 'army-mos-export.json')
    await fs.writeFile(outputPath, JSON.stringify(records, null, 2))
    log.info(`Exported ${records.length} records to ${outputPath}`)
  }
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Pipeline handler for the Army COOL scraper
 */
async function armyScrapeHandler(ctx: import('../../lib/pipeline').PipelineContext): Promise<void> {
  const scraper = new ArmyCoolScraper()

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
  replaceScriptHandler('mos-scrape-army', armyScrapeHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-scrape-army')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
