import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboard() {
  const admin = createAdminClient();
  const [{ data: paid }, { count: pendingCount }, { count: leadsCount }, { count: customersCount }, { data: topBooks }, { data: recent }] =
    await Promise.all([
      admin.from("orders").select("total_cents, created_at").eq("status", "paid"),
      admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("leads").select("id", { count: "exact", head: true }),
      admin.from("customers").select("id", { count: "exact", head: true }),
      admin.from("books").select("title_de, sales_count, price_cents").order("sales_count", { ascending: false }).limit(5),
      admin.from("orders").select("order_number, customer_email, total_cents, status, created_at").order("created_at", { ascending: false }).limit(8),
    ]);

  const revenueCents = (paid ?? []).reduce((s, o) => s + o.total_cents, 0);
  const ordersPaid = (paid ?? []).length;
  const aov = ordersPaid ? Math.round(revenueCents / ordersPaid) : 0;

  return {
    revenueCents,
    ordersPaid,
    ordersPending: pendingCount ?? 0,
    leadsCount: leadsCount ?? 0,
    customersCount: customersCount ?? 0,
    aovCents: aov,
    topBooks: topBooks ?? [],
    recent: recent ?? [],
  };
}

export async function listBooks() {
  const admin = createAdminClient();
  const [{ data: books }, { data: cats }] = await Promise.all([
    admin.from("books").select("id, slug, title_de, title_en, description_de, description_en, page_count, price_cents, status, is_featured, sales_count, category_id, source, cover_url").order("created_at", { ascending: false }),
    admin.from("categories").select("id, name_de, emoji"),
  ]);
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]));
  return (books ?? []).map((b) => ({ ...b, category: catMap.get(b.category_id ?? "") ?? null }));
}

export async function listOrders(limit = 100) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, order_number, customer_email, status, subtotal_cents, discount_cents, total_cents, currency, coupon_code, created_at, paid_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listCoupons() {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function listLeads(limit = 500) {
  const admin = createAdminClient();
  const { data } = await admin.from("leads").select("email, source, locale, created_at").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function listSupportTickets() {
  const admin = createAdminClient();
  const { data } = await admin.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
  return data ?? [];
}

export async function listBundlesAdmin() {
  const admin = createAdminClient();
  const { data: bundles } = await admin.from("bundles").select("*").order("created_at", { ascending: false });
  const { data: items } = await admin.from("bundle_items").select("bundle_id, book_id");
  const counts = new Map<string, number>();
  for (const it of items ?? []) counts.set(it.bundle_id, (counts.get(it.bundle_id) ?? 0) + 1);
  return (bundles ?? []).map((b) => ({ ...b, itemCount: counts.get(b.id) ?? 0 }));
}

export async function listPublishedBooksLite() {
  const admin = createAdminClient();
  const { data } = await admin.from("books").select("id, title_de").eq("status", "published").order("title_de");
  return data ?? [];
}

export async function listCategoriesFull() {
  const admin = createAdminClient();
  const { data: cats } = await admin.from("categories").select("*").order("sort_order");
  const { data: books } = await admin.from("books").select("category_id");
  const counts = new Map<string, number>();
  for (const b of books ?? []) if (b.category_id) counts.set(b.category_id, (counts.get(b.category_id) ?? 0) + 1);
  return (cats ?? []).map((c) => ({ ...c, bookCount: counts.get(c.id) ?? 0 }));
}

export async function listCategoriesAdmin() {
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("id, name_de, emoji, audience").order("sort_order");
  return data ?? [];
}

export async function listGenerationQueue() {
  const admin = createAdminClient();
  const [{ data: items }, { data: cats }] = await Promise.all([
    admin.from("book_generation_queue").select("*").order("created_at", { ascending: false }),
    admin.from("categories").select("id, name_de, emoji"),
  ]);
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]));
  return (items ?? []).map((i) => ({ ...i, category: catMap.get(i.category_id ?? "") ?? null }));
}
