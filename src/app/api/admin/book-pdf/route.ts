import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Streamt das saubere Master-PDF eines Buchs zum Durchblättern im Admin (auth-geschützt). */
export async function GET(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return new NextResponse("missing slug", { status: 400 });

  const admin = createAdminClient();
  const { data: book } = await admin.from("books").select("pdf_path, title_de").eq("slug", slug).maybeSingle();
  if (!book?.pdf_path) return new NextResponse("nicht gefunden", { status: 404 });

  let bytes: Uint8Array | null = null;
  if (book.pdf_path.startsWith("http") || book.pdf_path.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const url = book.pdf_path.startsWith("http") ? book.pdf_path : `${base}${book.pdf_path}`;
    const res = await fetch(url);
    if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
  } else {
    const { data } = await admin.storage.from("books").download(book.pdf_path);
    if (data) bytes = new Uint8Array(await data.arrayBuffer());
  }
  if (!bytes) return new NextResponse("Datei nicht verfügbar", { status: 404 });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
