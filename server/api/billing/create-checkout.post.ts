/**
 * @file Create Stripe Checkout session
 * @route POST /api/billing/create-checkout
 * @description Creates a Stripe Checkout session for claimed profile subscriptions
 */

import { getStripe } from "@/server/utils/stripe";
import { requireAuth } from "@/server/utils/better-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const config = useRuntimeConfig();

  const body = await readBody<{
    tier: "claimed" | "premium";
    contractorId: string;
    contractorName: string;
  }>(event);

  if (!body?.tier || !body?.contractorId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tier and contractorId are required",
    });
  }

  const priceId =
    body.tier === "premium"
      ? config.stripePremiumPriceId
      : config.stripeClaimedPriceId;

  if (!priceId) {
    throw createError({
      statusCode: 500,
      statusMessage: `Stripe price ID not configured for tier: ${body.tier}`,
    });
  }

  const stripe = getStripe();
  const siteUrl = config.public.siteUrl || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        contractorId: body.contractorId,
        tier: body.tier,
      },
      success_url: `${siteUrl}/profile-manager?checkout=success`,
      cancel_url: `${siteUrl}/profile-manager/claim?checkout=cancelled`,
    });

    return { url: session.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create checkout session: ${message}`,
    });
  }
});
