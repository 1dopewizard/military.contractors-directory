/**
 * Migration script to update existing jobs with structured data from Supabase
 * Run with: npx tsx scripts/migrate-job-structured-data.ts
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { readFile } from 'fs/promises'
import { join } from 'path'

const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_URL || ''

if (!CONVEX_URL) {
  console.error('Missing CONVEX_SELF_HOSTED_URL or CONVEX_URL')
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Recursively remove null values from objects (Convex doesn't allow null, only undefined)
 */
function cleanNulls(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanNulls).filter((v: any) => v !== undefined)
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanNulls(value)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  }
  return obj
}

interface SupabaseJob {
  id: string
  slug: string
  title: string
  responsibilities_data?: string[] | null
  compensation_data?: any | null
  qualifications_data?: any | null
  tools_tech?: string[] | null
  domain_tags?: string[] | null
  location_data?: any | null
  clearance_data?: any | null
  contract_data?: any | null
  compliance_data?: any | null
  posting_data?: any | null
  military_mapping?: any | null
  source_data?: any | null
  employer_data?: any | null
}

async function loadSupabaseJobs(): Promise<SupabaseJob[]> {
  const dataPath = join(import.meta.dirname, 'migration/data/jobs.json')
  const content = await readFile(dataPath, 'utf-8')
  return JSON.parse(content)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Migrating Job Structured Data')
  console.log('='.repeat(60))
  console.log()

  // Load Supabase data
  const supabaseJobs = await loadSupabaseJobs()
  console.log(`Loaded ${supabaseJobs.length} jobs from Supabase export`)
  console.log()

  // Get all Convex jobs to build a slug -> id map
  const convexJobs = await client.query(api.jobs.list, { limit: 200 })
  console.log(`Found ${convexJobs.length} jobs in Convex`)

  const slugToConvexId: Record<string, string> = {}
  for (const job of convexJobs) {
    if (job.slug) {
      slugToConvexId[job.slug] = job._id
    }
  }
  console.log(`Mapped ${Object.keys(slugToConvexId).length} jobs by slug`)
  console.log()

  // Update jobs with structured data
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const sbJob of supabaseJobs) {
    if (!sbJob.slug) {
      console.log(`  Skipping job without slug: ${sbJob.title}`)
      skipped++
      continue
    }

    const convexId = slugToConvexId[sbJob.slug]
    if (!convexId) {
      console.log(`  Job not found in Convex: ${sbJob.slug}`)
      skipped++
      continue
    }

    // Check if there's any structured data to update
    const hasData = sbJob.responsibilities_data?.length ||
      sbJob.compensation_data ||
      sbJob.qualifications_data ||
      sbJob.tools_tech?.length ||
      sbJob.domain_tags?.length ||
      sbJob.location_data ||
      sbJob.clearance_data ||
      sbJob.contract_data ||
      sbJob.compliance_data ||
      sbJob.posting_data ||
      sbJob.military_mapping ||
      sbJob.source_data ||
      sbJob.employer_data

    if (!hasData) {
      skipped++
      continue
    }

    try {
      await client.mutation(api.jobs.updateStructuredData as any, {
        id: convexId,
        responsibilitiesData: cleanNulls(sbJob.responsibilities_data),
        compensationData: cleanNulls(sbJob.compensation_data),
        qualificationsData: cleanNulls(sbJob.qualifications_data),
        toolsTech: cleanNulls(sbJob.tools_tech),
        domainTags: cleanNulls(sbJob.domain_tags),
        locationData: cleanNulls(sbJob.location_data),
        clearanceData: cleanNulls(sbJob.clearance_data),
        contractData: cleanNulls(sbJob.contract_data),
        complianceData: cleanNulls(sbJob.compliance_data),
        postingData: cleanNulls(sbJob.posting_data),
        militaryMapping: cleanNulls(sbJob.military_mapping),
        sourceData: cleanNulls(sbJob.source_data),
        employerData: cleanNulls(sbJob.employer_data),
      })
      updated++
      if (updated % 10 === 0) {
        console.log(`  Updated ${updated} jobs...`)
      }
    } catch (error: any) {
      errors++
      console.error(`  Error updating ${sbJob.slug}: ${error.message}`)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('Migration Complete')
  console.log('='.repeat(60))
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Errors: ${errors}`)
}

main().catch(console.error)
