import { onMounted, ref } from "vue";

interface UseBrowserFiltersOptions {
  defaultSearch?: string;
  defaultPrimary?: string;
  defaultSecondary?: string;
  defaultView?: "grid" | "list";
}

export const useBrowserFilters = (options: UseBrowserFiltersOptions = {}) => {
  const searchQuery = ref(options.defaultSearch ?? "");
  const primaryFilter = ref(options.defaultPrimary ?? "");
  const secondaryFilter = ref(options.defaultSecondary ?? "");
  const viewMode = ref<"grid" | "list">(options.defaultView ?? "grid");
  const isReady = ref(false);

  const setPrimaryFilter = (value: string) => {
    primaryFilter.value = value;
  };

  const setSecondaryFilter = (value: string) => {
    secondaryFilter.value = value;
  };

  const clearSecondaryFilter = () => {
    secondaryFilter.value = options.defaultSecondary ?? "";
  };

  const setViewMode = (mode: "grid" | "list") => {
    viewMode.value = mode;
  };

  const resetFilters = () => {
    searchQuery.value = options.defaultSearch ?? "";
    primaryFilter.value = options.defaultPrimary ?? "";
    secondaryFilter.value = options.defaultSecondary ?? "";
  };

  onMounted(() => {
    isReady.value = true;
  });

  return {
    searchQuery,
    primaryFilter,
    secondaryFilter,
    viewMode,
    isReady,
    setPrimaryFilter,
    setSecondaryFilter,
    clearSecondaryFilter,
    setViewMode,
    resetFilters,
  };
};
