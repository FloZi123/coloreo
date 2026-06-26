import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "missing_session" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, locale")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!order) return NextResponse.json({ status: "unknown" });
  if (order.status !== "paid") return NextResponse.json({ status: order.status, orderNumber: order.order_number });

  const { data: dls } = await admin
    .from("downloads")
    .select("token, book_id")
    .eq("order_id", order.id);

  const bookIds = (dls ?? []).map((d) => d.book_id);
  const { data: books } = bookIds.length
    ? await admin.from("books").select("id, title_de, title_en").in("id", bookIds)
    : { data: [] as { id: string; title_de: string; title_en: string }[] };
  const titleMap = new Map((books ?? []).map((b) => [b.id, order.locale === "en" ? b.title_en : b.title_de]));

  const downloads = (dls ?? []).map((d) => ({
    title: titleMap.get(d.book_id) ?? "Malbuch",
    url: `${SITE}/api/download/${d.token}`,
  }));

  return NextResponse.json({ status: "paid", orderNumber: order.order_number, downloads });
}
