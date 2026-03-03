<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>

<template>
  <div class="container mx-auto space-y-12 px-4 py-8">
    <h1 class="text-3xl font-bold">Component Test Page</h1>

    <!-- Loading Component -->
    <section class="space-y-4">
      <h2 class="border-b pb-2 text-xl font-semibold">Loading</h2>

      <div class="space-y-6">
        <div>
          <p class="text-muted-foreground mb-2 text-sm">Basic:</p>
          <div class="rounded-lg border">
            <Loading />
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">With text:</p>
          <div class="rounded-lg border">
            <Loading text="Loading data..." />
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">Custom size:</p>
          <div class="rounded-lg border">
            <Loading
              class="py-6"
              spinner-class="w-12 h-12"
              text="Large spinner"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- LoadingText Component -->
    <section class="space-y-4">
      <h2 class="border-b pb-2 text-xl font-semibold">LoadingText</h2>

      <div class="space-y-6">
        <div>
          <p class="text-muted-foreground mb-2 text-sm">Default:</p>
          <div class="rounded-lg border p-4">
            <LoadingText />
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">Custom text:</p>
          <div class="rounded-lg border p-4">
            <LoadingText text="Saving" />
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">In context:</p>
          <div class="rounded-lg border p-4">
            <p class="text-muted-foreground">
              <LoadingText text="Processing your request" />
            </p>
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">
            Contractor profile loading:
          </p>
          <div class="rounded-lg border">
            <div class="flex justify-center py-12">
              <LoadingText text="Loading contractor profile" />
            </div>
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">
            Contractors list loading:
          </p>
          <div class="rounded-lg border">
            <div class="flex justify-center py-12">
              <LoadingText text="Loading contractors" />
            </div>
          </div>
        </div>

        <div>
          <p class="text-muted-foreground mb-2 text-sm">
            Activity log loading:
          </p>
          <div class="rounded-lg border">
            <div class="flex justify-center py-6">
              <LoadingText text="Loading activity" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
