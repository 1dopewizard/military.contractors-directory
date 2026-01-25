/**
 * @file Pipeline Script Registry
 * @description Central registry for all pipeline scripts
 */

import type { PipelineScript, PipelineScriptName, PipelineHandler } from './types'

/**
 * Registry of all available pipeline scripts
 */
const scripts = new Map<PipelineScriptName, PipelineScript>()

/**
 * Register a pipeline script
 * If already registered, silently skips (idempotent)
 */
export function registerScript(script: PipelineScript): void {
  if (scripts.has(script.name)) {
    // Already registered - skip silently for idempotent behavior
    return
  }
  scripts.set(script.name, script)
}

/**
 * Get a registered script by name
 */
export function getScript(name: PipelineScriptName): PipelineScript | undefined {
  return scripts.get(name)
}

/**
 * Get all registered scripts
 */
export function getAllScripts(): PipelineScript[] {
  return Array.from(scripts.values())
}

/**
 * Get scripts by category
 */
export function getScriptsByCategory(category: PipelineScript['category']): PipelineScript[] {
  return getAllScripts().filter(script => script.category === category)
}

/**
 * Check if a script is registered
 */
export function isScriptRegistered(name: string): name is PipelineScriptName {
  return scripts.has(name as PipelineScriptName)
}

/**
 * Get script names for validation
 */
export function getScriptNames(): PipelineScriptName[] {
  return Array.from(scripts.keys())
}

/**
 * Script metadata for UI display (without handlers)
 */
export interface ScriptMetadata {
  name: PipelineScriptName
  description: string
  category: PipelineScript['category']
  supportsDryRun: boolean
}

/**
 * Get script metadata for UI display
 */
export function getScriptMetadata(): ScriptMetadata[] {
  return getAllScripts().map(({ name, description, category, supportsDryRun }) => ({
    name,
    description,
    category,
    supportsDryRun,
  }))
}

/**
 * Helper to define a script with type safety
 */
export function defineScript(
  name: PipelineScriptName,
  config: {
    description: string
    category: PipelineScript['category']
    supportsDryRun?: boolean
    handler: PipelineHandler
  }
): PipelineScript {
  return {
    name,
    description: config.description,
    category: config.category,
    supportsDryRun: config.supportsDryRun ?? true,
    handler: config.handler,
  }
}

// ===========================================
// Built-in Script Placeholders
// ===========================================

// Note: Actual handlers are registered separately in their own modules.
// These placeholders provide metadata for the UI before handlers are loaded.

const placeholderHandler: PipelineHandler = async (ctx) => {
  ctx.log.error(`Script "${ctx.script}" handler not implemented yet`)
  throw new Error(`Script "${ctx.script}" is not yet implemented`)
}

/**
 * Register placeholder scripts for UI display
 * Call this during app initialization
 */
export function registerPlaceholderScripts(): void {
  // MOS enrichment scripts
  registerScript(defineScript('mos', {
    description: 'Run complete MOS enrichment pipeline (classify + summarize + embed)',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-validate', {
    description: 'Validate MOS data integrity and report issues',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-enrich', {
    description: 'Enrich MOS codes with skills, roles, and certifications',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-classify', {
    description: 'Classify MOS codes into categories (IT_CYBER, INTELLIGENCE, etc.)',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-summarize', {
    description: 'Generate AI summaries for MOS descriptions',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-embed', {
    description: 'Generate vector embeddings for MOS codes',
    category: 'mos',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  // Scraper scripts
  registerScript(defineScript('mos-scrape-army', {
    description: 'Scrape Army COOL website for MOS data',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-scrape-navy', {
    description: 'Scrape Navy COOL website for rating/NEC data',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-scrape-airforce', {
    description: 'Scrape Air Force AFSC database',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-scrape-marines', {
    description: 'Scrape Marine Corps MOS manual',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-scrape-coastguard', {
    description: 'Scrape Coast Guard ratings database',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('mos-scrape-spaceforce', {
    description: 'Scrape Space Force AFSC database',
    category: 'scraper',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  // Data generation scripts
  registerScript(defineScript('seed-community-data', {
    description: 'Generate mock community intel data (salaries, interviews)',
    category: 'data',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('generate-jobs', {
    description: 'Generate mock job listings',
    category: 'data',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))

  registerScript(defineScript('generate-mappings', {
    description: 'Generate job-MOS mappings',
    category: 'data',
    supportsDryRun: true,
    handler: placeholderHandler,
  }))
}

/**
 * Replace a placeholder script handler with a real implementation
 */
export function replaceScriptHandler(name: PipelineScriptName, handler: PipelineHandler): void {
  const script = scripts.get(name)
  if (!script) {
    throw new Error(`Script "${name}" is not registered`)
  }
  script.handler = handler
}
