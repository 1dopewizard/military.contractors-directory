/**
 * @file Job detail composable (API-backed)
 * @usage const { job, summary, isLoading, error, refresh } = useJobDetail(slug)
 * @description Fetches and transforms job detail data with SSR support
 */

import type { JobDetail } from '@/app/types/job.types'

/**
 * Transform API job data to structured JobDetail
 */
function transformJobData(job: Record<string, unknown>, companySlug?: string | null): JobDetail {
  const locationData = (job.locationData as Record<string, unknown>) || {}
  const clearanceData = (job.clearanceData as Record<string, unknown>) || {}
  const compensationData = (job.compensationData as Record<string, unknown>) || {}
  const contractData = (job.contractData as Record<string, unknown>) || {}
  const qualificationsData = (job.qualificationsData as Record<string, unknown>) || {}
  const complianceData = (job.complianceData as Record<string, unknown>) || {}
  const postingData = (job.postingData as Record<string, unknown>) || {}
  const militaryMapping = (job.militaryMapping as Record<string, unknown>) || {}
  const sourceData = (job.sourceData as Record<string, unknown>) || {}
  const employerData = (job.employerData as Record<string, unknown>) || {}

  return {
    id: job.id as string,
    title: job.title as string,
    company: (employerData.name as string) || (job.company as string) || 'Unknown',
    seniority: job.seniority as string,
    location: {
      type: (locationData.type as string) || (job.location_type as string) || 'ONSITE',
      city: locationData.city as string,
      state: locationData.state as string,
      country: (locationData.country as string) || 'USA',
      region: (locationData.region as string) || ((job.is_oconus as boolean) ? 'OCONUS' : 'CONUS'),
      theater: (locationData.theater as string) || (job.theater as string),
      siteNameOrBase: locationData.siteNameOrBase as string,
      travelPercent: locationData.travelPercent as number,
    },
    clearance: {
      level: (clearanceData.level as string) || (job.clearance_required as string) || 'NONE',
      polygraph: (clearanceData.polygraph as string) || 'NONE',
      activeRequired: (clearanceData.activeRequired as boolean) ?? true,
      usCitizenshipRequired: (clearanceData.usCitizenshipRequired as boolean) ?? true,
      sponsorAvailable: clearanceData.sponsorAvailable as boolean,
    },
    compensation: {
      rateType: (compensationData.rateType as string) || 'SALARY',
      currency: (compensationData.currency as string) || (job.currency as string) || 'USD',
      min: (compensationData.min as number) || (job.salary_min as number),
      max: (compensationData.max as number) || (job.salary_max as number),
      period: (compensationData.period as string) || 'year',
      normalizedAnnualUSD: compensationData.normalizedAnnualUSD as number,
      benefits: (compensationData.benefits as string[]) || [],
      perDiemDailyUSD: compensationData.perDiemDailyUSD as number,
      housingProvided: compensationData.housingProvided as boolean,
      hardshipEligible: compensationData.hardshipEligible as boolean,
    },
    employmentType: (job.employment_type as string) || 'FULL_TIME',
    contract: {
      type: contractData.type as string,
      programOrMission: contractData.programOrMission as string,
      vehicleOrIDIQ: contractData.vehicleOrIDIQ as string,
      durationMonths: contractData.durationMonths as number,
    },
    qualifications: {
      certs: (qualificationsData.certs as string[]) || [],
      required: (qualificationsData.required as string[]) || (job.requirements as string[]) || [],
      preferred: (qualificationsData.preferred as string[]) || [],
      languages: (qualificationsData.languages as string[]) || [],
      licenses: (qualificationsData.licenses as string[]) || [],
      education: qualificationsData.education
        ? (typeof qualificationsData.education === 'string'
            ? { level: qualificationsData.education }
            : qualificationsData.education as { level?: string })
        : undefined,
      yearsExperienceMin: qualificationsData.yearsExperienceMin as number,
    },
    responsibilities: (job.responsibilitiesData as string[]) || [],
    toolsTech: (job.toolsTech as string[]) || [],
    domainTags: (job.domainTags as string[]) || [],
    militaryMapping: {
      service: (militaryMapping.service as string[]) || [],
      mos: (militaryMapping.mos as string[]) || [],
      afsc: (militaryMapping.afsc as string[]) || [],
      necOrRating: (militaryMapping.necOrRating as string[]) || [],
      billetKeywords: (militaryMapping.billetKeywords as string[]) || [],
    },
    compliance: {
      itar: complianceData.itar as boolean,
      drugTest: complianceData.drugTest as boolean,
      backgroundCheck: complianceData.backgroundCheck as boolean,
    },
    posting: {
      datePosted: postingData.datePosted as string,
      validThrough: postingData.validThrough as string,
      shift: postingData.shift as string,
    },
    sourceUrl: (sourceData.url as string) || '#',
    description: job.description as string,
    locationFlat: job.location as string,
    clearanceFlat: job.clearance_required as string,
    salaryMin: job.salary_min as number,
    salaryMax: job.salary_max as number,
    postedAt: job.posted_at as string,
    companySlug: companySlug ?? (job.company_slug as string) ?? null,
  }
}

