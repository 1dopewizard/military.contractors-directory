/**
 * @file POST /api/profile-corrections
 * @description Submit authenticated profile correction requests without mutating source facts
 */

import { getDb, schema } from "@/server/utils/db";
import { requireAuth } from "@/server/utils/better-auth";
import {
  profileCorrectionSchema,
  resolveProfileSubmissionTarget,
} from "@/server/utils/profile-submissions";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, profileCorrectionSchema.parse);
  const target = await resolveProfileSubmissionTarget(body.contractorSlug);
  const db = getDb();

  const [correction] = await db
    .insert(schema.profileCorrection)
    .values({
      contractorSlug: target.contractorSlug,
      contractorSnapshotId: target.contractorSnapshotId,
      contractorId: target.contractorId,
      submitterUserId: user.id,
      submitterEmail: user.email,
      targetField: body.targetField,
      explanation: body.explanation,
      evidenceUrl: body.evidenceUrl ?? null,
      status: "pending",
    })
    .returning();

  if (!correction) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create profile correction",
    });
  }

  return {
    correction: {
      id: correction.id,
      contractorSlug: correction.contractorSlug,
      targetField: correction.targetField,
      status: correction.status,
      createdAt: correction.createdAt.toISOString(),
    },
  };
});
