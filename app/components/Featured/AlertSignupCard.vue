<!--
  @file Alert signup card for sidebar
  @usage <AlertSignupCard />
  @description Compact CTA for job alert signup in search sidebar
-->

<script setup lang="ts">
import { toast } from 'vue-sonner'

const email = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)

const handleSubmit = async () => {
  if (!email.value || isLoading.value) return
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    toast.error('Please enter a valid email address')
    return
  }
  
  isLoading.value = true
  
  try {
    await $fetch('/api/alerts/subscribe', {
      method: 'POST',
      body: { email: email.value }
    })
    
    isSubmitted.value = true
    toast.success('Subscribed!', {
      description: 'You\'ll receive job alerts matching your interests.'
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to subscribe'
    toast.error('Subscription failed', { description: message })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Label -->
    <div class="flex items-center gap-1.5 mb-2">
      <span class="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Job Alerts</span>
    </div>
    
    <Card class="overflow-hidden">
      <CardContent class="p-4">
        <!-- Success state -->
        <div v-if="isSubmitted" class="text-center py-2">
          <Icon name="mdi:check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p class="text-sm font-medium text-foreground">You're subscribed!</p>
          <p class="text-xs text-muted-foreground mt-1">Check your inbox for confirmation.</p>
        </div>
        
        <!-- Form -->
        <template v-else>
          <div class="flex items-center gap-2 mb-3">
            <Icon name="mdi:bell-ring" class="w-5 h-5 text-primary" />
            <h4 class="text-sm font-semibold text-foreground">Get Job Alerts</h4>
          </div>
          
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
            New cleared jobs matching your MOS, delivered weekly.
          </p>
          
          <form @submit.prevent="handleSubmit" class="space-y-2">
            <Input 
              v-model="email"
              type="email" 
              placeholder="your@email.com"
              class="h-9 text-sm"
              :disabled="isLoading"
            />
            <Button 
              type="submit" 
              size="sm" 
              class="w-full"
              :disabled="!email || isLoading"
            >
              <Spinner v-if="isLoading" class="w-3 h-3 mr-1.5" />
              Subscribe
            </Button>
          </form>
          
          <p class="text-[9px] text-muted-foreground/60 text-center mt-2">
            Unsubscribe anytime. No spam.
          </p>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
