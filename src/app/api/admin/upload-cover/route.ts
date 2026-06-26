import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const bookId = String(form.get("book_id") ?? "");
  if (!file || !bookId) return NextResponse.json({ error: "file_and_book_required" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "too_large" }, { status: 400 });

  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : file.type.includes("svg") ? "svg" : "jpg";
  const admin = createAdminClient();
  const path = `upload-${bookId}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from("covers").upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const coverUrl = `${SUPA_URL}/storage/v1/object/public/covers/${path}?v=${Date.now()}`;
  await admin.from("books").update({ cover_url: coverUrl }).eq("id", bookId);
  return NextResponse.json({ ok: true, coverUrl });
}
