<!--
  @file Specialty browse page
  @route /companies/specialty/[slug]
  @description Lists contractors in a specific specialty area
-->

<script setup lang="ts">
definePageMeta({
  layout: "homepage",
});

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
  <div class="min-h-full">
    <div
      class="container mx-auto w-full max-w-6xl px-4 pt-[clamp(2.5rem,7vh,4.5rem)] pb-16 sm:px-6 lg:px-10"
    >
      <div v-if="isLoading" class="flex justify-center py-12">
        <LoadingText text="Loading contractors" />
      </div>

      <div v-else-if="error || !specialty">
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
          <Button as-child variant="default">
            <NuxtLink to="/companies">Browse All Contractors</NuxtLink>
          </Button>
        </Empty>
      </div>

      <div v-else>
        <div
          class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.18em] uppercase"
        >
          <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          <span>Contractor directory</span>
          <span class="text-muted-foreground/40">/</span>
          <span>Specialty filter</span>
        </div>

        <h1
          class="text-foreground mt-6 max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
        >
          <span class="text-primary">{{ specialty.name }}</span>
          contractors.
        </h1>
        <p
          v-if="specialty.description"
          class="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg"
        >
          {{ specialty.description }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <span
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Active
          </span>
          <Badge variant="secondary" class="flex items-center gap-1">
            <Icon
              v-if="specialty.icon"
              :name="specialty.icon"
              class="h-3 w-3"
            />
            <Icon v-else name="mdi:tag-outline" class="h-3 w-3" />
            Specialty: {{ specialty.name }}
            <NuxtLink
              to="/companies"
              class="hover:text-destructive ml-1 transition-colors"
            >
              <Icon name="mdi:close" class="h-3 w-3" />
            </NuxtLink>
          </Badge>
        </div>

        <div class="mt-8">
          <div
            class="text-muted-foreground mb-3 flex items-center justify-between text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span>
              {{ specialty.contractorCount }}
              {{
                specialty.contractorCount === 1 ? "contractor" : "contractors"
              }}
            </span>
            <NuxtLink to="/companies" class="text-primary hover:underline">
              All contractors →
            </NuxtLink>
          </div>

          <div v-if="specialty.contractors?.length" class="space-y-2">
            <ContractorResultItem
              v-for="contractor in specialty.contractors"
              :key="contractor.id"
              :contractor="contractor"
            />
          </div>

          <div
            v-else
            class="border-border text-muted-foreground border p-8 text-center text-sm"
          >
            No contractors found in this specialty.
          </div>
        </div>

        <div
          v-if="specialty.relatedSpecialties?.length"
          class="border-border mt-12 border-t pt-8"
        >
          <h2
            class="text-foreground text-xs font-semibold tracking-[0.14em] uppercase"
          >
            Related specialties
          </h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              v-for="related in specialty.relatedSpecialties"
              :key="related.id"
              :to="`/companies/specialty/${related.slug}`"
              class="border-border text-foreground/90 hover:border-primary hover:text-foreground inline-flex items-center gap-2 border px-3 py-2 text-sm transition-colors"
            >
              <Icon
                v-if="related.icon"
                :name="related.icon"
                class="text-muted-foreground h-4 w-4"
              />
              {{ related.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
