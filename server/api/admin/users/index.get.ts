/**
 * @file Admin Users List API
 * @description Returns list of all auth users for admin management
 */

import { getDb, schema } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/better-auth";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const db = getDb();

  const users = await db
    .select({
      user_id: schema.user.id,
      email: schema.user.email,
      display_name: schema.user.name,
      avatar_url: schema.user.image,
      role: schema.user.role,
      is_admin: schema.user.isAdmin,
      last_login_at: schema.user.lastLoginAt,
      created_at: schema.user.createdAt,
      updated_at: schema.user.updatedAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));

  return { users };
});
