/**
 * @file Stripe client singleton
 * @description Provides a lazy-initialized Stripe client for billing operations
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig();
    const secretKey = config.stripeSecretKey;

    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Set it in your .env file.",
      );
    }

    _stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  return _stripe;
}
