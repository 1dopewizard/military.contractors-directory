/**
 * @file List pending claims
 * @route GET /api/admin/claims
 * @description Returns all pending claim requests for admin review
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/server/utils/better-auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = getDb();

  const claims = await db
    .select({
      id: schema.claimedProfile.id,
      tier: schema.claimedProfile.tier,
      status: schema.claimedProfile.status,
      verificationMethod: schema.claimedProfile.verificationMethod,
      createdAt: schema.claimedProfile.createdAt,
      contractorId: schema.claimedProfile.contractorId,
      contractorName: schema.contractor.name,
      contractorSlug: schema.contractor.slug,
      userId: schema.claimedProfile.userId,
      userName: schema.user.name,
      userEmail: schema.user.email,
    })
    .from(schema.claimedProfile)
    .innerJoin(
      schema.contractor,
      eq(schema.claimedProfile.contractorId, schema.contractor.id),
    )
    .innerJoin(schema.user, eq(schema.claimedProfile.userId, schema.user.id))
    .where(eq(schema.claimedProfile.status, "pending"))
    .orderBy(desc(schema.claimedProfile.createdAt));

  return claims.map((claim) => ({
    id: claim.id,
    tier: claim.tier,
    status: claim.status,
    verificationMethod: claim.verificationMethod,
    createdAt: claim.createdAt?.toISOString(),
    contractor: {
      id: claim.contractorId,
      name: claim.contractorName,
      slug: claim.contractorSlug,
    },
    user: {
      id: claim.userId,
      name: claim.userName,
      email: claim.userEmail,
    },
  }));
});
