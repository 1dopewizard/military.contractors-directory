/**
 * @file Public intelligence UI helpers
 * @description Formatting and label helpers shared by source-backed intelligence pages
 */

import type { SourceMetadata } from "@/app/types/intelligence.types";

export const emptySourceMetadata = (): SourceMetadata => ({
  sources: [],
  generatedAt: "",
  refreshedAt: null,
  expiresAt: null,
  freshness: "",
  cacheStatus: "live",
  structuredRecords: 0,
  filters: [],
  warnings: [],
});

export const formatIntelligenceMoney = (
  value: number | null | undefined,
): string => {
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

export const formatIntelligencePercent = (
  value: number | null | undefined,
): string => {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
};

export const formatDirectoryRevenue = (
  revenue: number | null | undefined,
): string => {
  if (revenue == null) return "N/A";
  if (revenue >= 1) return `$${revenue.toFixed(1)}B`;
  return `$${(revenue * 1000).toFixed(0)}M`;
};

export const formatIntelligenceCell = (
  value: string | number | null | undefined,
): string => {
  if (value == null || value === "") return "N/A";
  if (typeof value === "number") {
    return Math.abs(value) > 100000
      ? formatIntelligenceMoney(value)
      : value.toLocaleString();
  }
  return value;
};

export const humanizeIntelligenceKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const sourceMetadataSummary = (
  metadata: SourceMetadata | null | undefined,
): string => {
  if (!metadata) return "Source metadata unavailable.";

  const records = `${metadata.structuredRecords.toLocaleString()} structured records`;
  return metadata.freshness ? `${records}. ${metadata.freshness}` : records;
};

export const isSourceMetadataWarning = (
  metadata: SourceMetadata | null | undefined,
): boolean =>
  !!metadata &&
  (metadata.cacheStatus === "cached" ||
    metadata.cacheStatus === "stale" ||
    metadata.cacheStatus === "error" ||
    (metadata.warnings?.length ?? 0) > 0);

export interface DirectoryMetricItem {
  label: string;
  value: string | number;
  detail?: string | null;
}

export const metricsFromMetadata = (
  metadata: SourceMetadata | null | undefined,
  windowLabel?: string | null,
): DirectoryMetricItem[] => {
  const warning = isSourceMetadataWarning(metadata);
  return [
    {
      label: "Source",
      value: metadata?.sources?.[0]?.label ?? "USAspending.gov",
    },
    {
      label: "Freshness",
      value: sourceMetadataSummary(metadata),
    },
    {
      label: "Window",
      value: windowLabel || "Current public award extract",
    },
    {
      label: "Status",
      value: warning
        ? metadata?.warnings?.[0] || `Using ${metadata?.cacheStatus} data`
        : "Source-backed records",
    },
  ];
};
