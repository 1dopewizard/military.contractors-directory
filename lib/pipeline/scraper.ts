/**
 * @file Crawlee Scraper Base Classes
 * @description Base classes for web scraping military MOS data using Crawlee
 *
 * This module provides abstract base classes for building MOS scrapers:
 * - `BaseMilitaryScraper` - Abstract base with common functionality
 * - `PlaywrightMilitaryScraper` - For JS-heavy sites requiring browser automation
 * - `CheerioMilitaryScraper` - For simpler HTML/API-based sites
 *
 * Features:
 * - Integration with pipeline logging and progress tracking
 * - HTML-to-Markdown conversion using Turndown
 * - SQL database integration for storing results (Drizzle/libSQL)
 * - Configurable concurrency, retries, and timeouts
 * - Dry-run mode for testing without database writes
 *
 * Usage:
 * ```typescript
 * import { PlaywrightMilitaryScraper, type MosRawData } from '@/lib/pipeline/scraper'
 *
 * class ArmyCoolScraper extends PlaywrightMilitaryScraper {
 *   siteId = 'army-cool'
 *   siteName = 'Army COOL'
 *   branch = 'army'
 *   startUrls = ['https://www.cool.osd.mil/army/moc/index.html']
 *
 *   async extractData(context) {
 *     // Extract MOS data from the page
 *     return [{ code: '11B', name: 'Infantryman', ... }]
 *   }
 * }
 * ```
 */

import type { Page } from 'playwright'
import type { CheerioAPI } from 'cheerio'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { PipelineContext, PipelineLogger } from './types'
import { htmlToMarkdown, type TurndownOptions, type SitePreset } from './turndown'

// ============================================
// Types
// ============================================

/**
 * Military branch identifiers matching SQL schema
 */
export type MilitaryBranch =
  | 'army'
  | 'navy'
  | 'air_force'
  | 'marine_corps'
  | 'coast_guard'
  | 'space_force'

/**
 * MOS category identifiers matching SQL schema
 */
export type MosCategory =
  | 'IT_CYBER'
  | 'INTELLIGENCE'
  | 'COMMUNICATIONS'
  | 'COMBAT'
  | 'LOGISTICS'
  | 'MEDICAL'
  | 'AVIATION'
  | 'ENGINEERING'
  | 'SUPPORT'
  | 'UNCLASSIFIED'

/**
 * Personnel category (enlisted, officer, warrant officer)
 */
export type PersonnelCategory = 'enlisted' | 'officer' | 'warrant_officer'

/**
 * Raw MOS data structure scraped from source sites
 *
 * This matches the shape expected by the SQL `mos_code` table,
 * with additional metadata fields for tracking scrape provenance.
 */
export interface MosRawData {
  /** Military branch */
  branch: MilitaryBranch
  /** MOS/AFSC/Rating code (e.g., "11B", "1N0X1", "IT") */
  code: string
  /** Job title/name */
  name: string
  /** Personnel rank/category (enlisted, officer, warrant_officer) */
  rank: PersonnelCategory
  /** Full job description (may be HTML or Markdown) */
  description?: string
  /** Source URL for this MOS data */
  sourceUrl: string
  /** Categorization of the MOS */
  mosCategory?: MosCategory
  /** AI-generated summary (populated during enrichment) */
  summarizedDescription?: string
  /** Data source identifier */
  source?: string

  // Additional metadata from scraping
  /** Internal ID from source system (e.g., COOL ID) */
  externalId?: string
  /** Full title if different from name */
  fullTitle?: string
  /** Related credential count */
  credentialCount?: number
  /** Raw HTML content before conversion */
  rawHtml?: string
  /** Markdown-converted content */
  markdownContent?: string
  /** Additional unstructured metadata */
  metadata?: Record<string, unknown>
}

/**
 * Scraper configuration options
 */
