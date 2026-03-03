/**
 * @file Job alert unsubscribe endpoint
 * @route GET /api/alerts/unsubscribe?token=<token>
 * @description Deactivates a job alert subscription via token
 */

import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Unsubscribe token is required",
    });
  }

  const db = getDb();

  try {
    const subscription = await db
      .select()
      .from(schema.jobAlertSubscription)
      .where(eq(schema.jobAlertSubscription.unsubscribeToken, token))
      .get();

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: "Subscription not found",
      });
    }

    await db
      .update(schema.jobAlertSubscription)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobAlertSubscription.id, subscription.id));

    // Redirect to unsubscribed confirmation page
    await sendRedirect(event, "/unsubscribed", 302);
  } catch (error) {
    if ((error as any).statusCode) throw error;
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to unsubscribe: ${message}`,
    });
  }
});
