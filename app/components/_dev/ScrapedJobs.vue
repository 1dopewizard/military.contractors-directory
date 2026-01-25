<!--
  @file ScrapedJobs component for dev page
  @usage <ScrapedJobs />
  @description Displays scraped jobs from crawl4ai_test table
-->

<script setup lang="ts">
import { ref } from 'vue'

const { fetchScrapedJobs } = useScrapedJobs()
const logger = useLogger('dev-scraped-jobs')

// Component state
const jobs = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const expandedJobId = ref<string | null>(null)

// ---------- Helpers (defensive shape handling) ----------
const getSummary = (job: any) => job?.summary ?? job ?? {}

const getLocation = (job: any) => getSummary(job)?.location ?? job?.location ?? {}
const getClearance = (job: any) => getSummary(job)?.clearance ?? job?.clearance ?? {}
const getComp = (job: any) => getSummary(job)?.compensation ?? job?.compensation ?? null
const getContract = (job: any) => getSummary(job)?.contract ?? job?.contract ?? {}
const getQuals = (job: any) => getSummary(job)?.qualifications ?? job?.qualifications ?? {}
const getReqs = (job: any): string[] => getQuals(job)?.required ?? []
const getPrefs = (job: any): string[] => getQuals(job)?.preferred ?? []
const getResps = (job: any): string[] => getSummary(job)?.responsibilities ?? job?.responsibilities ?? []
const getTools = (job: any): string[] => getSummary(job)?.toolsTech ?? job?.tools_tech ?? []
const getDomainTags = (job: any): string[] => getSummary(job)?.domainTags ?? job?.domain_tags ?? []

// Certifications: read from summary with fallback to root
const getCerts = (job: any): string[] => {
  const quals = getQuals(job)
  const arr = quals?.certs ?? job?.qualifications?.certs ?? []
  return sortCerts(Array.isArray(arr) ? arr : [])
}

// --------- Display formatters ----------
const BENEFIT_LABELS: Record<string, string> = {
  HEALTH: 'Health',
  DENTAL: 'Dental',
  VISION: 'Vision',
  RETIREMENT_401K: '401(k)',
  BONUS: 'Bonus',
  RELOCATION: 'Relocation',
  PER_DIEM: 'Per diem',
  HOUSING: 'Housing',
  HARDSHIP_PAY: 'Hardship pay',
  TRANSPORTATION: 'Transportation',
  TUITION_REIMBURSEMENT: 'Tuition reimbursement'
}

const CERT_PRIORITY = [
  'ISC2 CISSP',
  'CompTIA CASP+',
  'CompTIA CySA+',
  'CompTIA Security+',
  'Cisco CCNP',
  'Cisco CCNA',
  'AWS CCP',
  'Microsoft AZ-900',
  'PMI PMP',
  'ITIL Foundation'
]

