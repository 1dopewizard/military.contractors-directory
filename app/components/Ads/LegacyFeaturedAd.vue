<!--
  @file Legacy featured advertisement component (Company Spotlight, deprecated)
  @deprecated Self-service ads replaced by employer intake flow
  @usage <LegacyFeaturedAd /> or <LegacyFeaturedAd :ad="adData" :is-preview="true" />
  @description DEPRECATED - Native-looking featured ad placement.
               The self-service featured ads system has been replaced by
               the employer job intake flow with AI-powered approval.
               New code should use Featured/FeaturedJobCard.vue instead.
-->

<script setup lang="ts">
import type { FeaturedAd } from '@/app/types/ad.types'

const props = defineProps<{
  ad?: Partial<FeaturedAd>
  isPreview?: boolean
}>()

const logger = useLogger('LegacyFeaturedAd')
const { fetchRandomFeaturedAd, recordAdImpression, recordAdClick } = useAds()

// Fetch ad from Supabase (skip in preview mode)
const fetchedAd = ref<FeaturedAd | null>(null)
const isLoading = ref(!props.ad)

// Use prop ad or fetched ad
const currentAd = computed(() => props.ad || fetchedAd.value)

onMounted(async () => {
  // Skip fetch in preview mode
  if (props.isPreview || props.ad) {
    isLoading.value = false
    return
  }

  const { data, error } = await fetchRandomFeaturedAd()
  
  if (error) {
    logger.error({ error }, 'Failed to fetch featured ad')
  }
  
  if (data) {
    fetchedAd.value = data
    logger.debug({ adId: data.id }, 'Featured ad impression')
    // Record impression (non-blocking)
    recordAdImpression(data.id)
  }
  
  isLoading.value = false
})

// Track click (skip in preview mode)
const handleClick = (e: Event) => {
  if (props.isPreview) {
    e.preventDefault()
    return
  }
  if (!currentAd.value?.id) return
  logger.info({ adId: currentAd.value.id, advertiser: currentAd.value.advertiser }, 'Featured ad click')
  recordAdClick(currentAd.value.id)
}
</script>

<template>
  <div v-if="isPreview || currentAd">
    <!-- Featured label -->
    <div class="flex items-center gap-1.5 mb-2">
      <span class="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Featured</span>
    </div>
    
    <Card class="border-primary/80 overflow-hidden">
      <!-- Card link (entire card clickable) -->
      <a 
        v-if="currentAd"
        :href="currentAd.cta_url"
        target="_blank"
        rel="noopener"
        class="block p-4 hover:bg-primary/[0.02] transition-colors group"
        @click="handleClick"
      >
        <!-- Advertiser name (mirrors job title) -->
        <h4 class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
          {{ currentAd.advertiser }}
        </h4>
        
        <!-- Tagline (mirrors company) -->
        <p class="text-xs font-medium text-muted-foreground mb-2">
          {{ currentAd.tagline }}
        </p>
        
        <!-- Description (mirrors pitch, allow 2-3 lines) -->
        <p class="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
          {{ currentAd.description }}
        </p>
        
        <!-- Industry badges (mirrors job card badges) -->
        <div v-if="currentAd.industries?.length" class="flex flex-wrap items-center gap-2 mb-3">
          <Badge 
            v-for="industry in currentAd.industries.slice(0, 3)" 
            :key="industry" 
            variant="soft"
          >
            {{ industry }}
          </Badge>
        </div>
        
        <!-- CTA (mirrors salary + apply) -->
        <div class="flex items-center justify-end">
          <span class="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
            {{ currentAd.cta_text }}
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" />
          </span>
        </div>
      </a>
    </Card>
    
    <!-- Fine print -->
    <p class="text-[9px] text-muted-foreground/50 text-center mt-2">
      <NuxtLink to="/employers" class="underline hover:text-muted-foreground">Post a job</NuxtLink>
    </p>
  </div>
</template>

