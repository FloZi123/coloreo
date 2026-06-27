import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/fulfillment";
import { enqueueEmail } from "@/lib/emailJobs";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServer } from "@/lib/analyticsServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("PLACEHOLDER")) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig ?? "", secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bad_signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { order_id?: string };
        customer_details?: { email?: string } | null;
        customer_email?: string | null;
        amount_total?: number | null;
        total_details?: { amount_tax?: number | null } | null;
      };
      const orderId = session.metadata?.order_id;
      const email = session.customer_details?.email ?? session.customer_email ?? "";
      if (orderId && email) {
        await fulfillOrder(orderId, email);
        // Steuer/Brutto persistieren (Stripe Tax)
        if (session.amount_total != null) {
          await createAdminClient().from("orders").update({
            total_cents: session.amount_total,
            tax_cents: session.total_details?.amount_tax ?? 0,
          }).eq("id", orderId);
        }
        // Analytics serverseitig (verlässlich, anonyme distinctId = order_id)
        await captureServer(orderId, "purchase_completed", { order_id: orderId, value: (session.amount_total ?? 0) / 100 });
      }
    } else if (event.type === "checkout.session.expired") {
      // Warenkorbabbruch: nur wenn E-Mail vorliegt; DOI wird beim Versand geprüft
      const session = event.data.object as {
        id: string;
        metadata?: { locale?: string };
        customer_details?: { email?: string } | null;
        customer_email?: string | null;
      };
      const email = session.customer_details?.email ?? session.customer_email ?? "";
      if (email) {
        await enqueueEmail({ type: "abandoned_cart", recipient: email, locale: session.metadata?.locale ?? "de", runAfterMinutes: 60, dedupe: `abandoned_cart:${session.id}` });
      }
    }
  } catch (e) {
    console.error("[webhook] fulfillment error", e);
    return NextResponse.json({ error: "fulfillment_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
