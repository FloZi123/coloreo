// Lädt alle Master-PDFs in den privaten 'books'-Bucket (raus aus Git/Vercel) und
// erzeugt wasserzeichen-Vorschaubilder (erste Seiten) für die Kunden-Vorschau.
import { createClient } from "@supabase/supabase-js";
import { pdf } from "pdf-to-img";
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PREVIEW_PAGES = 5;
const PREVIEW_WIDTH = 700;

function watermarkSvg(w, h) {
  const tiles = [];
  for (let y = -20; y < h + 150; y += 150) {
    for (let x = -40; x < w + 230; x += 230) {
      tiles.push(`<text x="${x}" y="${y}" font-family="Arial" font-size="22" fill="#7c4dff" fill-opacity="0.22" font-weight="700" transform="rotate(-30 ${x} ${y})">COLOREO · VORSCHAU</text>`);
    }
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${tiles.join("")}</svg>`);
}

const { data: books } = await sb.from("books").select("id, slug, page_count");
console.log(`Verarbeite ${books.length} Bücher …`);

let done = 0;
for (const book of books) {
  const localPdf = join(root, "public", "masters", `${book.slug}.pdf`);
  if (!existsSync(localPdf)) { console.warn(`  ⚠ kein lokales PDF: ${book.slug}`); continue; }

  // 1) Master in privaten 'books'-Bucket laden
  const bytes = readFileSync(localPdf);
  const up = await sb.storage.from("books").upload(`${book.slug}.pdf`, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) { console.error(`  ✗ Upload ${book.slug}: ${up.error.message}`); continue; }

  // 2) Wasserzeichen-Vorschaubilder erzeugen
  const outDir = join(root, "public", "previews-wm", book.slug);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const previewUrls = [];
  const doc = await pdf(localPdf, { scale: 1.4 });
  let p = 0;
  for await (const pageBuf of doc) {
    if (p >= PREVIEW_PAGES) break;
    p++;
    const resized = await sharp(pageBuf).resize({ width: PREVIEW_WIDTH }).png().toBuffer();
    const meta = await sharp(resized).metadata();
    const out = await sharp(resized).composite([{ input: watermarkSvg(meta.width, meta.height), top: 0, left: 0 }]).webp({ quality: 78 }).toBuffer();
    writeFileSync(join(outDir, `p${p}.webp`), out);
    previewUrls.push(`/previews-wm/${book.slug}/p${p}.webp`);
  }

  // 3) DB aktualisieren: pdf_path -> Storage-Pfad, preview_urls -> Bilder
  await sb.from("books").update({ pdf_path: `${book.slug}.pdf`, preview_urls: previewUrls }).eq("id", book.id);

  done++;
  if (done % 10 === 0 || done === books.length) console.log(`  ✓ ${done}/${books.length}`);
}
console.log(`Fertig: ${done} Bücher in Storage + Vorschauen erzeugt.`);
