<!--
  @file Job apply CTA card
  @usage <JobApplyCard :job-id="jobId" :job-title="title" :company="company" :source-url="sourceUrl" />
-->

<script setup lang="ts">
defineProps<{
  jobId: string
  jobTitle: string
  company: string
  sourceUrl: string
}>()
</script>

<template>
  <Card class="hidden lg:block border-none overflow-hidden">
    <CardContent class="p-5">
      <div class="space-y-3">
        <Button size="lg" class="w-full font-bold tracking-wide" as-child>
          <NuxtLink :to="sourceUrl" target="_blank" rel="noopener noreferrer" class="gap-2">
            <Icon name="mdi:open-in-new" class="w-4 h-4" />
            Apply Directly
          </NuxtLink>
        </Button>
        <p class="text-xs text-center text-muted-foreground">
          {{ sourceUrl !== '#' ? `Opens ${company} careers portal` : 'Mock listing - live feed pending' }}
        </p>

        <Separator class="bg-border/30" />

        <div class="text-center">
          <p class="text-xs text-muted-foreground mb-2">Or let us represent you</p>
          <JobExpressInterest
            :job-id="jobId"
            :job-title="jobTitle"
            :company="company"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

