/**
 * @file Stripe Customer Portal
 * @route GET /api/billing/portal
 * @description Generates a Stripe Customer Portal URL for subscription management
 */

import { getStripe } from "@/server/utils/stripe";
import { requireAuth } from "@/server/utils/better-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const config = useRuntimeConfig();
  const stripe = getStripe();
  const siteUrl = config.public.siteUrl || "http://localhost:3000";

  try {
    // Find the customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "No billing account found",
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${siteUrl}/profile-manager`,
    });

    return { url: portalSession.url };
  } catch (error) {
    if ((error as any).statusCode) throw error;
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create portal session: ${message}`,
    });
  }
});
