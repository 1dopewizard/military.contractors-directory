<!--
  @file Unsubscribe confirmation page
  @route /unsubscribed
  @description Confirmation page shown after clicking unsubscribe link in email
-->

<script setup lang="ts">
const route = useRoute()

// Only allow access if redirected from unsubscribe API with success flag
const isValidAccess = computed(() => route.query.success === '1')

// Redirect to home if accessed directly without success flag
onMounted(() => {
  if (!isValidAccess.value) {
    navigateTo('/', { replace: true })
  }
})

useHead({
  title: 'Unsubscribed | military.contractors',
  meta: [
    {
      name: 'robots',
      content: 'noindex'
    }
  ]
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div v-if="isValidAccess" class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="mb-6">
        <Icon name="mdi:email-off-outline" class="w-16 h-16 text-muted-foreground mx-auto" />
      </div>
      
      <h1 class="text-2xl font-bold text-foreground mb-3">
        You've been unsubscribed
      </h1>
      
      <p class="text-muted-foreground mb-8">
        You will no longer receive job alert emails from military.contractors. 
        If this was a mistake, you can always subscribe again from any MOS page.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button as-child>
          <NuxtLink to="/">
            <Icon name="mdi:home" class="w-4 h-4 mr-2" />
            Back to Home
          </NuxtLink>
        </Button>
        
        <Button as-child variant="link">
          <NuxtLink to="/jobs">
            <Icon name="mdi:briefcase-search" class="w-4 h-4 mr-2" />
            Browse Jobs
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>


