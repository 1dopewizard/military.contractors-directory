<!--
  @file Job detail page
  @route /jobs/[id]
  @description Shows job details with rich structured data
-->

<script setup lang="ts">
import JobDetailSkeleton from '@/app/components/Jobs/JobDetailSkeleton.vue'
import { BENEFIT_LABELS } from '@/app/types/job.types'

const route = useRoute()
const logger = useLogger('JobDetailPage')

// The route param is the slug (e.g., "senior-engineer-booz-allen-washington-dc")
const jobSlug = computed(() => route.params.id as string)

// formatDate moved to JobDetailsCard component

// Use the job detail composable
const {
  job,
  summary,
  isLoading,
  error,
  refresh,
  locationDisplay,
  hasMilitaryMapping,
  hasCompensationDetails,
  hasQualificationsData,
  hasContractInfo,
  hasPostingInfo,
} = useJobDetail(jobSlug)

// SEO
useHead({
  title: () =>
    job.value ? `${job.value.title} at ${job.value.company} | military.contractors` : 'Job Details | military.contractors',
  meta: [
    {
      name: 'description',
      content: () => summary.value || 'Defense contractor job opportunity',
    },
  ],
})

// Schema.org JobPosting structured data for Google Jobs integration
useJobPostingSchema(job)

logger.info({ slug: jobSlug.value }, 'Job detail page loaded')
</script>

