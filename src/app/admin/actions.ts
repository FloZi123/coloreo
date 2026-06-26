"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import type { TablesUpdate } from "@/lib/database.types";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const expected = await expectedToken();
  if (!expected || token !== expected) throw new Error("unauthorized");
}

export async function setBookStatus(id: string, status: "published" | "draft" | "archived") {
  await requireAdmin();
  await createAdminClient().from("books").update({ status }).eq("id", id);
  revalidatePath("/admin/buecher");
}

export async function toggleFeatured(id: string, current: boolean) {
  await requireAdmin();
  await createAdminClient().from("books").update({ is_featured: !current }).eq("id", id);
  revalidatePath("/admin/buecher");
}

export async function updateBookPrice(id: string, priceCents: number) {
  await requireAdmin();
  const safe = Math.max(0, Math.min(99999, Math.round(priceCents)));
  await createAdminClient().from("books").update({ price_cents: safe }).eq("id", id);
  revalidatePath("/admin/buecher");
}

export async function createCoupon(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percent") === "fixed" ? "fixed" : "percent";
  const value = Number(formData.get("value") ?? 0);
  const minOrder = Number(formData.get("min_order") ?? 0);
  if (!code || value <= 0) return;
  await createAdminClient().from("coupons").insert({
    code,
    type,
    value,
    min_order_cents: Math.round(minOrder * 100),
    is_active: true,
  });
  revalidatePath("/admin/gutscheine");
}

export async function toggleCoupon(id: string, current: boolean) {
  await requireAdmin();
  await createAdminClient().from("coupons").update({ is_active: !current }).eq("id", id);
  revalidatePath("/admin/gutscheine");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await createAdminClient().from("coupons").delete().eq("id", id);
  revalidatePath("/admin/gutscheine");
}

export async function approveGeneration(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: item } = await admin.from("book_generation_queue").select("generated_book_id").eq("id", id).single();
  if (item?.generated_book_id) {
    await admin.from("books").update({ status: "published" }).eq("id", item.generated_book_id);
  }
  await admin.from("book_generation_queue").update({ status: "approved" }).eq("id", id);
  revalidatePath("/admin/generator");
}

export async function rejectGeneration(id: string) {
  await requireAdmin();
  await createAdminClient().from("book_generation_queue").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin/generator");
}

// ============ Buch voll bearbeiten ============
export async function updateBook(
  id: string,
  fields: {
    title_de?: string;
    title_en?: string;
    description_de?: string;
    description_en?: string;
    category_id?: string | null;
    price_cents?: number;
    page_count?: number;
    cover_url?: string;
  }
) {
  await requireAdmin();
  const clean: TablesUpdate<"books"> = {};
  if (fields.title_de !== undefined) clean.title_de = fields.title_de.slice(0, 200);
  if (fields.title_en !== undefined) clean.title_en = fields.title_en.slice(0, 200);
  if (fields.description_de !== undefined) clean.description_de = fields.description_de.slice(0, 2000);
  if (fields.description_en !== undefined) clean.description_en = fields.description_en.slice(0, 2000);
  if (fields.category_id !== undefined) clean.category_id = fields.category_id || null;
  if (fields.price_cents !== undefined) clean.price_cents = Math.max(0, Math.min(99999, Math.round(fields.price_cents)));
  if (fields.page_count !== undefined) clean.page_count = Math.max(1, Math.min(500, Math.round(fields.page_count)));
  if (fields.cover_url !== undefined) clean.cover_url = fields.cover_url;
  await createAdminClient().from("books").update(clean).eq("id", id);
  revalidatePath("/admin/buecher");
}

// ============ Refund ============
export async function refundOrder(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("stripe_payment_intent, status").eq("id", id).single();
  if (!order || order.status !== "paid") return;
  try {
    const { stripeConfigured, getStripe } = await import("@/lib/stripe");
    if (stripeConfigured() && order.stripe_payment_intent) {
      await getStripe().refunds.create({ payment_intent: order.stripe_payment_intent });
    }
  } catch (e) {
    console.error("[refund]", e);
  }
  await admin.from("orders").update({ status: "refunded" }).eq("id", id);
  revalidatePath("/admin/bestellungen");
}

// ============ Support-Tickets ============
export async function resolveTicket(id: string, resolved: boolean) {
  await requireAdmin();
  await createAdminClient().from("support_tickets").update({ status: resolved ? "resolved" : "open" }).eq("id", id);
  revalidatePath("/admin/support");
}

// ============ Bundles ============
function slugify(s: string) {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export async function createBundle(formData: FormData) {
  await requireAdmin();
  const titleDe = String(formData.get("title_de") ?? "").trim();
  const titleEn = String(formData.get("title_en") ?? titleDe).trim();
  const descDe = String(formData.get("description_de") ?? "").trim();
  const priceEur = Number(formData.get("price") ?? 0);
  const bookIds = formData.getAll("book_ids").map(String).filter(Boolean);
  if (!titleDe || priceEur <= 0 || bookIds.length === 0) return;
  const admin = createAdminClient();
  const slug = `${slugify(titleDe)}-${Math.floor(Math.random() * 900 + 100)}`;
  const { data: bundle } = await admin
    .from("bundles")
    .insert({ slug, type: "curated", title_de: titleDe, title_en: titleEn, description_de: descDe, description_en: descDe, price_cents: Math.round(priceEur * 100), is_active: true })
    .select("id")
    .single();
  if (bundle) {
    await admin.from("bundle_items").insert(bookIds.map((book_id) => ({ bundle_id: bundle.id, book_id })));
  }
  revalidatePath("/admin/bundles");
}

export async function toggleBundle(id: string, current: boolean) {
  await requireAdmin();
  await createAdminClient().from("bundles").update({ is_active: !current }).eq("id", id);
  revalidatePath("/admin/bundles");
}

export async function deleteBundle(id: string) {
  await requireAdmin();
  await createAdminClient().from("bundles").delete().eq("id", id);
  revalidatePath("/admin/bundles");
}

// ============ Kategorien ============
export async function createCategory(formData: FormData) {
  await requireAdmin();
  const nameDe = String(formData.get("name_de") ?? "").trim();
  const nameEn = String(formData.get("name_en") ?? nameDe).trim();
  const emoji = String(formData.get("emoji") ?? "🎨").trim();
  const audience = ["adult", "kids", "all"].includes(String(formData.get("audience"))) ? String(formData.get("audience")) : "adult";
  if (!nameDe) return;
  await createAdminClient().from("categories").insert({
    slug: `${slugify(nameDe)}-${Math.floor(Math.random() * 900 + 100)}`,
    name_de: nameDe, name_en: nameEn, emoji,
    audience: audience as "adult" | "kids" | "all",
    sort_order: 500,
  });
  revalidatePath("/admin/kategorien");
}

export async function toggleCategory(id: string, current: boolean) {
  await requireAdmin();
  await createAdminClient().from("categories").update({ is_active: !current }).eq("id", id);
  revalidatePath("/admin/kategorien");
}
