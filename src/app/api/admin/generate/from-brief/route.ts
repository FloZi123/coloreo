import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { generateBookFromBrief } from "@/lib/autogen";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const theme = String(body.theme ?? "").trim();
    const categoryId = String(body.categoryId ?? "").trim();
    const bullets: string[] = Array.isArray(body.bullets)
      ? body.bullets
      : String(body.bullets ?? "").split("\n");
    if (!theme || !categoryId) {
      return NextResponse.json({ error: "theme_and_category_required" }, { status: 400 });
    }
    const audience = ["adult", "kids", "all"].includes(body.audience) ? body.audience : undefined;
    const pageCount = Number.isFinite(Number(body.pageCount)) && Number(body.pageCount) > 0 ? Number(body.pageCount) : undefined;
    const euros = parseFloat(String(body.price ?? "").replace(",", "."));
    const priceCents = Number.isFinite(euros) && euros > 0 ? Math.round(euros * 100) : undefined;
    const result = await generateBookFromBrief({ theme, bullets, categoryId, audience, pageCount, priceCents });
    return NextResponse.json({ ok: true, bookId: result.bookId });
  } catch (e) {
    console.error("[generate/from-brief]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "generation_failed" }, { status: 500 });
  }
}
