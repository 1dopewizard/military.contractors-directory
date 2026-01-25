<!--
  @file Community Hub Page
  @route /community
  @description Activity hub featuring leaderboard, recent contributions, community stats, and CTAs
-->

<script setup lang="ts">
import type { CommunityStats } from '@/app/types/community.types'

const logger = useLogger('CommunityPage')
const { fetchStats } = useCommunityStats()
const { isContributor } = useCommunityAccess()
const { isAuthenticated } = useAuth()

// SEO
useHead({
  title: 'Community | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Join our community of veterans sharing salary data and interview experiences. See top contributors, recent activity, and contribute your own intel.'
    }
  ]
})

// State (LeaderboardCard and RecentActivityFeed handle their own data fetching)
const stats = ref<CommunityStats | null>(null)
const isLoadingStats = ref(true)

// Load stats only - child components fetch their own data
onMounted(async () => {
  try {
    const statsData = await fetchStats()
    stats.value = statsData
  } catch (error) {
    logger.error({ error }, 'Failed to load community stats')
  } finally {
    isLoadingStats.value = false
  }
})

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`
  }
  return num.toLocaleString()
}

// Stats configuration
const statCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      value: stats.value.totalSalaryReports,
      label: 'Salary Reports',
      description: `${stats.value.verifiedSalaryReports} verified`,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/salaries',
    },
    {
      value: stats.value.totalInterviewExperiences,
      label: 'Interviews',
      description: `${stats.value.verifiedInterviewExperiences} verified`,
      textColor: 'text-blue-600 dark:text-blue-400',
      href: '/interviews',
    },
    {
      value: stats.value.totalContributors,
      label: 'Contributors',
      description: 'Sharing their intel',
      textColor: 'text-amber-600 dark:text-amber-400',
      href: null,
    },
  ]
})
</script>

<template>
  <div class="min-h-full">
    <!-- Header Section -->
    <section class="border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div class="max-w-3xl mx-auto text-center space-y-4">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide">
            <Icon name="mdi:account-group" class="w-4 h-4" />
            COMMUNITY HUB
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Together We're Stronger
          </h1>
          <p class="text-lg text-muted-foreground max-w-xl mx-auto">
            Real intel from veterans who've been there. See what's being shared, 
            who's leading the way, and how you can contribute.
          </p>

          <!-- CTAs -->
          <div class="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button size="lg" as-child>
              <NuxtLink to="/salaries/submit" class="gap-2">
                <Icon name="mdi:currency-usd" class="w-5 h-5" />
                Share Salary
              </NuxtLink>
            </Button>
            <Button size="lg" variant="ghost" as-child>
              <NuxtLink to="/interviews/submit" class="gap-2">
                <Icon name="mdi:message-plus" class="w-5 h-5" />
                Share Interview
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Strip -->
    <section class="border-y border-border/30 bg-card/20">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-3 divide-x divide-border/30">
          <!-- Loading skeleton -->
          <template v-if="isLoadingStats">
            <div
              v-for="i in 3"
              :key="i"
              class="py-6 px-4 sm:px-6 text-center animate-pulse"
            >
              <div class="h-8 w-16 bg-muted mx-auto mb-2" />
              <div class="h-4 w-24 bg-muted mx-auto mb-1" />
              <div class="h-3 w-20 bg-muted/50 mx-auto" />
            </div>
          </template>

          <!-- Actual stats -->
          <template v-else-if="stats">
            <component
              :is="stat.href ? 'NuxtLink' : 'div'"
              v-for="stat in statCards"
              :key="stat.label"
              :to="stat.href"
              class="group py-6 px-4 sm:px-6 text-center transition-colors"
              :class="stat.href ? 'hover:bg-card/50 cursor-pointer' : ''"
            >
              <div class="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" :class="stat.textColor">
                {{ formatNumber(stat.value) }}
              </div>
              <div class="text-sm font-medium text-foreground mt-1">
                {{ stat.label }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ stat.description }}
              </div>
            </component>
          </template>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <!-- Left Column: Leaderboard -->
        <div class="lg:col-span-1">
          <LeaderboardCard
            :limit="15"
            :show-view-all="false"
            flat
          />

          <!-- How it works card (below leaderboard on desktop) -->
          <Card class="mt-6 hidden lg:block bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader class="pb-2">
              <CardTitle class="text-base font-semibold flex items-center gap-2">
                <Icon name="mdi:help-circle" class="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-0 space-y-3 text-sm text-muted-foreground">
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  1
                </div>
                <p>Share your salary or interview experience anonymously</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  2
                </div>
                <p>Help others by voting on the most helpful reports</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  3
                </div>
                <p>Get unlimited access to all community intel as a contributor</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Activity Feed + Additional Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Recent Activity Section (same styling as homepage) -->
          <RecentActivityFeed
            :limit="15"
            :show-view-all="false"
          />

          <!-- Browse sections -->
          <div class="grid sm:grid-cols-2 gap-4">
            <!-- Browse Salaries -->
            <Card class="group hover:border-emerald-500/30 transition-colors">
              <CardContent class="p-5">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:scale-105 transition-transform">
                    <Icon name="mdi:chart-bar" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-foreground">Salary Reports</h3>
                    <p class="text-xs text-muted-foreground">
                      {{ stats ? formatNumber(stats.totalSalaryReports) : '...' }} reports
                    </p>
                  </div>
                </div>
                <p class="text-sm text-muted-foreground mb-4">
                  Real compensation data from veterans at defense contractors. Filter by MOS, company, clearance, and location.
                </p>
                <div class="flex gap-2">
                  <Button as-child size="sm" class="flex-1">
                    <NuxtLink to="/salaries">Browse</NuxtLink>
                  </Button>
                  <Button as-child variant="ghost" size="sm">
                    <NuxtLink to="/salaries/submit">
                      <Icon name="mdi:plus" class="w-4 h-4" />
                    </NuxtLink>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <!-- Browse Interviews -->
            <Card class="group hover:border-blue-500/30 transition-colors">
              <CardContent class="p-5">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-105 transition-transform">
                    <Icon name="mdi:message-text" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-foreground">Interview Experiences</h3>
                    <p class="text-xs text-muted-foreground">
                      {{ stats ? formatNumber(stats.totalInterviewExperiences) : '...' }} experiences
                    </p>
                  </div>
                </div>
                <p class="text-sm text-muted-foreground mb-4">
                  Learn what to expect from the interview process. Questions asked, tips, outcomes, and timelines.
                </p>
                <div class="flex gap-2">
                  <Button as-child size="sm" class="flex-1">
                    <NuxtLink to="/interviews">Browse</NuxtLink>
                  </Button>
                  <Button as-child variant="ghost" size="sm">
                    <NuxtLink to="/interviews/submit">
                      <Icon name="mdi:plus" class="w-4 h-4" />
                    </NuxtLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Contribute CTA (full width on mobile) -->
          <ContributeCta
            v-if="!isContributor"
            variant="banner"
          />

          <!-- Contributor badge (if user is a contributor) -->
          <Card v-else-if="isAuthenticated" class="bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30">
            <CardContent class="p-5">
              <div class="flex items-center gap-4">
                <div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Icon name="mdi:check-decagram" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-foreground">You're a Contributor!</h3>
                  <p class="text-sm text-muted-foreground">
                    Thanks for sharing your intel with the community. You have unlimited access to all reports.
                  </p>
                </div>
                <Button as-child variant="ghost" size="sm">
                  <NuxtLink to="/account" class="gap-2">
                    <Icon name="mdi:account" class="w-4 h-4" />
                    My Contributions
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- How it works (mobile only) -->
          <Card class="lg:hidden bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader class="pb-2">
              <CardTitle class="text-base font-semibold flex items-center gap-2">
                <Icon name="mdi:help-circle" class="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-0 space-y-3 text-sm text-muted-foreground">
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  1
                </div>
                <p>Share your salary or interview experience anonymously</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  2
                </div>
                <p>Help others by voting on the most helpful reports</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold shrink-0">
                  3
                </div>
                <p>Get unlimited access to all community intel as a contributor</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  </div>
</template>
