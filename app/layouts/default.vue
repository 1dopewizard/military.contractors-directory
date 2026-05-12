<script setup lang="ts">
/**
 * @file Default layout for military.contractors
 * @usage Applied automatically to all pages unless overridden
 * @description Provides a simple layout with header navigation and color mode toggle
 */

const route = useRoute();

// Mobile menu state
const mobileMenuOpen = ref(false);

const currentYear = new Date().getFullYear();

// Close mobile menu when route changes
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  },
);
</script>

<template>
  <div class="flex h-screen flex-col overflow-x-hidden">
    <!-- Persistent Grid Background -->
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"
    />
    <div
      class="from-background via-background/0 to-background pointer-events-none fixed inset-0 z-0 bg-linear-to-b"
    />

    <!-- Top Header -->
    <header
      class="bg-background/80 z-50 w-full shrink-0 overflow-visible backdrop-blur-sm"
    >
      <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- Logo -->
        <NuxtLink to="/" class="flex shrink-0 items-center">
          <Badge
            variant="default"
            class="flex items-center justify-center px-2"
          >
            <span class="text-primary-foreground text-base font-semibold"
              >MC</span
            >
          </Badge>
          <span
            class="text-md text-primary ml-2 hidden font-semibold sm:inline"
          >
            military.contractors
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-6 lg:flex">
          <NuxtLink
            to="/rankings/top-defense-contractors"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            active-class="text-foreground"
          >
            Rankings
          </NuxtLink>
          <NuxtLink
            to="/agencies"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            active-class="text-foreground"
          >
            Agencies
          </NuxtLink>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Auth Button (Desktop) -->
          <div class="hidden lg:block">
            <AuthButton />
          </div>

          <!-- Mobile/Tablet Menu Button -->
          <Button
            variant="ghost"
            class="h-9 w-9 p-0 hover:bg-transparent lg:hidden"
            @click="mobileMenuOpen = true"
          >
            <Icon name="mdi:menu" class="h-5 w-5" />
            <span class="sr-only">Open menu</span>
          </Button>

          <ColorModeToggle />
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Sheet -->
    <Sheet v-model:open="mobileMenuOpen">
      <SheetContent side="top" class="max-h-[80vh] w-full overflow-y-auto">
        <SheetHeader class="text-left">
          <SheetTitle class="text-left">Navigation</SheetTitle>
        </SheetHeader>

        <!-- Mobile Nav Links -->
        <nav class="flex flex-col gap-3">
          <NuxtLink
            to="/rankings/top-defense-contractors"
            class="text-foreground hover:text-primary text-sm transition-colors"
          >
            Rankings
          </NuxtLink>
          <NuxtLink
            to="/agencies"
            class="text-foreground hover:text-primary text-sm transition-colors"
          >
            Agencies
          </NuxtLink>
        </nav>

        <div class="mt-4">
          <AuthButton />
        </div>
      </SheetContent>
    </Sheet>

    <!-- Main Content + Footer (scroll together) -->
    <main class="relative z-10 flex-1 overflow-auto">
      <div class="flex min-h-full flex-col">
        <!-- Page Content -->
        <div class="flex-1">
          <slot />
        </div>

        <!-- Footer (scrolls with content, pushed to bottom when short) -->
        <footer
          class="bg-background/80 shrink-0 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8"
        >
          <div
            class="text-muted-foreground flex flex-col items-center justify-between gap-2 text-xs sm:flex-row"
          >
            <p>© {{ currentYear }} military.contractors</p>
            <div class="flex items-center gap-4">
              <NuxtLink to="/about" class="hover:text-primary transition-colors"
                >About</NuxtLink
              >
              <NuxtLink
                to="/contact"
                class="hover:text-primary transition-colors"
                >Contact</NuxtLink
              >
              <NuxtLink
                to="/privacy"
                class="hover:text-primary transition-colors"
                >Privacy</NuxtLink
              >
              <NuxtLink to="/terms" class="hover:text-primary transition-colors"
                >Terms</NuxtLink
              >
            </div>
          </div>
        </footer>
      </div>
    </main>
  </div>
</template>
