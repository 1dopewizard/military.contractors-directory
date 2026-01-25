#!/usr/bin/env npx tsx
/**
 * @file Air Force AFSC Scraper
 * @description Scrape Air Force AFSC data from airforce.com careers API
 *
 * Source: https://www.airforce.com/careers/career-finder
 *
 * This script uses the Air Force public careers API to fetch all AFSC
 * (Air Force Specialty Code) data. The API provides paginated JSON data.
 *
 * Categories covered:
 * - Enlisted: AFSCs with "Enlisted" eyebrow
 * - Officer: AFSCs with "Officer" eyebrow
 *
 * Per AFSC we capture:
 *   - branch       ("air_force")
 *   - code         (e.g., 1N0X1, 17D, 1A8X1)
 *   - name         (job title)
 *   - rank         (enlisted, officer)
 *   - source_url   (career detail page URL)
 *   - description  (from inspirationalBanners)
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-airforce.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-airforce.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-airforce.ts --category=enlisted
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-airforce.ts --export-json
 */

import {
  HttpApiMilitaryScraper,
  type MosRawData,
  type PersonnelCategory,
  runPipelineCLI,
  replaceScriptHandler,
  registerPlaceholderScripts,
  createPipelineClient,
} from '../../lib/pipeline'

// ============================================
// Types
// ============================================

/**
 * Raw career record from Air Force API
 */
interface AirForceCareersResponse {
  afscCode?: string
  title?: string
  link?: {
    url?: string
  }
  heroModelContentHeading?: {
    eyebrow?: string
  }
  inspirationalBanners?: Array<{
    contentHeading?: {
      description?: string
    }
  }>
}

/**
 * Pagination metadata from API
 */
interface AirForcePagination {
  total?: number
  offset?: number
  limit?: number
}

/**
 * Full API response structure
 */
interface AirForceApiResponse {
  data?: AirForceCareersResponse[]
  pagination?: AirForcePagination
}

// ============================================
// Constants
// ============================================

/**
 * Air Force careers API endpoint
 */
const CAREERS_API_BASE = 'https://www.airforce.com/bin/api/careers'

/**
 * Root path for career content
 */
const CAREERS_ROOT_PATH = '/content/airforce/en/careers'

/**
 * Page size for API requests
 */
const PAGE_LIMIT = 100

/**
 * Eyebrow to rank mapping
 */
const EYEBROW_TO_RANK: Record<string, PersonnelCategory> = {
  Enlisted: 'enlisted',
  ENLISTED: 'enlisted',
  enlisted: 'enlisted',
  Officer: 'officer',
  OFFICER: 'officer',
  officer: 'officer',
  'Officer-Specialty': 'officer',
  Specialty: 'officer',
  CAREERS: 'officer', // Generic careers are typically officer-level
}

// ============================================
// Air Force Careers Scraper Implementation
// ============================================

/**
 * Scraper for Air Force careers API (airforce.com)
 *
 * Fetches all Air Force Specialty Codes (AFSCs) from the official
 * Air Force careers website.
 */
class AirForceCareersApiScraper extends HttpApiMilitaryScraper {
  readonly siteId = 'airforce-careers'
  readonly siteName = 'Air Force Careers'
  readonly branch = 'air_force' as const
  readonly apiBaseUrl = CAREERS_API_BASE

  // Optional filters from CLI args
  private categoryFilter?: PersonnelCategory
  private exportJson = false

  /**
   * Set filters from pipeline args
   */
  setFilters(args: Record<string, unknown> = {}): void {
    if (args.category && typeof args.category === 'string') {
      const cat = args.category.toLowerCase()
      if (['enlisted', 'officer'].includes(cat)) {
        this.categoryFilter = cat as PersonnelCategory
      }
    }
    if (args.exportJson === 'true' || args.exportJson === true) {
      this.exportJson = true
    }
  }

  /**
   * Fetch all AFSC data from the Air Force careers API
   */
  async fetchData(): Promise<MosRawData[]> {
    const log = this.ctx!.log

    log.info('Fetching Air Force AFSC data from careers API...')

    // Fetch all pages
    const rawRecords = await this.fetchAllPages()
    log.info(`Received ${rawRecords.length} raw career records from API`)

    // Parse and transform records
    const records = this.parseRecords(rawRecords)
    log.info(`Parsed ${records.length} valid AFSC records`)

    // Deduplicate by code
    const deduped = this.deduplicateByCode(records)
    if (deduped.length < records.length) {
      log.info(`Deduplicated to ${deduped.length} unique AFSC records`)
    }

    // Apply category filter
    const filtered = this.categoryFilter
      ? deduped.filter((r) => r.rank === this.categoryFilter)
      : deduped

    if (this.categoryFilter) {
      log.info(`Filtered to ${filtered.length} records (category=${this.categoryFilter})`)
    }

    // Log summary
    this.logSummary(filtered)

    // Export to JSON if requested
    if (this.exportJson) {
      await this.exportToJson(filtered)
    }

    return filtered
  }