export interface ScraperConfig {
  /** Minimum concurrent requests */
  minConcurrency?: number
  /** Maximum concurrent requests */
  maxConcurrency?: number
  /** Maximum retries per request */
  maxRetries?: number
  /** Request timeout in seconds */
  requestTimeoutSecs?: number
  /** Maximum total requests (for testing) */
  maxRequests?: number
  /** Browser headless mode (for Playwright) */
  headless?: boolean
  /** User agent string */
  userAgent?: string
  /** Turndown options for HTML-to-Markdown conversion */
  turndownOptions?: TurndownOptions
  /** Turndown preset for specific military sites */
  turndownPreset?: SitePreset
  /** Whether to store raw HTML in results */
  storeRawHtml?: boolean
  /** Custom HTTP headers */
  headers?: Record<string, string>
}

/**
 * Default scraper configuration
 */
export const DEFAULT_SCRAPER_CONFIG: Required<ScraperConfig> = {
  minConcurrency: 1,
  maxConcurrency: 10,
  maxRetries: 3,
  requestTimeoutSecs: 60,
  maxRequests: 1000,
  headless: true,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  turndownOptions: {},
  turndownPreset: 'generic',
  storeRawHtml: false,
  headers: {},
}

/**
 * Context passed to Playwright extraction handlers
 */
export interface PlaywrightExtractionContext {
  /** Playwright Page object */
  page: Page
  /** Current request URL */
  url: string
  /** Request label (for multi-page crawls) */
  label?: string
  /** Function to enqueue additional URLs */
  enqueueLinks: (options: { selector: string; label?: string }) => Promise<void>
  /** Pipeline logger */
  log: PipelineLogger
  /** Convert HTML to Markdown */
  toMarkdown: (html: string) => string
}

/**
 * Context passed to Cheerio extraction handlers
 */
export interface CheerioExtractionContext {
  /** Cheerio instance loaded with page HTML */
  $: CheerioAPI
  /** Current request URL */
  url: string
  /** Request label (for multi-page crawls) */
  label?: string
  /** Function to enqueue additional URLs */
  enqueueLinks: (options: { selector: string; label?: string }) => Promise<void>
  /** Pipeline logger */
  log: PipelineLogger
  /** Convert HTML to Markdown */
  toMarkdown: (html: string) => string
  /** Raw HTML body */
  body: string
}

/**
 * Result of a scraper run
 */
export interface ScraperResult {
  /** Number of MOS records scraped */
  totalScraped: number
  /** Number of records successfully inserted/updated */
  totalInserted: number
  /** Number of records that failed to insert */
  totalFailed: number
  /** Number of duplicate records skipped */
  totalSkipped: number
  /** Duration in milliseconds */
  durationMs: number
  /** Any errors encountered */
  errors: string[]
  /** Scraped data (if not persisted) */
  data?: MosRawData[]
}

// ============================================
// Abstract Base Class
// ============================================

/**
 * Abstract base class for military MOS scrapers
 *
 * Provides common functionality for all scraper implementations:
 * - Configuration management
 * - HTML-to-Markdown conversion
 * - Pipeline integration (logging, progress)
 * - Result aggregation
 *
 * Subclasses must implement:
 * - `siteId` - Unique identifier for this scraper
 * - `siteName` - Human-readable site name
 * - `branch` - Military branch being scraped
 * - `startUrls` - Initial URLs to crawl
 * - `createCrawler()` - Create the Crawlee crawler instance
 * - `extractData()` - Extract MOS data from pages
 */
export abstract class BaseMilitaryScraper {
  /** Unique identifier for this scraper (e.g., 'army-cool') */
  abstract readonly siteId: string

  /** Human-readable site name (e.g., 'Army COOL') */
  abstract readonly siteName: string

  /** Military branch this scraper targets */
  abstract readonly branch: MilitaryBranch

  /** Starting URLs to crawl */
  abstract readonly startUrls: string[]

  /** Scraper configuration */
  protected config: Required<ScraperConfig>

