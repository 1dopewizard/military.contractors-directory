/**
 * GET /api/admin/pipeline/scripts/[name]
 * Get detailed information about a specific script
 */

import { initializePipeline, getScript, getAllScripts, type PipelineScriptName } from '@/lib/pipeline'

export default defineEventHandler(async (event) => {
  // TODO: Add admin authentication check

  const scriptName = getRouterParam(event, 'name')

  if (!scriptName) {
    throw createError({
      statusCode: 400,
      message: 'Script name is required',
    })
  }

  // Initialize pipeline scripts registry
  initializePipeline()

  const script = getScript(scriptName as PipelineScriptName)

  if (!script) {
    throw createError({
      statusCode: 404,
      message: `Script not found: ${scriptName}`,
    })
  }

  // Get all scripts to find dependencies and dependents
  const allScripts = getAllScripts()

  // Find scripts this one depends on (by analyzing description patterns)
  // In the TypeScript framework, dependencies are implicit based on data requirements
  const dependencies: { script: string; name: string; type: string }[] = []
  const dependents: { script: string; name: string; type: string }[] = []

  // Build dependency graph based on script naming conventions
  if (scriptName === 'mos-enrich') {
    dependencies.push({
      script: 'mos-classify',
      name: 'Classify MOS',
      type: 'requires',
    })
  }
  if (scriptName === 'mos-summarize') {
    dependencies.push({
      script: 'mos-enrich',
      name: 'Enrich MOS',
      type: 'requires',
    })
  }
  if (scriptName === 'mos-embed') {
    dependencies.push({
      script: 'mos-summarize',
      name: 'Summarize MOS',
      type: 'requires',
    })
  }
  if (scriptName === 'mos') {
    dependencies.push(
      { script: 'mos-classify', name: 'Classify MOS', type: 'requires' },
      { script: 'mos-enrich', name: 'Enrich MOS', type: 'requires' },
      { script: 'mos-summarize', name: 'Summarize MOS', type: 'requires' },
      { script: 'mos-embed', name: 'Embed MOS', type: 'requires' },
      { script: 'mos-validate', name: 'Validate MOS', type: 'optional' }
    )
  }

  // Find scripts that depend on this one
  if (scriptName === 'mos-classify') {
    dependents.push({
      script: 'mos-enrich',
      name: 'Enrich MOS',
      type: 'requires',
    })
  }
  if (scriptName === 'mos-enrich') {
    dependents.push({
      script: 'mos-summarize',
      name: 'Summarize MOS',
      type: 'requires',
    })
  }
  if (scriptName === 'mos-summarize') {
    dependents.push({
      script: 'mos-embed',
      name: 'Embed MOS',
      type: 'requires',
    })
  }

  // Build DAG for visualization
  const dag = buildPipelineDAG(allScripts)

  return {
    id: script.name,
    name: formatScriptName(script.name),
    description: script.description,
    category: script.category,
    supportsDryRun: script.supportsDryRun,
    estimatedTime: estimateTime(script.category),
    isPipeline: script.category === 'mos' && script.name === 'mos',
    documentation: getScriptDocumentation(script.name),
    sourceCode: null, // TypeScript source isn't exposed
    dependencies,
    dependents,
    dag,
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

/**
 * Get documentation for a script
 */
function getScriptDocumentation(name: string): string {
  const docs: Record<string, string> = {
    mos: `MOS enrichment pipeline stages:
1. Classify uncategorized MOS codes
2. Enrich MOS profiles with LLM
3. Generate summaries
4. Generate embeddings
5. Validate enrichment`,
    'mos-validate': `Validates MOS enrichment quality:
- Checks enrichment coverage by category
- Reports missing fields
- Identifies incomplete records`,
    'mos-enrich': `LLM-powered MOS enrichment:
- Generates skills, certifications, civilian roles
- Creates detailed profile narratives
- Focuses on IT/Cyber, Intelligence, Communications categories`,
    'mos-classify': `Classifies MOS codes into categories:
- IT_CYBER, INTELLIGENCE, COMMUNICATIONS (target categories)
- Uses LLM to analyze MOS titles and descriptions
- Updates category field in database`,
    'mos-summarize': `Generates MOS summaries:
- Creates concise descriptions for search results
- Produces detailed narratives for profile pages
- Uses enriched data as input`,
    'mos-embed': `Generates MOS embeddings:
- Creates vector representations for semantic search
- Uses enriched profile data
- Enables company-MOS matching`,
  }

  return docs[name] ?? 'No detailed documentation available.'
}

interface PipelineNode {
  id: string
  name: string
  category: string
}

interface PipelineEdge {
  from: string
  to: string
  type: string
}

/**
 * Build DAG structure for pipeline visualization
 */
function buildPipelineDAG(scripts: { name: string; description: string; category: string }[]): {
  nodes: PipelineNode[]
  edges: PipelineEdge[]
} {
  const nodes: PipelineNode[] = scripts
    .filter((s) => s.category === 'mos' && s.name !== 'mos')
    .map((s) => ({
      id: s.name,
      name: formatScriptName(s.name),
      category: s.category,
    }))

  const edges: PipelineEdge[] = [
    { from: 'mos-classify', to: 'mos-enrich', type: 'requires' },
    { from: 'mos-enrich', to: 'mos-summarize', type: 'requires' },
    { from: 'mos-summarize', to: 'mos-embed', type: 'requires' },
  ]

  return { nodes, edges }
}
