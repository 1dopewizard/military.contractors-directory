/**
 * GET /api/admin/pipeline/scripts
 * List all available pipeline scripts from the TypeScript registry
 *
 * Returns script metadata organized by category for the admin UI.
 */

import { initializePipeline, getScriptMetadata, getScriptsByCategory } from '@/lib/pipeline'

export default defineEventHandler(async () => {
  // TODO: Add admin authentication check
  // const user = await requireAdminUser(event)

  // Initialize pipeline scripts registry
  initializePipeline()

  // Get all script metadata
  const allScripts = getScriptMetadata()

  // Get scripts organized by category
  const mosScripts = getScriptsByCategory('mos').map((s) => ({
    id: s.name,
    name: formatScriptName(s.name),
    description: s.description,
    category: s.category,
    supportsDryRun: s.supportsDryRun,
    estimatedTime: estimateTime(s.category),
  }))

  const scraperScripts = getScriptsByCategory('scraper').map((s) => ({
    id: s.name,
    name: formatScriptName(s.name),
    description: s.description,
    category: s.category,
    supportsDryRun: s.supportsDryRun,
    estimatedTime: estimateTime(s.category),
  }))

  const dataScripts = getScriptsByCategory('data').map((s) => ({
    id: s.name,
    name: formatScriptName(s.name),
    description: s.description,
    category: s.category,
    supportsDryRun: s.supportsDryRun,
    estimatedTime: estimateTime(s.category),
  }))

  const maintenanceScripts = getScriptsByCategory('maintenance').map((s) => ({
    id: s.name,
    name: formatScriptName(s.name),
    description: s.description,
    category: s.category,
    supportsDryRun: s.supportsDryRun,
    estimatedTime: estimateTime(s.category),
  }))

  return {
    scripts: allScripts.map((s) => ({
      id: s.name,
      name: formatScriptName(s.name),
      description: s.description,
      category: s.category,
      supportsDryRun: s.supportsDryRun,
      estimatedTime: estimateTime(s.category),
    })),
    byCategory: {
      mos: mosScripts,
      scraper: scraperScripts,
      data: dataScripts,
      maintenance: maintenanceScripts,
    },
    total: allScripts.length,
  }
})

/**
 * Format script name for display
 */
function formatScriptName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Estimate execution time based on script category
 */
function estimateTime(category: string): string {
  switch (category) {
    case 'mos':
      return '2-10 min'
    case 'scraper':
      return '5-15 min'
    case 'data':
      return '1-5 min'
    case 'maintenance':
      return '< 1 min'
    default:
      return 'Unknown'
  }
}