  /** Pipeline context (set when run() is called) */
  protected ctx?: PipelineContext

  /** Database instance for SQL operations */
  protected db?: LibSQLDatabase<any>

  /** Collected MOS data during crawl */
  protected collectedData: MosRawData[] = []

  /** Errors collected during crawl */
  protected errors: string[] = []

  constructor(config: ScraperConfig = {}) {
    this.config = { ...DEFAULT_SCRAPER_CONFIG, ...config }
  }

  /**
   * Run the scraper with pipeline context
   *
   * @param ctx - Pipeline context with logging, progress, etc.
   * @param db - Drizzle database instance for SQL operations
   * @returns Scraper result with statistics
   */
  async run(ctx: PipelineContext, db?: LibSQLDatabase<any>): Promise<ScraperResult> {
    this.ctx = ctx
    this.db = db
    this.collectedData = []
    this.errors = []

    const startTime = Date.now()
    const { log, options } = ctx

    log.info(`Starting ${this.siteName} scraper (${this.siteId})`)
    log.info(`Branch: ${this.branch}`)
    log.info(`Start URLs: ${this.startUrls.join(', ')}`)

    if (options.dryRun) {
      log.info('DRY RUN mode - no data will be persisted')
    }

    try {
      // Run the crawler
      await this.executeCrawl()

      log.info(`Crawl complete. Collected ${this.collectedData.length} MOS records`)

      // Deduplicate by branch+code
      const dedupedData = this.deduplicateRecords(this.collectedData)
      log.info(`After deduplication: ${dedupedData.length} unique records`)

      // Persist to SQL (unless dry run)
      let inserted = 0
      let failed = 0
      let skipped = 0

      if (!options.dryRun && db) {
        const persistResult = await this.persistToSql(dedupedData, db, log)
        inserted = persistResult.inserted
        failed = persistResult.failed
        skipped = persistResult.skipped
      } else if (options.dryRun) {
        // In dry run, show sample of what would be inserted
        log.info('Sample records that would be inserted:')
        for (const record of dedupedData.slice(0, 5)) {
          log.info(`  - ${record.code}: ${record.name} (${record.rank})`)
        }
        if (dedupedData.length > 5) {
          log.info(`  ... and ${dedupedData.length - 5} more`)
        }
      }

      const durationMs = Date.now() - startTime
      log.success(
        `${this.siteName} scraper complete: ${inserted} inserted, ${skipped} skipped, ${failed} failed`
      )

      return {
        totalScraped: this.collectedData.length,
        totalInserted: inserted,
        totalFailed: failed,
        totalSkipped: skipped,
        durationMs,
        errors: this.errors,
        data: options.dryRun ? dedupedData : undefined,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`Scraper failed: ${message}`)
      this.errors.push(message)

      return {
        totalScraped: this.collectedData.length,
        totalInserted: 0,
        totalFailed: this.collectedData.length,
        totalSkipped: 0,
        durationMs: Date.now() - startTime,
        errors: this.errors,
      }
    }
  }

  /**
   * Execute the actual crawl
   * Implemented by subclasses to create and run the appropriate crawler
   */
  protected abstract executeCrawl(): Promise<void>

  /**
   * Convert HTML to Markdown using configured options
   */
  protected toMarkdown(html: string): string {
    return htmlToMarkdown(html, this.config.turndownOptions)
  }

  /**
   * Add a scraped MOS record to the collection
   */
  protected addRecord(record: MosRawData): void {
    // Ensure branch is set
    if (!record.branch) {
      record.branch = this.branch
    }

    // Ensure source is set
    if (!record.source) {
      record.source = this.siteId
    }

    // Convert HTML description to Markdown if present
    if (record.description && record.description.includes('<')) {
      record.markdownContent = this.toMarkdown(record.description)
      if (this.config.storeRawHtml) {
        record.rawHtml = record.description
      }
      record.description = record.markdownContent
    }

    this.collectedData.push(record)
  }

