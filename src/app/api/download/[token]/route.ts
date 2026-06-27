import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: dl } = await admin
    .from("downloads")
    .select("id, book_id, watermarked_path, download_count, max_downloads, expires_at, customer_email")
    .eq("token", token)
    .maybeSingle();

  if (!dl || !dl.watermarked_path) {
    return new NextResponse("Download nicht gefunden.", { status: 404 });
  }
  if (new Date(dl.expires_at) < new Date()) {
    return new NextResponse("Download-Link abgelaufen.", { status: 410 });
  }
  if (dl.download_count >= dl.max_downloads) {
    return new NextResponse("Download-Limit erreicht.", { status: 429 });
  }

  const { data: file, error } = await admin.storage.from("downloads").download(dl.watermarked_path);
  if (error || !file) {
    return new NextResponse("Datei nicht verfügbar.", { status: 404 });
  }

  await admin.from("downloads").update({ download_count: dl.download_count + 1 }).eq("id", dl.id);

  // Track download event (fire-and-forget, non-critical)
  void admin.from("download_events").insert({
    kind: "purchase",
    book_id: dl.book_id,
    email: dl.customer_email ?? null,
  });

  const { data: book } = await admin.from("books").select("slug").eq("id", dl.book_id).maybeSingle();
  const filename = `coloreo-${book?.slug ?? "malbuch"}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
