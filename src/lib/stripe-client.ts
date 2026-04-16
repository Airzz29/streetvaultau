import { loadStripe } from "@stripe/stripe-js";

// Paste NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in `.env.local`.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
