/**
 * @file Job submission endpoint for employer intake
 * @route POST /api/employers/submit-job
 * @description Submits extracted job, runs Approval Agent, creates job record
 */

import { z } from 'zod'
import { runApprovalAgent, type ApprovalDecision } from '../../utils/approvalAgent'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'
import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const submitJobSchema = z.object({
  // Contact info
  contact_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  company_name: z.string().min(2),
  
  // Source info
  source_type: z.enum(['url', 'paste']),
  job_url: z.string().url().optional(),
  job_content: z.string().optional(),
  
  // Extracted job data (from preview)
  job: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    location_type: z.string().nullable().optional(),
    clearance_required: z.string().nullable().optional(),
    clearance_level: z.string().nullable().optional(),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    salary_display: z.string().nullable().optional(),
    description: z.string(),
    snippet: z.string().nullable().optional(),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    employment_type: z.string().nullable().optional(),
    seniority: z.string().nullable().optional(),
    source_url: z.string().nullable().optional(),
    external_id: z.string().nullable().optional(),
    embedding_text: z.string().nullable().optional(),
    matched_mos_codes: z.array(z.object({
      code: z.string(),
      name: z.string(),
      branch: z.string(),
      similarity: z.number(),
    })).optional(),
  }),
})

function generateSlug(title: string, company: string, location: string): string {
  const locationPart = location.split(',')[0] || location
  const parts = [title, company, locationPart]
    .map(p => p?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '')
    .filter(Boolean)
  return parts.join('-').slice(0, 100)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Validate
  const parsed = submitJobSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const {
    contact_name,
    contact_email,
    contact_phone,
    company_name,
    source_type,
    job_url,
    job,
  } = parsed.data

  try {
    // Step 1: Fetch known companies for agent context
    const companies = await db.query.company.findMany({
      columns: { name: true },
      limit: 500,
    })
    const knownCompanies = companies.map(c => c.name)

    // Step 2: Run Approval Agent
    let agentDecision: ApprovalDecision
    try {
      agentDecision = await runApprovalAgent(
        {
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
            location_type: job.location_type,
            clearance_required: job.clearance_required,
            clearance_level: job.clearance_level,
            description: job.description,
            requirements: job.requirements,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
          },
          submitter: {
            name: contact_name,
            email: contact_email,
            company: company_name,
          },
          sourceType: source_type,
          sourceUrl: job_url,
          knownCompanies,
        },
        config.openaiApiKey
      )
    } catch (agentError) {
      console.error('Approval agent failed:', agentError)
      // Default to review if agent fails
      agentDecision = {
        decision: 'review',
        confidence: 0,
        reasoning: 'Approval agent failed, defaulting to manual review',
        flags: ['agent_error'],
      }
    }

    // Step 3: Determine job status based on agent decision
    const statusMap: Record<string, string> = {
      approve: 'ACTIVE',
      soft_approve: 'ACTIVE',
      review: 'PENDING_REVIEW',
    }
    const jobStatus = statusMap[agentDecision.decision] || 'PENDING_REVIEW'
    const autoApproved = agentDecision.decision === 'approve' || agentDecision.decision === 'soft_approve'

    // Step 4: Generate embedding for the job
    let jobEmbedding: number[] | null = null
    try {
      const openai = createOpenAI({ apiKey: config.openaiApiKey })
      const embeddingText = job.embedding_text || 
        `${job.title} ${job.clearance_required || ''} ${job.location} ${job.description.slice(0, 200)}`
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: embeddingText,
      })
      jobEmbedding = embedding
    } catch (embeddingError) {
      console.warn('Failed to generate embedding:', embeddingError)
    }

    // Step 5: Find or create company
    let companyRecord = await db.query.company.findFirst({
      where: eq(schema.company.name, job.company),
    })

    if (!companyRecord) {
      const companySlug = job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const [newCompany] = await db.insert(schema.company).values({
        id: randomUUID(),
        name: job.company,
        slug: companySlug,
        status: 'ACTIVE',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning()
      companyRecord = newCompany
    }

    // Step 6: Create job record
    const slug = generateSlug(job.title, job.company, job.location)
    const jobId = randomUUID()
    const now = Date.now()

    await db.insert(schema.job).values({
      id: jobId,
      title: job.title,
      slug,
      companyId: companyRecord!.id,
      location: job.location,
      locationType: job.location_type || null,
      clearanceRequired: job.clearance_required || null,
      clearanceLevel: job.clearance_level || null,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      salaryDisplay: job.salary_display || null,
      description: job.description,
      snippet: job.snippet || job.description.slice(0, 200),
      requirements: job.requirements ? JSON.stringify(job.requirements) : null,
      responsibilities: job.responsibilities ? JSON.stringify(job.responsibilities) : null,
      employmentType: job.employment_type || null,
      seniority: job.seniority || null,
      sourceUrl: job.source_url || job_url || null,
      externalId: job.external_id || null,
      embedding: jobEmbedding ? JSON.stringify(jobEmbedding) : null,
      status: jobStatus,
      autoApproved,
      approvalDecision: agentDecision.decision,
      approvalConfidence: agentDecision.confidence,
      approvalReasoning: agentDecision.reasoning,
      approvalFlags: agentDecision.flags ? JSON.stringify(agentDecision.flags) : null,
      createdAt: now,
      updatedAt: now,
      postedAt: autoApproved ? now : null,
    })

    // Step 7: Create MOS mappings if provided
    if (job.matched_mos_codes && job.matched_mos_codes.length > 0) {
      for (const match of job.matched_mos_codes) {
        const mosRecord = await db.query.mosCode.findFirst({
          where: eq(schema.mosCode.code, match.code),
        })

        if (mosRecord) {
          await db.insert(schema.jobMosMapping).values({
            id: randomUUID(),
            jobId,
            mosId: mosRecord.id,
            similarity: match.similarity,
            createdAt: now,
          }).onConflictDoNothing()
        }
      }
    }

    // Step 8: Log employer contact/activity
    await db.insert(schema.candidateActivity).values({
      id: randomUUID(),
      type: 'JOB_SUBMISSION',
      email: contact_email,
      name: contact_name,
      phone: contact_phone || null,
      companyName: company_name,
      jobId,
      notes: `Job submitted via ${source_type}${job_url ? ` from ${job_url}` : ''}`,
      createdAt: now,
    })

    return {
      success: true,
      job_id: jobId,
      job_slug: slug,
      status: jobStatus,
      auto_approved: autoApproved,
      approval: {
        decision: agentDecision.decision,
        confidence: agentDecision.confidence,
        reasoning: agentDecision.reasoning,
        flags: agentDecision.flags,
      },
      message: autoApproved 
        ? 'Job submitted and automatically approved!' 
        : 'Job submitted for review. We will notify you once approved.',
    }

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Submit job error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit job'
    })
  }
})
