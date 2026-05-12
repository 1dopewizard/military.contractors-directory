/**
 * @file GET /api/contractors/[slug]/intelligence
 * @description Cached contractor intelligence with stale-while-revalidate refresh behavior
 */

import {
  enqueueSnapshotProfileRefresh,
  getCachedSnapshotProfileIntelligence,
  getContractorDirectoryProfileBySlug,
  getContractorSnapshotBySlug,
  type CachedProfileIntelligence,
} from "@/server/utils/contractor-snapshot";
import {
  enqueueContractorIntelligenceRefresh,
  getCachedContractorIntelligence,
} from "@/server/utils/intelligence";
import { z } from "zod";

const querySchema = z.object({
  refresh: z.coerce.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const query = await getValidatedQuery(event, querySchema.parse);

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contractor slug is required",
    });
  }

  const directoryProfile = await getContractorDirectoryProfileBySlug(slug);
  const snapshot =
    directoryProfile?.snapshot ?? (await getContractorSnapshotBySlug(slug));

  if (snapshot) {
    const canonicalSlug = directoryProfile?.group.slug ?? snapshot.slug;
    const cached = await getCachedSnapshotProfileIntelligence(canonicalSlug);
    const refreshQueued = shouldRefresh(cached.status, query.refresh)
      ? enqueueSnapshotProfileRefresh(canonicalSlug, { forceRefresh: true })
      : false;

    return profileIntelligenceResponse(cached, refreshQueued);
  }

  const cached = await getCachedContractorIntelligence(slug);
  const refreshQueued = shouldRefresh(cached.status, query.refresh)
    ? enqueueContractorIntelligenceRefresh(slug, { forceRefresh: true })
    : false;

  return profileIntelligenceResponse(cached, refreshQueued);
});

function shouldRefresh(
  status: CachedProfileIntelligence["status"],
  refresh: boolean,
) {
  return refresh || status === "stale" || status === "unavailable";
}

function profileIntelligenceResponse(
  cached: CachedProfileIntelligence,
  refreshQueued: boolean,
) {
  const status =
    cached.status === "unavailable" && refreshQueued
      ? "refreshing"
      : cached.status;

  return {
    status,
    intelligence: cached.intelligence,
    refreshedAt: cached.refreshedAt,
    expiresAt: cached.expiresAt,
    refreshQueued,
    warnings: cached.warnings,
  };
}
