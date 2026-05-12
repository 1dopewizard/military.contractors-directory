<!--
  @file ContractorSnapshotTable
  @description Server-backed canonical contractor directory table
-->

<script setup lang="ts">
import {
  getCoreRowModel,
  useVueTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/vue-table";

interface ContractorSnapshotRow {
  id: string;
  slug: string;
  canonicalSlug: string;
  recipientName: string;
  recipientUei: string | null;
  recipientCode: string | null;
  totalObligations36m: number;
  awardCount36m: number;
  lastAwardDate: string | null;
  topAwardingAgency: string | null;
  topAwardingSubagency: string | null;
  topNaicsCode: string | null;
  topNaicsTitle: string | null;
  topPscCode: string | null;
  topPscTitle: string | null;
  sourceUrl: string;
  refreshedAt: string;
  aliasCount: number;
  alternateRecipientNames: string[];
}

interface SourceMetadata {
  refreshedAt: string | null;
  freshness: string;
  cacheStatus: "live" | "cached" | "stale" | "error";
  structuredRecords: number;
  warnings: string[];
}

interface ContractorSnapshotResponse {
  rows: ContractorSnapshotRow[];
  total: number;
  limit: number;
  offset: number;
  sourceMetadata: SourceMetadata;
}

const props = withDefaults(
  defineProps<{
    preview?: boolean;
    pageSize?: number;
    showFilters?: boolean;
    syncRoute?: boolean;
  }>(),
  {
    preview: false,
    pageSize: 25,
    showFilters: true,
    syncRoute: false,
  },
);

const route = useRoute();
const router = useRouter();

const initialPage = Number(route.query.page || 1);
const searchInput = ref(
  props.syncRoute ? ((route.query.q as string) ?? "") : "",
);
const q = ref(searchInput.value);
const agency = ref(
  props.syncRoute ? ((route.query.agency as string) ?? "") : "",
);
const naics = ref(props.syncRoute ? ((route.query.naics as string) ?? "") : "");
const psc = ref(props.syncRoute ? ((route.query.psc as string) ?? "") : "");
const sorting = ref<SortingState>([
  {
    id: (route.query.sort as string) || "totalObligations36m",
    desc: (route.query.order as string) !== "asc",
  },
]);
const pagination = ref<PaginationState>({
  pageIndex: Math.max(0, Number.isFinite(initialPage) ? initialPage - 1 : 0),
  pageSize: props.preview ? props.pageSize : props.pageSize,
});

const columns: ColumnDef<ContractorSnapshotRow>[] = [
  { accessorKey: "recipientName", header: "Contractor" },
  { accessorKey: "totalObligations36m", header: "Obligations" },
  { accessorKey: "awardCount36m", header: "Awards" },
  { accessorKey: "topAwardingSubagency", header: "Top Agency" },
  { accessorKey: "topNaicsCode", header: "NAICS" },
  { accessorKey: "topPscCode", header: "PSC" },
  { accessorKey: "lastAwardDate", header: "Last Award" },
];

const requestUrl = computed(() => {
  const params = new URLSearchParams();
  if (q.value) params.set("q", q.value);
  if (agency.value) params.set("agency", agency.value);
  if (naics.value) params.set("naics", naics.value);
  if (psc.value) params.set("psc", psc.value);
  const currentSort = sorting.value[0];
  params.set("sort", currentSort?.id || "totalObligations36m");
  params.set("order", currentSort?.desc === false ? "asc" : "desc");
  params.set("limit", String(pagination.value.pageSize));
  params.set(
    "offset",
    String(pagination.value.pageIndex * pagination.value.pageSize),
  );
  return `/api/contractors?${params.toString()}`;
});

const {
  data,
  pending,
  error,
  refresh: refreshRows,
} = useFetch<ContractorSnapshotResponse>(requestUrl, {
  lazy: true,
  default: (): ContractorSnapshotResponse => ({
    rows: [],
    total: 0,
    limit: pagination.value.pageSize,
    offset: 0,
    sourceMetadata: {
      refreshedAt: null,
      freshness: "",
      cacheStatus: "stale",
      structuredRecords: 0,
      warnings: [],
    },
  }),
});

const rows = computed(() => data.value?.rows ?? []);
const total = computed(() => data.value?.total ?? 0);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / pagination.value.pageSize)),
);
const hasFilters = computed(
  () => !!q.value || !!agency.value || !!naics.value || !!psc.value,
);
const firstRowNumber = computed(() =>
  total.value === 0
    ? 0
    : pagination.value.pageIndex * pagination.value.pageSize + 1,
);
const lastRowNumber = computed(() =>
  Math.min(
    total.value,
    (pagination.value.pageIndex + 1) * pagination.value.pageSize,
  ),
);

