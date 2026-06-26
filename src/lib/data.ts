import { createPublicClient } from "@/lib/supabase/public";
import type { Locale } from "@/i18n/config";
import type { Tables } from "@/lib/database.types";
import type { PricingTier } from "@/lib/pricing";

export type Category = Tables<"categories">;
export type Book = Tables<"books">;
export type Bundle = Tables<"bundles">;

export function tName<T extends { name_de: string; name_en: string }>(o: T, l: Locale) {
  return l === "en" ? o.name_en : o.name_de;
}
export function tTitle<T extends { title_de: string; title_en: string }>(o: T, l: Locale) {
  return l === "en" ? o.title_en : o.title_de;
}
export function tDesc<T extends { description_de: string | null; description_en: string | null }>(o: T, l: Locale) {
  return (l === "en" ? o.description_en : o.description_de) ?? "";
}

export async function getBrand(): Promise<{ name: string; tagline_de: string; tagline_en: string }> {
  const sb = createPublicClient();
  const { data } = await sb.from("site_settings").select("value").eq("key", "brand").maybeSingle();
  const v = (data?.value as { name?: string; tagline_de?: string; tagline_en?: string }) ?? {};
  const name = v.name && v.name !== "PLACEHOLDER" ? v.name : "Malbuch-Shop";
  return { name, tagline_de: v.tagline_de ?? "", tagline_en: v.tagline_en ?? "" };
}

export async function getCategories(): Promise<Category[]> {
  const sb = createPublicClient();
  const { data } = await sb.from("categories").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const sb = createPublicClient();
  const { data } = await sb.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ?? null;
}

export async function getBooks(opts: { categoryId?: string; featured?: boolean; limit?: number } = {}): Promise<Book[]> {
  const sb = createPublicClient();
  let q = sb.from("books").select("*").eq("status", "published");
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.featured) q = q.eq("is_featured", true);
  q = q.order("sales_count", { ascending: false }).order("created_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return data ?? [];
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const sb = createPublicClient();
  const { data } = await sb.from("books").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ?? null;
}

export async function getBundles(): Promise<Bundle[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("bundles")
    .select("*")
    .eq("is_active", true)
    .eq("type", "curated")
    .order("sort_order");
  return data ?? [];
}

export async function getBundleWithBooks(slug: string): Promise<{ bundle: Bundle; books: Book[] } | null> {
  const sb = createPublicClient();
  const { data: bundle } = await sb.from("bundles").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!bundle) return null;
  const { data: items } = await sb.from("bundle_items").select("book_id").eq("bundle_id", bundle.id);
  const ids = (items ?? []).map((i) => i.book_id);
  const { data: books } = ids.length
    ? await sb.from("books").select("*").in("id", ids)
    : { data: [] as Book[] };
  return { bundle, books: books ?? [] };
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("pricing_tiers")
    .select("min_quantity, discount_percent")
    .eq("is_active", true)
    .order("min_quantity");
  return data ?? [];
}
