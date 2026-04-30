/**
 * @file Contractor data composable (API-backed)
 * @description Provides contractor directory helpers backed by server API routes
 */

import type { Ref } from "vue";

export interface Contractor {
  id: string;
  slug: string;
  name: string;
  recipientName?: string;
  description?: string;
  defenseNewsRank?: number;
  headquarters?: string;
  founded?: number;
  employeeCount?: string;
  website?: string;
  linkedinUrl?: string;
  wikipediaUrl?: string;
  stockTicker?: string;
  isPublic?: boolean;
  totalRevenue?: number;
  defenseRevenue?: number;
  defenseRevenuePercent?: number;
  logoUrl?: string;
  totalObligations36m?: number;
  awardCount36m?: number;
  specialties?: Array<{
    id: string;
    slug: string;
    name: string;
    isPrimary: boolean;
  }>;
}

interface ContractorListResponse {
  rows?: Array<Contractor & { recipientName: string }>;
  contractors?: Array<Contractor & { recipientName?: string }>;
}

export interface ContractorFilters {
  searchQuery?: string;
  specialty?: string;
  sort?: "rank" | "revenue" | "name";
}

export interface UseContractorsReturn {
  allContractors: Ref<Contractor[]>;
  getAllContractors: () => Promise<Contractor[]>;
  getContractorById: (id: string) => Promise<Contractor | undefined>;
  getContractorBySlug: (slug: string) => Promise<Contractor | undefined>;
  searchContractors: (query: string, limit?: number) => Promise<Contractor[]>;
  filterContractors: (filters?: ContractorFilters) => Promise<Contractor[]>;
}

export const useContractors = (): UseContractorsReturn => {
  const logger = useLogger("useContractors");

  logger.info("useContractors composable initialized");

  // Shared state for all contractors (cached)
  const allContractors = useState<Contractor[]>("all-contractors", () => []);

  const getAllContractors = async (): Promise<Contractor[]> => {
    logger.debug("getAllContractors called");

    // Return cached if available
    if (allContractors.value.length > 0) {
      logger.debug(
        { count: allContractors.value.length },
        "Returning cached contractors",
      );
      return allContractors.value;
    }

    try {
      const data = await $fetch<ContractorListResponse>("/api/contractors", {
        query: { limit: 500 },
      });

      // Sort by name
      const contractors = normalizeContractorList(data).sort(
        (a: Contractor, b: Contractor) => a.name.localeCompare(b.name),
      );

      // Update state
      allContractors.value = contractors;

      logger.debug(
        { count: contractors.length },
        "Contractors fetched and cached",
      );
      return contractors;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "Failed to fetch contractors");
      return [];
    }
  };

  const getContractorById = async (
    id: string,
  ): Promise<Contractor | undefined> => {
    logger.debug({ id }, "getContractorById called");

    try {
      // Check cache first
      const cached = allContractors.value.find((c) => c.id === id);
      if (cached) {
        return cached;
      }

      // Fetch all contractors to find by ID
      const contractors = await getAllContractors();
      return contractors.find((c) => c.id === id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message, id }, "Failed to fetch contractor by ID");
      return undefined;
    }
  };

  const getContractorBySlug = async (
    slug: string,
  ): Promise<Contractor | undefined> => {
    logger.debug({ slug }, "getContractorBySlug called");

    try {
      const data = await $fetch<Contractor>(
        `/api/contractors/${slug.toLowerCase()}`,
      );

      if (!data) {
        logger.warn({ slug }, "Contractor not found for slug");
        return undefined;
      }

      return data;
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      if (err?.statusCode === 404) {
        logger.warn({ slug }, "Contractor not found for slug");
        return undefined;
      }

      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: message, slug },
        "Failed to fetch contractor by slug",
      );
      return undefined;
    }
  };

  const searchContractors = async (
    query: string,
    limit = 25,
  ): Promise<Contractor[]> => {
    const trimmed = query.trim();
    if (!trimmed) {
      logger.debug("searchContractors called with empty query, returning []");
      return [];
    }

    logger.debug({ query: trimmed, limit }, "Searching contractors");

    try {
      const data = await $fetch<ContractorListResponse>("/api/contractors", {
        query: { q: trimmed, limit },
      });
      const contractors = normalizeContractorList(data);

      logger.debug(
        { query: trimmed, resultCount: contractors.length },
        "searchContractors completed",
      );
      return contractors;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "Failed to search contractors");
      return [];
    }
  };

  const filterContractors = async (
    filters: ContractorFilters = {},
  ): Promise<Contractor[]> => {
    logger.debug({ filters }, "filterContractors called");

    const { searchQuery, specialty, sort } = filters;

    try {
      // Fetch contractors with optional search query
      let contractors: Contractor[];

      if (searchQuery && searchQuery.trim().length > 0) {
        contractors = await searchContractors(searchQuery, 500);
      } else {
        contractors = await getAllContractors();
      }

      // Apply client-side filter for specialty
      let filtered = contractors;

      if (specialty && specialty.trim().length > 0) {
        filtered = filtered.filter((c) =>
          c.specialties?.some(
            (s) => s.slug === specialty || s.name === specialty,
          ),
        );
      }

      // Sort
      if (sort === "rank") {
        filtered.sort(
          (a, b) => (a.defenseNewsRank || 999) - (b.defenseNewsRank || 999),
        );
      } else if (sort === "revenue") {
        filtered.sort(
          (a, b) => (b.defenseRevenue || 0) - (a.defenseRevenue || 0),
        );
      } else {
        // Default: sort alphabetically by name
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      logger.debug(
        { filters, resultCount: filtered.length },
        "filterContractors completed",
      );
      return filtered;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message, filters }, "Failed to filter contractors");
      return [];
    }
  };

  return {
    allContractors,
    getAllContractors,
    getContractorById,
    getContractorBySlug,
    searchContractors,
    filterContractors,
  };
};

function normalizeContractorList(
  data: ContractorListResponse | null | undefined,
): Contractor[] {
  const rows = data?.contractors ?? data?.rows ?? [];
  return rows.map((row) => ({
    ...row,
    name: row.name ?? row.recipientName,
  }));
}