const table = useVueTable({
  get data() {
    return rows.value;
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  manualSorting: true,
  get pageCount() {
    return pageCount.value;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
});

const isActiveSort = (id: string) => sorting.value[0]?.id === id;
const activeSortDir = (id: string): "asc" | "desc" | null => {
  const current = sorting.value[0];
  if (current?.id !== id) return null;
  return current.desc ? "desc" : "asc";
};

const setSort = (id: string) => {
  const current = sorting.value[0];
  sorting.value = [
    {
      id,
      desc: current?.id === id ? !current.desc : id !== "recipientName",
    },
  ];
  pagination.value = { ...pagination.value, pageIndex: 0 };
  syncUrl();
};

const applyFilters = () => {
  q.value = searchInput.value.trim();
  pagination.value = { ...pagination.value, pageIndex: 0 };
  syncUrl();
};

const clearFilters = () => {
  searchInput.value = "";
  q.value = "";
  agency.value = "";
  naics.value = "";
  psc.value = "";
  pagination.value = { ...pagination.value, pageIndex: 0 };
  syncUrl();
};

const goToPage = (pageIndex: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: Math.min(Math.max(0, pageIndex), pageCount.value - 1),
  };
  syncUrl();
};

const navigateRow = (slug: string) => {
  router.push(`/${slug}`);
};

const syncUrl = () => {
  if (!props.syncRoute) return;
  const currentSort = sorting.value[0];
  const query: Record<string, string> = {};
  if (q.value) query.q = q.value;
  if (agency.value) query.agency = agency.value;
  if (naics.value) query.naics = naics.value;
  if (psc.value) query.psc = psc.value;
  if (currentSort?.id && currentSort.id !== "totalObligations36m") {
    query.sort = currentSort.id;
  }
  if (currentSort?.desc === false) query.order = "asc";
  if (pagination.value.pageIndex > 0) {
    query.page = String(pagination.value.pageIndex + 1);
  }
  router.replace({ query });
};

const formatMoney = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "N/A";
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 1_000_000_000) {
    return `${sign}$${(absolute / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}$${(absolute / 1_000_000).toFixed(0)}M`;
  }
  return `${sign}$${Math.round(absolute).toLocaleString()}`;
};

const formatDate = (value: string | null): string => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const sourceLabel = computed(() => {
  const metadata = data.value?.sourceMetadata;
  if (!metadata?.refreshedAt) return "No snapshot yet";
  return `Snapshot ${metadata.cacheStatus} · ${formatDate(metadata.refreshedAt)}`;
});
</script>

