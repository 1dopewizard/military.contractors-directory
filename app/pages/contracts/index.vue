<!--
  @file Contract awards page
  @route /contracts
  @description Browse recent defense contract awards with MOS relevance indicators
-->

<script setup lang="ts">
const config = useRuntimeConfig()

// SEO
useHead({
  title: 'Contract Awards | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Browse recent defense contract awards and discover which military specialties are in demand for each contract.'
    }
  ]
})

// Contract type
interface ContractAward {
  id: string
  title: string
  contractor: string
  contractorSlug: string
  agency: string
  value: number
  awardDate: string
  domain: string
  location: string
  description: string
  relevantMos: Array<{
    code: string
    title: string
    branch: string
  }>
}

// Mock contract awards data
const contracts: ContractAward[] = [
  {
    id: '1',
    title: 'Enterprise Cybersecurity Operations Support',
    contractor: 'Booz Allen Hamilton',
    contractorSlug: 'booz-allen-hamilton',
    agency: 'Department of Defense',
    value: 450000000,
    awardDate: '2024-12-15',
    domain: 'Cybersecurity',
    location: 'Fort Meade, MD',
    description: 'Provide cybersecurity operations, threat analysis, and incident response support for DoD enterprise networks. Includes 24/7 SOC operations, vulnerability assessments, and security architecture consulting.',
    relevantMos: [
      { code: '17C', title: 'Cyber Operations Specialist', branch: 'Army' },
      { code: '25B', title: 'Information Technology Specialist', branch: 'Army' },
      { code: 'CTN', title: 'Cryptologic Technician Networks', branch: 'Navy' },
      { code: '1B4X1', title: 'Cyber Warfare Operations', branch: 'Air Force' },
    ]
  },
  {
    id: '2',
    title: 'CENTCOM Theater Intelligence Support',
    contractor: 'CACI International',
    contractorSlug: 'caci-international',
    agency: 'U.S. Central Command',
    value: 320000000,
    awardDate: '2024-12-10',
    domain: 'Intelligence',
    location: 'Tampa, FL / OCONUS',
    description: 'Intelligence analysis, collection management, and all-source fusion support for CENTCOM operations. Forward deployed positions available with premium compensation packages.',
    relevantMos: [
      { code: '35F', title: 'Intelligence Analyst', branch: 'Army' },
      { code: '35M', title: 'Human Intelligence Collector', branch: 'Army' },
      { code: 'IS', title: 'Intelligence Specialist', branch: 'Navy' },
      { code: '1N0X1', title: 'All Source Intelligence Analyst', branch: 'Air Force' },
    ]
  },
  {
    id: '3',
    title: 'Next Generation Logistics Information System',
    contractor: 'Leidos',
    contractorSlug: 'leidos',
    agency: 'Defense Logistics Agency',
    value: 275000000,
    awardDate: '2024-12-05',
    domain: 'Logistics & IT',
    location: 'Fort Belvoir, VA',
    description: 'Design, development, and sustainment of enterprise logistics management systems. Modernization of supply chain visibility tools and integration with joint service platforms.',
    relevantMos: [
      { code: '92A', title: 'Automated Logistical Specialist', branch: 'Army' },
      { code: '25B', title: 'Information Technology Specialist', branch: 'Army' },
      { code: 'LS', title: 'Logistics Specialist', branch: 'Navy' },
      { code: '2T0X1', title: 'Traffic Management', branch: 'Air Force' },
    ]
  },
  {
    id: '4',
    title: 'Satellite Communications Engineering Support',
    contractor: 'General Dynamics IT',
    contractorSlug: 'general-dynamics-it',
    agency: 'U.S. Space Force',
    value: 185000000,
    awardDate: '2024-11-28',
    domain: 'Communications',
    location: 'Colorado Springs, CO',
    description: 'Engineering and technical support for military satellite communications systems. Includes ground segment operations, link analysis, and spectrum management.',
    relevantMos: [
      { code: '25S', title: 'Satellite Communication Systems Operator', branch: 'Army' },
      { code: '5C0X1', title: 'Command & Control Battle Management', branch: 'Space Force' },
      { code: 'CTT', title: 'Cryptologic Technician Technical', branch: 'Navy' },
      { code: '1C6X1', title: 'Space Systems Operations', branch: 'Air Force' },
    ]
  },
  {
    id: '5',
    title: 'Special Operations Medical Training Program',
    contractor: 'KBR',
    contractorSlug: 'kbr',
    agency: 'U.S. Special Operations Command',
    value: 95000000,
    awardDate: '2024-11-20',
    domain: 'Medical & Training',
    location: 'Fort Bragg, NC',
    description: 'Advanced tactical combat casualty care training, medical simulation development, and curriculum management for SOF medical personnel. Includes live tissue training coordination.',
    relevantMos: [
      { code: '68W', title: 'Combat Medic Specialist', branch: 'Army' },
      { code: '18D', title: 'Special Forces Medical Sergeant', branch: 'Army' },
      { code: 'HM', title: 'Hospital Corpsman', branch: 'Navy' },
      { code: '4N0X1', title: 'Aerospace Medical Service', branch: 'Air Force' },
    ]
  },
  {
    id: '6',
    title: 'Joint All-Domain Command & Control Integration',
    contractor: 'Northrop Grumman',
    contractorSlug: 'northrop-grumman',
    agency: 'Joint Chiefs of Staff',
    value: 520000000,
    awardDate: '2024-11-15',
    domain: 'C4ISR',
    location: 'Multiple CONUS/OCONUS',
    description: 'Systems integration and software development for JADC2 initiative. Cross-domain solutions enabling seamless data sharing across Army, Navy, Air Force, and Space Force platforms.',
    relevantMos: [
      { code: '25N', title: 'Nodal Network Systems Operator', branch: 'Army' },
      { code: '17A', title: 'Cyber Operations Officer', branch: 'Army' },
      { code: 'IT', title: 'Information Systems Technician', branch: 'Navy' },
      { code: '3D0X2', title: 'Cyber Systems Operations', branch: 'Air Force' },
    ]
  }
]

