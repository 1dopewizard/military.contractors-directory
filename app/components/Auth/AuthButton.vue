<!--
  @file Authentication button component for header
  @usage <AuthButton />
  @description Displays sign in/sign out button with user dropdown menu
-->

<script setup lang="ts">
import { isAdminEmail } from '@/app/config/auth'

const logger = useLogger('AuthButton')
const route = useRoute()
const { isAuthenticated, isAuthReady, signOut, userEmail } = useAuth()
const { displayName, email } = useUserProfile()

// Check if user is admin
const isAdmin = computed(() => isAdminEmail(userEmail.value))

// Login URL with redirect back to current page
const loginUrl = computed(() => {
  const currentPath = route.fullPath
  // Don't redirect back to auth pages
  if (currentPath.startsWith('/auth/')) {
    return '/auth/login'
  }
  return `/auth/login?redirect=${encodeURIComponent(currentPath)}`
})

/**
 * Handle sign out
 */
const handleSignOut = async () => {
  logger.info('AuthButton: User signing out')
  const { success, error } = await signOut()
  
  if (success) {
    logger.info('AuthButton: Sign out successful')
    navigateTo('/')
  } else {
    logger.error({ err: error }, 'AuthButton: Sign out failed')
  }
}
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <!-- SSR placeholder - matches loading state dimensions -->
      <div class="w-[70px] h-8" />
    </template>
    
    <div>
      <!-- Loading state while auth initializes -->
      <div v-if="!isAuthReady" class="w-[70px] h-8" />

      <!-- User is authenticated -->
      <DropdownMenu v-else-if="isAuthenticated">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="gap-2 font-medium">
            <Icon name="mdi:account-circle" class="size-4 text-muted-foreground" />
            <span class="hidden sm:inline">{{ displayName }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <!-- User info header -->
          <DropdownMenuLabel class="font-normal py-3">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-foreground">{{ displayName }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ email }}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <!-- Navigation section -->
          <DropdownMenuGroup>
            <!-- Admin link (admin only) -->
            <DropdownMenuItem v-if="isAdmin" as-child>
              <NuxtLink to="/admin" class="flex items-center gap-2 cursor-pointer">
                <Icon name="mdi:shield-check" class="size-4 text-primary" />
                <span class="font-semibold text-primary">Admin Dashboard</span>
              </NuxtLink>
            </DropdownMenuItem>
            
            <!-- User dashboard links -->
            <DropdownMenuItem as-child>
              <NuxtLink to="/account" class="flex items-center gap-2 cursor-pointer">
                <Icon name="mdi:account-cog-outline" class="size-4 text-muted-foreground" />
                <span class="font-medium">My Account</span>
              </NuxtLink>
            </DropdownMenuItem>
            
            <DropdownMenuItem as-child>
              <NuxtLink to="/contractors" class="flex items-center gap-2 cursor-pointer">
                <Icon name="mdi:domain" class="size-4 text-muted-foreground" />
                <span class="font-medium">Browse Contractors</span>
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <!-- Sign out -->
          <DropdownMenuItem 
            @click="handleSignOut" 
            class="cursor-pointer text-muted-foreground hover:text-destructive focus:text-destructive"
          >
            <Icon name="mdi:logout" class="size-4 mr-2" />
            <span class="font-medium text-foreground">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Sign In button -->
    <Button v-else variant="ghost" class="hover:bg-transparent" size="sm" as-child>
        <NuxtLink :to="loginUrl">Sign In</NuxtLink>
      </Button>
    </div>
  </ClientOnly>
</template>
