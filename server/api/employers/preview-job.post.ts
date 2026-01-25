/**
 * @file Job preview endpoint for employer intake
 * @route POST /api/employers/preview-job
 * @description Extracts structured job data from URL or pasted content,
 *              then matches MOS codes via embedding similarity
 * 
 * @status DISABLED - Job extraction feature pending TypeScript migration
 * @todo Implement extraction using Vercel AI SDK + Crawlee (see migration plan)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { eq, desc, sql } from 'drizzle-orm'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'

const previewJobSchema = z.object({
  source_type: z.enum(['url', 'paste']),
  job_url: z.string().url().optional(),
  job_content: z.string().min(100).optional(),
}).refine(
  (data) => {
    if (data.source_type === 'url') return !!data.job_url
    if (data.source_type === 'paste') return !!data.job_content
    return false
  },
  { message: 'Must provide job_url for URL source or job_content for paste source' }
)

// Feature flag: Job extraction is disabled until TypeScript migration is complete
const FEATURE_ENABLED = false

// Education structure for qualifications
interface JobEducation {
  level?: string
  fields?: string[]
  acceptsEquivalency?: boolean
}

// Qualifications structure matching job detail page
interface JobQualifications {
  certs?: string[]
  required?: string[]
  preferred?: string[]
  languages?: string[]
  licenses?: string[]
  education?: JobEducation
  yearsExperienceMin?: number
}

// Compensation structure matching job detail page
interface JobCompensation {
  benefits?: string[]
  perDiemDailyUSD?: number
  housingProvided?: boolean
  hardshipEligible?: boolean
}

// Type for extracted job from extraction API
interface ExtractedJob {
  title: string
  company: string
  location: string
  location_type?: string | null
  theater?: string | null
  clearance_required?: string | null
  clearance_level?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_display?: string | null
  description: string
  snippet?: string | null
  requirements?: string[]  // Legacy flat field
  responsibilities?: string[]
  qualifications?: JobQualifications  // Rich qualifications structure
  compensation?: JobCompensation  // Benefits & compensation details
  tools_tech?: string[]
  domain_tags?: string[]
  employment_type?: string | null
  seniority?: string | null
  source_url?: string | null
  external_id?: string | null
  embedding_text?: string | null
}

interface ExtractionApiResponse {
  success: boolean
  job?: ExtractedJob
  error?: string
}

// MOS match result
interface MosMatch {
  code: string
  name: string
  branch: string
  similarity: number
}

export default defineEventHandler(async (event) => {
  // Feature disabled until TypeScript migration is complete
  if (!FEATURE_ENABLED) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Job preview feature is temporarily unavailable. The extraction service is being migrated to TypeScript.',
    })
  }

  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Validate request
  const parsed = previewJobSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const { source_type, job_url, job_content } = parsed.data
  // TODO: Replace with TypeScript extraction using Vercel AI SDK + Crawlee
  const extractionApiUrl = 'http://localhost:8001' // Placeholder - extraction service not available

  const db = getDb()

  try {
    // Step 1: Call Python API for extraction
    const extractEndpoint = source_type === 'url' ? '/extract/url' : '/extract/content'
    const extractBody = source_type === 'url' 
      ? { url: job_url }
      : { content: job_content }

    const extractResponse = await $fetch<ExtractionApiResponse>(`${extractionApiUrl}${extractEndpoint}`, {
      method: 'POST',
      body: extractBody,
      timeout: 30000, // 30s timeout for scraping + LLM
    })

    if (!extractResponse.success || !extractResponse.job) {
      throw createError({
        statusCode: 422,
        statusMessage: extractResponse.error || 'Failed to extract job data'
      })
    }

    const extractedJob = extractResponse.job

    // Step 2: Generate embedding for MOS matching
    let matchedMosCodes: MosMatch[] = []
    
    try {
      const openai = createOpenAI({
        apiKey: config.openaiApiKey,
      })

      // Generate embedding from the job's embedding text
      const embeddingText = extractedJob.embedding_text || 
        `${extractedJob.title} ${extractedJob.clearance_required || ''} ${extractedJob.location} ${extractedJob.description.slice(0, 200)}`

      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: embeddingText,
      })

      // Step 3: Find matching MOS codes using text similarity (since we don't have vector search in SQLite)
      // For now, use a simple keyword-based approach
      const keywords = embeddingText.toLowerCase().split(/\s+/).filter(k => k.length > 3)
      
      // Get MOS codes that might match based on their names and categories
      const mosCodes = await db
        .select()
        .from(schema.mosCode)
        .limit(100)

      // Score MOS codes by keyword overlap
      const scored = mosCodes.map(mos => {
        const mosText = `${mos.name} ${mos.mosCategory || ''} ${(mos.civilianRoles as string[] || []).join(' ')}`.toLowerCase()
        const overlap = keywords.filter(k => mosText.includes(k)).length
        return { mos, score: overlap / keywords.length }
      })

      // Get top 10 matches
      matchedMosCodes = scored
        .filter(s => s.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => ({
          code: s.mos.code,
          name: s.mos.name,
          branch: s.mos.branch,
          similarity: s.score,
        }))

    } catch (embeddingError) {
      // Non-fatal: continue without MOS matches
      console.warn('Embedding/MOS matching failed:', embeddingError)
    }

    return {
      success: true,
      job: {
        ...extractedJob,
        matched_mos_codes: matchedMosCodes,
      }
    }

  } catch (error: unknown) {
    // Check if it's our custom error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Preview job error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process job posting'
    })
  }
})
