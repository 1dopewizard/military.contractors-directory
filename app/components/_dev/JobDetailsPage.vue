<!--
  @file JobDetailsPage.vue
  @description Dev-only job details page matching the production job detail page style
  @usage <JobDetailsPage />
-->

<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb'

const job = {
  id: 'service-desk-administrator-swa',
  title: 'Service Desk Administrator',
  company: 'V2X',
  location: {
    type: 'DEPLOYED',
    region: 'OCONUS',
    country: 'Southwest Asia',
    theater: 'CENTCOM'
  },
  clearance: {
    level: 'SECRET',
    polygraph: 'NONE',
    activeRequired: true,
    usCitizenshipRequired: true
  },
  compensation: {
    benefits: ['HOUSING', 'TRANSPORTATION', 'BONUS', 'TUITION_REIMBURSEMENT'],
    housingProvided: true
  },
  employmentType: 'FULL_TIME',
  contract: {
    programOrMission: 'OMDAC-SWACA'
  },
  qualifications: {
    certs: ['ISC2 CISSP', 'CompTIA CASP+', 'CompTIA Security+', 'Cisco CCNP', 'Cisco CCNA', 'ITIL Foundation'],
    required: ['Active Secret Clearance', '4 years of professional experience'],
    education: {
      level: 'ASSOCIATE',
      fields: ['Computer Science', 'Management Information Systems', 'Information Systems', 'Engineering'],
      acceptsEquivalency: true
    },
    yearsExperienceMin: 4
  },
  responsibilities: [
    'Provide enterprise-level technical support',
    'Act as escalation point for complex issues',
    'Deliver feedback on technical events',
    'Maintain high level of customer service',
    'Serve as primary POC with NOCs',
    'Provide input for SOPs and WIs',
    'Manage user and computer objects',
    'Coordinate ASI requests',
    'Perform effectively in fast-paced environment',
    'Collaborate across multiple stakeholders'
  ],
  toolsTech: ['Army365 Portal', 'BMC Remedy', 'DHCP', 'DISA DEPO', 'DNS', 'Microsoft Active Directory', 'SharePoint', 'Spectrum', 'Solarwinds'],
  domainTags: ['IT', 'CYBER'],
  sourceUrl: 'https://careers.gov2x.com/why-gov2x/jobs/49324?lang=en-us',
  description: `The Service Desk Administrator plays a critical role in maintaining and supporting enterprise IT systems and services for CENTCOM operations. This position involves performing assessments, triage, and resolution of technical issues while monitoring Authorized Service Interruptions affecting DISA and CENTCOM facilities. The ideal candidate will have a solid understanding of DISA guidelines and ITIL processes, managing tickets throughout their lifecycle to ensure customer satisfaction. This OCONUS position offers company-paid housing and transportation, a completion bonus, and tuition reimbursement.`
}

const locationDisplay = computed(() => {
  const parts = []
  if (job.location.country) parts.push(job.location.country)
  if (job.location.theater) parts.push(job.location.theater)
  return parts.join(' • ')
})

const benefitLabels: Record<string, { label: string; icon: string }> = {
  HOUSING: { label: 'Housing Provided', icon: 'mdi:home' },
  TRANSPORTATION: { label: 'Transportation', icon: 'mdi:car' },
  BONUS: { label: 'Completion Bonus', icon: 'mdi:cash-plus' },
  TUITION_REIMBURSEMENT: { label: 'Tuition Reimbursement', icon: 'mdi:school' }
}
</script>

