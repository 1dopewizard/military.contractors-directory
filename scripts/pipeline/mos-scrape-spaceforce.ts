#!/usr/bin/env npx tsx
/**
 * @file Space Force Career Scraper
 * @description Scrape Space Force career data from spaceforce.com Next.js JSON endpoints
 *
 * Source: https://www.spaceforce.com/career-finder
 *
 * This script uses the Space Force website's Next.js JSON endpoints to fetch
 * all career data. Space Force doesn't use traditional AFSC codes - instead
 * we use career slugs as codes.
 *
 * Categories covered:
 * - Enlisted: Guardian careers marked as "Enlisted"
 * - Officer: Guardian careers marked as "Officer"
 *
 * Per career we capture:
 *   - branch       ("space_force")
 *   - code         (slug converted to code format, e.g., CYBER_SYSTEMS_OPERATIONS)
 *   - name         (career title)
 *   - rank         (enlisted, officer)
 *   - source_url   (career detail page URL)
 *   - description  (from career page metadata)
 *
 * Usage:
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-spaceforce.ts
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-spaceforce.ts --dry-run
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-spaceforce.ts --category=enlisted
 *   cd apps/contractors && npx tsx scripts/pipeline/mos-scrape-spaceforce.ts --export-json
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
 * Guardian type from Space Force API
 */
interface GuardianType {
  title?: string
  slug?: string
}

/**
 * Raw career record from Space Force JSON
 */
interface SpaceForceCareerResponse {
  slug?: string
  title?: string
  description?: string
  guardianType?: GuardianType
}

/**
 * Career detail page props
 */
interface CareerDetailPageProps {
  data?: Record<string, unknown>
  metadata?: {
    description?: string
    title?: string
  }
}

/**
 * Career finder page props
 */
interface CareerFinderPageProps {
  allCareerDetailPages?: SpaceForceCareerResponse[]
}

/**
 * Next.js data response wrapper
 */
interface NextDataResponse<T = unknown> {
  pageProps?: T
}

// ============================================
// Constants
// ============================================

/**
 * Career finder JSON URL template (requires build ID)
 */
const CAREERS_JSON_URL = 'https://www.spaceforce.com/_next/data/{buildId}/career-finder.json'

/**
 * Career detail JSON URL template
 */
const CAREER_DETAIL_URL =
  'https://www.spaceforce.com/_next/data/{buildId}/{careerType}-careers/{slug}.json'

/**
 * Guardian type to rank mapping
 */
const GUARDIAN_TYPE_TO_RANK: Record<string, PersonnelCategory> = {
  enlisted: 'enlisted',
  officer: 'officer',
}

// ============================================
// Space Force Scraper Implementation
// ============================================

/**
 * Scraper for Space Force careers (spaceforce.com)
 *
 * Space Force uses a Next.js website with JSON data endpoints.
 * We need to detect the build ID first, then fetch career data.
 */
class SpaceForceCareersApiScraper extends HttpApiMilitaryScraper {
  readonly siteId = 'spaceforce-careers'
  readonly siteName = 'Space Force Careers'
  readonly branch = 'space_force' as const
  readonly apiBaseUrl = 'https://www.spaceforce.com'

  // Build ID detected from the website
  private buildId: string | null = null

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
   * Fetch all career data from the Space Force website
   */
  async fetchData(): Promise<MosRawData[]> {
    const log = this.ctx!.log

    log.info('Fetching Space Force career data from spaceforce.com...')

    // Detect build ID
    this.buildId = await this.detectBuildId()
    if (!this.buildId) {
      throw new Error('Failed to detect Space Force website build ID')
    }

    log.info(`Detected build ID: ${this.buildId}`)

    // Fetch career list
    const rawCareers = await this.fetchCareers()
    if (!rawCareers.length) {
      throw new Error('No careers found from Space Force website')
    }

    log.info(`Received ${rawCareers.length} raw career records`)

    // Parse and transform records
    const records = await this.parseRecords(rawCareers)
    log.info(`Parsed ${records.length} valid military career records`)

    // Apply category filter
    const filtered = this.categoryFilter
      ? records.filter((r) => r.rank === this.categoryFilter)
      : records

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
   * Detect the Next.js build ID from the Space Force website
   */
  private async detectBuildId(): Promise<string | null> {
    const log = this.ctx!.log

    try {
      const response = await this.fetch('/career-finder')
      const html = await response.text()

      // Method 1: Look for _next/data/{buildId}/ in the HTML
      let match = html.match(/\/_next\/data\/([^/]+)\//)
      if (match?.[1]) {
        return match[1]
      }

      // Method 2: Look in __NEXT_DATA__ script tag
      match = html.match(/"buildId":"([^"]+)"/)
      if (match?.[1]) {
        return match[1]
      }

      log.error('Could not detect build ID from HTML')
      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`Failed to get build ID: ${message}`)
      return null
    }
  }

