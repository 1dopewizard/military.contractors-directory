/**
 * @file Create/update company program
 * @route POST /api/profile-manager/programs
 * @description Creates or updates a program for the company's profile
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/server/utils/better-auth";
import { z } from "zod";

const programSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  category: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(10).default(0),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const db = getDb();
  const body = await readBody(event);

  const parsed = programSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid input: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    });
  }

  // Find claimed profile
  const [claimedProfile] = await db
    .select({ id: schema.claimedProfile.id })
    .from(schema.claimedProfile)
    .where(
      and(
        eq(schema.claimedProfile.userId, user.id),
        eq(schema.claimedProfile.status, "active"),
      ),
    )
    .limit(1);

  let profileId = claimedProfile?.id;

  if (!profileId) {
    const [contractorAccess] = await db
      .select()
      .from(schema.contractorUser)
      .where(eq(schema.contractorUser.userId, user.id))
      .limit(1);

    if (!contractorAccess || contractorAccess.role === "editor") {
      throw createError({
        statusCode: 403,
        statusMessage: "You do not have permission to manage programs",
      });
    }
    profileId = contractorAccess.claimedProfileId;
  }

  if (parsed.data.id) {
    // Update existing program
    await db
      .update(schema.contractorProgram)
      .set({
        name: parsed.data.name,
        category: parsed.data.category || null,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.contractorProgram.id, parsed.data.id),
          eq(schema.contractorProgram.claimedProfileId, profileId),
        ),
      );

    return { success: true, id: parsed.data.id };
  }

  // Create new program
  const [newProgram] = await db
    .insert(schema.contractorProgram)
    .values({
      claimedProfileId: profileId,
      name: parsed.data.name,
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: schema.contractorProgram.id });

  return { success: true, id: newProgram?.id };
});
