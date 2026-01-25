import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a job URL path using the job's slug
 * @param slug - The job's URL slug from the database
 * @returns Full path like "/jobs/senior-engineer-booz-allen-washington-dc"
 */
export function getJobUrl(slug: string): string {
  return `/jobs/${slug}`
}

/**
 * Format clearance level for display (TS_SCI → TS/SCI)
 * Database stores machine-friendly values with underscores; this converts to display format.
 * @param level - Clearance level from database (e.g., "TS_SCI", "TOP_SECRET")
 * @returns Display format (e.g., "TS/SCI", "TOP SECRET")
 */
export function formatClearance(level: string): string {
  return level.replace(/_/g, '/')
}
