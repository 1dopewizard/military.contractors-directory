/**
 * @file Approve/reject claim
 * @route PATCH /api/admin/claims/[id]
 * @description Admin action to approve or reject a claim request
 */

import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/server/utils/better-auth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);
  const db = getDb();
  const claimId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!claimId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Claim ID is required",
    });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
    });
  }

  // Get the claim
  const [claim] = await db
    .select()
    .from(schema.claimedProfile)
    .where(eq(schema.claimedProfile.id, claimId))
    .limit(1);

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: "Claim not found",
    });
  }

  if (claim.status !== "pending") {
    throw createError({
      statusCode: 400,
      statusMessage: "Claim has already been processed",
    });
  }

  if (parsed.data.action === "approve") {
    await db
      .update(schema.claimedProfile)
      .set({
        status: "active",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.claimedProfile.id, claimId));

    // Also create a contractor user record for the claimant as owner
    await db.insert(schema.contractorUser).values({
      userId: claim.userId,
      claimedProfileId: claimId,
      role: "owner",
    });

    return { success: true, status: "active" };
  } else {
    // For rejection, we could either delete the claim or mark it as suspended
    await db
      .update(schema.claimedProfile)
      .set({
        status: "suspended",
        updatedAt: new Date(),
      })
      .where(eq(schema.claimedProfile.id, claimId));

    return { success: true, status: "suspended" };
  }
});
