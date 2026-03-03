<!--
  @file Dev page with select navigation
  @description Development page with select dropdown for testing different components and features
-->

<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";

type DevView =
  | "scraped-jobs"
  | "logo-test"
  | "logo-listings"
  | "lockheed-company"
  | "job-details"
  | "chat-attachments"
  | "chat-attachments-append"
  | "chat-messages"
  | "chat-request"
  | "chat-tools"
  | "use-object";

interface NavItem {
  id: DevView;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

useHead({
  title: "Dev - Development Tools",
  meta: [
    {
      name: "description",
      content: "Development page for testing various components and features",
    },
  ],
});

const activeView = ref<DevView>("scraped-jobs");

const navGroups: NavGroup[] = [
  {
    title: "Components",
    items: [
      {
        id: "scraped-jobs",
        label: "Scraped Jobs",
        icon: "mdi:briefcase-search",
      },
      { id: "logo-test", label: "Logo Test", icon: "mdi:image-outline" },
      {
        id: "logo-listings",
        label: "Logo Listings",
        icon: "mdi:briefcase-outline",
      },
      {
        id: "lockheed-company",
        label: "Lockheed Martin Page",
        icon: "mdi:airplane",
      },
      {
        id: "job-details",
        label: "Job Details Page",
        icon: "mdi:file-document-outline",
      },
    ],
  },
  {
    title: "AI SDK Components",
    items: [
      {
        id: "chat-attachments",
        label: "Chat Attachments",
        icon: "mdi:attachment",
      },
      {
        id: "chat-attachments-append",
        label: "Chat Attachments Append",
        icon: "mdi:attachment-plus",
      },
      { id: "chat-messages", label: "Chat Messages", icon: "mdi:message-text" },
      { id: "chat-request", label: "Chat Request", icon: "mdi:send" },
      { id: "chat-tools", label: "Chat Tools", icon: "mdi:tools" },
      { id: "use-object", label: "Use Object", icon: "mdi:code-json" },
    ],
  },
];

const activeLabel = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === activeView.value);
    if (item) return item.label;
  }
  return "Select Component";
});
</script>

<template>
  <div class="bg-background pb-12">
    <PageHeader padding="py-8">
      <!-- Breadcrumbs -->
      <Breadcrumb class="mb-8">
        <BreadcrumbList class="font-mono text-xs tracking-wider uppercase">
          <BreadcrumbItem>
            <BreadcrumbLink as-child>
              <NuxtLink to="/">Home</NuxtLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage class="font-bold">Dev Tools</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <!-- Header Section -->
      <div class="max-w-3xl">
        <div
          class="bg-primary/5 text-primary border-primary/20 mb-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase"
        >
          <div class="bg-primary h-1.5 w-1.5 animate-pulse rounded-full"></div>
          Developer Portal
        </div>

        <h1
          class="text-foreground mb-4 font-mono text-3xl font-bold tracking-tight md:text-4xl"
        >
          COMPONENT PLAYGROUND
        </h1>

        <p class="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          Test and validate UI components, API integrations, and experimental
          features.
        </p>
      </div>
    </PageHeader>

    <div
      class="relative z-20 container mx-auto -mt-8 max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div class="space-y-6">
        <!-- Component Selector -->
        <div class="flex items-center gap-4">
          <label
            class="text-muted-foreground shrink-0 font-mono text-xs font-bold tracking-widest uppercase"
          >
            Component
          </label>
          <Select v-model="activeView">
            <SelectTrigger class="w-full max-w-sm">
              <SelectValue :placeholder="activeLabel" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup
                v-for="(group, index) in navGroups"
                :key="group.title"
              >
                <SelectLabel>{{ group.title }}</SelectLabel>
                <SelectItem
                  v-for="item in group.items"
                  :key="item.id"
                  :value="item.id"
                >
                  <div class="flex items-center gap-2">
                    <Icon :name="item.icon" class="h-4 w-4" />
                    <span>{{ item.label }}</span>
                  </div>
                </SelectItem>
                <SelectSeparator
                  v-if="index < navGroups.length - 1"
                  class="my-1"
                />
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- View Content -->
        <ScrapedJobs v-if="activeView === 'scraped-jobs'" />
        <LogoTest v-else-if="activeView === 'logo-test'" />
        <LogoListingsExperiment v-else-if="activeView === 'logo-listings'" />
        <LockheedMartinPage v-else-if="activeView === 'lockheed-company'" />
        <JobDetailsPage v-else-if="activeView === 'job-details'" />
        <ChatAttachments v-else-if="activeView === 'chat-attachments'" />
        <ChatAttachmentsAppend
          v-else-if="activeView === 'chat-attachments-append'"
        />
        <ChatMessages v-else-if="activeView === 'chat-messages'" />
        <ChatRequest v-else-if="activeView === 'chat-request'" />
        <ChatTools v-else-if="activeView === 'chat-tools'" />
        <UseObject v-else-if="activeView === 'use-object'" />
      </div>
    </div>
  </div>
</template>
