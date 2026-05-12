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
  <main class="min-h-full">
    <div v-if="isLoading">
      <section class="border-border border-b">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span class="text-muted-foreground">Contractor directory</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-muted-foreground">Specialty filter</span>
          </div>
        </div>
      </section>
      <div class="flex justify-center py-12">
        <LoadingText text="Loading contractors" />
      </div>
    </div>

    <div v-else-if="error || !specialty">
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
          <Button as-child variant="default">
            <NuxtLink to="/">Browse All Contractors</NuxtLink>
          </Button>
        </Empty>
      </div>
    </div>

    <div v-else>
      <section class="border-border border-b">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] tracking-[0.18em] uppercase"
          >
            <span class="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
            <span class="text-muted-foreground">Contractor directory</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-muted-foreground">Specialty filter</span>
            <span class="text-muted-foreground/40 hidden sm:inline">/</span>
            <span class="text-foreground tabular-nums">
              {{ specialty.contractorCount.toLocaleString() }}
              {{
                specialty.contractorCount === 1 ? "contractor" : "contractors"
              }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h1
                class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                {{ specialty.name }} contractors
              </h1>
              <p
                v-if="specialty.description"
                class="text-muted-foreground mt-1 max-w-3xl text-sm"
              >
                {{ specialty.description }}
              </p>
            </div>
            <NuxtLink to="/">
              <Button variant="outline" size="sm">All contractors</Button>
            </NuxtLink>
          </div>
        </div>
      </section>

      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Recipients
          </h2>
          <div v-if="specialty.contractors?.length" class="mt-5 space-y-2">
            <ContractorResultItem
              v-for="contractor in specialty.contractors"
              :key="contractor.id"
              :contractor="contractor"
            />
          </div>
          <div v-else class="text-muted-foreground mt-5 text-sm">
            No contractors found in this specialty.
          </div>
        </section>

        <section
          v-if="specialty.relatedSpecialties?.length"
          class="border-border mt-12 border-t pt-10"
        >
          <h2
            class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
          >
            Related specialties
          </h2>
          <ul class="mt-5 flex flex-wrap gap-2">
            <li
              v-for="related in specialty.relatedSpecialties"
              :key="related.id"
            >
              <NuxtLink
                :to="`/companies/specialty/${related.slug}`"
                class="text-foreground/90 hover:text-primary inline-flex items-center gap-2 text-sm"
              >
                <Icon
                  v-if="related.icon"
                  :name="related.icon"
                  class="text-muted-foreground h-4 w-4"
                />
                {{ related.name }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>
