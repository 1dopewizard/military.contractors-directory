/**
 * @file Pipeline Logger
 * @description Structured logging for pipeline scripts with SQL persistence (Drizzle/libSQL)
 */

import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import type { PipelineLogger, LogLevel } from './types'

/**
 * Configuration for the pipeline logger
 */
export interface LoggerConfig {
  /** Drizzle database instance */
  db: LibSQLDatabase<any>
  /** Pipeline schema (containing pipelineJob table) */
  schema: { pipelineJob: any }
  /** Pipeline job ID to log to */
  jobId: string
  /** Minimum log level to persist (default: 'info') */
  minLevel?: LogLevel
  /** Batch size for flushing logs (default: 10) */
  batchSize?: number
  /** Auto-flush interval in ms (default: 2000) */
  flushInterval?: number
  /** Also log to console (default: true) */
  console?: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  success: 1, // Same priority as info
}

const LOG_PREFIXES: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // Gray
  info: '\x1b[36m',  // Cyan
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  success: '\x1b[32m', // Green
}

const RESET = '\x1b[0m'

/**
 * Create a pipeline logger that persists logs to SQL database
 */
export function createPipelineLogger(config: LoggerConfig): PipelineLogger {
  const {
    db,
    schema,
    jobId,
    minLevel = 'info',
    batchSize = 10,
    flushInterval = 2000,
    console: logToConsole = true,
  } = config

  const pendingLogs: string[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let isFlushing = false

  const minLevelValue = LOG_LEVELS[minLevel]

  /**
   * Format a log entry for storage
   */
  function formatLog(level: LogLevel, message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const prefix = LOG_PREFIXES[level]
    const formattedArgs = args.length > 0 
      ? ' ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')
      : ''
    return `[${timestamp}] ${prefix} ${message}${formattedArgs}`
  }

  /**
   * Log to console with colors
   */
  function consoleLog(level: LogLevel, message: string, args: unknown[]): void {
    if (!logToConsole) return
    
    const color = LOG_COLORS[level]
    const prefix = LOG_PREFIXES[level]
    const formattedMessage = `${color}${prefix} ${message}${RESET}`
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, ...args)
        break
      case 'warn':
        console.warn(formattedMessage, ...args)
        break
      case 'debug':
        console.debug(formattedMessage, ...args)
        break
      default:
        console.log(formattedMessage, ...args)
    }
  }

  /**
   * Flush pending logs to SQL database
   */
  async function flush(): Promise<void> {
    if (isFlushing || pendingLogs.length === 0) return

    isFlushing = true
    const logsToFlush = pendingLogs.splice(0, pendingLogs.length)

    try {
      // Get current job to append logs
      const [job] = await db
        .select({ logs: schema.pipelineJob.logs })
        .from(schema.pipelineJob)
        .where(eq(schema.pipelineJob.id, jobId))
        .limit(1)

      if (job) {
        const existingLogs = (job.logs as string[] | null) ?? []
        const updatedLogs = [...existingLogs, ...logsToFlush]

        await db
          .update(schema.pipelineJob)
          .set({ logs: updatedLogs })
          .where(eq(schema.pipelineJob.id, jobId))
      }
    } catch (error) {
      // If flush fails, add logs back to queue
      pendingLogs.unshift(...logsToFlush)
      console.error('Failed to flush pipeline logs:', error)
    } finally {
      isFlushing = false
    }
  }

  /**
   * Schedule a flush if not already scheduled
   */
  function scheduleFlush(): void {
    if (flushTimer) return
    
    flushTimer = setTimeout(() => {
      flushTimer = null
      flush().catch(console.error)
    }, flushInterval)
  }

  /**
   * Add a log entry
   */
  function log(level: LogLevel, message: string, args: unknown[]): void {
    // Always log to console
    consoleLog(level, message, args)

    // Check if level meets minimum threshold for persistence
    if (LOG_LEVELS[level] < minLevelValue) return

    // Add to pending logs
    const formattedLog = formatLog(level, message, args)
    pendingLogs.push(formattedLog)

    // Flush if batch size reached
    if (pendingLogs.length >= batchSize) {
      flush().catch(console.error)
    } else {
      scheduleFlush()
    }
  }

  return {
    debug: (message: string, ...args: unknown[]) => log('debug', message, args),
    info: (message: string, ...args: unknown[]) => log('info', message, args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, args),
    error: (message: string, ...args: unknown[]) => log('error', message, args),
    success: (message: string, ...args: unknown[]) => log('success', message, args),
    flush: async () => {
      // Clear any pending timer
      if (flushTimer) {
        clearTimeout(flushTimer)
        flushTimer = null
      }
      // Flush all pending logs
      await flush()
    },
  }
}

/**
 * Create a simple console-only logger (for testing or CLI use)
 */
export function createConsoleLogger(): PipelineLogger {
  const log = (level: LogLevel, message: string, args: unknown[]): void => {
    const color = LOG_COLORS[level]
    const prefix = LOG_PREFIXES[level]
    const formattedMessage = `${color}${prefix} ${message}${RESET}`
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, ...args)
        break
      case 'warn':
        console.warn(formattedMessage, ...args)
        break
      case 'debug':
        console.debug(formattedMessage, ...args)
        break
      default:
        console.log(formattedMessage, ...args)
    }
  }

  return {
    debug: (message: string, ...args: unknown[]) => log('debug', message, args),
    info: (message: string, ...args: unknown[]) => log('info', message, args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, args),
    error: (message: string, ...args: unknown[]) => log('error', message, args),
    success: (message: string, ...args: unknown[]) => log('success', message, args),
    flush: async () => { /* no-op for console logger */ },
  }
}
