import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Admin = SupabaseClient<Database>;

/** Lädt das Master-PDF aus dem 'books'-Bucket oder erzeugt einen Platzhalter (bis Phase 4). */
async function getMasterPdfBytes(
  admin: Admin,
  book: { title_de: string; pdf_path: string | null; page_count: number }
): Promise<Uint8Array> {
  if (book.pdf_path) {
    // URL oder lokaler Public-Pfad (generierte Masters) → per fetch laden
    if (book.pdf_path.startsWith("http") || book.pdf_path.startsWith("/")) {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const url = book.pdf_path.startsWith("http") ? book.pdf_path : `${base}${book.pdf_path}`;
      try {
        const res = await fetch(url);
        if (res.ok) return new Uint8Array(await res.arrayBuffer());
      } catch {}
    } else {
      // Storage-Pfad im 'books'-Bucket
      const { data, error } = await admin.storage.from("books").download(book.pdf_path);
      if (!error && data) return new Uint8Array(await data.arrayBuffer());
    }
  }
  // Fallback-Platzhalter
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = Math.min(Math.max(book.page_count, 1), 4);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595, 842]); // A4
    page.drawText("Coloreo", { x: 60, y: 760, size: 28, font, color: rgb(0.49, 0.3, 1) });
    page.drawText(book.title_de, { x: 60, y: 710, size: 18, font, color: rgb(0.17, 0.15, 0.25) });
    page.drawText(`Seite ${i + 1} (Platzhalter – echtes Motiv folgt)`, {
      x: 60, y: 670, size: 12, font, color: rgb(0.55, 0.5, 0.6),
    });
    page.drawRectangle({ x: 60, y: 120, width: 475, height: 520, borderColor: rgb(0.8, 0.78, 0.85), borderWidth: 1.5 });
  }
  return await doc.save();
}

/** Bettet ein personalisiertes Wasserzeichen (Käufer-E-Mail + Bestellnr.) auf jeder Seite ein. */
export async function watermarkPdf(
  master: Uint8Array,
  opts: { email: string; orderNumber: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(master);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = `Lizenziert für ${opts.email} · Bestellung ${opts.orderNumber} · Nur privater Gebrauch`;
  for (const page of doc.getPages()) {
    const { width } = page.getSize();
    page.drawText(text, {
      x: 30,
      y: 16,
      size: 7,
      font,
      color: rgb(0.6, 0.6, 0.65),
      maxWidth: width - 60,
    });
  }
  return await doc.save();
}

/** Erzeugt das personalisierte PDF und legt es im 'downloads'-Bucket ab. Gibt den Storage-Pfad zurück. */
export async function produceWatermarkedDownload(
  admin: Admin,
  book: { id: string; title_de: string; pdf_path: string | null; page_count: number },
  orderId: string,
  opts: { email: string; orderNumber: string }
): Promise<string> {
  const master = await getMasterPdfBytes(admin, book);
  const stamped = await watermarkPdf(master, opts);
  const path = `${orderId}/${book.id}.pdf`;
  await admin.storage.from("downloads").upload(path, stamped, {
    contentType: "application/pdf",
    upsert: true,
  });
  return path;
}
