"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";

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
