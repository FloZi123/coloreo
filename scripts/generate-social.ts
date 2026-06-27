/**
 * Social-Content-Pipeline (Phase 2: Pins). Erzeugt aus dem Master-PDF eines Buchs
 * gebrandete 2:3-Pinterest-Pins + Manifest in public/social/<slug>/.
 *   npx tsx scripts/generate-social.ts <slug> [<slug> …]
 *   npx tsx scripts/generate-social.ts --all
 * Voraussetzung: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { pdfToFrames, pickSpread } from "../src/lib/social/frames";
import { makePin } from "../src/lib/social/pins";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const PIN_COUNT = 6;

async function processBook(slug: string) {
  const { data: book } = await sb.from("books").select("slug, title_de, pdf_path, category_id").eq("slug", slug).maybeSingle();
  if (!book) { console.warn(`  ⚠ ${slug}: Buch nicht gefunden`); return; }
  let category = "";
  if (book.category_id) {
    const { data: c } = await sb.from("categories").select("name_de").eq("id", book.category_id).maybeSingle();
    category = c?.name_de ?? "";
  }
  const pdfPath = book.pdf_path ?? `${slug}.pdf`;
  const { data: pdfBlob, error } = await sb.storage.from("books").download(pdfPath);
  if (error || !pdfBlob) { console.warn(`  ⚠ ${slug}: PDF-Download fehlgeschlagen (${error?.message})`); return; }
  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());

  console.log(`▶ ${slug} – Frames extrahieren …`);
  const frames = await pdfToFrames(pdfBytes, { scale: 2 });
  const chosen = pickSpread(frames, PIN_COUNT);
  const dir = join(root, "public", "social", slug);
  mkdirSync(dir, { recursive: true });

  const pins: string[] = [];
  for (let i = 0; i < chosen.length; i++) {
    const webp = await makePin(chosen[i], { title: book.title_de, category, locale: "de" });
    const name = `pin-${i + 1}.webp`;
    writeFileSync(join(dir, name), webp);
    pins.push(`public/social/${slug}/${name}`);
  }
  console.log(`  ✓ ${pins.length} Pins`);

  const manifest = {
    slug, title: book.title_de, category,
    generatedAt: process.env.SOCIAL_TS || null,
    pins, videos: [] as string[],
  };
  writeFileSync(join(dir, "social.json"), JSON.stringify(manifest, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  let slugs: string[];
  if (args.includes("--all")) {
    const { data } = await sb.from("books").select("slug").eq("status", "published");
    slugs = (data ?? []).map((b) => b.slug);
  } else {
    slugs = args.filter((a) => !a.startsWith("--"));
  }
  if (!slugs.length) { console.error("Kein Slug. Nutzung: generate-social.ts <slug> | --all"); process.exit(1); }
  console.log(`Social-Assets für ${slugs.length} Buch/Bücher:`);
  for (const s of slugs) await processBook(s);
  console.log("FERTIG");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
