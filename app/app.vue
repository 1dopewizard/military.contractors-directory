<script setup lang="ts">
import { Toaster } from 'vue-sonner'

// SEO metadata for global app shell
useHead({
    titleTemplate: (t?: string) => (t ? `${t} · military.contractors` : 'military.contractors'),
    meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#171A21' },
        { name: 'color-scheme', content: 'dark light' }
    ]
})
</script>

<template>
    <div class="bg-background min-h-screen text-foreground">
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <Toaster />
    </div>
</template>

<style>
/* Hide scrollbar while keeping scroll functionality */
/* Firefox */
html,
main {
    scrollbar-width: none;
}

/* Chrome, Safari, Edge */
html::-webkit-scrollbar,
main::-webkit-scrollbar {
    display: none;
}
</style>