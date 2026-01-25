/**
 * GET /api/admin/pipeline/dag
 * Get the pipeline DAG (Directed Acyclic Graph) for visualization
 */

import { initializePipeline, getScriptMetadata, getScriptsByCategory } from '@/lib/pipeline'

export default defineEventHandler(async () => {
  // TODO: Add admin authentication check

  // Initialize pipeline scripts registry
  initializePipeline()

  const allScripts = getScriptMetadata()
  const mosScripts = getScriptsByCategory('mos')

  // Build nodes from MOS scripts (excluding the composite 'mos' pipeline)
  const nodes = mosScripts
    .filter((s) => s.name !== 'mos')
    .map((script) => ({
      id: script.name,
      name: formatScriptName(script.name),
      category: script.category,
      description: script.description,
      estimatedTime: estimateTime(script.category),
      supportsDryRun: script.supportsDryRun,
      hasParams: false, // TypeScript scripts don't have legacy params structure
    }))

  // Define edges for the MOS pipeline DAG
  const edges = [
    { from: 'mos-classify', to: 'mos-enrich', type: 'requires' },
    { from: 'mos-enrich', to: 'mos-summarize', type: 'requires' },
    { from: 'mos-summarize', to: 'mos-embed', type: 'requires' },
  ]

  // Group nodes by category for layout
  const categories = ['mos', 'scraper', 'data', 'maintenance'] as const
  const nodesByCategory = Object.fromEntries(
    categories.map((cat) => [
      cat,
      allScripts
        .filter((s) => s.category === cat && s.name !== 'mos')
        .map((s) => ({
          id: s.name,
          name: formatScriptName(s.name),
          category: s.category,
          description: s.description,
          estimatedTime: estimateTime(s.category),
          supportsDryRun: s.supportsDryRun,
          hasParams: false,
        })),
    ])
  )

  return {
    nodes,
    edges,
    nodesByCategory,
    categories,
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