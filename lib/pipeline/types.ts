/**
 * @file Pipeline Type Definitions
 * @description Types for the TypeScript pipeline execution framework
 * 
 * Uses SQL-backed storage (Drizzle/libSQL) for pipeline job tracking.
 */

/**
 * Available pipeline script names
 */
export type PipelineScriptName =
  // MOS enrichment scripts
  | 'mos'
  | 'mos-validate'
  | 'mos-enrich'
  | 'mos-classify'
  | 'mos-summarize'
  | 'mos-embed'
  // Scraper scripts (to be migrated)
  | 'mos-scrape-army'
  | 'mos-scrape-navy'
  | 'mos-scrape-airforce'
  | 'mos-scrape-marines'
  | 'mos-scrape-coastguard'
  | 'mos-scrape-spaceforce'
  // Data generation scripts
  | 'seed-community-data'
  | 'generate-jobs'
  | 'generate-mappings'

/**
 * Pipeline job status
 */
export type PipelineJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Pipeline job record from SQL database
 */
export interface PipelineJob {
  id: string
  script: string
  status: PipelineJobStatus
  dryRun?: boolean
  args?: Record<string, unknown>
  startedAt: Date
  completedAt?: Date | null
  exitCode?: number | null
  error?: string | null
  logs?: string[]
  createdBy?: string | null
  createdAt: Date
}

/**
 * Options for running a pipeline script
 */
export interface PipelineRunOptions {
  /** Dry run mode - don't persist changes */
  dryRun?: boolean
  /** Additional script arguments */
  args?: Record<string, unknown>
  /** Batch size for processing */
  batchSize?: number
  /** Maximum items to process (for testing) */
  limit?: number
}

/**
 * Progress callback for pipeline scripts
 */
export interface PipelineProgress {
  /** Current item being processed */
  current: number
  /** Total items to process */
  total: number
  /** Current item description */
  item?: string
  /** Phase of processing */
  phase?: string
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: PipelineProgress) => void | Promise<void>

/**
 * Pipeline context passed to script handlers
 */
export interface PipelineContext {
  /** SQL job ID (UUID string) */
  jobId: string
  /** Script name */
  script: PipelineScriptName
  /** Run options */
  options: PipelineRunOptions
  /** Logger instance */
  log: PipelineLogger
  /** Progress reporter */
  progress: (progress: PipelineProgress) => Promise<void>
  /** Check if job was cancelled */
  isCancelled: () => Promise<boolean>
  /** Signal for abort handling */
  signal?: AbortSignal
}

/**
 * Pipeline logger interface
 */
export interface PipelineLogger {
  /** Log debug message */
  debug: (message: string, ...args: unknown[]) => void
  /** Log info message */
  info: (message: string, ...args: unknown[]) => void
  /** Log warning message */
  warn: (message: string, ...args: unknown[]) => void
  /** Log error message */
  error: (message: string, ...args: unknown[]) => void
  /** Log success message */
  success: (message: string, ...args: unknown[]) => void
  /** Flush pending logs to database */
  flush: () => Promise<void>
}

/**
 * Pipeline script handler function
 */
export type PipelineHandler = (ctx: PipelineContext) => Promise<void>

/**
 * Pipeline script definition
 */
export interface PipelineScript {
  /** Script name (unique identifier) */
  name: PipelineScriptName
  /** Human-readable description */
  description: string
  /** Category for grouping */
  category: 'mos' | 'scraper' | 'data' | 'maintenance'
  /** Whether script supports dry run mode */
  supportsDryRun: boolean
  /** Script handler function */
  handler: PipelineHandler
}

/**
 * Result of a pipeline run
 */
export interface PipelineResult {
  /** Job ID (UUID string) */
  jobId: string
  /** Final status */
  status: PipelineJobStatus
  /** Duration in milliseconds */
  durationMs: number
  /** Error message if failed */
  error?: string
  /** Exit code */
  exitCode: number
}

/**
 * Log level for pipeline messages
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

/**
 * Log entry with timestamp and level
 */
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
}
