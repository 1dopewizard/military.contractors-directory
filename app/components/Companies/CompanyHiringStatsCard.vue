<!--
  @file Company hiring stats card
  @usage <CompanyHiringStatsCard :stats="company.stats" />
  @description Shows MOS match statistics for a company
-->

<script setup lang="ts">
interface CompanyStats {
  totalMosMatches: number
  strongMatches: number
  mediumMatches: number
  weakMatches: number
  clearanceLevels: string[]
  branches: string[]
}

defineProps<{
  stats: CompanyStats
}>()

/**
 * Abbreviate clearance levels for compact display
 */
const clearanceAbbrev = (level: string): string => {
  const abbrevMap: Record<string, string> = {
    'TS/SCI': 'TS/SCI',
    'TOP SECRET/SCI': 'TS/SCI',
    'TOP SECRET': 'TS',
    'SECRET': 'Secret',
    'PUBLIC TRUST': 'PT',
    'NONE': 'None'
  }
  return abbrevMap[level.toUpperCase()] || level
}

</script>

<template>
  <Card class="border-none bg-sidebar overflow-hidden">
    <CardContent class="p-0">
      <!-- Total MOS Matches -->
      <div class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
          MOS Coverage
        </span>
        <div class="flex items-center gap-3">
          <div class="text-2xl font-bold text-primary font-mono">{{ stats.totalMosMatches }}</div>
          <div class="text-xs text-muted-foreground">Military Specialties</div>
        </div>
      </div>
      
      <!-- Strength Breakdown -->
      <div class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
          Match Strength
        </span>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 bg-primary"></div>
              <span class="text-muted-foreground">Strong</span>
            </div>
            <span class="text-foreground font-medium font-mono">{{ stats.strongMatches }}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 bg-muted-foreground/50"></div>
              <span class="text-muted-foreground">Medium</span>
            </div>
            <span class="text-foreground font-medium font-mono">{{ stats.mediumMatches }}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 bg-muted-foreground/20 border border-muted-foreground/30"></div>
              <span class="text-muted-foreground">Weak</span>
            </div>
            <span class="text-foreground font-medium font-mono">{{ stats.weakMatches }}</span>
          </div>
        </div>
      </div>

      <!-- Clearance Levels -->
      <div v-if="stats.clearanceLevels?.length" class="p-4 border-b border-border/30">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
          Typical Clearances
        </span>
        <div class="flex flex-wrap gap-1.5">
          <Badge 
            v-for="level in stats.clearanceLevels.slice(0, 5)" 
            :key="level" 
            variant="soft"
            class="text-[10px]"
          >
            <Icon name="mdi:shield-check" class="w-3 h-3 mr-1" />
            {{ clearanceAbbrev(level) }}
          </Badge>
          <span 
            v-if="stats.clearanceLevels.length > 5" 
            class="text-[10px] text-muted-foreground self-center"
          >
            +{{ stats.clearanceLevels.length - 5 }}
          </span>
        </div>
      </div>

      <!-- Branches -->
      <div v-if="stats.branches?.length" class="p-4">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
          Military Branches
        </span>
        <div class="flex flex-wrap gap-1.5">
          <Badge 
            v-for="branch in stats.branches.slice(0, 6)" 
            :key="branch"
            variant="outline"
            class="text-[10px]"
          >
            <BranchLogo :branch="branch" size="xs" class="mr-1" />
            {{ branch }}
          </Badge>
          <span 
            v-if="stats.branches.length > 6" 
            class="text-[10px] text-muted-foreground self-center"
          >
            +{{ stats.branches.length - 6 }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