/**
 * Generate a summary from description (268 char max, complete sentences)
 */
function generateSummary(description: string | undefined, snippet: string | undefined): string | null {
  const desc = description || snippet || ''
  if (!desc) return null

  const sentences = desc.match(/[^.!?]+[.!?]+/g) || []
  let summary = ''

  for (const sentence of sentences.slice(0, 3)) {
    const candidate = summary ? `${summary} ${sentence.trim()}` : sentence.trim()
    if (candidate.length <= 268) {
      summary = candidate
    } else {
      break
    }
  }

  return summary || desc.substring(0, 268)
}

/**
 * Composable for fetching and managing job detail data
 */
export function useJobDetail(slug: Ref<string> | ComputedRef<string>) {
  const logger = useLogger('useJobDetail')

  // Fetch job data with useAsyncData for SSR support
  const {
    data: jobData,
    pending,
    error: fetchError,
    refresh,
  } = useAsyncData(
    () => `job-${toValue(slug)}`,
    async () => {
      const slugValue = toValue(slug)
      if (!slugValue) return null

      logger.debug({ slug: slugValue }, 'Fetching job detail')

      try {
        // Fetch job from API
        const job = await $fetch<Record<string, unknown>>(`/api/jobs/${slugValue}`)

        if (!job) {
          logger.warn({ slug: slugValue }, 'Job not found')
          return null
        }

        logger.info({ slug: slugValue, id: job.id }, 'Job fetched successfully')

        return {
          job: transformJobData(job, job.company_slug as string | null),
          summary: generateSummary(job.description as string, job.snippet as string),
        }
      } catch (err) {
        const error = err as { statusCode?: number }
        if (error?.statusCode === 404) {
          logger.warn({ slug: slugValue }, 'Job not found')
          return null
        }
        throw err
      }
    },
    {
      watch: [slug],
      server: false, // Skip SSR for now
      lazy: true, // Don't block navigation
      default: () => null, // Explicit default to avoid immediate notFound state
    }
  )

  // Track if the fetch has ever completed
  const hasFetched = ref(false)
  watch(pending, (loading) => {
    if (!loading && !hasFetched.value) {
      hasFetched.value = true
    }
  })

  // Show loading if pending OR if we haven't fetched yet (initial client-side render)
  const isLoading = computed(() => pending.value || !hasFetched.value)

  // Computed accessors
  const job = computed(() => jobData.value?.job ?? null)
  const summary = computed(() => jobData.value?.summary ?? null)
  // Only show "not found" after fetch has completed
  const notFound = computed(() => hasFetched.value && !fetchError.value && !job.value)

  // Error message for display
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.statusMessage || 'Failed to load job'
    }
    if (notFound.value) {
      return 'Job not found'
    }
    return null
  })

  // Computed helpers for conditional rendering
  const locationDisplay = computed(() => {
    if (!job.value) return ''
    const loc = job.value.location
    if (loc.city || loc.state) {
      const parts = []
      if (loc.city) parts.push(loc.city)
      if (loc.state) parts.push(loc.state)
      if (loc.country && loc.country !== 'USA' && !loc.state) parts.push(loc.country)
      return parts.join(', ')
    }
    return job.value.locationFlat || loc.country || 'Unknown'
  })

  const hasMilitaryMapping = computed(() => {
    if (!job.value?.militaryMapping) return false
    const m = job.value.militaryMapping
    return !!(m.service?.length || m.mos?.length || m.afsc?.length || m.necOrRating?.length || m.billetKeywords?.length)
  })

  const hasComplianceInfo = computed(() => {
    if (!job.value?.compliance) return false
    const c = job.value.compliance
    return c.itar === true || c.drugTest === true || c.backgroundCheck === true
  })

  const hasCompensationDetails = computed(() => {
    if (!job.value?.compensation) return false
    const c = job.value.compensation
    return !!(c.perDiemDailyUSD || c.housingProvided === true || c.hardshipEligible === true)
  })

  const hasQualificationsData = computed(() => {
    if (!job.value) return false
    const q = job.value.qualifications
    return !!(
      (q.required && q.required.length > 0) ||
      (q.preferred && q.preferred.length > 0) ||
      (q.languages && q.languages.length > 0) ||
      (q.licenses && q.licenses.length > 0) ||
      q.education?.level ||
      (q.certs && q.certs.length > 0) ||
      (q.yearsExperienceMin && q.yearsExperienceMin > 0)
    )
  })

  const hasContractInfo = computed(() => {
    if (!job.value?.contract) return false
    const c = job.value.contract
    return !!(c.type || c.programOrMission || c.vehicleOrIDIQ || c.durationMonths)
  })

  const hasPostingInfo = computed(() => {
    if (!job.value?.posting) return false
    const p = job.value.posting
    return !!(p.datePosted || p.validThrough || (p.shift && p.shift !== 'NOT_STATED'))
  })

  return {
    // Core data
    job,
    summary,
    isLoading,
    error,
    notFound,
    refresh,

    // Computed helpers
    locationDisplay,
    hasMilitaryMapping,
    hasComplianceInfo,
    hasCompensationDetails,
    hasQualificationsData,
    hasContractInfo,
    hasPostingInfo,
  }
}
