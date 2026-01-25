<!--
  @file Specialty browse page
  @route /contractors/specialty/[slug]
  @description Lists contractors in a specific specialty area
-->

<script setup lang="ts">
const route = useRoute()

const slug = computed(() => route.params.slug as string)

const { data: specialty, pending: isLoading, error } = useFetch(() => `/api/specialties/${slug.value}`, {
  lazy: true,
  default: () => null,
  watch: [slug],
})

// SEO
useHead(() => {
  if (!specialty.value) return {}
  return {
    title: `${specialty.value.name} Defense Contractors | military.contractors`,
    meta: [
      {
        name: 'description',
        content: `Browse ${specialty.value.contractorCount} defense contractors specializing in ${specialty.value.name}. ${specialty.value.description || ''}`,
      },
    ],
  }
})

// Structured data for CollectionPage
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    name: `${specialty.value?.name} Defense Contractors`,
    description: specialty.value?.description || undefined,
  }),
])
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="min-h-full">
    <SearchablePageHeader>
      <template #filters>
        <div class="h-7" />
      </template>
    </SearchablePageHeader>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>
  </div>

  <!-- Error/Not Found State -->
  <div v-else-if="error || !specialty" class="min-h-full">
    <SearchablePageHeader />
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 flex items-center justify-center">
      <Empty>
        <EmptyMedia variant="icon">
          <Icon name="mdi:tag-off-outline" class="size-5" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>Specialty Not Found</EmptyTitle>
          <EmptyDescription>
            The specialty "{{ slug }}" could not be found.
          </EmptyDescription>
        </EmptyContent>
        <div class="flex gap-3 justify-center">
          <Button as-child variant="default">
            <NuxtLink to="/contractors">Browse All Contractors</NuxtLink>
          </Button>
        </div>
      </Empty>
    </div>
  </div>

  <!-- Specialty Page -->
  <div v-else class="min-h-full">
    <!-- Page Header -->
    <SearchablePageHeader>
      <template #filters>
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink to="/contractors" class="text-muted-foreground hover:text-primary transition-colors">
            Contractors
          </NuxtLink>
          <Icon name="mdi:chevron-right" class="w-4 h-4 text-muted-foreground/50" />
          <span class="text-foreground font-medium truncate">{{ specialty.name }}</span>
        </div>
      </template>
    </SearchablePageHeader>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <!-- Hero Section -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon v-if="specialty.icon" :name="specialty.icon" class="w-6 h-6 text-primary" />
            <Icon v-else name="mdi:tag-outline" class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-foreground">
              {{ specialty.name }} Contractors
            </h1>
            <p class="text-muted-foreground">
              {{ specialty.contractorCount }} defense contractors
            </p>
          </div>
        </div>
        <p v-if="specialty.description" class="text-muted-foreground max-w-2xl">
          {{ specialty.description }}
        </p>
      </div>

      <!-- Contractors Grid -->
      <div v-if="specialty.contractors?.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          v-for="contractor in specialty.contractors" 
          :key="contractor.id"
          class="p-4 hover:border-primary/30 transition-colors"
        >
          <NuxtLink :to="`/contractors/${contractor.slug}`" class="block">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                <img 
                  v-if="contractor.logoUrl" 
                  :src="contractor.logoUrl" 
                  :alt="contractor.name"
                  class="w-full h-full object-contain rounded"
                />
                <span v-else class="text-sm font-bold text-muted-foreground">
                  {{ contractor.name?.charAt(0) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="font-semibold truncate">{{ contractor.name }}</h2>
                  <Badge v-if="contractor.defenseNewsRank" variant="outline" class="shrink-0">
                    #{{ contractor.defenseNewsRank }}
                  </Badge>
                </div>
                <p v-if="contractor.headquarters" class="text-sm text-muted-foreground truncate">
                  {{ contractor.headquarters }}
                </p>
                <Badge v-if="contractor.isPrimary" variant="default" class="mt-2 text-xs">
                  Primary Focus
                </Badge>
              </div>
            </div>
          </NuxtLink>
        </Card>
      </div>

      <!-- Related Specialties -->
      <div v-if="specialty.relatedSpecialties?.length" class="mt-12">
        <h2 class="text-lg font-semibold mb-4">Related Specialties</h2>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            v-for="related in specialty.relatedSpecialties"
            :key="related.id"
            :to="`/contractors/specialty/${related.slug}`"
            class="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon v-if="related.icon" :name="related.icon" class="w-4 h-4 text-primary" />
            <span class="text-sm font-medium">{{ related.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
