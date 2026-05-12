/**
 * @file Profile submission utilities
 * @description Validation and target resolution for profile claims and corrections
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getContractorSnapshotBySlug } from "@/server/utils/contractor-snapshot";
import { getDb, schema } from "@/server/utils/db";

export const profileClaimSchema = z.object({
  contractorSlug: z.string().trim().min(1).max(160),
  submitterName: z.string().trim().max(160).optional(),
  companyRole: z.string().trim().min(2).max(160).optional(),
  evidenceUrl: z.url().optional(),
  requestedContext: z.record(z.string(), z.unknown()).optional(),
});

export const profileCorrectionSchema = z.object({
  contractorSlug: z.string().trim().min(1).max(160),
  targetField: z.string().trim().min(2).max(120),
  explanation: z.string().trim().min(10).max(4000),
  evidenceUrl: z.url().optional(),
});

export type ProfileClaimInput = z.infer<typeof profileClaimSchema>;
export type ProfileCorrectionInput = z.infer<typeof profileCorrectionSchema>;

export interface ProfileSubmissionTarget {
  contractorSlug: string;
  contractorSnapshotId: string | null;
  contractorId: string | null;
}

export function normalizeSubmissionSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export async function resolveProfileSubmissionTarget(
  slug: string,
): Promise<ProfileSubmissionTarget> {
  const normalizedSlug = normalizeSubmissionSlug(slug);
  const snapshot = await getContractorSnapshotBySlug(normalizedSlug);
  if (snapshot) {
    return {
      contractorSlug: snapshot.slug,
      contractorSnapshotId: snapshot.id,
      contractorId: null,
    };
  }

  const db = getDb();
  const [contractor] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.slug, normalizedSlug))
    .limit(1);

  if (!contractor) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown contractor slug: ${slug}`,
    });
  }

  return {
    contractorSlug: contractor.slug,
    contractorSnapshotId: null,
    contractorId: contractor.id,
  };
}
