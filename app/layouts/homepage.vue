<script setup lang="ts">
/**
 * @file Homepage layout - Defense Contractor Directory
 * @usage Apply to homepage with definePageMeta({ layout: 'homepage' })
 */

const route = useRoute();
const mobileMenuOpen = ref(false);

const currentYear = new Date().getFullYear();

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  },
);
</script>

<template>
  <div class="mx-auto flex h-screen w-full max-w-screen-2xl flex-col overflow-x-hidden">
    <!-- Persistent Grid Background -->
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"
    />
    <div
      class="from-background via-background/0 to-background pointer-events-none fixed inset-0 z-0 bg-linear-to-b"
    />

    <!-- Header -->
    <header
      class="bg-background/80 z-50 w-full shrink-0 overflow-visible backdrop-blur-sm"
    >
      <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
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
            to="/"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Directory
          </NuxtLink>
          <NuxtLink
            to="/rankings/top-defense-contractors"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Rankings
          </NuxtLink>
          <NuxtLink
            to="/agencies"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Agencies
          </NuxtLink>
          <NuxtLink
            to="/explorer"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Explorer
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            About
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Header Search (hidden on mobile, shown on md+) -->
          <div class="hidden md:block">
            <HeaderSearch />
          </div>
          <div class="hidden lg:block">
            <AuthButton />
          </div>
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
      <SheetContent side="top" class="flex max-h-[80vh] w-full flex-col">
        <SheetHeader class="text-left">
          <SheetTitle class="text-left">Navigation</SheetTitle>
        </SheetHeader>

        <ScrollArea class="-mx-6 flex-1 px-6">
          <div class="py-2">
            <!-- Mobile Search -->
            <div class="mb-6">
              <HeaderSearch />
            </div>

            <nav class="flex flex-col gap-3">
              <NuxtLink
                to="/"
                class="text-foreground hover:text-primary text-sm transition-colors"
              >
                Directory
              </NuxtLink>
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
              <NuxtLink
                to="/explorer"
                class="text-foreground hover:text-primary text-sm transition-colors"
              >
                Explorer
              </NuxtLink>
              <NuxtLink
                to="/about"
                class="text-foreground hover:text-primary text-sm transition-colors"
              >
                About
              </NuxtLink>
            </nav>

            <div class="mt-4">
              <AuthButton />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <!-- Main Content (scrolls only when needed) -->
    <main class="relative z-10 min-h-0 flex-1 overflow-auto">
      <slot />
    </main>

    <!-- Compact Footer -->
    <footer
      class="bg-background/80 relative z-10 shrink-0 py-3 backdrop-blur-sm"
    >
      <div class="px-4 sm:px-6 lg:px-8">
        <div
          class="text-muted-foreground flex flex-col items-center justify-between gap-2 text-xs sm:flex-row"
        >
          <p>© {{ currentYear }} military.contractors</p>
          <div class="flex items-center gap-4">
            <NuxtLink to="/about" class="hover:text-primary transition-colors"
              >About</NuxtLink
            >
            <NuxtLink to="/contact" class="hover:text-primary transition-colors"
              >Contact</NuxtLink
            >
            <NuxtLink to="/privacy" class="hover:text-primary transition-colors"
              >Privacy</NuxtLink
            >
            <NuxtLink to="/terms" class="hover:text-primary transition-colors"
              >Terms</NuxtLink
            >
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
