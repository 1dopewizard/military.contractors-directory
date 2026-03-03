<!--
  @file AdminSearch.vue
  @description Command palette style search for admin dashboard
-->
<script setup lang="ts">
interface Props {
  open: boolean;
  tabs: { id: string; label: string; icon: string }[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "select-tab": [tabId: string];
}>();

const searchQuery = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

// Filter tabs based on search
const filteredTabs = computed(() => {
  if (!searchQuery.value) return props.tabs;
  const query = searchQuery.value.toLowerCase();
  return props.tabs.filter(
    (tab) =>
      tab.label.toLowerCase().includes(query) ||
      tab.id.toLowerCase().includes(query),
  );
});

// Quick actions
const quickActions = [
  { id: "refresh", label: "Refresh Data", icon: "mdi:refresh", shortcut: "R" },
  {
    id: "featured-listings",
    label: "Go to Featured Listings",
    icon: "mdi:star-outline",
    shortcut: "6",
  },
  { id: "pipeline", label: "Go to Pipeline", icon: "mdi:pipe", shortcut: "7" },
];

const filteredActions = computed(() => {
  if (!searchQuery.value) return quickActions;
  const query = searchQuery.value.toLowerCase();
  return quickActions.filter((action) =>
    action.label.toLowerCase().includes(query),
  );
});

const handleSelect = (tabId: string) => {
  emit("select-tab", tabId);
  emit("update:open", false);
  searchQuery.value = "";
};

const handleOpenChange = (value: boolean) => {
  emit("update:open", value);
  if (!value) {
    searchQuery.value = "";
  }
};

// Focus input when opened
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  },
);
</script>

<template>
  <CommandDialog :open="open" @update:open="handleOpenChange">
    <CommandInput
      ref="inputRef"
      v-model="searchQuery"
      placeholder="Search tabs, actions..."
    />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>

      <CommandGroup v-if="filteredTabs.length > 0" heading="Navigate">
        <CommandItem
          v-for="tab in filteredTabs"
          :key="tab.id"
          :value="tab.id"
          @select="handleSelect(tab.id)"
        >
          <Icon :name="tab.icon" class="mr-2 h-4 w-4" />
          <span>{{ tab.label }}</span>
        </CommandItem>
      </CommandGroup>

      <CommandSeparator
        v-if="filteredTabs.length > 0 && filteredActions.length > 0"
      />

      <CommandGroup v-if="filteredActions.length > 0" heading="Quick Actions">
        <CommandItem
          v-for="action in filteredActions"
          :key="action.id"
          :value="action.id"
          @select="handleSelect(action.id)"
        >
          <Icon :name="action.icon" class="mr-2 h-4 w-4" />
          <span>{{ action.label }}</span>
          <CommandShortcut>{{ action.shortcut }}</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
