import Stripe from "stripe";

/**
 * Helper to assert that an environment variable is defined.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Determine if we are allowed to use live Stripe keys.
 *
 * For now, we default to TEST mode only, and only permit LIVE keys
 * if STRIPE_ALLOW_LIVE is explicitly set to "true". This makes it
 * hard to accidentally charge real cards while developing.
 */
function createStripeClient(): Stripe {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");

  const isLiveKey = secretKey.startsWith("sk_live_");
  const allowLive = process.env.STRIPE_ALLOW_LIVE === "true";

  if (isLiveKey && !allowLive) {
    throw new Error(
      "Detected a live Stripe secret key but STRIPE_ALLOW_LIVE is not enabled. " +
        "Use test keys (sk_test_...) while developing, or set STRIPE_ALLOW_LIVE=true " +
        "in your production environment once you're ready to process real payments."
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia", // use latest stable at implementation time
  });
}

/**
 * Stripe client instance, configured with the secret key from env.
 *
 * In Next.js, you would import this only in server-side code
 * (API routes, route handlers, server actions, etc.).
 */
export const stripe = createStripeClient();

/**
 * Centralised mapping of Stripe price IDs used by the app.
 *
 * All prices are in USD, with a base of $20/month for Premium.
 * Longer intervals are discounted (approximate values):
 * - Monthly:  $20 / month
 * - Quarterly: ~$54 / 3 months
 * - Semiannual: ~$96 / 6 months
 * - Annual:   ~$168 / year
 *
 * NOTE: The actual amounts are configured in Stripe itself; here
 * we only reference the corresponding price IDs via environment variables.
 */
export const STRIPE_PRICE_IDS = {
  premium: {
    monthly: requireEnv("STRIPE_PRICE_PREMIUM_MONTHLY"),
    quarterly: requireEnv("STRIPE_PRICE_PREMIUM_QUARTERLY"),
    semiannual: requireEnv("STRIPE_PRICE_PREMIUM_SEMIANNUAL"),
    annual: requireEnv("STRIPE_PRICE_PREMIUM_ANNUAL"),
  },
} as const;

export type PremiumBillingInterval = keyof typeof STRIPE_PRICE_IDS.premium;

/**
 * Get the Stripe price ID for a given Premium billing interval.
 *
 * Example usage in a checkout/session creation:
 *
 *   const priceId = getPremiumPriceId("monthly");
 *   await stripe.checkout.sessions.create({ line_items: [{ price: priceId, quantity: 1 }], ... });
 */
export function getPremiumPriceId(interval: PremiumBillingInterval): string {
  return STRIPE_PRICE_IDS.premium[interval];
}