<template>
  <div class="min-h-screen bg-background pb-12">
    <!-- Header Background -->
    <div class="border-b border-border/50 bg-muted/5 relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-background via-background/0 to-background"></div>

      <div class="container mx-auto px-4 max-w-7xl py-8 relative z-10">
        <!-- Breadcrumb -->
        <Breadcrumb class="mb-8">
          <BreadcrumbList class="text-xs font-mono uppercase tracking-wider">
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <NuxtLink to="/">Home</NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <NuxtLink to="/jobs">Jobs</NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="truncate max-w-[200px] md:max-w-md font-bold">
                {{ job.title }}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <!-- Job Header -->
        <div class="max-w-4xl space-y-6">
          <div class="flex flex-wrap gap-2">
            <div class="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-widest border border-primary/20">
              {{ job.location.region }}
            </div>
            <div class="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 text-muted-foreground text-[10px] font-mono font-bold uppercase tracking-widest border border-border/50">
              <Icon name="mdi:shield-check" class="w-3 h-3" />
              {{ job.clearance.level }}
            </div>
            <div class="inline-flex items-center px-2 py-1 bg-muted/50 text-muted-foreground text-[10px] font-mono font-bold uppercase tracking-widest border border-border/50">
              {{ job.employmentType.replace('_', ' ') }}
            </div>
            <div v-if="job.contract.programOrMission" class="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 text-muted-foreground text-[10px] font-mono font-bold uppercase tracking-widest border border-border/50">
              <Icon name="mdi:file-document-outline" class="w-3 h-3" />
              {{ job.contract.programOrMission }}
            </div>
          </div>

          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {{ job.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-mono text-muted-foreground uppercase tracking-wide">
              <div class="flex items-center gap-2">
                <Icon name="mdi:domain" class="w-4 h-4" />
                <span class="text-foreground font-bold">{{ job.company }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:map-marker" class="w-4 h-4" />
                {{ locationDisplay }}
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:earth" class="w-4 h-4" />
                {{ job.location.region }}
              </div>
            </div>
          </div>

          <!-- Benefits highlight -->
          <div class="flex flex-wrap gap-3 border-l-4 border-primary/20 pl-4">
            <div
              v-for="benefit in job.compensation.benefits"
              :key="benefit"
              class="inline-flex items-center gap-1.5 text-sm text-foreground"
            >
              <Icon :name="benefitLabels[benefit]?.icon || 'mdi:check'" class="w-4 h-4 text-primary" />
              <span>{{ benefitLabels[benefit]?.label || benefit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="container mx-auto px-4 max-w-7xl py-8 -mt-8 relative z-20">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Job Description -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50">
              <h3 class="text-lg font-semibold text-foreground">Job Description</h3>
            </div>
            <div class="p-5">
              <div class="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                <p class="whitespace-pre-wrap leading-relaxed">{{ job.description }}</p>
              </div>
            </div>
          </div>

          <!-- Responsibilities -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50">
              <h3 class="text-lg font-semibold text-foreground">Responsibilities</h3>
            </div>
            <div class="p-5">
              <ul class="space-y-3">
                <li
                  v-for="(resp, index) in job.responsibilities"
                  :key="index"
                  class="flex items-start gap-3 text-sm text-foreground/90"
                >
                  <div class="mt-1 p-0.5 bg-primary/10 text-primary shrink-0">
                    <Icon name="mdi:check" class="w-3 h-3" />
                  </div>
                  <span class="leading-relaxed">{{ resp }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Qualifications -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50">
              <h3 class="text-lg font-semibold text-foreground">Qualifications</h3>
            </div>
            <div class="p-5 space-y-6">
              <!-- Required -->
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Required</p>
                <ul class="space-y-2">
                  <li
                    v-for="(req, index) in job.qualifications.required"
                    :key="index"
                    class="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <div class="mt-1 p-0.5 bg-primary/10 text-primary shrink-0">
                      <Icon name="mdi:check" class="w-3 h-3" />
                    </div>
                    <span>{{ req }}</span>
                  </li>
                </ul>
              </div>

              <!-- Education -->
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Education</p>
                <div class="text-sm text-foreground/90 space-y-1">
                  <p>{{ job.qualifications.education.level }} degree in:</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <Badge
                      v-for="field in job.qualifications.education.fields"
                      :key="field"
                      variant="secondary"
                      class="text-[10px] font-mono"
                    >
                      {{ field }}
                    </Badge>
                  </div>
                  <p v-if="job.qualifications.education.acceptsEquivalency" class="text-xs text-muted-foreground mt-2">
                    * Equivalent experience may substitute for formal education
                  </p>
                </div>
              </div>

              <!-- Certifications -->
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Certifications (DoD 8570.01M)</p>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="cert in job.qualifications.certs"
                    :key="cert"
                    variant="ghost"
                    class="text-[10px] font-mono"
                  >
                    {{ cert }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Tools & Technologies -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50">
              <h3 class="text-lg font-semibold text-foreground">Tools & Technologies</h3>
            </div>
            <div class="p-5">
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="tool in job.toolsTech"
                  :key="tool"
                  variant="secondary"
                  class="text-xs font-mono bg-muted/50"
                >
                  {{ tool }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Apply Section -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
            <div class="p-6 relative z-10">
              <div class="flex flex-col sm:flex-row items-start gap-6">
                <div class="p-3 bg-background border border-border/50 shrink-0">
                  <Icon name="mdi:briefcase-check" class="w-8 h-8 text-primary" />
                </div>
                <div class="space-y-4 flex-1">
                  <div>
                    <h3 class="text-lg font-bold text-foreground mb-1">Ready to apply?</h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                      Apply directly on the {{ job.company }} careers portal. This OCONUS position includes company-paid housing and transportation.
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <Button size="lg" class="font-bold tracking-wide" as-child>
                      <NuxtLink :to="job.sourceUrl" target="_blank" rel="noopener noreferrer" class="gap-2">
                        <Icon name="mdi:open-in-new" class="w-4 h-4" />
                        APPLY ON {{ job.company.toUpperCase() }}
                      </NuxtLink>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-4 space-y-6">
          <!-- Quick Facts -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50">
              <h3 class="text-sm font-semibold text-foreground">Quick Facts</h3>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Company</div>
                <div class="text-sm font-medium text-foreground">{{ job.company }}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Location</div>
                <div class="text-sm font-medium text-foreground">{{ locationDisplay }}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Location Type</div>
                <div class="text-sm font-medium text-foreground">{{ job.location.region }}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Clearance</div>
                <div class="text-sm font-medium text-foreground flex items-center gap-2">
                  {{ job.clearance.level }}
                  <Badge v-if="job.clearance.activeRequired" variant="ghost" class="text-[10px]">Active Required</Badge>
                </div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">US Citizenship</div>
                <div class="text-sm font-medium text-foreground">{{ job.clearance.usCitizenshipRequired ? 'Required' : 'Not Required' }}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Experience</div>
                <div class="text-sm font-medium text-foreground">{{ job.qualifications.yearsExperienceMin }}+ years</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Program</div>
                <div class="text-sm font-medium text-foreground">{{ job.contract.programOrMission }}</div>
              </div>
            </div>
          </div>

          <!-- Domain Tags -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon name="mdi:tag-multiple" class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold text-foreground">Domain</h3>
            </div>
            <div class="p-4">
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="tag in job.domainTags"
                  :key="tag"
                  variant="secondary"
                  class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-muted/50"
                >
                  {{ tag }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Benefits -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon name="mdi:gift-outline" class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold text-foreground">Benefits</h3>
            </div>
            <div class="p-4 space-y-3">
              <div
                v-for="benefit in job.compensation.benefits"
                :key="benefit"
                class="flex items-center gap-3 text-sm"
              >
                <div class="p-1.5 bg-primary/10 text-primary">
                  <Icon :name="benefitLabels[benefit]?.icon || 'mdi:check'" class="w-4 h-4" />
                </div>
                <span class="text-foreground">{{ benefitLabels[benefit]?.label || benefit }}</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
