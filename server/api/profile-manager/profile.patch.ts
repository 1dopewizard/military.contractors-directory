/**
 * @file Update company's contractor profile
 * @route PATCH /api/profile-manager/profile
 * @description Updates the contractor profile for a claimed profile owner/admin
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/server/utils/better-auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  description: z.string().max(2000).optional(),
  headquarters: z.string().max(200).optional(),
  employeeCount: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal("")),
  careersUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const db = getDb();
  const body = await readBody(event);

  // Validate input
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid input: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    });
  }

  // Find claimed profile where user is owner
  const [claimedProfile] = await db
    .select()
    .from(schema.claimedProfile)
    .where(
      and(
        eq(schema.claimedProfile.userId, user.id),
        eq(schema.claimedProfile.status, "active"),
      ),
    )
    .limit(1);

  if (!claimedProfile) {
    // Check if user is a contractor admin
    const [contractorAccess] = await db
      .select()
      .from(schema.contractorUser)
      .innerJoin(
        schema.claimedProfile,
        eq(schema.contractorUser.claimedProfileId, schema.claimedProfile.id),
      )
      .where(
        and(
          eq(schema.contractorUser.userId, user.id),
          eq(schema.claimedProfile.status, "active"),
        ),
      )
      .limit(1);

    if (
      !contractorAccess ||
      contractorAccess.contractorUser.role === "editor"
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "You do not have permission to edit this profile",
      });
    }

    // Update contractor profile
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.headquarters !== undefined)
      updateData.headquarters = parsed.data.headquarters;
    if (parsed.data.employeeCount !== undefined)
      updateData.employeeCount = parsed.data.employeeCount;
    if (parsed.data.website !== undefined)
      updateData.website = parsed.data.website || null;
    if (parsed.data.careersUrl !== undefined)
      updateData.careersUrl = parsed.data.careersUrl || null;
    if (parsed.data.linkedinUrl !== undefined)
      updateData.linkedinUrl = parsed.data.linkedinUrl || null;

    await db
      .update(schema.contractor)
      .set(updateData)
      .where(
        eq(schema.contractor.id, contractorAccess.claimedProfile.contractorId),
      );

    return { success: true };
  }

  // Update contractor profile
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.headquarters !== undefined)
    updateData.headquarters = parsed.data.headquarters;
  if (parsed.data.employeeCount !== undefined)
    updateData.employeeCount = parsed.data.employeeCount;
  if (parsed.data.website !== undefined)
    updateData.website = parsed.data.website || null;
  if (parsed.data.careersUrl !== undefined)
    updateData.careersUrl = parsed.data.careersUrl || null;
  if (parsed.data.linkedinUrl !== undefined)
    updateData.linkedinUrl = parsed.data.linkedinUrl || null;

  await db
    .update(schema.contractor)
    .set(updateData)
    .where(eq(schema.contractor.id, claimedProfile.contractorId));

  return { success: true };
});
