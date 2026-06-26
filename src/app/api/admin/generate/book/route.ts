import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { generateBookDraft } from "@/lib/autogen";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const result = await generateBookDraft(id);
    return NextResponse.json({ ok: true, bookId: result.bookId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "generation_failed" }, { status: 500 });
  }
}
