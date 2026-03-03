/**
 * @file Initiate profile claim
 * @route POST /api/employer/claim
 * @description Creates a pending claimed profile request
 */

import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/utils/better-auth";
import { z } from "zod";

const claimSchema = z.object({
  contractorId: z.string().uuid(),
  verificationMethod: z.enum(["email_domain", "manual", "document"]),
  tier: z.enum(["claimed", "premium", "enterprise"]).default("claimed"),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const db = getDb();
  const body = await readBody(event);

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid input: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    });
  }

  // Check if contractor exists
  const [contractor] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.id, parsed.data.contractorId))
    .limit(1);

  if (!contractor) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contractor not found",
    });
  }

  // Check if contractor is already claimed
  const [existingClaim] = await db
    .select()
    .from(schema.claimedProfile)
    .where(eq(schema.claimedProfile.contractorId, parsed.data.contractorId))
    .limit(1);

  if (existingClaim) {
    throw createError({
      statusCode: 409,
      statusMessage: "This contractor profile has already been claimed",
    });
  }

  // Create pending claim
  const [newClaim] = await db
    .insert(schema.claimedProfile)
    .values({
      contractorId: parsed.data.contractorId,
      userId: user.id,
      tier: parsed.data.tier,
      status: "pending",
      verificationMethod: parsed.data.verificationMethod,
    })
    .returning();

  if (!newClaim) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create claim",
    });
  }

  return {
    success: true,
    claim: {
      id: newClaim.id,
      status: newClaim.status,
      tier: newClaim.tier,
      verificationMethod: newClaim.verificationMethod,
      contractor: {
        id: contractor.id,
        name: contractor.name,
        slug: contractor.slug,
      },
    },
  };
});
