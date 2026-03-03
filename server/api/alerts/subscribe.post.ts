/**
 * @file Job alert subscription endpoint
 * @route POST /api/alerts/subscribe
 * @description Creates or updates a job alert subscription
 */

import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string;
    keywords?: string[];
    locations?: string[];
    clearanceLevels?: string[];
    mosCodes?: string[];
    frequency?: string;
  }>(event);

  if (!body?.email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email is required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid email address",
    });
  }

  const db = getDb();

  try {
    // Check for existing subscription
    const existing = await db
      .select()
      .from(schema.jobAlertSubscription)
      .where(eq(schema.jobAlertSubscription.email, body.email))
      .get();

    if (existing) {
      // Update existing subscription preferences and reactivate
      await db
        .update(schema.jobAlertSubscription)
        .set({
          keywords: body.keywords ?? existing.keywords,
          locations: body.locations ?? existing.locations,
          clearanceLevels: body.clearanceLevels ?? existing.clearanceLevels,
          mosCodes: body.mosCodes ?? existing.mosCodes,
          frequency: body.frequency ?? existing.frequency,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.jobAlertSubscription.id, existing.id));

      return { success: true, message: "Subscription updated" };
    }

    // Create new subscription
    const unsubscribeToken = crypto.randomUUID();

    await db.insert(schema.jobAlertSubscription).values({
      email: body.email,
      keywords: body.keywords ?? null,
      locations: body.locations ?? null,
      clearanceLevels: body.clearanceLevels ?? null,
      mosCodes: body.mosCodes ?? null,
      frequency: body.frequency ?? "weekly",
      unsubscribeToken,
    });

    return { success: true, message: "Subscribed successfully" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to subscribe: ${message}`,
    });
  }
});
