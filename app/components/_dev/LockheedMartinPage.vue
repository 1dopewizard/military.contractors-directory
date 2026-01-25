<!--
  @file LockheedMartinPage.vue
  @description Dev-only curated company profile for Lockheed Martin mirroring company detail page styling
  @usage <LockheedMartinPage />
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

const heroStats = [
  { label: 'Global Employees', value: '122K+', icon: 'mdi:account-group' },
  { label: 'Annual R&D Spend', value: '$3B+', icon: 'mdi:flask' },
  { label: 'Programs Supported', value: '400+', icon: 'mdi:rocket-launch-outline' },
  { label: 'Veteran Workforce', value: '23%', icon: 'mdi:shield-star' }
] as const

const missionFocus = [
  {
    title: 'Integrated Mission Systems',
    description: 'Command, control, communications, computers, cyber, intelligence, surveillance, and reconnaissance (C5ISR) solutions that keep warfighters connected.',
    icon: 'mdi:radar'
  },
  {
    title: 'Advanced Platforms',
    description: 'F-35 Lightning II, F-16 Viper, C-130J Super Hercules, and next-gen rotary and mission systems enabling joint domain operations.',
    icon: 'mdi:airplane'
  },
  {
    title: 'Space & Missile Defense',
    description: 'Hypersonics, precision strike, missile defense, and space domain awareness programs protecting strategic assets worldwide.',
    icon: 'mdi:orbit'
  }
] as const

const capabilityPillars = [
  {
    title: 'Digital Transformation',
    points: [
      'Model-based systems engineering across lifecycle',
      'AI/ML augmented mission planning and logistics',
      'Digital twins enabling rapid iteration and sustainment'
    ],
    icon: 'mdi:chip'
  },
  {
    title: 'Secure Supply Chain',
    points: [
      'Global network of 16,000 suppliers',
      'Zero-trust architecture and cyber resiliency standards',
      'Industry-leading earned value and compliance controls'
    ],
    icon: 'mdi:shield-check'
  },
  {
    title: 'Lifecycle Sustainment',
    points: [
      'Proven performance-based logistics for aviation fleets',
      'Field service teams in 30+ countries supporting OCONUS deployments',
      'Integrated training solutions and mission rehearsal centers'
    ],
    icon: 'mdi:infinity'
  }
] as const

type ProgramCard = {
  name: string
  description: string
  theater: string
  clearance: string
  icon: string
  focus: string
}

const marqueePrograms: ProgramCard[] = [
  {
    name: 'F-35 Lightning II',
    description: 'Joint strike fighter program delivering air dominance, multi-domain sensor fusion, and sustainment for 17 international partners.',
    theater: 'INDOPACOM, EUCOM, CENTCOM',
    clearance: 'TS/SCI eligible',
    icon: 'mdi:airplane',
    focus: 'Systems integration, ALIS/ODIN sustainment, mission data files'
  },
  {
    name: 'THAAD & Integrated Air Missile Defense',
    description: 'Layered missile defense capability with global deployments supporting CENTCOM, INDOPACOM, and homeland defense missions.',
    theater: 'CENTCOM, INDOPACOM, NORTHCOM',
    clearance: 'Secret / TS',
    icon: 'mdi:target-variant',
    focus: 'Radar engineering, fire control software, field service reps'
  },
  {
    name: 'Space Protection Programs',
    description: 'National security space assets and ground systems delivering resilient communications, ISR, and precision navigation and timing.',
    theater: 'Space Operations Command',
    clearance: 'TS/SCI + Poly',
    icon: 'mdi:satellite-variant',
    focus: 'Satellite operations, cyber defense, cross-domain solutions'
  }
]

const featuredRoles = [
  {
    title: 'Systems Engineer Staff – Joint All Domain Command and Control',
    location: 'Orlando, FL • Hybrid',
    clearance: 'TS/SCI',
    summary: 'Lead model-based systems engineering (MBSE) for joint fires integration, fusing sensor data and targeting workflows across domains.',
    tags: ['MBSE', 'C5ISR', 'Agile']
  },
  {
    title: 'Field Service Representative – THAAD Deployments',
    location: 'Okinawa, Japan • Deployed',
    clearance: 'Secret',
    summary: 'Provide forward-deployed maintenance, system diagnostics, and operator training for THAAD batteries supporting INDOPACOM.',
    tags: ['OCONUS', 'Maintenance', 'Missile Defense']
  },
  {
    title: 'Cybersecurity Architect – Classified Space Systems',
    location: 'Colorado Springs, CO • Onsite',
    clearance: 'TS/SCI + Poly',
    summary: 'Design zero-trust architectures, coordinate ATO packages, and protect mission systems supporting national security space assets.',
    tags: ['Zero Trust', 'RMF', 'Space']
  }
] as const