  /**
   * Fetch all pages from the API
   */
  private async fetchAllPages(): Promise<AirForceCareersResponse[]> {
    const log = this.ctx!.log
    const allRecords: AirForceCareersResponse[] = []
    let offset = 0

    while (true) {
      const params = new URLSearchParams({
        careersRootPath: CAREERS_ROOT_PATH,
        limit: PAGE_LIMIT.toString(),
        offset: offset.toString(),
      })

      const url = `${this.apiBaseUrl}?${params.toString()}`
      log.debug(`Fetching: ${url}`)

      try {
        const response = await this.fetch(url)
        const data = (await response.json()) as AirForceApiResponse

        const records = data.data ?? []
        const pagination = data.pagination ?? {}
        const total = pagination.total ?? 0

        allRecords.push(...records)
        log.info(
          `Fetched ${records.length} records at offset ${offset} (total: ${allRecords.length}/${total})`
        )

        if (allRecords.length >= total || records.length === 0) {
          break
        }

        offset = allRecords.length
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log.error(`API request failed: ${message}`)
        break
      }
    }

    return allRecords
  }

  /**
   * Parse raw API responses into MosRawData records
   */
  private parseRecords(raw: AirForceCareersResponse[]): MosRawData[] {
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
   * Parse a single career record into MosRawData
   */
  private parseRecord(raw: AirForceCareersResponse): MosRawData | null {
    const log = this.ctx!.log

    const afscCode = raw.afscCode?.trim()
    const title = raw.title?.trim()

    if (!afscCode) {
      log.debug(`Skipping record without AFSC code: ${title ?? 'Unknown'}`)
      return null
    }

    if (!title) {
      log.debug(`Skipping record without title: ${afscCode}`)
      return null
    }

    // Determine rank from eyebrow
    const eyebrow = raw.heroModelContentHeading?.eyebrow ?? ''
    let rank = EYEBROW_TO_RANK[eyebrow]
    if (!rank) {
      log.debug(`Unknown eyebrow type '${eyebrow}' for ${afscCode} (${title}), defaulting to enlisted`)
      rank = 'enlisted'
    }

    // Extract description from inspirationalBanners
    let description = ''
    const banners = raw.inspirationalBanners ?? []
    if (banners.length > 0) {
      const contentHeading = banners[0]?.contentHeading
      description = contentHeading?.description ?? ''
    }

    // Build source URL
    const linkUrl = raw.link?.url ?? ''
    const sourceUrl = linkUrl
      ? `https://www.airforce.com${linkUrl}`
      : 'https://www.airforce.com/careers/career-finder'

    return {
      branch: 'air_force',
      code: afscCode.toUpperCase(),
      name: title,
      rank,
      description: description || undefined,
      sourceUrl,
      source: this.siteId,
      metadata: {
        eyebrow: eyebrow || undefined,
      },
    }
  }

  /**
   * Deduplicate records by code, keeping the one with more data
   */
  private deduplicateByCode(records: MosRawData[]): MosRawData[] {
    const seen = new Map<string, MosRawData>()
    const log = this.ctx!.log

    for (const record of records) {
      const existing = seen.get(record.code)

      if (!existing) {
        seen.set(record.code, record)
      } else {
        // Append alternate name to existing record's description
        if (existing.description && record.name && !existing.description.includes(record.name)) {
          existing.description = `${existing.description} Also includes: ${record.name}.`
        }
        log.debug(`Skipping duplicate AFSC ${record.code}: ${record.name} (keeping ${existing.name})`)
      }
    }

    return Array.from(seen.values())
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

    const outputPath = path.join(process.cwd(), 'airforce-afsc-export.json')
    await fs.writeFile(outputPath, JSON.stringify(records, null, 2))
    log.info(`Exported ${records.length} records to ${outputPath}`)
  }
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Pipeline handler for the Air Force careers scraper
 */
async function airforceScrapeHandler(
  ctx: import('../../lib/pipeline').PipelineContext
): Promise<void> {
  const scraper = new AirForceCareersApiScraper()

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
  replaceScriptHandler('mos-scrape-airforce', airforceScrapeHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-scrape-airforce')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
