/**
 * @file Stripe webhook handler
 * @route POST /api/billing/webhook
 * @description Processes Stripe webhook events for subscription lifecycle
 */

import { getStripe } from "@/server/utils/stripe";
import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const stripe = getStripe();

  const body = await readRawBody(event);
  const signature = getRequestHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing body or signature",
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 400,
      statusMessage: `Webhook signature verification failed: ${message}`,
    });
  }

  const db = getDb();

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const { contractorId, tier, userId } = session.metadata || {};

      if (!contractorId || !tier || !userId) break;

      // Update claimed profile status to active
      const existing = await db
        .select()
        .from(schema.claimedProfile)
        .where(eq(schema.claimedProfile.contractorId, contractorId))
        .get();

      if (existing) {
        await db
          .update(schema.claimedProfile)
          .set({
            status: "active",
            tier: tier as "claimed" | "premium",
            billingStartedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.claimedProfile.id, existing.id));
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = stripeEvent.data
        .object as Stripe.Subscription;

      if (subscription.status === "past_due" || subscription.status === "unpaid") {
        const contractorId = subscription.metadata?.contractorId;
        if (!contractorId) break;

        await db
          .update(schema.claimedProfile)
          .set({
            status: "suspended",
            updatedAt: new Date(),
          })
          .where(eq(schema.claimedProfile.contractorId, contractorId));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = stripeEvent.data
        .object as Stripe.Subscription;
      const contractorId = subscription.metadata?.contractorId;
      if (!contractorId) break;

      await db
        .update(schema.claimedProfile)
        .set({
          status: "suspended",
          updatedAt: new Date(),
        })
        .where(eq(schema.claimedProfile.contractorId, contractorId));
      break;
    }
  }

  return { received: true };
});
