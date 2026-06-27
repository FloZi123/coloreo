import { NextResponse } from "next/server";
import { buildOrderFromCart, generateOrderNumber, type RawLine } from "@/lib/checkout";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLocale } from "@/i18n/config";
import { limited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const retry = limited(req, "checkout", 15);
  if (retry) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retry) } });
  try {
    const body = await req.json();
    const rawLines: RawLine[] = (body.lines ?? []).map((l: RawLine) => ({ kind: l.kind, id: l.id, quantity: l.quantity }));
    const couponCode: string | null = body.couponCode ?? null;
    const locale = isLocale(body.locale) ? body.locale : "de";

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json({ error: "empty_cart" }, { status: 400 });
    }
    if (!stripeConfigured()) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    const { lines, breakdown } = await buildOrderFromCart(rawLines, couponCode, locale);
    if (lines.length === 0) {
      return NextResponse.json({ error: "no_valid_items" }, { status: 400 });
    }

    const admin = createAdminClient();
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: "pending@checkout",
        status: "pending",
        subtotal_cents: breakdown.subtotalCents,
        discount_cents: breakdown.totalDiscountCents,
        total_cents: breakdown.totalCents,
        currency: "eur",
        coupon_code: couponCode,
        locale,
      })
      .select("id")
      .single();
    if (orderErr || !order) throw orderErr ?? new Error("order_insert_failed");

    // Order-Items (Snapshot)
    await admin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        book_id: l.kind === "book" ? l.id : null,
        bundle_id: l.kind === "bundle" ? l.id : null,
        title_snapshot: l.title,
        unit_price_cents: l.unitPriceCents,
        quantity: l.quantity,
        line_total_cents: l.unitPriceCents * l.quantity,
      }))
    );

    const stripe = getStripe();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const TAX = process.env.STRIPE_TAX_ENABLED === "true"; // erst aktivieren, wenn OSS/Stripe-Tax eingerichtet

    const lineItems = lines.map((l) => ({
      price_data: {
        currency: "eur",
        // Bruttopreise (EU-B2C): Steuer ist im Preis enthalten, Stripe weist sie aus
        ...(TAX ? { tax_behavior: "inclusive" as const } : {}),
        // Tax-Code für E-Books/digitale Güter
        product_data: { name: l.title, ...(TAX ? { tax_code: "txcd_10302000" } : {}) },
        unit_amount: l.unitPriceCents,
      },
      quantity: l.quantity,
    }));

    // Rabatt als einmaliger Stripe-Coupon (amount_off), damit Items sichtbar bleiben
    const discounts = [];
    if (breakdown.totalDiscountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: breakdown.totalDiscountCents,
        currency: "eur",
        duration: "once",
        name: "Rabatt",
      });
      discounts.push({ coupon: coupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // KEIN payment_method_types → Stripe Checkout zeigt automatisch alle im Dashboard
      // aktivierten Zahlarten (Karte, PayPal, Klarna …). Bricht nicht, wenn PayPal (noch) fehlt.
      line_items: lineItems,
      discounts,
      success_url: `${origin}/${locale}/danke?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/warenkorb`,
      automatic_tax: { enabled: TAX },
      ...(TAX ? { billing_address_collection: "required" as const, customer_creation: "always" as const } : {}),
      // Läuft nach 2 h ab → löst checkout.session.expired (Warenkorbabbruch-Flow) aus
      expires_at: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      // app-Tag → trennt Coloreo-Events von anderen Apps am selben Stripe-Konto
      metadata: { order_id: order.id, order_number: orderNumber, locale, app: "coloreo" },
      // Stripe Checkout unterstützt de/en/fr/es/it/nl direkt
      locale: (["de", "en", "fr", "es", "it", "nl"].includes(locale) ? locale : "auto") as "de" | "en" | "fr" | "es" | "it" | "nl" | "auto",
    });

    await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "checkout_failed";
    console.error("[checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
