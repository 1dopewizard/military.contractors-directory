<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 space-y-12">
    <h1 class="text-3xl font-bold">Component Test Page</h1>

    <!-- Loading Component -->
    <section class="space-y-4">
      <h2 class="text-xl font-semibold border-b pb-2">Loading</h2>
      
      <div class="space-y-6">
        <div>
          <p class="text-sm text-muted-foreground mb-2">Basic:</p>
          <div class="border rounded-lg">
            <Loading />
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">With text:</p>
          <div class="border rounded-lg">
            <Loading text="Loading data..." />
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">Custom size:</p>
          <div class="border rounded-lg">
            <Loading class="py-6" spinner-class="w-12 h-12" text="Large spinner" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
