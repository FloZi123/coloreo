import { createPublicClient } from "@/lib/supabase/public";
import type { Locale } from "@/i18n/config";
import type { Tables } from "@/lib/database.types";
import type { PricingTier } from "@/lib/pricing";

export type Category = Tables<"categories">;
export type Book = Tables<"books">;
export type Bundle = Tables<"bundles">;

/** i18n-JSONB: { "<locale>": { title?, name?, description? } }. */
type I18n = Record<string, { title?: string; name?: string; description?: string } | undefined>;
function i18nVal(o: { i18n?: unknown }, l: Locale, key: "title" | "name" | "description"): string | undefined {
  const v = (o.i18n as I18n | undefined)?.[l]?.[key];
  return v && v.trim() ? v : undefined;
}

export function tName<T extends { name_de: string; name_en: string; i18n?: unknown }>(o: T, l: Locale) {
  return i18nVal(o, l, "name") ?? (l === "de" ? o.name_de : o.name_en);
}
export function tTitle<T extends { title_de: string; title_en: string; i18n?: unknown }>(o: T, l: Locale) {
  return i18nVal(o, l, "title") ?? (l === "de" ? o.title_de : o.title_en);
}
export function tDesc<T extends { description_de: string | null; description_en: string | null; i18n?: unknown }>(o: T, l: Locale) {
  return i18nVal(o, l, "description") ?? (l === "de" ? o.description_de : o.description_en) ?? "";
}

export async function getBrand(): Promise<{ name: string; tagline_de: string; tagline_en: string }> {
  const sb = createPublicClient();
  const { data } = await sb.from("site_settings").select("value").eq("key", "brand").maybeSingle();
  const v = (data?.value as { name?: string; tagline_de?: string; tagline_en?: string }) ?? {};
  const name = v.name && v.name !== "PLACEHOLDER" ? v.name : "Malbuch-Shop";
  return { name, tagline_de: v.tagline_de ?? "", tagline_en: v.tagline_en ?? "" };
}

export type World = Tables<"worlds">;

export async function getWorlds(): Promise<World[]> {
  const sb = createPublicClient();
  const { data } = await sb.from("worlds").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function getWorldBySlug(slug: string): Promise<World | null> {
  const sb = createPublicClient();
  const { data } = await sb.from("worlds").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ?? null;
}

export async function getCategoriesByWorld(worldId: string): Promise<Category[]> {
  const sb = createPublicClient();
  const { data } = await sb.from("categories").select("*").eq("world_id", worldId).eq("is_active", true).order("sort_order");
  return data ?? [];
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

export async function searchBooks(opts: {
  q?: string;
  audience?: "adult" | "kids" | "all";
  difficulty?: "einfach" | "mittel" | "filigran";
  seasonal?: "weihnachten" | "halloween" | "ostern";
  categorySlug?: string;
  sort?: "popular" | "price_asc" | "price_desc" | "new";
}): Promise<Book[]> {
  const sb = createPublicClient();
  let q = sb.from("books").select("*").eq("status", "published");
  if (opts.q) q = q.or(`title_de.ilike.%${opts.q}%,title_en.ilike.%${opts.q}%`);
  if (opts.audience) q = q.eq("audience", opts.audience);
  if (opts.difficulty) q = q.eq("difficulty", opts.difficulty);
  if (opts.seasonal) q = q.eq("seasonal_tag", opts.seasonal);
  if (opts.categorySlug) {
    const cat = await getCategoryBySlug(opts.categorySlug);
    if (cat) q = q.eq("category_id", cat.id);
  }
  if (opts.sort === "price_asc") q = q.order("price_cents", { ascending: true });
  else if (opts.sort === "price_desc") q = q.order("price_cents", { ascending: false });
  else if (opts.sort === "new") q = q.order("created_at", { ascending: false });
  else q = q.order("sales_count", { ascending: false });
  const { data } = await q.limit(60);
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

export type Rating = { avg: number; count: number };

export async function getBookRating(bookId: string): Promise<Rating | null> {
  const sb = createPublicClient();
  const { data } = await sb.from("book_ratings").select("avg_rating, review_count").eq("book_id", bookId).maybeSingle();
  if (!data || data.review_count == null) return null;
  return { avg: Number(data.avg_rating ?? 0), count: data.review_count };
}

export async function getReviews(bookId: string, limit = 8) {
  const sb = createPublicClient();
  const { data } = await sb
    .from("reviews")
    .select("rating, author_name, body, created_at, source")
    .eq("book_id", bookId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRatingsForBooks(bookIds: string[]): Promise<Map<string, Rating>> {
  const map = new Map<string, Rating>();
  if (bookIds.length === 0) return map;
  const sb = createPublicClient();
  const { data } = await sb.from("book_ratings").select("book_id, avg_rating, review_count").in("book_id", bookIds);
  for (const r of data ?? []) {
    if (r.book_id) map.set(r.book_id, { avg: Number(r.avg_rating ?? 0), count: r.review_count ?? 0 });
  }
  return map;
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
