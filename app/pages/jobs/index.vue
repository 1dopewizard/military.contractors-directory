<!--
  @file Jobs index page (redirects to /search)
  @route /jobs
  @description Redirects to unified search page for consistent job discovery experience
-->

<script setup lang="ts">
// Redirect /jobs to /search (browse mode) for unified job discovery
// This preserves SEO and existing bookmarks while consolidating the UX

definePageMeta({
  middleware: () => {
    return navigateTo('/search', { redirectCode: 301 })
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-muted-foreground">Redirecting to job search...</p>
  </div>
</template>
