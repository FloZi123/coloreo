import { createAdminClient } from "@/lib/supabase/admin";
import { produceWatermarkedDownload } from "@/lib/pdf";
import { sendOrderConfirmation } from "@/lib/email";
import { isLocale } from "@/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Idempotente Auftragserfüllung: wird vom Stripe-Webhook nach Zahlung aufgerufen.
 * Erzeugt personalisierte PDFs, Download-Tokens, setzt die Bestellung auf "paid",
 * aktualisiert Kunde & Statistik und versendet die Bestätigungsmail.
 */
export async function fulfillOrder(orderId: string, email: string): Promise<void> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, locale, coupon_code")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error("order_not_found");
  if (order.status === "paid") return; // bereits erfüllt

  const locale = isLocale(order.locale) ? order.locale : "de";

  // Items laden und in Bücher auflösen (Bundles expandieren)
  const { data: items } = await admin
    .from("order_items")
    .select("book_id, bundle_id, quantity")
    .eq("order_id", orderId);

  const bookQty = new Map<string, number>();
  for (const it of items ?? []) {
    if (it.book_id) bookQty.set(it.book_id, (bookQty.get(it.book_id) ?? 0) + it.quantity);
  }
  const bundleIds = (items ?? []).filter((i) => i.bundle_id).map((i) => i.bundle_id as string);
  if (bundleIds.length) {
    const { data: members } = await admin.from("bundle_items").select("book_id").in("bundle_id", bundleIds);
    for (const m of members ?? []) bookQty.set(m.book_id, (bookQty.get(m.book_id) ?? 0) + 1);
  }

  const bookIds = [...bookQty.keys()];
  if (bookIds.length === 0) throw new Error("no_books_to_fulfill");

  const { data: books } = await admin
    .from("books")
    .select("id, title_de, title_en, pdf_path, page_count")
    .in("id", bookIds);

  // Kunde upsert
  const { data: customer } = await admin
    .from("customers")
    .upsert({ email, locale }, { onConflict: "email" })
    .select("id")
    .single();

  // PDFs erzeugen + Download-Zeilen
  const downloads: { title: string; url: string }[] = [];
  for (const book of books ?? []) {
    const path = await produceWatermarkedDownload(admin, book, orderId, {
      email,
      orderNumber: order.order_number,
    });
    const token = crypto.randomUUID().replace(/-/g, "");
    await admin.from("downloads").insert({
      order_id: orderId,
      book_id: book.id,
      customer_email: email,
      token,
      watermarked_path: path,
    });
    downloads.push({ title: locale === "en" ? book.title_en : book.title_de, url: `${SITE}/api/download/${token}` });
    await admin.rpc("increment_book_sales", { p_id: book.id, p_qty: bookQty.get(book.id) ?? 1 });
  }

  // Bestellung abschließen
  await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), customer_email: email, customer_id: customer?.id ?? null })
    .eq("id", orderId);

  if (order.coupon_code) {
    await admin.rpc("redeem_coupon", { p_code: order.coupon_code });
  }

  await sendOrderConfirmation({ email, orderNumber: order.order_number, locale, downloads });
}
