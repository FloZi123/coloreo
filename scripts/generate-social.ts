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
import { renderFlipThrough, renderReveal } from "../src/lib/social/video";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const PIN_COUNT = 6;
const FLIP_PAGES = 8;
const DOMAIN = "https://coloreo.de";
const BUCKET = "social-assets";
const UPLOAD = process.argv.includes("--upload");

const linkFor = (slug: string, channel: string) =>
  `${DOMAIN}/de/buch/${slug}?utm_source=${channel}&utm_medium=organic&utm_campaign=${slug}`;

async function processBook(slug: string) {
  const { data: book } = await sb.from("books").select("slug, title_de, cover_url, pdf_path, category_id").eq("slug", slug).maybeSingle();
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
  const dir = join(root, "public", "social", slug);
  mkdirSync(dir, { recursive: true });
  const localPaths: string[] = [];

  // Pins
  const pinFrames = pickSpread(frames, PIN_COUNT);
  const pins: string[] = [];
  for (let i = 0; i < pinFrames.length; i++) {
    const webp = await makePin(pinFrames[i], { title: book.title_de, category, locale: "de" });
    const name = `pin-${i + 1}.webp`;
    writeFileSync(join(dir, name), webp);
    pins.push(`public/social/${slug}/${name}`); localPaths.push(join(dir, name));
  }
  console.log(`  ✓ ${pins.length} Pins`);

  // Cover für Hook
  let coverBytes: Buffer | null = null;
  const coverFile = (book.cover_url?.split("/").pop()) || `${slug}.png`;
  const { data: covBlob } = await sb.storage.from("covers").download(coverFile);
  if (covBlob) coverBytes = Buffer.from(await covBlob.arrayBuffer());

  // Videos
  const videos: string[] = [];
  console.log(`  … Flip-Through rendern`);
  const flipOut = join(dir, "video-flip.mp4");
  await renderFlipThrough({ title: book.title_de }, coverBytes ?? frames[0].png, pickSpread(frames, FLIP_PAGES), flipOut);
  videos.push(`public/social/${slug}/video-flip.mp4`); localPaths.push(flipOut);

  console.log(`  … Reveal rendern`);
  const revealOut = join(dir, "video-reveal.mp4");
  await renderReveal({ title: book.title_de }, [frames[Math.floor(frames.length / 2)]], revealOut);
  videos.push(`public/social/${slug}/video-reveal.mp4`); localPaths.push(revealOut);
  console.log(`  ✓ 2 Videos`);

  const manifest = {
    slug, title: book.title_de, category,
    links: { tiktok: linkFor(slug, "tiktok"), instagram: linkFor(slug, "instagram"), pinterest: linkFor(slug, "pinterest") },
    pins, videos,
    bucket: UPLOAD ? BUCKET : null,
  };
  writeFileSync(join(dir, "social.json"), JSON.stringify(manifest, null, 2));
  localPaths.push(join(dir, "social.json"));

  if (UPLOAD) {
    await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});
    for (const fp of localPaths) {
      const rel = `${slug}/${fp.split(/[\\/]/).pop()}`;
      const ct = fp.endsWith(".mp4") ? "video/mp4" : fp.endsWith(".webp") ? "image/webp" : "application/json";
      await sb.storage.from(BUCKET).upload(rel, readFileSync(fp), { contentType: ct, upsert: true });
    }
    console.log(`  ✓ ${localPaths.length} Dateien → Bucket ${BUCKET}`);
  }
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
