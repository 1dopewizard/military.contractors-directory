<!--
  @file Specialty browse page
  @route /companies/specialty/[slug]
  @description Lists contractors in a specific specialty area
-->

<script setup lang="ts">
interface SpecialtyResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  contractorCount: number;
  contractors: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    defenseNewsRank: number | null;
    headquarters: string | null;
    employeeCount: number | null;
    logoUrl: string | null;
    isPrimary: boolean;
  }>;
  relatedSpecialties?: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
  }>;
}

const route = useRoute();

const slug = computed(() => route.params.slug as string);

const {
  data: specialty,
  pending: isLoading,
  error,
} = useFetch<SpecialtyResponse | null>(() => `/api/specialties/${slug.value}`, {
  lazy: true,
  watch: [slug],
});

// SEO
useHead(() => {
  if (!specialty.value) return {};
  return {
    title: `${specialty.value.name} Defense Contractors | military.contractors`,
    meta: [
      {
        name: "description",
        content: `Browse ${specialty.value.contractorCount} defense contractors specializing in ${specialty.value.name}. ${specialty.value.description || ""}`,
      },
    ],
  };
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="min-h-full">
      <SearchablePageHeader>
        <template #filters>
          <div class="h-7" />
        </template>
      </SearchablePageHeader>
      <div
        class="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <LoadingText text="Loading contractors" />
      </div>
    </div>

    <!-- Error/Not Found State -->
    <div v-else-if="error || !specialty" class="min-h-full">
      <SearchablePageHeader />
      <div
        class="container mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
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
          <div class="flex justify-center gap-3">
            <Button as-child variant="default">
              <NuxtLink to="/companies">Browse All Contractors</NuxtLink>
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
            <NuxtLink
              to="/companies"
              class="text-muted-foreground hover:text-primary transition-colors"
            >
              Companies
            </NuxtLink>
            <Icon
              name="mdi:chevron-right"
              class="text-muted-foreground/50 h-4 w-4"
            />
            <span class="text-foreground truncate font-medium">{{
              specialty.name
            }}</span>
          </div>
        </template>
      </SearchablePageHeader>

      <!-- Main Content -->
      <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Hero Section -->
        <div class="mb-8">
          <h1 class="text-foreground mb-1 text-2xl font-bold md:text-3xl">
            {{ specialty.name }} Contractors
          </h1>
          <p class="text-muted-foreground mb-4">
            {{ specialty.contractorCount }} defense contractors
          </p>
          <div v-if="specialty.description" class="flex items-start gap-3">
            <Icon
              v-if="specialty.icon"
              :name="specialty.icon"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <Icon
              v-else
              name="mdi:tag-outline"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <p class="text-muted-foreground max-w-2xl">
              {{ specialty.description }}
            </p>
          </div>
        </div>

        <!-- Contractors List -->
        <div v-if="specialty.contractors?.length" class="space-y-2">
          <ContractorResultItem
            v-for="contractor in specialty.contractors"
            :key="contractor.id"
            :contractor="contractor"
          />
        </div>

        <!-- Related Specialties -->
        <div v-if="specialty.relatedSpecialties?.length" class="mt-12">
          <h2 class="mb-4 text-lg font-semibold">Related Specialties</h2>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              v-for="related in specialty.relatedSpecialties"
              :key="related.id"
              :to="`/companies/specialty/${related.slug}`"
              class="bg-muted/50 hover:bg-muted flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
            >
              <Icon
                v-if="related.icon"
                :name="related.icon"
                class="text-primary h-4 w-4"
              />
              <span class="text-sm font-medium">{{ related.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
