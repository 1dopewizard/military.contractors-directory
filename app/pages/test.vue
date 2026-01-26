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

    <!-- LoadingText Component -->
    <section class="space-y-4">
      <h2 class="text-xl font-semibold border-b pb-2">LoadingText</h2>
      
      <div class="space-y-6">
        <div>
          <p class="text-sm text-muted-foreground mb-2">Default:</p>
          <div class="border rounded-lg p-4">
            <LoadingText />
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">Custom text:</p>
          <div class="border rounded-lg p-4">
            <LoadingText text="Saving" />
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">In context:</p>
          <div class="border rounded-lg p-4">
            <p class="text-muted-foreground">
              <LoadingText text="Processing your request" />
            </p>
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">Contractor profile loading:</p>
          <div class="border rounded-lg">
            <div class="flex justify-center py-12">
              <LoadingText text="Loading contractor profile" />
            </div>
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">Contractors list loading:</p>
          <div class="border rounded-lg">
            <div class="flex justify-center py-12">
              <LoadingText text="Loading contractors" />
            </div>
          </div>
        </div>

        <div>
          <p class="text-sm text-muted-foreground mb-2">Activity log loading:</p>
          <div class="border rounded-lg">
            <div class="flex justify-center py-6">
              <LoadingText text="Loading activity" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