const talentInitiatives = [
  {
    label: 'Lockheed Martin Heroes',
    description: 'Paid fellowships transitioning service members into engineering, logistics, and program management roles.',
    icon: 'mdi:medal'
  },
  {
    label: 'Mission-Ready Communities',
    description: 'Employee resource groups supporting veterans, guardians, and military families with mentorship and onboarding.',
    icon: 'mdi:handshake'
  },
  {
    label: 'Skunk Works Innovation Labs',
    description: 'Rapid prototyping environments enabling cross-functional teams to deliver classified solutions at operational tempo.',
    icon: 'mdi:lightbulb-on-outline'
  }
] as const

const benefits = [
  {
    title: 'Total Rewards',
    items: [
      'Industry-leading 401(k) match up to 8%',
      'Multiple health plan options with TRICARE bridge support',
      'Performance-based bonuses aligned to program milestones'
    ],
    icon: 'mdi:gift-outline'
  },
  {
    title: 'Mobility & Sponsorship',
    items: [
      'Global relocation support and hardship allowances',
      'Clearance crossover teams and sponsorship pathways',
      'Deployable family readiness resources and benefits'
    ],
    icon: 'mdi:earth'
  },
  {
    title: 'Learning & Growth',
    items: [
      'Tuition assistance up to $10K annually',
      'Mission-led leadership development academies',
      'Technical credentialing and cyber range access'
    ],
    icon: 'mdi:school-outline'
  }
] as const

const mosMatches: Array<{ mosCode: string; strength: 'STRONG' | 'MEDIUM' | 'WEAK'; notes: string }> = [
  { mosCode: '25B', strength: 'STRONG', notes: 'IT Specialist roles across enterprise systems' },
  { mosCode: '35F', strength: 'STRONG', notes: 'Intelligence analyst positions in C5ISR' },
  { mosCode: '15T', strength: 'MEDIUM', notes: 'Aviation maintenance and sustainment' },
  { mosCode: '94F', strength: 'MEDIUM', notes: 'Computer/radar repair technicians' }
]

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost'

const callToActions = [
  {
    label: 'View All Lockheed Martin Roles',
    href: '/jobs?company=Lockheed+Martin',
    icon: 'mdi:briefcase-search',
    variant: 'default'
  },
  {
    label: 'Meet With a Talent Partner',
    href: '#',
    icon: 'mdi:calendar-account',
    variant: 'outline'
  }
] satisfies Array<{
  label: string
  href: string
  icon: string
  variant: ButtonVariant
}>
</script>

