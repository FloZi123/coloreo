/**
 * Günstiges Cover-Rebranding OHNE Neu-Generierung: legt über den alten (Coral/Fredoka-)
 * Branding-Balken oben einen deckenden neuen erdigen Balken + Serif-Wortmarke (src/lib/brand.ts).
 * Lädt jedes veröffentlichte Cover, überlagert, lädt es zurück (upsert) und bumpt cover_url ?v.
 *   npx tsx scripts/rebrand-covers.ts            # alle veröffentlichten Cover
 *   npx tsx scripts/rebrand-covers.ts <slug> …   # einzelne
 * Voraussetzung: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { BRAND, wordmarkSvg } from "../src/lib/brand";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of (existsSync(join(root, ".env.local")) ? readFileSync(join(root, ".env.local"), "utf8") : "").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const BUCKET = "covers";

/** Deckender neuer Branding-Balken (überdeckt den alten vollständig). */
function newBrandBar(W: number, H: number): Buffer {
  const barH = Math.max(40, Math.round((H * 76) / 800));
  const size = Math.round((36 * H) / 800);
  const y = Math.round((50 * H) / 800);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<rect x="0" y="0" width="${W}" height="${barH}" fill="#1C1815"/>` + // opak → alter Balken verschwindet
      wordmarkSvg(W / 2, y, size, BRAND.ivory) +
      `</svg>`
  );
}

async function rebrand(slug: string): Promise<boolean> {
  const { data: book } = await sb.from("books").select("slug, cover_url").eq("slug", slug).maybeSingle();
  if (!book?.cover_url) { console.warn(`  ⚠ ${slug}: kein cover_url`); return false; }
  const file = book.cover_url.split("/").pop()!.split("?")[0]; // <slug>.png
  const { data: blob, error } = await sb.storage.from(BUCKET).download(file);
  if (error || !blob) { console.warn(`  ⚠ ${slug}: Download fehlgeschlagen (${error?.message})`); return false; }
  const buf = Buffer.from(await blob.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const W = meta.width ?? 600, H = meta.height ?? 800;

  const out = await sharp(buf).composite([{ input: newBrandBar(W, H), left: 0, top: 0 }]).png().toBuffer();
  const up = await sb.storage.from(BUCKET).upload(file, out, { contentType: "image/png", upsert: true });
  if (up.error) { console.warn(`  ⚠ ${slug}: Upload fehlgeschlagen (${up.error.message})`); return false; }

  const base = book.cover_url.split("?")[0];
  const v = Date.now();
  await sb.from("books").update({ cover_url: `${base}?v=${v}` }).eq("slug", slug);
  console.log(`  ✓ ${slug} (${W}×${H}) rebranded + Cache-Bust ?v=${v}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  let slugs = args;
  if (!slugs.length) {
    const { data } = await sb.from("books").select("slug").eq("status", "published").not("cover_url", "is", null);
    slugs = (data ?? []).map((b) => b.slug);
  }
  console.log(`Cover-Rebranding für ${slugs.length} Buch/Bücher …`);
  let ok = 0;
  for (const s of slugs) { if (await rebrand(s)) ok++; }
  console.log(`FERTIG · ${ok}/${slugs.length} rebranded`);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
