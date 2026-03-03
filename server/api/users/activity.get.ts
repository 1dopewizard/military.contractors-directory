/**
 * @file User activity endpoint
 * @route GET /api/users/activity
 * @description Fetch recent activity for the authenticated user
 */

import { db, schema } from "@/server/utils/db";
import { getServerUser } from "@/server/utils/better-auth";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = await getServerUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const query = getQuery(event);
  const limit = Math.min(Number(query.limit) || 10, 50);

  try {
    const activities = await db.query.candidateActivity.findMany({
      where: eq(schema.candidateActivity.userId, user.id),
      orderBy: desc(schema.candidateActivity.createdAt),
      limit,
    });

    return activities.map((activity) => ({
      id: activity.id,
      activityType: activity.type || activity.activityType || "unknown",
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata as Record<string, unknown> | null,
      createdAt:
        activity.createdAt instanceof Date
          ? activity.createdAt.getTime()
          : activity.createdAt,
    }));
  } catch (error) {
    console.error("Failed to fetch user activity:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch user activity",
    });
  }
});