// Format currency
const formatValue = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`
  }
  return `$${(value / 1000000).toFixed(0)}M`
}

// Format date
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Get branch slug for MOS directory link
const getBranchSlug = (branch: string): string => {
  const slugMap: Record<string, string> = {
    'Army': 'army',
    'Navy': 'navy',
    'Air Force': 'air-force',
    'Marine Corps': 'marines',
    'Coast Guard': 'coast-guard',
    'Space Force': 'space-force'
  }
  return slugMap[branch] || 'army'
}
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-8 pb-6">
      <!-- Breadcrumb -->
      <nav class="text-sm text-muted-foreground mb-8">
        <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-foreground">Contract Awards</span>
      </nav>

      <div class="max-w-2xl">
        <p class="text-xs font-mono uppercase tracking-widest text-primary mb-3">Market Intelligence</p>
        <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Recent Contract Awards
        </h1>
        <p class="text-lg text-muted-foreground leading-relaxed">
          Track major defense contract awards and discover which military specialties are in demand. Each contract shows relevant MOS codes to help you identify opportunities.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Contract List -->
        <div class="flex-1 min-w-0 max-w-3xl lg:pr-24">
          <div class="space-y-4">
            <Card 
              v-for="contract in contracts" 
              :key="contract.id"
              class="overflow-hidden hover:border-border/80 transition-colors"
            >
              <CardContent class="p-0">
                <!-- Contract Header -->
                <div class="p-4 pb-3">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex items-baseline gap-3 min-w-0">
                      <h3 class="text-base font-semibold text-foreground leading-snug">
                        {{ contract.title }}
                      </h3>
                      <span class="text-sm text-muted-foreground shrink-0">{{ contract.location }}</span>
                    </div>
                    <span class="text-lg font-bold font-mono text-primary shrink-0">
                      {{ formatValue(contract.value) }}
                    </span>
                  </div>
                  
                  <!-- Meta Row -->
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mb-3">
                    <NuxtLink 
                      :to="`/companies/${contract.contractorSlug}`"
                      class="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {{ contract.contractor }}
                    </NuxtLink>
                    <span class="text-muted-foreground/50">·</span>
                    <span class="text-muted-foreground">{{ contract.agency }}</span>
                  </div>

                  <!-- Badges -->
                  <div class="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="soft">{{ contract.domain }}</Badge>
                    <span class="text-xs text-muted-foreground ml-auto">
                      {{ formatDate(contract.awardDate) }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {{ contract.description }}
                  </p>
                </div>

                <!-- Relevant MOS Section -->
                <div class="border-t border-border/50 bg-muted/20 p-4">
                  <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                    Relevant Specialties
                  </span>
                  <div class="flex flex-wrap gap-2">
                    <NuxtLink
                      v-for="mos in contract.relevantMos"
                      :key="`${contract.id}-${mos.code}`"
                      :to="`${config.public.directoryUrl}/${getBranchSlug(mos.branch)}/${mos.code}`"
                      target="_blank"
                      class="group"
                    >
                      <Badge 
                        variant="outline" 
                        class="hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <span class="font-mono font-medium">{{ mos.code }}</span>
                        <span class="ml-1.5 text-muted-foreground group-hover:text-primary/80 hidden sm:inline">
                          {{ mos.branch }}
                        </span>
                      </Badge>
                    </NuxtLink>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- More Coming Soon -->
          <div class="mt-8 text-center py-8 border border-dashed border-border/50">
            <Icon name="mdi:bell-ring-outline" class="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground mb-2">
              Contract data updated weekly from federal procurement sources.
            </p>
            <p class="text-xs text-muted-foreground/60">
              Want notifications? Sign up for job alerts on any MOS page.
            </p>
          </div>
        </div>

        <!-- Right Column: Sidebar -->
        <SearchSidebar />
      </div>
    </div>
  </div>
</template>