const sortCerts = (list: string[]) => {
  const dedup = Array.from(new Set(list.filter(Boolean)))
  const idx = (s: string) => CERT_PRIORITY.indexOf(s)
  return dedup.sort((a, b) => {
    const ia = idx(a), ib = idx(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

const formatBenefits = (benefits?: string[]) => {
  if (!benefits?.length) return ''
  return benefits.map(b => BENEFIT_LABELS[b] ?? b).join(', ')
}

const formatSalaryRange = (min: number | null, max: number | null, currency = 'USD'): string => {
  if (!min && !max) return 'Not specified'
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  })
  if (min && max) return `${formatter.format(min)}–${formatter.format(max)}`
  if (min) return `${formatter.format(min)}+`
  if (max) return `Up to ${formatter.format(max)}`
  return 'Not specified'
}

const formattedJobTopline = (job: any) => {
  const company = job?.employer?.name ?? job?.company ?? 'Unknown company'
  const loc = (() => {
    const L = getLocation(job)
    if (!L) return 'Location TBD'
    if (L?.city) return `${L.city}${L?.state ? ', ' + L.state : ''}`
    return L?.country ?? 'Location TBD'
  })()
  return `${company} • ${loc}`
}

const toggleExpanded = (id: string) => {
  expandedJobId.value = expandedJobId.value === id ? null : id
}

// ---------- Load data ----------
onMounted(async () => {
  logger.info('Loading scraped jobs')

  const { data, error: fetchError } = await fetchScrapedJobs(100)

  if (fetchError) {
    logger.error({ error: fetchError }, 'Failed to load scraped jobs')
    error.value = fetchError
  } else if (data) {
    jobs.value = data
    logger.info({ count: data.length }, 'Scraped jobs loaded successfully')
  }

  loading.value = false
})
</script>

<template>
  <div class="space-y-12">
    <section class="space-y-6 pt-4">
      <Badge variant="ghost" class="w-fit text-sm px-3 py-1">
        <Icon name="mdi:code-tags" class="w-3.5 h-3.5 mr-1.5" />
        Development
      </Badge>
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Scraped Job Data
        </h1>
        <p class="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Development page displaying scraped jobs from the crawl4ai_test table. {{ jobs.length }} job{{ jobs.length !== 1 ? 's' : '' }} loaded from Supabase.
        </p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-primary">
            <Icon name="mdi:database" class="w-4 h-4" />
            <span class="text-2xl font-bold">{{ jobs.length }}</span>
          </div>
          <p class="text-xs text-muted-foreground">Total Jobs</p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-primary">
            <Icon name="mdi:table" class="w-4 h-4" />
            <span class="text-2xl font-bold">Test</span>
          </div>
          <p class="text-xs text-muted-foreground">Table Source</p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-primary">
            <Icon name="mdi:update" class="w-4 h-4" />
            <span class="text-2xl font-bold">Live</span>
          </div>
          <p class="text-xs text-muted-foreground">Data Status</p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-primary">
            <Icon name="mdi:flask" class="w-4 h-4" />
            <span class="text-2xl font-bold">Dev</span>
          </div>
          <p class="text-xs text-muted-foreground">Environment</p>
        </div>
      </div>
    </section>

    <Card v-if="loading" class="border-border/50 shadow-sm">
      <CardContent class="pt-6">
        <div class="flex items-center gap-3">
          <Spinner class="size-5 text-primary" />
          <p class="text-sm text-muted-foreground">Loading scraped jobs from database...</p>
        </div>
      </CardContent>
    </Card>

    <Card v-else-if="error" class="border-border/50 shadow-sm">
      <CardContent class="pt-6">
        <Alert variant="destructive">
          <Icon name="mdi:alert-circle" class="w-4 h-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <Card v-else-if="jobs.length === 0" class="border-border/50 shadow-sm">
      <CardContent class="pt-6">
        <div class="text-center py-8">
          <Icon name="mdi:database-off" class="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p class="text-sm text-muted-foreground">No scraped jobs found in the database.</p>
        </div>
      </CardContent>
    </Card>

    <div v-else class="grid grid-cols-1 gap-4">
      <Card 
        v-for="job in jobs"
        :key="job.id || job.job_id || job.jobId || job.title"
        class="border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/50 bg-card overflow-hidden"
        :class="expandedJobId === (job.id || job.job_id) ? 'ring-1 ring-primary/20' : 'cursor-pointer'"
      >
        <CardContent class="p-0">
          <div
            class="p-4 flex flex-col gap-3"
            role="button"
            tabindex="0"
            @click="toggleExpanded(job.id || job.job_id)"
            @keydown.enter.prevent="toggleExpanded(job.id || job.job_id)"
            @keydown.space.prevent="toggleExpanded(job.id || job.job_id)"
            :aria-expanded="expandedJobId === (job.id || job.job_id)"
            :aria-controls="`job-details-${job.id || job.job_id}`"
          >
            <!-- Header Row: Title and Chevron -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 min-w-0 w-full">
                <div class="flex items-center justify-between gap-2 w-full">
                  <div class="flex items-center gap-2 min-w-0">
                    <h3 class="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate pr-2">
                      {{ job.title }}
                    </h3>
                    <Badge v-if="job.is_new" variant="ghost" class="text-[10px] uppercase tracking-wide bg-green-50 border-green-600 text-green-700 dark:bg-green-950 dark:border-green-600 dark:text-green-400 h-5 px-1.5 shrink-0">
                      <Icon name="mdi:new-box" class="w-3 h-3 mr-0.5" />
                      New
                    </Badge>
                  </div>
                  
                  <!-- Expand Chevron -->
                   <Icon
                    name="mdi:chevron-down"
                    class="h-5 w-5 transition-transform text-muted-foreground shrink-0"
                    :class="expandedJobId === (job.id || job.job_id) ? 'rotate-180' : ''"
                  />
                </div>

                <!-- Metadata Row: Company • Location [Spacer] Salary -->
                <div class="flex items-center justify-between gap-2 text-sm text-muted-foreground w-full flex-wrap sm:flex-nowrap">
                  <div class="flex items-center gap-2 min-w-0 max-w-full">
                    <span class="flex items-center gap-1.5 font-medium text-foreground shrink-0 truncate max-w-[200px]">
                      <Icon name="mdi:domain" class="w-3.5 h-3.5 opacity-70" />
                      {{ job?.employer?.name ?? job?.company ?? 'Unknown company' }}
                    </span>
                    <span class="text-border shrink-0">•</span>
                    <span class="flex items-center gap-1.5 truncate min-w-0">
                      {{
                        (() => {
                          const L = getLocation(job)
                          if (!L) return 'Location Not Specified'
                          if (L?.city) return `${L.city}${L?.state ? ', ' + L.state : ''}`
                          return L?.country ?? 'Location Not Specified'
                        })()
                      }}
                    </span>
                  </div>

                  <span class="font-mono font-medium text-foreground shrink-0 ml-auto sm:ml-0">
                    {{
                      getComp(job)
                        ? formatSalaryRange(getComp(job)?.min ?? null, getComp(job)?.max ?? null, getComp(job)?.currency ?? 'USD')
                        : 'Pay N/A'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer: Badges (Left) & Date (Right) -->
            <div class="flex items-end justify-between pt-2 border-t border-border/50 mt-auto gap-2">
              <div class="flex flex-wrap gap-2">
                <Badge v-if="getLocation(job)?.type" variant="ghost" class="text-[10px] px-1.5 h-5 text-muted-foreground">
                  {{ getLocation(job)?.type }}
                </Badge>
                <Badge v-if="getClearance(job)?.level" variant="ghost" class="text-[10px] px-1.5 h-5 text-muted-foreground">
                  <Icon name="mdi:shield-check" class="w-3 h-3 mr-1 opacity-70" />
                  {{ getClearance(job)?.level }}
                </Badge>
              </div>

              <span class="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap shrink-0 flex items-center gap-1">
                 <Icon name="mdi:calendar" class="w-3 h-3 opacity-70" />
                 {{ (job.posting?.datePosted ?? job.posting?.lastSeenAt ?? '').slice(0, 10) || 'Date N/A' }}
              </span>
            </div>
          </div>

          <!-- Expanded Details -->
          <div
            v-if="expandedJobId === (job.id || job.job_id)"
            :id="`job-details-${job.id || job.job_id}`"
            class="px-5 pb-5 border-t border-border/50 bg-muted/5"
          >
            <div class="space-y-6 pt-4">
              <div class="grid gap-x-8 gap-y-4 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Location</span>
                  <p>
                    {{
                      getLocation(job)?.city
                        ? `${getLocation(job)?.city}${getLocation(job)?.state ? ', ' + getLocation(job)?.state : ''}`
                        : getLocation(job)?.country
                    }}
                    <span v-if="getLocation(job)?.region"> • {{ getLocation(job)?.region }}</span>
                    <span v-if="getLocation(job)?.theater"> • {{ getLocation(job)?.theater }}</span>
                  </p>
                </div>
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Work type</span>
                  <p>
                    {{ getLocation(job)?.type || 'Not specified' }}
                    <span v-if="getLocation(job)?.travelPercent !== undefined && getLocation(job)?.travelPercent !== null">
                      • {{ getLocation(job)?.travelPercent }}% travel
                    </span>
                  </p>
                </div>
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Clearance</span>
                  <p>
                    {{ getClearance(job)?.level || 'Not specified' }}
                    <span v-if="getClearance(job)?.level">
                      {{ getClearance(job)?.activeRequired ? '(active required)' : '(eligible okay)' }}
                    </span>
                    <span v-if="getClearance(job)?.polygraph && getClearance(job)?.polygraph !== 'NONE'">
                      • Poly: {{ getClearance(job)?.polygraph }}
                    </span>
                    <span v-if="getClearance(job)?.sponsorAvailable === true">
                      • Sponsor available
                    </span>
                  </p>
                </div>
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Compensation</span>
                  <template v-if="getComp(job)">
                    <p>
                      {{ formatSalaryRange(getComp(job)?.min ?? null, getComp(job)?.max ?? null, getComp(job)?.currency ?? 'USD') }}
                      <span v-if="getComp(job)?.period">/ {{ getComp(job)?.period }}</span>
                    </p>
                    <p v-if="getComp(job)?.benefits?.length" class="mt-1 text-xs">
                      {{ formatBenefits(getComp(job)?.benefits) }}
                    </p>
                    <p v-if="getComp(job)?.perDiemDailyUSD" class="mt-1 text-xs">
                      Per diem: ${{ getComp(job)?.perDiemDailyUSD }} / day
                    </p>
                    <p v-if="getComp(job)?.housingProvided === true" class="mt-1 text-xs">
                      Housing provided
                    </p>
                    <p v-if="getComp(job)?.hardshipEligible === true" class="mt-1 text-xs">
                      Hardship pay eligible
                    </p>
                  </template>
                  <p v-else>Not specified</p>
                </div>
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Program</span>
                  <p v-if="getContract(job)?.programOrMission">{{ getContract(job)?.programOrMission }}</p>
                  <p v-else>Not specified</p>
                </div>
                <div>
                  <span class="font-medium text-foreground text-xs uppercase tracking-wider block mb-1">Contract</span>
                  <p>
                    {{ getContract(job)?.type || 'Not specified' }}
                    <span v-if="getContract(job)?.vehicleOrIDIQ"> • {{ getContract(job)?.vehicleOrIDIQ }}</span>
                    <span v-if="getContract(job)?.durationMonths"> • {{ getContract(job)?.durationMonths }}mo</span>
                  </p>
                </div>
              </div>

              <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-3">
                  <h3 class="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon name="mdi:clipboard-check-outline" class="w-4 h-4 text-primary" />
                    Requirements
                  </h3>
                  <ul class="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-disc list-inside pl-1">
                    <li v-for="req in getReqs(job)" :key="req">
                      {{ req }}
                    </li>
                  </ul>

                  <div v-if="getCerts(job).length" class="pt-2 space-y-1.5">
                    <p class="text-xs font-medium text-foreground uppercase tracking-wider">Certifications</p>
                    <div class="flex flex-wrap gap-1.5">
                      <Badge v-for="cert in getCerts(job)" :key="cert" variant="secondary" class="text-[10px]">
                        {{ cert }}
                      </Badge>
                    </div>
                  </div>

                  <div v-if="getPrefs(job).length" class="pt-2 space-y-1.5">
                    <p class="text-xs font-medium text-foreground uppercase tracking-wider">Nice to have</p>
                    <ul class="space-y-1 text-sm text-muted-foreground leading-relaxed list-disc list-inside pl-1">
                      <li v-for="pref in getPrefs(job)" :key="pref">
                        {{ pref }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="space-y-3">
                  <h3 class="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon name="mdi:briefcase-outline" class="w-4 h-4 text-primary" />
                    Responsibilities
                  </h3>
                  <ul class="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-disc list-inside pl-1">
                    <li v-for="resp in getResps(job)" :key="resp">
                      {{ resp }}
                    </li>
                  </ul>
                  <div v-if="getTools(job)?.length" class="pt-2 space-y-1.5">
                    <p class="text-xs font-medium text-foreground uppercase tracking-wider">Tech stack</p>
                    <div class="flex flex-wrap gap-1.5">
                      <Badge v-for="tool in getTools(job)" :key="tool" variant="ghost" class="text-[10px]">
                        {{ tool }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="getSummary(job)?.militaryMapping && (getSummary(job)?.militaryMapping?.mos?.length || getSummary(job)?.militaryMapping?.afsc?.length || getSummary(job)?.militaryMapping?.service?.length)"
                class="space-y-2 pt-2 border-t border-border/50"
              >
                <h3 class="text-xs font-medium text-foreground uppercase tracking-wider">Military mapping</h3>
                <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span v-if="getSummary(job)?.militaryMapping?.service?.length">
                    <span class="font-medium text-foreground">Service:</span> {{ getSummary(job)?.militaryMapping?.service.join(', ') }}
                  </span>
                  <span v-if="getSummary(job)?.militaryMapping?.mos?.length">
                    <span class="font-medium text-foreground">MOS:</span> {{ getSummary(job)?.militaryMapping?.mos.join(', ') }}
                  </span>
                  <span v-if="getSummary(job)?.militaryMapping?.afsc?.length">
                    <span class="font-medium text-foreground">AFSC:</span> {{ getSummary(job)?.militaryMapping?.afsc.join(', ') }}
                  </span>
                  <span v-if="getSummary(job)?.militaryMapping?.necOrRating?.length">
                    <span class="font-medium text-foreground">NEC:</span> {{ getSummary(job)?.militaryMapping?.necOrRating.join(', ') }}
                  </span>
                </div>
              </div>

              <div v-if="getDomainTags(job)?.length" class="pt-2">
                <div class="flex flex-wrap gap-1.5">
                  <Badge v-for="tag in getDomainTags(job)" :key="tag" variant="secondary" class="text-[10px] bg-muted text-muted-foreground">
                    {{ tag }}
                  </Badge>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-3 pt-4 border-t border-border/50">
                <Button as-child size="sm" variant="ghost" class="h-8 text-xs" @click.stop>
                  <NuxtLink
                    :to="job.source?.url || job.source_url"
                    external
                    target="_blank"
                    rel="noopener"
                  >
                    <Icon name="mdi:open-in-new" class="w-3.5 h-3.5 mr-1.5" />
                    View Source
                  </NuxtLink>
                </Button>
                <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="mdi:calendar" class="w-3.5 h-3.5 opacity-70" />
                  Posted: {{
                    (job.posting?.datePosted ?? job.posting?.lastSeenAt ?? '').slice(0, 10) || 'Date N/A'
                  }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
