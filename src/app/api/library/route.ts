import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ orders: [] });
  }
  const admin = createAdminClient();
  const normalized = email.toLowerCase().trim();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, created_at")
    .eq("customer_email", normalized)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) return NextResponse.json({ orders: [] });

  const orderIds = orders.map((o) => o.id);
  const { data: dls } = await admin
    .from("downloads")
    .select("order_id, book_id, token, download_count, max_downloads, expires_at")
    .in("order_id", orderIds);

  const bookIds = [...new Set((dls ?? []).map((d) => d.book_id))];
  const { data: books } = bookIds.length
    ? await admin.from("books").select("id, title_de, title_en").in("id", bookIds)
    : { data: [] as { id: string; title_de: string; title_en: string }[] };
  const bookMap = new Map((books ?? []).map((b) => [b.id, b]));

  const result = orders.map((o) => ({
    orderNumber: o.order_number,
    date: o.created_at,
    items: (dls ?? [])
      .filter((d) => d.order_id === o.id)
      .map((d) => ({
        title_de: bookMap.get(d.book_id)?.title_de ?? "Malbuch",
        title_en: bookMap.get(d.book_id)?.title_en ?? "Coloring book",
        url: `${SITE}/api/download/${d.token}`,
        downloadsLeft: Math.max(0, d.max_downloads - d.download_count),
        expired: new Date(d.expires_at) < new Date(),
      })),
  }));

  return NextResponse.json({ orders: result });
}
