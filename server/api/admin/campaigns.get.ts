/**
 * @file Admin Campaigns API - GET
 * @description Fetches all campaigns for admin dashboard (Drizzle-backed)
 */
import { requireAdmin } from "@/server/utils/better-auth";
import { getDb, schema } from "@/server/utils/db";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const db = getDb();

    const campaigns = await db
      .select()
      .from(schema.campaign)
      .orderBy(desc(schema.campaign.createdAt));

    // Transform to expected format
    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      budget: c.budget,
      spent: c.spent,
      starts_at: c.startDate?.toISOString() ?? null,
      ends_at: c.endDate?.toISOString() ?? null,
      created_at: c.createdAt?.toISOString() ?? null,
      updated_at: c.updatedAt?.toISOString() ?? null,
    }));
  } catch (err: unknown) {
    const error = err as {
      statusCode?: number;
      statusMessage?: string;
      message?: string;
    };
    console.error("Admin API: Error", err);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
      data: error.message,
    });
  }
});