<template>
  <!-- Loading State (show when loading OR when we don't have job data yet and no error) -->
  <div v-if="isLoading || (!job && !error)" class="min-h-full">
    <SearchablePageHeader>
      <template #filters>
        <div class="h-7"></div>
      </template>
    </SearchablePageHeader>
    <JobDetailSkeleton />
  </div>

  <!-- Error/Empty State -->
  <div v-else-if="error" class="min-h-full">
    <SearchablePageHeader />
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
      <Empty>
        <EmptyMedia variant="icon">
          <Icon name="mdi:briefcase-off-outline" class="size-5" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>Job Not Found</EmptyTitle>
          <EmptyDescription>{{ error }}</EmptyDescription>
        </EmptyContent>
        <div class="flex gap-3 justify-center">
          <Button as-child variant="default">
            <NuxtLink to="/jobs">Browse Jobs</NuxtLink>
          </Button>
          <Button variant="link" @click="refresh">
            <Icon name="mdi:refresh" class="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Empty>
    </div>
  </div>

  <!-- Job Details -->
  <div v-else-if="job" class="min-h-full">
    <!-- Page Header -->
    <SearchablePageHeader>
      <template #filters>
        <!-- Breadcrumb-style context -->
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink to="/jobs" class="text-muted-foreground hover:text-primary transition-colors">
            Jobs
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium truncate">{{ job.title }}</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Job Info -->
        <div class="flex-1 min-w-0 max-w-3xl">
          <!-- Job Header -->
          <div class="mb-8 pb-6 border-b border-border/30">
            <h1 class="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {{ job.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
              <div class="flex items-center gap-2">
                <Icon name="mdi:domain" class="w-4 h-4" />
                <NuxtLink 
                  v-if="job.companySlug" 
                  :to="`/companies/${job.companySlug}`"
                  class="text-foreground font-medium hover:text-primary hover:underline"
                >
                  {{ job.company }}
                </NuxtLink>
                <span v-else class="text-foreground font-medium">{{ job.company }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:map-marker" class="w-4 h-4" />
                {{ locationDisplay }}
              </div>
              <div v-if="job.location.theater" class="flex items-center gap-2">
                <Icon name="mdi:earth" class="w-4 h-4" />
                {{ job.location.theater }}
              </div>
            </div>

            <!-- Job Summary -->
            <p v-if="summary" class="text-base text-muted-foreground leading-relaxed">
              {{ summary }}
            </p>
          </div>

          <!-- Responsibilities -->
          <section v-if="job.responsibilities?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Responsibilities
            </h2>
            <ul class="grid grid-cols-1 gap-3">
              <li
                v-for="(resp, index) in job.responsibilities"
                :key="index"
                class="flex items-start gap-3 text-sm text-foreground/90"
              >
                <div class="mt-0.5 w-5 h-5 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span class="text-[10px] font-bold">{{ index + 1 }}</span>
                </div>
                <span class="leading-relaxed">{{ resp }}</span>
              </li>
            </ul>
          </section>

          <Separator v-if="hasQualificationsData" class="bg-border/30 mb-8" />

          <!-- Qualifications -->
          <section v-if="hasQualificationsData" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-6">
              Qualifications
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Education & Experience -->
              <div v-if="job.qualifications.education?.level || job.qualifications.yearsExperienceMin" class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Education & Experience</h3>
                <div class="space-y-2">
                  <p v-if="job.qualifications.education?.level" class="flex items-start gap-2 text-sm">
                    <Icon name="mdi:school" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      {{ job.qualifications.education.level }} degree<span v-if="job.qualifications.education.fields?.length" class="text-muted-foreground"> in {{ job.qualifications.education.fields.join(', ') }}</span>
                    </span>
                  </p>
                  <p v-if="job.qualifications.yearsExperienceMin" class="flex items-center gap-2 text-sm">
                    <Icon name="mdi:briefcase-clock" class="w-4 h-4 text-primary shrink-0" />
                    <span>{{ job.qualifications.yearsExperienceMin }}+ years of experience</span>
                  </p>
                  <p v-if="job.qualifications.education?.acceptsEquivalency" class="text-xs text-muted-foreground pl-6">
                    * Equivalent experience may substitute
                  </p>
                </div>
              </div>

              <!-- Certifications -->
              <div v-if="job.qualifications.certs?.length" class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Certifications</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge v-for="cert in job.qualifications.certs" :key="cert" variant="soft" class="">
                    {{ cert }}
                  </Badge>
                </div>
              </div>

              <!-- Languages -->
              <div v-if="job.qualifications.languages?.length" class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Languages</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge v-for="lang in job.qualifications.languages" :key="lang" variant="soft" class="">
                    {{ lang }}
                  </Badge>
                </div>
              </div>

              <!-- Licenses -->
              <div v-if="job.qualifications.licenses?.length" class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Licenses</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="license in job.qualifications.licenses"
                    :key="license"
                    variant="soft"
                    class=""
                  >
                    {{ license }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Required Qualifications -->
            <div v-if="job.qualifications.required?.length" class="mt-6 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Required</h3>
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <li
                  v-for="(req, index) in job.qualifications.required"
                  :key="index"
                  class="flex items-start gap-2 text-sm text-foreground/90"
                >
                  <Icon name="mdi:check-circle" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{{ req }}</span>
                </li>
              </ul>
            </div>

            <!-- Preferred Qualifications -->
            <div v-if="job.qualifications.preferred?.length" class="mt-6 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred</h3>
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <li
                  v-for="(pref, index) in job.qualifications.preferred"
                  :key="index"
                  class="flex items-start gap-2 text-sm text-foreground/70"
                >
                  <Icon name="mdi:plus-circle-outline" class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{{ pref }}</span>
                </li>
              </ul>
            </div>
          </section>

          <Separator v-if="job.toolsTech?.length || job.domainTags?.length" class="bg-border/30 mb-8" />

          <!-- Tools & Domain Tags -->
          <section v-if="job.toolsTech?.length || job.domainTags?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div v-if="job.toolsTech?.length" class="space-y-3">
              <h2 class="text-lg font-bold text-foreground">
                Tools & Tech
              </h2>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="tool in job.toolsTech" :key="tool" variant="soft" class="">
                  {{ tool }}
                </Badge>
              </div>
            </div>
            <div v-if="job.domainTags?.length" class="space-y-3">
              <h2 class="text-lg font-bold text-foreground">
                Domain
              </h2>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="tag in job.domainTags" :key="tag" variant="soft" class="">
                  {{ tag }}
                </Badge>
              </div>
            </div>
          </section>

          <Separator v-if="hasCompensationDetails || job.compensation.benefits?.length" class="bg-border/30 mb-8" />

          <!-- Benefits & Compensation -->
          <section v-if="hasCompensationDetails || job.compensation.benefits?.length" class="mb-8">
            <h2 class="text-lg font-bold text-foreground mb-4">
              Benefits & Compensation
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="benefit in job.compensation.benefits" :key="benefit" class="flex items-center gap-2 text-sm">
                <Icon :name="BENEFIT_LABELS[benefit]?.icon || 'mdi:check'" class="w-4 h-4 text-primary shrink-0" />
                <span class="text-foreground">{{ BENEFIT_LABELS[benefit]?.label || benefit }}</span>
              </div>
              <div v-if="job.compensation.perDiemDailyUSD" class="flex items-center gap-2 text-sm">
                <Icon name="mdi:cash" class="w-4 h-4 text-primary shrink-0" />
                <span class="text-foreground">${{ job.compensation.perDiemDailyUSD }}/day per diem</span>
              </div>
              <div v-if="job.compensation.housingProvided" class="flex items-center gap-2 text-sm">
                <Icon name="mdi:home" class="w-4 h-4 text-primary shrink-0" />
                <span class="text-foreground">Housing provided</span>
              </div>
              <div v-if="job.compensation.hardshipEligible" class="flex items-center gap-2 text-sm">
                <Icon name="mdi:shield-star" class="w-4 h-4 text-primary shrink-0" />
                <span class="text-foreground">Hardship pay eligible</span>
              </div>
            </div>
          </section>

          <!-- Bottom Apply CTA (mobile only) -->
          <div class="lg:hidden pt-4">
            <Card class="border-none bg-sidebar overflow-hidden">
              <CardContent class="p-5 space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-base font-bold text-foreground">Ready to apply?</h3>
                    <p class="text-sm text-muted-foreground">
                      Apply on {{ job.company }}'s portal
                    </p>
                  </div>
                  <Button size="lg" class="font-bold tracking-wide shrink-0" as-child>
                    <NuxtLink :to="job.sourceUrl" target="_blank" rel="noopener noreferrer" class="gap-2">
                      <Icon name="mdi:open-in-new" class="w-4 h-4" />
                      Apply
                    </NuxtLink>
                  </Button>
                </div>
                <Separator class="bg-border/30" />
                <div class="flex items-center justify-between gap-4">
                  <p class="text-sm text-muted-foreground">Or let us submit your profile</p>
                  <JobExpressInterest
                    :job-id="job.id"
                    :job-title="job.title"
                    :company="job.company"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <JobDetailSidebar
          :job="job"
          :location-display="locationDisplay"
          :has-military-mapping="hasMilitaryMapping"
          :has-contract-info="hasContractInfo"
          :has-posting-info="hasPostingInfo"
        />
      </div>
    </div>
  </div>
</template>
