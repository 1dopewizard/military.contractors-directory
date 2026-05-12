/**
 * @file POST /api/profile-claims
 * @description Submit authenticated contractor profile claim requests
 */

import { getDb, schema } from "@/server/utils/db";
import { requireAuth } from "@/server/utils/better-auth";
import {
  profileClaimSchema,
  resolveProfileSubmissionTarget,
} from "@/server/utils/profile-submissions";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, profileClaimSchema.parse);
  const target = await resolveProfileSubmissionTarget(body.contractorSlug);
  const db = getDb();

  const [claim] = await db
    .insert(schema.profileClaim)
    .values({
      contractorSlug: target.contractorSlug,
      contractorSnapshotId: target.contractorSnapshotId,
      contractorId: target.contractorId,
      submitterUserId: user.id,
      submitterEmail: user.email,
      submitterName: body.submitterName ?? user.name ?? null,
      companyRole: body.companyRole ?? null,
      evidenceUrl: body.evidenceUrl ?? null,
      requestedContext: body.requestedContext ?? null,
      status: "pending",
    })
    .returning();

  if (!claim) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create profile claim",
    });
  }

  return {
    claim: {
      id: claim.id,
      contractorSlug: claim.contractorSlug,
      status: claim.status,
      createdAt: claim.createdAt.toISOString(),
    },
  };
});
