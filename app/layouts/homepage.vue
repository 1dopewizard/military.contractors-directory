<script setup lang="ts">
/**
 * @file Homepage layout - Defense Contractor Directory
 * @usage Apply to homepage with definePageMeta({ layout: 'homepage' })
 */

const route = useRoute()
const mobileMenuOpen = ref(false)

const currentYear = new Date().getFullYear()

// Navigation items - Defense Contractor Directory structure
const navItems = [
  { name: 'Contractors', icon: 'mdi:domain', route: '/contractors', active: computed(() => route.path.startsWith('/contractors')) },
  { name: 'Top 100', icon: 'mdi:trophy-outline', route: '/top-defense-contractors', active: computed(() => route.path === '/top-defense-contractors') }
]

watch(() => route.path, () => { 
    mobileMenuOpen.value = false 
})
</script>

<template>
  <div class="flex flex-col h-screen overflow-x-hidden">
    <!-- Persistent Grid Background -->
    <div class="z-0 fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
    <div class="z-0 fixed inset-0 bg-linear-to-b from-background via-background/0 to-background pointer-events-none" />


    <!-- Header -->
    <header class="z-50 bg-background/80 backdrop-blur-sm w-full overflow-visible shrink-0">
      <div class="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
        <NuxtLink to="/" class="flex items-center shrink-0">
          <Badge variant="default" class="flex justify-center items-center px-2">
            <span class="font-semibold text-primary-foreground text-base">MC</span>
          </Badge>
          <span class="hidden sm:inline ml-2 font-semibold text-md text-primary">
            military.contractors
          </span>
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-6">
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.name"
            :to="item.route"
            class="flex items-center gap-2 font-medium hover:text-primary text-sm whitespace-nowrap transition-colors"
            :class="item.active.value ? 'text-primary' : 'text-muted-foreground'"
          >
            <Icon :name="item.icon" class="size-4" />
            <span>{{ item.name }}</span>
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
          <Button variant="ghost" class="lg:hidden p-0 w-9 h-9 hover:bg-transparent" @click="mobileMenuOpen = true">
            <Icon name="mdi:menu" class="w-5 h-5" />
            <span class="sr-only">Open menu</span>
          </Button>
          <ColorModeToggle />
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Sheet -->
    <Sheet v-model:open="mobileMenuOpen">
      <SheetContent side="top" class="w-full max-h-[80vh] overflow-y-auto">
        <SheetHeader class="text-left">
          <SheetTitle class="text-left">Navigation</SheetTitle>
        </SheetHeader>
        
        <!-- Mobile Search -->
        <div class="mt-4 mb-6">
          <HeaderSearch />
        </div>
        
        <nav class="flex flex-col gap-4">
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.name"
            :to="item.route"
            class="flex items-center gap-3 hover:bg-muted px-3 py-3 rounded-md font-medium text-base transition-colors"
            :class="item.active.value ? 'text-primary bg-muted' : 'text-muted-foreground'"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </NuxtLink>
          
          <div class="mt-4 pt-4 border-border border-t">
            <AuthButton />
          </div>
        </nav>
      </SheetContent>
    </Sheet>

    <!-- Main Content (scrolls only when needed) -->
    <main class="z-10 relative flex-1 min-h-0 overflow-auto">
      <slot />
    </main>

    <!-- Compact Footer -->
    <footer class="z-10 relative bg-background/80 backdrop-blur-sm py-3 shrink-0">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex sm:flex-row flex-col justify-between items-center gap-2 text-muted-foreground text-xs">
          <p>© {{ currentYear }} military.contractors</p>
          <div class="flex items-center gap-4">
            <NuxtLink to="/for-companies" class="hover:text-primary transition-colors">For Companies</NuxtLink>
            <NuxtLink to="/about" class="hover:text-primary transition-colors">About</NuxtLink>
            <NuxtLink to="/privacy" class="hover:text-primary transition-colors">Privacy</NuxtLink>
            <NuxtLink to="/terms" class="hover:text-primary transition-colors">Terms</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