  /**
   * Fetch the career list from the JSON endpoint
   */
  private async fetchCareers(): Promise<SpaceForceCareerResponse[]> {
    const log = this.ctx!.log

    const url = CAREERS_JSON_URL.replace('{buildId}', this.buildId!)
    log.debug(`Fetching careers from: ${url}`)

    try {
      const response = await this.fetch(url)
      const data = (await response.json()) as NextDataResponse<CareerFinderPageProps>

      const careers = data.pageProps?.allCareerDetailPages ?? []
      log.info(`Found ${careers.length} total careers`)
      return careers
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`Failed to fetch careers: ${message}`)
      return []
    }
  }

  /**
   * Fetch detailed info for a specific career
   */
  private async fetchCareerDetail(
    slug: string,
    careerType: string
  ): Promise<CareerDetailPageProps | null> {
    const log = this.ctx!.log

    const url = CAREER_DETAIL_URL.replace('{buildId}', this.buildId!)
      .replace('{careerType}', careerType.toLowerCase())
      .replace('{slug}', slug)

    try {
      const response = await this.fetch(url)
      const data = (await response.json()) as NextDataResponse<CareerDetailPageProps>

      return {
        data: data.pageProps?.data,
        metadata: data.pageProps?.metadata,
      }
    } catch (error) {
      log.debug(`Failed to fetch detail for ${slug}: ${error}`)
      return null
    }
  }

  /**
   * Parse raw career responses into MosRawData records
   */
  private async parseRecords(raw: SpaceForceCareerResponse[]): Promise<MosRawData[]> {
    const records: MosRawData[] = []
    const log = this.ctx!.log

    for (const item of raw) {
      const record = await this.parseRecord(item)
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
  private async parseRecord(raw: SpaceForceCareerResponse): Promise<MosRawData | null> {
    const log = this.ctx!.log

    const slug = raw.slug?.trim()
    const title = raw.title?.trim()

    if (!slug) {
      return null
    }

    if (!title) {
      log.debug(`Skipping record without title: ${slug}`)
      return null
    }

    // Get guardian type
    const guardianType = raw.guardianType
    const guardianTitle = guardianType?.title?.toLowerCase() ?? ''

    // Skip civilians - only include enlisted and officer
    if (guardianTitle === 'civilian') {
      log.debug(`Skipping civilian career: ${title}`)
      return null
    }

    // Map guardian type to rank
    const rank = GUARDIAN_TYPE_TO_RANK[guardianTitle]
    if (!rank) {
      log.debug(`Unknown guardian type '${guardianTitle}' for ${title}, skipping`)
      return null
    }

    // Get description - start with the basic one
    let description = raw.description ?? ''

    // Try to get more detailed description from individual career page
    if (this.buildId) {
      const detail = await this.fetchCareerDetail(slug, guardianTitle)
      if (detail?.metadata?.description) {
        // Use SEO metadata description if longer
        if (detail.metadata.description.length > description.length) {
          description = detail.metadata.description
        }
      }
    }

    // Build source URL
    const sourceUrl = `https://www.spaceforce.com/${guardianTitle}-careers/${slug}`

    // Convert slug to code format (uppercase with underscores)
    const code = slug.toUpperCase().replace(/-/g, '_')

    return {
      branch: 'space_force',
      code,
      name: title,
      rank,
      description: description || undefined,
      sourceUrl,
      source: this.siteId,
      metadata: {
        slug,
        guardianType: guardianTitle,
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

    const outputPath = path.join(process.cwd(), 'spaceforce-careers-export.json')
    await fs.writeFile(outputPath, JSON.stringify(records, null, 2))
    log.info(`Exported ${records.length} records to ${outputPath}`)
  }
}

// ============================================
// Pipeline Handler
// ============================================

/**
 * Pipeline handler for the Space Force careers scraper
 */
async function spaceforceScrapeHandler(
  ctx: import('../../lib/pipeline').PipelineContext
): Promise<void> {
  const scraper = new SpaceForceCareersApiScraper()

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
  replaceScriptHandler('mos-scrape-spaceforce', spaceforceScrapeHandler)

  // Run via CLI helper
  await runPipelineCLI('mos-scrape-spaceforce')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
