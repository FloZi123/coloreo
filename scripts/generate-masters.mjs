import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pagePaths, styleForCategory, hashSeed } from "./lib-art.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
// Service-Key bevorzugen, damit auch Entwürfe (draft) sichtbar sind (sonst RLS).
const key =
  env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes("PLACEHOLDER")
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

const PAGES_PER_BOOK = 24;

const { data: cats } = await sb.from("categories").select("id, slug, name_de");
const catById = new Map(cats.map((c) => [c.id, c]));
const { data: books } = await sb.from("books").select("id, slug, title_de, category_id");

const outDir = join(root, "public", "masters");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

let n = 0;
for (const book of books) {
  const cat = catById.get(book.category_id);
  const primary = styleForCategory(cat?.slug ?? book.slug);
  const alt = primary === "mandala" ? "grid" : "mandala";

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < PAGES_PER_BOOK; p++) {
    const page = doc.addPage([595, 842]); // A4
    // Abwechslung: jede 3. Seite der alternative Stil
    const style = p % 3 === 2 ? alt : primary;
    const d = pagePaths(style, hashSeed(book.slug + "#" + p), 297, 470, style === "grid" ? 250 : 245).join(" ");
    page.drawSvgPath(d, { x: 0, y: 842, borderColor: rgb(0.1, 0.1, 0.12), borderWidth: 1.4 });
    page.drawText(`Coloreo · ${book.title_de}`, { x: 37, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
    page.drawText(`${p + 1} / ${PAGES_PER_BOOK}`, { x: 520, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
  }
  writeFileSync(join(outDir, `${book.slug}.pdf`), await doc.save());
  n++;
}
console.log(`✓ ${n} Master-PDFs erzeugt (alle Bücher, ${PAGES_PER_BOOK} Seiten je Buch)`);
