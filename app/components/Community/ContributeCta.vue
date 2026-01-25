<!--
  @file Community/ContributeCta.vue
  @description Call-to-action component prompting users to contribute salary/interview data
  @usage <ContributeCta variant="inline" />
-->

<script setup lang="ts">
interface Props {
  /** Display variant */
  variant?: 'card' | 'inline' | 'banner'
  /** Show compact version */
  compact?: boolean
  /** Hide if user has already contributed (requires auth check) */
  hideForContributors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'card',
  compact: false,
  hideForContributors: false,
})

const { isAuthenticated } = useAuth()

// Variant-based styling
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'banner':
      return {
        wrapper: 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary p-4 sm:p-6',
        title: 'text-lg font-semibold text-foreground',
        description: 'text-sm text-muted-foreground mt-1',
        actions: 'flex flex-wrap gap-2 mt-4',
      }
    case 'inline':
      return {
        wrapper: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border/50',
        title: 'text-base font-semibold text-foreground',
        description: 'text-sm text-muted-foreground',
        actions: 'flex flex-wrap gap-2 shrink-0',
      }
    default: // card
      return {
        wrapper: 'bg-card border border-border p-5 sm:p-6',
        title: 'text-lg font-semibold text-foreground',
        description: 'text-sm text-muted-foreground mt-1',
        actions: 'flex flex-wrap gap-2 mt-4',
      }
  }
})

// Compact adjusts content
const contentConfig = computed(() => {
  if (props.compact) {
    return {
      title: 'Share Your Intel',
      description: 'Help fellow veterans with salary and interview insights.',
      showIcons: false,
    }
  }
  return {
    title: 'Share Your Experience',
    description: 'Help fellow veterans make informed career decisions. Your anonymous salary and interview reports contribute to the community.',
    showIcons: true,
  }
})
</script>

<template>
  <div :class="variantClasses.wrapper">
    <div :class="{ 'flex-1': variant === 'inline' }">
      <div class="flex items-center gap-2">
        <Icon
          v-if="contentConfig.showIcons"
          name="mdi:hand-heart"
          class="w-5 h-5 text-primary shrink-0"
        />
        <h3 :class="variantClasses.title">
          {{ contentConfig.title }}
        </h3>
      </div>
      <p :class="variantClasses.description">
        {{ contentConfig.description }}
      </p>
    </div>

    <div :class="variantClasses.actions">
      <Button as-child>
        <NuxtLink to="/salaries/submit">
          <Icon name="mdi:currency-usd" class="w-4 h-4 mr-1.5" />
          Share Salary
        </NuxtLink>
      </Button>
      <Button variant="ghost" as-child>
        <NuxtLink to="/interviews/submit">
          <Icon name="mdi:message-plus" class="w-4 h-4 mr-1.5" />
          Share Interview
        </NuxtLink>
      </Button>
      <Button
        v-if="!isAuthenticated && !compact"
        variant="link"
        as-child
        class="text-muted-foreground"
      >
        <NuxtLink to="/auth/login">
          Sign in to track your contributions
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
