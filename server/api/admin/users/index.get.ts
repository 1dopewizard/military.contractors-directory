/**
 * @file Admin Users List API
 * @description Returns list of all users for admin management
 */

import { getDb, schema } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/better-auth";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  // Require admin access
  await requireAdmin(event);

  const db = getDb();

  // Get all users with their profiles
  const users = await db
    .select({
      user_id: schema.user.id,
      email: schema.user.email,
      display_name: schema.user.name,
      avatar_url: schema.user.image,
      branch: schema.profile.branch,
      clearance_level: schema.profile.clearanceLevel,
      oconus_preference: schema.profile.openToOconus,
      preferred_regions: schema.profile.preferredLocations,
      preferred_theaters: schema.profile.preferredTheaters,
      created_at: schema.user.createdAt,
      updated_at: schema.user.updatedAt,
    })
    .from(schema.user)
    .leftJoin(schema.profile, eq(schema.user.id, schema.profile.userId))
    .orderBy(desc(schema.user.createdAt));

  return { users };
});
