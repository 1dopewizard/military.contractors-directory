<!--
  @file Dashboard layout
  @description Dashboard layout for authenticated users with header and footer
-->

<script setup lang="ts">

const logger = useLogger('DashboardLayout')
const route = useRoute()

// Mobile menu state
const mobileMenuOpen = ref(false)

const currentYear = new Date().getFullYear()

// Close mobile menu when route changes
watch(() => route.path, () => {
    mobileMenuOpen.value = false
})

logger.info('Dashboard layout loaded')
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Persistent Grid Background -->
    <div class="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
    <div class="fixed inset-0 bg-gradient-to-b from-background via-background/0 to-background pointer-events-none z-0" />

    <!-- Main header -->
    <header class="shrink-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div class="flex h-16 items-center px-4 sm:px-6 lg:px-8 relative">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center shrink-0 z-10">
          <Badge variant="default" class="flex justify-center items-center px-2">
            <span class="font-semibold text-primary-foreground text-base">MC</span>
          </Badge>
          <span class="ml-2 font-semibold text-md text-primary hidden sm:inline">
            military.contractors
          </span>
        </NuxtLink>

        <!-- Right side actions -->
        <div class="flex items-center gap-2 sm:gap-4 ml-auto z-10">
          <!-- Auth Button (Desktop) -->
          <div class="hidden lg:block">
            <AuthButton />
          </div>

          <!-- Mobile/Tablet Menu Button -->
          <Button 
            variant="ghost" 
            class="lg:hidden h-9 w-9 p-0 hover:bg-transparent"
            @click="mobileMenuOpen = true"
          >
            <Icon name="mdi:menu" class="w-5 h-5" />
            <span class="sr-only">Open menu</span>
          </Button>

          <ColorModeToggle />
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Sheet -->
    <Sheet v-model:open="mobileMenuOpen">
      <SheetContent side="top" class="w-full">
        <SheetHeader class="text-left">
          <SheetTitle class="text-left">Navigation</SheetTitle>
        </SheetHeader>
        <div class="mt-6">
          <AuthButton />
        </div>
      </SheetContent>
    </Sheet>

    <!-- Main Content + Footer (scroll together) -->
    <main class="flex-1 overflow-auto relative z-10">
      <div class="flex flex-col min-h-full">
        <!-- Page Content -->
        <div class="flex-1">
          <slot />
        </div>

        <!-- Footer (scrolls with content, pushed to bottom when short) -->
        <footer class="shrink-0 bg-background/80 backdrop-blur-sm py-3">
          <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>© {{ currentYear }} military.contractors</p>
              <div class="flex items-center gap-4">
                <NuxtLink to="/about" class="hover:text-primary transition-colors">About</NuxtLink>
                <NuxtLink to="/contact" class="hover:text-primary transition-colors">Contact</NuxtLink>
                <NuxtLink to="/privacy" class="hover:text-primary transition-colors">Privacy</NuxtLink>
                <NuxtLink to="/terms" class="hover:text-primary transition-colors">Terms</NuxtLink>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
    
  </div>
</template>

