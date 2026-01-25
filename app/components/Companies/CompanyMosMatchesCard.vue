<!--
  @file Company MOS matches card
  @usage <CompanyMosMatchesCard :matches="mosMatchesSorted" />
  @description Quick navigation sidebar card for MOS matches
-->

<script setup lang="ts">
interface MosMatch {
  mosCode: string
  mosTitle?: string
  branch?: string
  strength: 'WEAK' | 'MEDIUM' | 'STRONG'
  typicalClearance?: string | null
}

defineProps<{
  matches: MosMatch[]
}>()

/**
 * Get strength badge variant
 */
const getStrengthVariant = (strength: string): 'default' | 'secondary' | 'outline' => {
  switch (strength) {
    case 'STRONG': return 'default'
    case 'MEDIUM': return 'secondary'
    default: return 'outline'
  }
}
</script>

<template>
  <Card class="border-none bg-sidebar overflow-hidden">
    <CardContent class="p-0">
      <div class="p-4">
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
          Top MOS Matches
        </span>
        
        <div class="space-y-1">
          <NuxtLink
            v-for="match in matches.slice(0, 6)"
            :key="match.mosCode"
            :to="`/search?q=${match.mosCode}`"
            class="block py-2.5 hover:bg-muted/30 -mx-2 px-2 transition-colors group"
          >
            <!-- Top row: Branch logo + MOS code + title -->
            <div class="flex items-start gap-2 mb-1.5">
              <BranchLogo :branch="match.branch" size="xs" class="shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-primary group-hover:underline">
                    {{ match.mosCode }}
                  </span>
                  <span 
                    v-if="match.mosTitle" 
                    class="text-xs text-muted-foreground truncate"
                  >
                    {{ match.mosTitle }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Bottom row: Strength badge + clearance hint -->
            <div class="flex items-center justify-between pl-6">
              <Badge :variant="getStrengthVariant(match.strength)" class="text-[10px]">
                {{ match.strength }}
              </Badge>
              <span 
                v-if="match.typicalClearance" 
                class="text-[10px] text-muted-foreground"
              >
                {{ match.typicalClearance }}
              </span>
            </div>
          </NuxtLink>
        </div>
        
        <p v-if="matches.length > 6" class="text-[10px] text-muted-foreground pt-3 border-t border-border/30 mt-2">
          + {{ matches.length - 6 }} more matches
        </p>
      </div>
    </CardContent>
  </Card>
</template>
