import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  if (stripeClient) {
    return stripeClient;
  }

  // Paste STRIPE_SECRET_KEY in `.env.local`.
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
};
