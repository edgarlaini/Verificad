import Stripe from "stripe";

let client: Stripe | null = null;

// Istanziato "lazy" (solo alla prima chiamata reale), non a livello di modulo:
// altrimenti la build su Vercel fallisce se la variabile d'ambiente non è
// ancora letta in quel momento — stessa lezione già imparata con Resend.
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return client;
}
