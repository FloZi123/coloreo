import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mandalaPaths, hashSeed } from "./lib-art.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Muster-freundliche Kategorien (prozedural als echte Linienkunst erzeugbar)
const PATTERN_CATS = ["mandalas", "geometrisch", "paisley-henna", "japan-zen", "blumen-botanik"];
const PAGES_PER_BOOK = 24;

const { data: cats } = await sb.from("categories").select("id, slug, name_de");
const catBySlug = new Map(cats.map((c) => [c.slug, c]));
const catIds = PATTERN_CATS.map((s) => catBySlug.get(s)?.id).filter(Boolean);
const { data: books } = await sb
  .from("books")
  .select("id, slug, title_de, category_id")
  .in("category_id", catIds);

const outDir = join(root, "public", "masters");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const updated = [];
for (const book of books) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < PAGES_PER_BOOK; p++) {
    const page = doc.addPage([595, 842]); // A4
    // Mandala in 520er-Box, zentriert
    const paths = mandalaPaths(hashSeed(book.slug + "#" + p), 260, 260, 245);
    const d = paths.join(" ");
    page.drawSvgPath(d, {
      x: 37,
      y: 800,
      borderColor: rgb(0.1, 0.1, 0.12),
      borderWidth: 1.4,
    });
    page.drawText(`Coloreo · ${book.title_de}`, { x: 37, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
    page.drawText(`${p + 1} / ${PAGES_PER_BOOK}`, { x: 520, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
  }
  const bytes = await doc.save();
  writeFileSync(join(outDir, `${book.slug}.pdf`), bytes);
  updated.push(book.slug);
}
console.log(`✓ ${updated.length} Master-PDFs erzeugt (${PAGES_PER_BOOK} Seiten je Buch)`);
console.log(updated.join(","));
