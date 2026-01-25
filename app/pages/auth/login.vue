<!--
  @file Full-page login
  @route /auth/login
  @description Dedicated login page with magic link auth and value props
-->

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Sign In | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Sign in to manage your featured ads and job listings.'
    }
  ]
})

const route = useRoute()
const { isAuthenticated } = useAuth()

// Redirect destination after login
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string
  return redirect || '/advertiser'
})

// If already authenticated, redirect
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    navigateTo(redirectTo.value)
  }
}, { immediate: true })

// Handle successful magic link send
const handleMagicLinkSent = () => {
  // Success state is handled by the MagicLinkForm component
}

// Value props for the right side
const benefits = [
  {
    icon: 'mdi:bullhorn-outline',
    title: 'Create & manage ads',
    description: 'Post featured jobs and partner spotlights to reach thousands of cleared veterans.'
  },
  {
    icon: 'mdi:chart-line',
    title: 'Track performance',
    description: 'Monitor impressions, clicks, and engagement metrics in real-time.'
  },
  {
    icon: 'mdi:clock-outline',
    title: 'Control your campaigns',
    description: 'Pause, resume, or modify your ads anytime from your dashboard.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Left Side - Login Form -->
    <div class="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo / Branding -->
        <NuxtLink to="/" class="flex items-center justify-center gap-2 mb-8">
          <Badge variant="default" class="flex justify-center items-center gap-1.5 px-2">
            <span class="font-semibold text-primary-foreground text-base">M</span>
            <div class="h-4 w-px bg-primary-foreground" />
            <span class="font-semibold text-primary-foreground text-base">C</span>
          </Badge>
          <span class="font-semibold text-lg text-foreground">military.contractors</span>
        </NuxtLink>

        <!-- Magic Link Form -->
        <MagicLinkForm @success="handleMagicLinkSent" />

        <!-- Back to home -->
        <p class="mt-6 text-center text-sm text-muted-foreground">
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            <Icon name="mdi:arrow-left" class="w-4 h-4 inline mr-1" />
            Back to home
          </NuxtLink>
        </p>
      </div>
    </div>

    <!-- Vertical Divider (visible on lg+) -->
    <div class="hidden lg:block w-px bg-border"></div>

    <!-- Right Side - Value Props (visible on lg+) -->
    <div class="hidden lg:flex flex-1 flex-col justify-center px-12 py-12 bg-muted/30">
      <div class="max-w-md mx-auto">
        <p class="text-xs font-mono uppercase tracking-widest text-primary mb-4">
          Advertiser Dashboard
        </p>
        <h2 class="text-2xl font-bold text-foreground mb-4 tracking-tight">
          Reach veterans ready for their next mission
        </h2>
        <p class="text-muted-foreground mb-8">
          Create featured content that appears alongside job searches — native, non-intrusive, and targeted to cleared professionals.
        </p>

        <!-- Benefits List -->
        <div class="space-y-6">
          <div 
            v-for="benefit in benefits" 
            :key="benefit.title"
            class="flex gap-4"
          >
            <div class="shrink-0 flex items-center justify-center">
              <Icon :name="benefit.icon" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-foreground text-sm">{{ benefit.title }}</h3>
              <p class="text-sm text-muted-foreground mt-0.5">{{ benefit.description }}</p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="mt-10 pt-8 border-t border-border/50 flex gap-8">
          <div>
            <p class="text-2xl font-bold font-mono text-foreground">4,000+</p>
            <p class="text-xs text-muted-foreground">MOSes indexed</p>
          </div>
          <div>
            <p class="text-2xl font-bold font-mono text-foreground">5</p>
            <p class="text-xs text-muted-foreground">branches</p>
          </div>
          <div>
            <p class="text-2xl font-bold font-mono text-foreground">$299</p>
            <p class="text-xs text-muted-foreground">starting price</p>
          </div>
        </div>

        <!-- Testimonial placeholder -->
        <div class="mt-8 p-4 bg-background border border-border/50 rounded">
          <p class="text-sm text-muted-foreground italic">
            "We filled 3 cleared positions in the first week. The targeting is incredibly precise."
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            — Talent Acquisition, Defense Contractor
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
