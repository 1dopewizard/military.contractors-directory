/**
 * @file Get company's claimed profile
 * @route GET /api/profile-manager/profile
 * @description Returns the claimed profile for the authenticated user
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/server/utils/better-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const db = getDb();

  // Find claimed profile where user is owner or company user
  const [claimedProfile] = await db
    .select({
      id: schema.claimedProfile.id,
      contractorId: schema.claimedProfile.contractorId,
      tier: schema.claimedProfile.tier,
      status: schema.claimedProfile.status,
      verifiedAt: schema.claimedProfile.verifiedAt,
      verificationMethod: schema.claimedProfile.verificationMethod,
      monthlyPrice: schema.claimedProfile.monthlyPrice,
      billingStartedAt: schema.claimedProfile.billingStartedAt,
      createdAt: schema.claimedProfile.createdAt,
      updatedAt: schema.claimedProfile.updatedAt,
    })
    .from(schema.claimedProfile)
    .where(
      and(
        eq(schema.claimedProfile.userId, user.id),
        eq(schema.claimedProfile.status, "active"),
      ),
    )
    .limit(1);

  if (!claimedProfile) {
    // Check if user is a contractor user (not owner)
    const [contractorAccess] = await db
      .select({
        claimedProfileId: schema.contractorUser.claimedProfileId,
        role: schema.contractorUser.role,
      })
      .from(schema.contractorUser)
      .where(eq(schema.contractorUser.userId, user.id))
      .limit(1);

    if (!contractorAccess) {
      return null;
    }

    // Get the claimed profile they have access to
    const [accessedProfile] = await db
      .select()
      .from(schema.claimedProfile)
      .where(eq(schema.claimedProfile.id, contractorAccess.claimedProfileId))
      .limit(1);

    if (!accessedProfile || accessedProfile.status !== "active") {
      return null;
    }

    // Get contractor details
    const [contractor] = await db
      .select()
      .from(schema.contractor)
      .where(eq(schema.contractor.id, accessedProfile.contractorId))
      .limit(1);

    return {
      ...accessedProfile,
      contractor,
      userRole: contractorAccess.role,
      isOwner: false,
    };
  }

  // Get contractor details
  const [contractor] = await db
    .select()
    .from(schema.contractor)
    .where(eq(schema.contractor.id, claimedProfile.contractorId))
    .limit(1);

  return {
    ...claimedProfile,
    contractor,
    userRole: "owner",
    isOwner: true,
  };
});
