<!--
  @file Homepage - Community Intel Platform
  @description Primary landing page featuring community value prop, recent activity, and featured listings
  @usage Landing page at /
-->

<script setup lang="ts">
definePageMeta({
  layout: 'homepage'
})

useHead({
  title: 'Salary Intel & Interview Reports for Cleared Professionals | military.contractors',
  meta: [
    {
      name: 'description',
      content: 'Real salary data and interview experiences shared by veterans. Discover what defense contractors pay by MOS, clearance, and location. From veterans, for veterans.'
    },
    {
      name: 'keywords',
      content: 'defense contractor salary, cleared jobs salary, TS/SCI salary, veteran salary data, contractor interview process, military transition salary, security clearance pay, defense industry compensation'
    }
  ]
})

// Schema.org structured data
useWebSiteSchema()
useWebPageSchema({
  name: 'Salary Intel & Interview Reports for Cleared Professionals',
  description: 'Real salary data and interview experiences shared by veterans at defense contractors. Community-powered career intelligence.'
})
</script>

<template>
  <div class="min-h-full">
    <!-- Hero Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-[clamp(1.5rem,6vh,3rem)] pb-6">
      <CommunityHero />
    </section>

    <!-- Recent Activity Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-3xl mx-auto">
        <RecentActivityFeed :limit="5" />
      </div>
    </section>

    <!-- Featured Listings Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border/30">
      <div class="max-w-4xl mx-auto">
        <FeaturedListings />
      </div>
    </section>
  </div>
</template>
