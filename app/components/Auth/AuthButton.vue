<!--
  @file Authentication button component for header
  @usage <AuthButton />
  @description Displays sign in/sign out button with user dropdown menu
-->

<script setup lang="ts">
import { isAdminEmail } from "@/app/config/auth";

const logger = useLogger("AuthButton");
const route = useRoute();
const { isAuthenticated, isAuthReady, signOut, userEmail } = useAuth();

const email = computed(() => userEmail.value);
const displayName = computed(() => {
  const value = userEmail.value;
  return value ? value.split("@")[0] : "Admin";
});

// Check if user is admin
const isAdmin = computed(() => isAdminEmail(userEmail.value));

// Login URL with redirect back to current page
const loginUrl = computed(() => {
  const currentPath = route.fullPath;
  // Don't redirect back to auth pages
  if (currentPath.startsWith("/auth/")) {
    return "/auth/login";
  }
  return `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
});

/**
 * Handle sign out
 */
const handleSignOut = async () => {
  logger.info("AuthButton: User signing out");
  const { success, error } = await signOut();

  if (success) {
    logger.info("AuthButton: Sign out successful");
    navigateTo("/");
  } else {
    logger.error({ err: error }, "AuthButton: Sign out failed");
  }
};
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <!-- SSR placeholder - matches loading state dimensions -->
      <div class="h-8 w-[70px]" />
    </template>

    <div>
      <!-- Loading state while auth initializes -->
      <div v-if="!isAuthReady" class="h-8 w-[70px]" />

      <!-- User is authenticated -->
      <DropdownMenu v-else-if="isAuthenticated">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="gap-2 font-medium">
            <Icon
              name="mdi:account-circle"
              class="text-muted-foreground size-4"
            />
            <span class="hidden sm:inline">{{ displayName }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <!-- User info header -->
          <DropdownMenuLabel class="py-3 font-normal">
            <div class="flex flex-col gap-1">
              <p class="text-foreground text-sm font-semibold">
                {{ displayName }}
              </p>
              <p class="text-muted-foreground truncate text-xs">{{ email }}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <!-- Navigation section -->
          <DropdownMenuGroup>
            <!-- Admin link (admin only) -->
            <DropdownMenuItem v-if="isAdmin" as-child>
              <NuxtLink
                to="/admin"
                class="flex cursor-pointer items-center gap-2"
              >
                <Icon name="mdi:shield-check" class="text-primary size-4" />
                <span class="text-primary font-semibold">Admin Dashboard</span>
              </NuxtLink>
            </DropdownMenuItem>

            <DropdownMenuItem as-child>
              <NuxtLink
                to="/"
                class="flex cursor-pointer items-center gap-2"
              >
                <Icon name="mdi:domain" class="text-muted-foreground size-4" />
                <span class="font-medium">Browse Companies</span>
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <!-- Sign out -->
          <DropdownMenuItem
            @click="handleSignOut"
            class="text-muted-foreground hover:text-destructive focus:text-destructive cursor-pointer"
          >
            <Icon name="mdi:logout" class="mr-2 size-4" />
            <span class="text-foreground font-medium">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Sign In button -->
      <Button
        v-else
        variant="ghost"
        class="hover:bg-transparent"
        size="sm"
        as-child
      >
        <NuxtLink :to="loginUrl">Sign In</NuxtLink>
      </Button>
    </div>
  </ClientOnly>
</template>