<template>
  <section class="space-y-4">
    <form
      v-if="showFilters && !preview"
      class="border-border bg-card grid gap-3 border p-3 lg:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(8rem,1fr))_auto]"
      @submit.prevent="applyFilters"
    >
      <Input
        v-model="searchInput"
        class="h-10 rounded-none"
        placeholder="Search contractor, alternate recipient, UEI, or code"
      />
      <Input v-model="agency" class="h-10 rounded-none" placeholder="Agency" />
      <Input v-model="naics" class="h-10 rounded-none" placeholder="NAICS" />
      <Input v-model="psc" class="h-10 rounded-none" placeholder="PSC" />
      <div class="flex gap-2">
        <Button type="submit" class="h-10">
          <Icon name="mdi:magnify" class="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button
          v-if="hasFilters"
          type="button"
          variant="outline"
          class="h-10"
          @click="clearFilters"
        >
          Clear
        </Button>
      </div>
    </form>

    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p
          class="text-muted-foreground text-[0.7rem] tracking-[0.16em] uppercase"
        >
          {{ sourceLabel }}
        </p>
        <p class="text-foreground mt-1 text-sm">
          <span class="font-medium tabular-nums">{{
            total.toLocaleString()
          }}</span>
          canonical active DoD contractors
        </p>
      </div>
      <div v-if="!preview" class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="pending"
          @click="refreshRows"
        >
          <Icon
            :name="pending ? 'mdi:loading' : 'mdi:refresh'"
            :class="['mr-2 h-4 w-4', { 'animate-spin': pending }]"
          />
          Reload
        </Button>
      </div>
    </div>

    <div class="bg-card overflow-hidden">
      <div v-if="pending" class="flex min-h-72 items-center justify-center">
        <LoadingText text="Loading contractor directory" />
      </div>

      <Empty v-else-if="error">
        <EmptyMedia variant="icon">
          <Icon name="mdi:alert-circle-outline" class="size-5" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>Directory Unavailable</EmptyTitle>
          <EmptyDescription>
            The contractor snapshot could not be loaded.
          </EmptyDescription>
        </EmptyContent>
        <Button variant="outline" size="sm" @click="refreshRows">
          Retry
        </Button>
      </Empty>

      <Empty v-else-if="rows.length === 0">
        <EmptyMedia variant="icon">
          <Icon name="mdi:database-off-outline" class="size-5" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>No Contractor Groups</EmptyTitle>
          <EmptyDescription>
            Run the USAspending recipient snapshot refresh to populate the
            canonical contractor directory.
          </EmptyDescription>
        </EmptyContent>
      </Empty>

      <Table v-else class="min-w-[960px] table-fixed">
        <colgroup>
          <col class="w-[28%]" />
          <col class="w-[11%]" />
          <col class="w-[8%]" />
          <col class="w-[22%]" />
          <col class="w-[9%]" />
          <col class="w-[9%]" />
          <col class="w-[13%]" />
        </colgroup>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead
              class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              <button
                type="button"
                class="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                :class="{ 'text-foreground': isActiveSort('recipientName') }"
                @click="setSort('recipientName')"
              >
                Contractor
                <Icon
                  v-if="activeSortDir('recipientName')"
                  :name="
                    activeSortDir('recipientName') === 'desc'
                      ? 'mdi:arrow-down'
                      : 'mdi:arrow-up'
                  "
                  class="h-3 w-3"
                />
              </button>
            </TableHead>
            <TableHead
              class="text-muted-foreground text-right text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              <button
                type="button"
                class="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                :class="{
                  'text-foreground': isActiveSort('totalObligations36m'),
                }"
                @click="setSort('totalObligations36m')"
              >
                Obligations
                <Icon
                  v-if="activeSortDir('totalObligations36m')"
                  :name="
                    activeSortDir('totalObligations36m') === 'desc'
                      ? 'mdi:arrow-down'
                      : 'mdi:arrow-up'
                  "
                  class="h-3 w-3"
                />
              </button>
            </TableHead>
            <TableHead
              class="text-muted-foreground text-right text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              <button
                type="button"
                class="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                :class="{ 'text-foreground': isActiveSort('awardCount36m') }"
                @click="setSort('awardCount36m')"
              >
                Awards
                <Icon
                  v-if="activeSortDir('awardCount36m')"
                  :name="
                    activeSortDir('awardCount36m') === 'desc'
                      ? 'mdi:arrow-down'
                      : 'mdi:arrow-up'
                  "
                  class="h-3 w-3"
                />
              </button>
            </TableHead>
            <TableHead
              class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              Top Agency
            </TableHead>
            <TableHead
              class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              NAICS
            </TableHead>
            <TableHead
              class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              PSC
            </TableHead>
            <TableHead
              class="text-muted-foreground text-[0.65rem] font-medium tracking-[0.16em] uppercase"
            >
              <button
                type="button"
                class="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                :class="{ 'text-foreground': isActiveSort('lastAwardDate') }"
                @click="setSort('lastAwardDate')"
              >
                Last Award
                <Icon
                  v-if="activeSortDir('lastAwardDate')"
                  :name="
                    activeSortDir('lastAwardDate') === 'desc'
                      ? 'mdi:arrow-down'
                      : 'mdi:arrow-up'
                  "
                  class="h-3 w-3"
                />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.original.id"
            class="cursor-pointer"
            tabindex="0"
            @click="navigateRow(row.original.slug)"
            @keydown.enter.prevent="navigateRow(row.original.slug)"
          >
            <TableCell class="align-top">
              <p class="text-foreground font-medium break-words">
                {{ row.original.recipientName }}
              </p>
              <p
                class="text-muted-foreground mt-1 truncate font-mono text-[11px]"
              >
                {{
                  row.original.recipientUei
                    ? `UEI ${row.original.recipientUei}`
                    : row.original.recipientCode || row.original.slug
                }}
              </p>
              <p
                v-if="row.original.aliasCount > 1"
                class="text-muted-foreground mt-1 text-[11px]"
              >
                {{ row.original.aliasCount.toLocaleString() }} USAspending
                recipient names
              </p>
            </TableCell>
            <TableCell class="text-right align-top font-medium tabular-nums">
              {{ formatMoney(row.original.totalObligations36m) }}
            </TableCell>
            <TableCell class="text-right align-top tabular-nums">
              {{ row.original.awardCount36m.toLocaleString() }}
            </TableCell>
            <TableCell class="align-top">
              <span class="line-clamp-2 break-words">
                {{
                  row.original.topAwardingSubagency ||
                  row.original.topAwardingAgency ||
                  "N/A"
                }}
              </span>
            </TableCell>
            <TableCell class="align-top">
              <span v-if="row.original.topNaicsCode" class="font-mono text-xs">
                {{ row.original.topNaicsCode }}
              </span>
              <span v-else class="text-muted-foreground">N/A</span>
            </TableCell>
            <TableCell class="align-top">
              <span v-if="row.original.topPscCode" class="font-mono text-xs">
                {{ row.original.topPscCode }}
              </span>
              <span v-else class="text-muted-foreground">N/A</span>
            </TableCell>
            <TableCell class="align-top text-sm">
              {{ formatDate(row.original.lastAwardDate) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div
      v-if="!preview"
      class="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-muted-foreground">
        Showing {{ firstRowNumber.toLocaleString() }}-{{
          lastRowNumber.toLocaleString()
        }}
        of {{ total.toLocaleString() }}
      </p>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="pagination.pageIndex === 0 || pending"
          @click="goToPage(0)"
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="pagination.pageIndex === 0 || pending"
          @click="goToPage(pagination.pageIndex - 1)"
        >
          <Icon name="mdi:chevron-left" class="h-4 w-4" />
          Previous
        </Button>
        <span class="text-muted-foreground px-2 text-xs tabular-nums">
          Page {{ pagination.pageIndex + 1 }} / {{ pageCount }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="pagination.pageIndex >= pageCount - 1 || pending"
          @click="goToPage(pagination.pageIndex + 1)"
        >
          Next
          <Icon name="mdi:chevron-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
</template>