  /**
   * Add multiple scraped records
   */
  protected addRecords(records: MosRawData[]): void {
    for (const record of records) {
      this.addRecord(record)
    }
  }

  /**
   * Report an error during scraping
   */
  protected reportError(error: string | Error, url?: string): void {
    const message = error instanceof Error ? error.message : error
    const fullMessage = url ? `[${url}] ${message}` : message
    this.errors.push(fullMessage)
    this.ctx?.log.warn(`Scrape error: ${fullMessage}`)
  }

  /**
   * Deduplicate records by branch+code, preferring records with more data
   */
  protected deduplicateRecords(records: MosRawData[]): MosRawData[] {
    const seen = new Map<string, MosRawData>()

    for (const record of records) {
      const key = `${record.branch}:${record.code}`
      const existing = seen.get(key)

      if (!existing) {
        seen.set(key, record)
      } else {
        // Prefer the record with more data
        const existingScore = this.scoreRecord(existing)
        const newScore = this.scoreRecord(record)
        if (newScore > existingScore) {
          seen.set(key, record)
        }
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Score a record based on data completeness
   */
  private scoreRecord(record: MosRawData): number {
    let score = 0
    if (record.description) score += 10
    if (record.name) score += 5
    if (record.mosCategory) score += 3
    if (record.sourceUrl) score += 2
    if (record.metadata && Object.keys(record.metadata).length > 0) score += 1
    return score
  }

  /**
   * Persist scraped data to SQL database
   */
  protected async persistToSql(
    records: MosRawData[],
    db: LibSQLDatabase<any>,
    log: PipelineLogger
  ): Promise<{ inserted: number; failed: number; skipped: number }> {
    // Dynamically import schema to avoid circular dependencies
    const { mosCode } = await import('@/server/database/schema/mos')
    const { eq, and } = await import('drizzle-orm')

    let inserted = 0
    let failed = 0
    let skipped = 0

    log.info(`Persisting ${records.length} records to SQL database...`)

    // Report progress
    let processed = 0
    const total = records.length

    for (const record of records) {
      try {
        // Check if record already exists
        const [existing] = await db
          .select()
          .from(mosCode)
          .where(and(
            eq(mosCode.branch, record.branch),
            eq(mosCode.code, record.code)
          ))
          .limit(1)

        if (existing) {
          // Update existing record if we have more data
          const hasMoreData =
            (!existing.description && record.description) ||
            (!existing.mosCategory && record.mosCategory)

          if (hasMoreData) {
            await db
              .update(mosCode)
              .set({
                description: record.description ?? existing.description,
                mosCategory: record.mosCategory ?? existing.mosCategory,
                updatedAt: new Date(),
              })
              .where(eq(mosCode.id, existing.id))
            inserted++
          } else {
            skipped++
          }
        } else {
          // Create new record
          await db.insert(mosCode).values({
            id: crypto.randomUUID(),
            branch: record.branch,
            code: record.code,
            name: record.name,
            rank: record.rank,
            description: record.description,
            sourceUrl: record.sourceUrl,
            mosCategory: record.mosCategory ?? 'UNCLASSIFIED',
            source: record.source,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          inserted++
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log.warn(`Failed to persist ${record.branch}/${record.code}: ${message}`)
        failed++
      }

      // Update progress periodically
      processed++
      if (processed % 50 === 0 || processed === total) {
        await this.ctx?.progress({
          current: processed,
          total,
          phase: 'persisting',
          item: `${record.branch}/${record.code}`,
        })
      }
    }

    return { inserted, failed, skipped }
  }
}

// ============================================
// Playwright Scraper Base
// ============================================

/**
 * Abstract base class for Playwright-based scrapers
 *
 * Use this for sites that require JavaScript execution, such as:
 * - Single Page Applications (SPAs)
 * - Sites with dynamic content loading
 * - Sites requiring user interaction
 */
export abstract class PlaywrightMilitaryScraper extends BaseMilitaryScraper {
  /**
   * Extract MOS data from a page
   *
   * Implement this method to scrape MOS data from the loaded page.
   * Return an array of MosRawData objects.
   *
   * @param context - Extraction context with page, utilities, etc.
   * @returns Array of scraped MOS records
   */
  abstract extractData(context: PlaywrightExtractionContext): Promise<MosRawData[]>

  /**
   * Optional: Handle page-specific logic based on URL/label
   * Override to implement multi-page crawl logic
   */
  protected async handlePage(context: PlaywrightExtractionContext): Promise<void> {
    const data = await this.extractData(context)
    this.addRecords(data)
  }

  /**
   * Execute the Playwright crawl
   */
  protected async executeCrawl(): Promise<void> {
    // Dynamic import to avoid loading Crawlee in non-pipeline contexts
    const { PlaywrightCrawler } = await import('crawlee')

    const log = this.ctx!.log
    const self = this

    const crawler = new PlaywrightCrawler({
      launchContext: {
        launchOptions: {
          headless: this.config.headless,
        },
      },
      minConcurrency: this.config.minConcurrency,
      maxConcurrency: this.config.maxConcurrency,
      maxRequestRetries: this.config.maxRetries,
      requestHandlerTimeoutSecs: this.config.requestTimeoutSecs,
      maxRequestsPerCrawl: this.config.maxRequests,

      async requestHandler({ page, request, enqueueLinks: crawleeEnqueueLinks }) {
        log.info(`Processing: ${request.url}`)

        try {
          // Create extraction context
          const context: PlaywrightExtractionContext = {
            page,
            url: request.url,
            label: request.label,
            enqueueLinks: async (options) => {
              await crawleeEnqueueLinks({
                selector: options.selector,
                label: options.label,
              })
            },
            log,
            toMarkdown: (html: string) => self.toMarkdown(html),
          }

          // Handle the page
          await self.handlePage(context)
        } catch (error) {
          self.reportError(error instanceof Error ? error : String(error), request.url)
        }
      },

      failedRequestHandler: ({ request }) => {
        self.reportError(`Request failed after ${self.config.maxRetries} retries`, request.url)
      },
    })

    // Add start URLs
    await crawler.addRequests(this.startUrls)

    // Run the crawler
    await crawler.run()
  }
}

// ============================================
// Cheerio Scraper Base
// ============================================

/**
 * Abstract base class for Cheerio-based scrapers
 *
 * Use this for sites that work with simple HTTP requests:
 * - Static HTML pages
 * - REST APIs returning HTML
 * - Sites without complex JavaScript
 *
 * This is more efficient than Playwright when browser execution isn't needed.
 */
export abstract class CheerioMilitaryScraper extends BaseMilitaryScraper {
  /**
   * Extract MOS data from the page HTML
   *
   * Implement this method to scrape MOS data using Cheerio.
   * Return an array of MosRawData objects.
   *
   * @param context - Extraction context with Cheerio, utilities, etc.
   * @returns Array of scraped MOS records
   */
  abstract extractData(context: CheerioExtractionContext): Promise<MosRawData[]>

  /**
   * Optional: Handle page-specific logic based on URL/label
   * Override to implement multi-page crawl logic
   */
  protected async handlePage(context: CheerioExtractionContext): Promise<void> {
    const data = await this.extractData(context)
    this.addRecords(data)
  }

  /**
   * Execute the Cheerio crawl
   */
  protected async executeCrawl(): Promise<void> {
    // Dynamic import to avoid loading Crawlee in non-pipeline contexts
    const { CheerioCrawler } = await import('crawlee')

    const log = this.ctx!.log
    const self = this

    const crawler = new CheerioCrawler({
      minConcurrency: this.config.minConcurrency,
      maxConcurrency: this.config.maxConcurrency,
      maxRequestRetries: this.config.maxRetries,
      requestHandlerTimeoutSecs: this.config.requestTimeoutSecs,
      maxRequestsPerCrawl: this.config.maxRequests,

      async requestHandler({ $, request, body, enqueueLinks: crawleeEnqueueLinks }) {
        log.info(`Processing: ${request.url}`)

        try {
          // Create extraction context
          const context: CheerioExtractionContext = {
            $,
            url: request.url,
            label: request.label,
            body: body.toString(),
            enqueueLinks: async (options) => {
              await crawleeEnqueueLinks({
                selector: options.selector,
                label: options.label,
              })
            },
            log,
            toMarkdown: (html: string) => self.toMarkdown(html),
          }

          // Handle the page
          await self.handlePage(context)
        } catch (error) {
          self.reportError(error instanceof Error ? error : String(error), request.url)
        }
      },

      failedRequestHandler: ({ request }) => {
        self.reportError(`Request failed after ${self.config.maxRetries} retries`, request.url)
      },
    })

    // Add start URLs
    await crawler.addRequests(this.startUrls)

    // Run the crawler
    await crawler.run()
  }
}

// ============================================
// HTTP API Scraper Base
// ============================================

/**
 * Abstract base class for API-based scrapers
 *
 * Use this for sites with structured APIs (JSON, XML):
 * - REST APIs returning JSON data
 * - GraphQL endpoints
 * - AWS API Gateway / S3 Select APIs (like COOL)
 *
 * This is the most efficient option when the data is already structured.
 */
export abstract class HttpApiMilitaryScraper extends BaseMilitaryScraper {
  /** Base URL for API requests */
  abstract readonly apiBaseUrl: string

  /** API endpoints don't have start URLs in the traditional sense */
  readonly startUrls: string[] = []

  /**
   * Fetch and parse all MOS data from the API
   *
   * Implement this method to fetch data from the API.
   * Return an array of MosRawData objects.
   *
   * @returns Array of scraped MOS records
   */
  abstract fetchData(): Promise<MosRawData[]>

  /**
   * Make an HTTP request to the API
   *
   * @param path - API path (appended to apiBaseUrl)
   * @param options - Fetch options
   * @returns Fetch Response
   */
  protected async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${this.apiBaseUrl}${path}`

    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/json',
      ...this.config.headers,
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }

  /**
   * Fetch JSON from the API
   *
   * @param path - API path
   * @param options - Fetch options
   * @returns Parsed JSON response
   */
  protected async fetchJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const response = await this.fetch(path, options)
    return (await response.json()) as T
  }

  /**
   * Execute the API scrape
   */
  protected async executeCrawl(): Promise<void> {
    const log = this.ctx!.log

    log.info(`Fetching data from ${this.apiBaseUrl}...`)

    try {
      const data = await this.fetchData()
      this.addRecords(data)
      log.info(`Fetched ${data.length} records from API`)
    } catch (error) {
      this.reportError(error instanceof Error ? error : String(error), this.apiBaseUrl)
      throw error
    }
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Normalize a MOS code to uppercase without spaces
 */
export function normalizeMosCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '')
}

/**
 * Determine personnel category from rank/grade code
 */
export function parsePersonnelCategory(value: string): PersonnelCategory {
  const upper = value.toUpperCase()

  if (upper.startsWith('W') || upper.includes('WARRANT')) {
    return 'warrant_officer'
  }
  if (upper.startsWith('O') || upper.includes('OFFICER')) {
    return 'officer'
  }
  return 'enlisted'
}

/**
 * Build a COOL detail page URL
 */
export function buildCoolUrl(branch: string, mocKey: string): string {
  const branchLower = branch.toLowerCase()
  return `https://www.cool.osd.mil/${branchLower}/moc/index.html?moc=${mocKey}&tab=overview`
}

// ============================================
// Exports
// ============================================

export type {
  PipelineContext,
  PipelineLogger,
} from './types'
