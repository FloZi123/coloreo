import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("PLACEHOLDER")) {
    throw new Error("STRIPE_SECRET_KEY fehlt/Platzhalter. Bitte Test-Key in .env.local / Vercel eintragen.");
  }
  if (!_stripe) {
    _stripe = new Stripe(key); // SDK-Standard-API-Version verwenden
  }
  return _stripe;
}

export function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && !key.includes("PLACEHOLDER");
}