<template>
  <div class="min-h-screen bg-background pb-12">
    <!-- Header Background with Grid -->
    <div class="border-b border-border/50 bg-muted/5 relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-background via-background/0 to-background"></div>

      <div class="container mx-auto px-4 max-w-7xl py-8 relative z-10">
        <!-- Breadcrumbs -->
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
                <NuxtLink to="/companies">Companies</NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="font-bold">Lockheed Martin</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div class="space-y-4 max-w-3xl">
            <div class="flex flex-wrap items-center gap-3 mb-2">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-widest border border-primary/20">
                <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                Strategic Industry Partner
              </div>
            </div>

            <h1 class="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-mono">
              Lockheed Martin
            </h1>

            <p class="text-lg text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-6 py-1">
              From fifth-generation fighters to space domain awareness, Lockheed Martin accelerates integrated deterrence with veteran-led teams delivering decisive advantages for joint force commanders.
            </p>

            <div class="flex flex-wrap items-center gap-4 pt-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                <Icon name="mdi:map-marker-radius" class="w-4 h-4 text-primary" />
                <span class="font-medium">INDOPACOM • EUCOM • CENTCOM • NORTHCOM</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="domain in ['Aerospace', 'Defense', 'Space', 'Cyber']"
                  :key="domain"
                  variant="secondary"
                  class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-muted/50 border-border/50"
                >
                  {{ domain }}
                </Badge>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 pt-4">
              <Button
                v-for="cta in callToActions"
                :key="cta.label"
                :variant="cta.variant"
                as-child
              >
                <NuxtLink :to="cta.href" class="gap-2">
                  <Icon :name="cta.icon" class="w-4 h-4" />
                  {{ cta.label }}
                </NuxtLink>
              </Button>
            </div>
          </div>

          <div class="flex-shrink-0">
            <Button as-child size="lg" class="w-full md:w-auto">
              <NuxtLink
                to="https://www.lockheedmartin.com/careers"
                target="_blank"
                rel="noopener noreferrer"
                class="gap-2"
              >
                Visit Website
                <Icon name="mdi:open-in-new" class="w-4 h-4" />
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 max-w-7xl py-8 -mt-8 relative z-20">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Key Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="bg-background/80 backdrop-blur-md border border-border/50 p-4 space-y-2"
            >
              <div class="flex items-center gap-2 text-primary">
                <Icon :name="stat.icon" class="w-5 h-5" />
              </div>
              <p class="text-2xl font-bold font-mono">{{ stat.value }}</p>
              <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
            </div>
          </div>

          <!-- Mission Domains -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:radar" class="w-5 h-5 text-primary" />
                Mission Domains
              </h2>
              <span class="text-xs text-muted-foreground">Core Capabilities</span>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div
                v-for="focus in missionFocus"
                :key="focus.title"
                class="bg-background/80 backdrop-blur-md border border-border/50 p-4 space-y-3"
              >
                <div class="flex items-center gap-2 text-primary">
                  <Icon :name="focus.icon" class="w-5 h-5" />
                  <span class="text-[10px] font-mono uppercase tracking-widest">Core Discipline</span>
                </div>
                <h3 class="font-semibold">{{ focus.title }}</h3>
                <p class="text-sm text-muted-foreground leading-relaxed">{{ focus.description }}</p>
              </div>
            </div>
          </div>

          <!-- Capability Pillars -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:shield-check" class="w-5 h-5 text-primary" />
                Capability Pillars
              </h2>
              <span class="text-xs text-muted-foreground">Competitive Advantages</span>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div
                v-for="pillar in capabilityPillars"
                :key="pillar.title"
                class="bg-background/80 backdrop-blur-md border border-border/50 p-4 space-y-3"
              >
                <div class="flex items-center gap-2 text-primary">
                  <Icon :name="pillar.icon" class="w-5 h-5" />
                  <span class="text-[10px] font-mono uppercase tracking-widest">Advantage</span>
                </div>
                <h3 class="font-semibold">{{ pillar.title }}</h3>
                <ul class="space-y-2 text-sm text-muted-foreground">
                  <li
                    v-for="point in pillar.points"
                    :key="point"
                    class="flex items-start gap-2"
                  >
                    <Icon name="mdi:check-circle-outline" class="mt-0.5 w-4 h-4 text-primary flex-shrink-0" />
                    <span>{{ point }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Marquee Programs -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:rocket-launch-outline" class="w-5 h-5 text-primary" />
                Marquee Programs & Deployments
              </h2>
              <span class="text-xs text-muted-foreground">Priority Opportunities</span>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div
                v-for="program in marqueePrograms"
                :key="program.name"
                class="bg-background/80 backdrop-blur-md border border-border/50 p-4 space-y-3"
              >
                <div class="flex items-center gap-2 text-primary">
                  <Icon :name="program.icon" class="w-5 h-5" />
                  <span class="text-[10px] font-mono uppercase tracking-widest">Program Focus</span>
                </div>
                <h3 class="font-semibold">{{ program.name }}</h3>
                <p class="text-sm text-muted-foreground leading-relaxed">{{ program.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <Badge variant="ghost" class="text-[10px]">
                    <Icon name="mdi:earth" class="w-3 h-3 mr-1" />
                    {{ program.theater }}
                  </Badge>
                  <Badge variant="secondary" class="text-[10px]">
                    <Icon name="mdi:lock-check-outline" class="w-3 h-3 mr-1" />
                    {{ program.clearance }}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground">{{ program.focus }}</p>
              </div>
            </div>
          </div>

          <!-- Featured Roles -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:briefcase-outline" class="w-5 h-5 text-primary" />
                Featured Mission Roles
              </h2>
              <span class="text-xs text-muted-foreground">Sample Opportunities</span>
            </div>

            <div class="bg-background/80 backdrop-blur-md border border-border/50 divide-y divide-border/50">
              <div
                v-for="role in featuredRoles"
                :key="role.title"
                class="p-4 space-y-3"
              >
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-semibold">{{ role.title }}</h3>
                      <Badge variant="secondary" class="">Lockheed Martin</Badge>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span class="flex items-center gap-1">
                        <Icon name="mdi:map-marker" class="w-4 h-4" />
                        {{ role.location }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Icon name="mdi:shield-check" class="w-4 h-4" />
                        {{ role.clearance }}
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground leading-relaxed">{{ role.summary }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="tag in role.tags"
                      :key="tag"
                      variant="ghost"
                      class="text-[10px]"
                    >
                      {{ tag }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Talent Pathways & Benefits -->
          <div class="grid gap-8 md:grid-cols-2">
            <div class="space-y-4">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:medal" class="w-5 h-5 text-primary" />
                Veteran Talent Pathways
              </h2>
              <div class="space-y-3">
                <div
                  v-for="initiative in talentInitiatives"
                  :key="initiative.label"
                  class="bg-background/80 backdrop-blur-md border border-border/50 p-4 flex items-start gap-3"
                >
                  <div class="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                    <Icon :name="initiative.icon" class="w-5 h-5" />
                  </div>
                  <div class="space-y-1">
                    <h3 class="text-sm font-semibold">{{ initiative.label }}</h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">{{ initiative.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <Icon name="mdi:gift-outline" class="w-5 h-5 text-primary" />
                Total Rewards
              </h2>
              <div class="space-y-3">
                <div
                  v-for="benefit in benefits"
                  :key="benefit.title"
                  class="bg-background/80 backdrop-blur-md border border-border/50 p-4 space-y-3"
                >
                  <div class="flex items-center gap-2 text-primary">
                    <Icon :name="benefit.icon" class="w-5 h-5" />
                    <span class="text-[10px] font-mono uppercase tracking-widest">Support</span>
                  </div>
                  <h3 class="font-semibold">{{ benefit.title }}</h3>
                  <ul class="space-y-2 text-sm text-muted-foreground">
                    <li
                      v-for="item in benefit.items"
                      :key="item"
                      class="flex items-start gap-2"
                    >
                      <Icon name="mdi:checkbox-marked-circle-outline" class="mt-0.5 w-4 h-4 text-primary flex-shrink-0" />
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Closing CTA -->
          <div class="bg-background/80 backdrop-blur-md border border-border/50 p-6 space-y-4">
            <h2 class="text-xl font-semibold">Ready to deliver decisive advantage with Lockheed Martin?</h2>
            <p class="text-muted-foreground">
              Connect with mission-focused recruiters, explore cleared roles, and align your military experience with programs accelerating integrated deterrence.
            </p>
            <div class="flex flex-wrap gap-3">
              <Button
                v-for="cta in callToActions"
                :key="cta.label"
                :variant="cta.variant"
                as-child
              >
                <NuxtLink :to="cta.href" class="gap-2">
                  <Icon :name="cta.icon" class="w-4 h-4" />
                  {{ cta.label }}
                </NuxtLink>
              </Button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="lg:col-span-4 space-y-6">
          <div class="bg-background/80 backdrop-blur-md border border-border/50 overflow-hidden sticky top-4">
            <div class="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon name="mdi:shield-check" class="w-5 h-5 text-primary" />
              <h3 class="text-base font-semibold text-foreground">Veteran Profile</h3>
            </div>
            <div class="p-4 space-y-4">
              <div class="text-xs text-muted-foreground mb-2">
                Alignment with military backgrounds
              </div>

              <div class="space-y-3">
                <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Common MOS/AFSC Matches
                </p>
                <ul class="space-y-1">
                  <li
                    v-for="match in mosMatches"
                    :key="match.mosCode"
                    class="group p-2 hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                  >
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-bold text-primary bg-primary/10 px-1.5 py-0.5">
                          {{ match.mosCode }}
                        </span>
                        <Badge
                          variant="ghost"
                          class="text-[10px] h-5 px-1.5 font-medium"
                          :class="{
                            'border-green-500/30 text-green-600 bg-green-500/5': match.strength === 'STRONG',
                            'border-yellow-500/30 text-yellow-600 bg-yellow-500/5': match.strength === 'MEDIUM',
                            'border-muted text-muted-foreground': match.strength === 'WEAK'
                          }"
                        >
                          {{ match.strength }}
                        </Badge>
                      </div>
                      <NuxtLink
                        :to="`/search?q=${match.mosCode}`"
                        class="text-muted-foreground hover:text-primary transition-colors"
                        title="Search jobs for this MOS"
                      >
                        <Icon name="mdi:arrow-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </NuxtLink>
                    </div>
                    <p class="text-xs text-muted-foreground leading-relaxed pl-1">
                      {{ match.notes }}
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
