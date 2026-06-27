/**
 * Social-Content-Pipeline: erzeugt pro Buch 6 Pinterest-Pins + Flip-Through- & Reveal-Video
 * (+ Manifest) in public/social/<slug>/.
 *   npx tsx scripts/generate-social.ts <slug> [<slug> …]   # einzelne Bücher
 *   npx tsx scripts/generate-social.ts --all               # alle veröffentlichten
 * Flags: --upload (nach Supabase-Bucket social-assets) · --flat (flache Markenfüllung statt
 *        realistischer AI-Farben) · --force (Vorhandenes neu erzeugen statt überspringen).
 * Voraussetzung: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ REPLICATE_API_TOKEN) in .env.local.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { pdfToFrames, pickSpread, type Frame } from "../src/lib/social/frames";
import { makePin } from "../src/lib/social/pins";
import { renderFlipThrough, renderReveal } from "../src/lib/social/video";
import { realisticColored, flatColored } from "../src/lib/social/colorize";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const PIN_COUNT = 6;
const FLIP_PAGES = 6;
const DOMAIN = "https://coloreo.shop";
const BUCKET = "social-assets";
const UPLOAD = process.argv.includes("--upload");
const FLAT = process.argv.includes("--flat"); // flache Markenfüllung statt realistischer AI-Farben
const FORCE = process.argv.includes("--force"); // Vorhandenes neu erzeugen
const rep = new Replicate({ auth: process.env.REPLICATE_API_TOKEN ?? "" });

// --locale de,en  → Sprachen für die Assets (Default: de). Die KI-Kolorierung läuft trotzdem nur EINMAL.
const li = process.argv.indexOf("--locale");
const LOCALES = (li >= 0 && process.argv[li + 1] ? process.argv[li + 1].split(",") : ["de"]).map((s) => s.trim());

type Loc = "de" | "en" | "fr" | "es" | "it" | "nl";
const pick = (row: Record<string, unknown>, field: "title" | "name", locale: string): string => {
  const t = (row.i18n as Record<string, { title?: string; name?: string }> | undefined)?.[locale]?.[field];
  if (t && String(t).trim()) return String(t);
  return String(row[`${field}_${locale === "de" ? "de" : "en"}`] ?? row[`${field}_de`] ?? "");
};

const linkFor = (slug: string, channel: string, locale: string) =>
  `${DOMAIN}/${locale}/buch/${slug}?utm_source=${channel}&utm_medium=organic&utm_campaign=${slug}`;

async function processBook(slug: string) {
  const { data: book } = await sb.from("books").select("slug, title_de, title_en, i18n, cover_url, pdf_path, category_id").eq("slug", slug).maybeSingle();
  if (!book) { console.warn(`  ⚠ ${slug}: Buch nicht gefunden`); return; }
  let cat: Record<string, unknown> = {};
  if (book.category_id) {
    const { data: c } = await sb.from("categories").select("name_de, name_en, i18n").eq("id", book.category_id).maybeSingle();
    cat = (c as Record<string, unknown>) ?? {};
  }
  const dir = join(root, "public", "social", slug);
  const done = (l: string) => existsSync(join(dir, l, "social.json")) && existsSync(join(dir, l, "video-flip.mp4"));
  if (!FORCE && LOCALES.every(done)) {
    console.log(`⏭  ${slug}: bereits vorhanden (--force zum Neu-Erzeugen)`);
    return;
  }
  const pdfPath = book.pdf_path ?? `${slug}.pdf`;
  const { data: pdfBlob, error } = await sb.storage.from("books").download(pdfPath);
  if (error || !pdfBlob) { console.warn(`  ⚠ ${slug}: PDF-Download fehlgeschlagen (${error?.message})`); return; }
  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());

  console.log(`▶ ${slug} – Frames extrahieren …`);
  const frames = await pdfToFrames(pdfBytes, { scale: 2 });

  // Seiten auswählen + EINMALIGE Kolorierung (sprach-neutral, von allen Locales geteilt)
  const pageFrames = pickSpread(frames, Math.max(PIN_COUNT, FLIP_PAGES));
  const revealFrame = frames[Math.floor(frames.length / 2)];
  const unique = [...pageFrames];
  if (!unique.includes(revealFrame)) unique.push(revealFrame);
  console.log(`  … koloriere ${unique.length} Seiten (${FLAT ? "flach" : "realistisch/AI"}) – einmal für ${LOCALES.join("/")} …`);
  const colorMap = new Map<Frame, Buffer>();
  for (const f of unique) {
    const cw = 800, ch = Math.max(1, Math.round((cw * f.height) / f.width));
    colorMap.set(f, FLAT ? await flatColored(f, cw, ch) : await realisticColored(rep, f, cw, ch));
  }

  // Cover für Hook (optional)
  let coverBytes: Buffer | null = null;
  const coverFile = (book.cover_url?.split("/").pop()) || `${slug}.png`;
  const { data: covBlob } = await sb.storage.from("covers").download(coverFile);
  if (covBlob) coverBytes = Buffer.from(await covBlob.arrayBuffer());

  const pinFrames = pageFrames.slice(0, PIN_COUNT);
  const flipPages = pageFrames.slice(0, FLIP_PAGES).map((f) => ({ frame: f, colored: colorMap.get(f)! }));

  // Pro Sprache: nur die (billigen) Text-Overlays neu rendern
  for (const loc of LOCALES) {
    const title = pick(book as Record<string, unknown>, "title", loc);
    const category = pick(cat, "name", loc);
    const lDir = join(dir, loc);
    mkdirSync(lDir, { recursive: true });
    const localPaths: string[] = [];
    console.log(`  ▸ ${loc}: Pins + Videos …`);

    const pins: string[] = [];
    for (let i = 0; i < pinFrames.length; i++) {
      const webp = await makePin(pinFrames[i], colorMap.get(pinFrames[i])!, { title, category, locale: loc as Loc });
      const fp = join(lDir, `pin-${i + 1}.webp`); writeFileSync(fp, webp);
      pins.push(`public/social/${slug}/${loc}/pin-${i + 1}.webp`); localPaths.push(fp);
    }
    const flipOut = join(lDir, "video-flip.mp4");
    await renderFlipThrough({ title }, coverBytes ?? frames[0].png, flipPages, flipOut, loc as Loc);
    localPaths.push(flipOut);
    const revealOut = join(lDir, "video-reveal.mp4");
    await renderReveal({ title }, { frame: revealFrame, colored: colorMap.get(revealFrame)! }, revealOut, loc as Loc);
    localPaths.push(revealOut);

    const manifest = {
      slug, locale: loc, title, category,
      links: { tiktok: linkFor(slug, "tiktok", loc), instagram: linkFor(slug, "instagram", loc), pinterest: linkFor(slug, "pinterest", loc) },
      pins, videos: [`public/social/${slug}/${loc}/video-flip.mp4`, `public/social/${slug}/${loc}/video-reveal.mp4`],
      bucket: UPLOAD ? BUCKET : null,
    };
    const mPath = join(lDir, "social.json"); writeFileSync(mPath, JSON.stringify(manifest, null, 2)); localPaths.push(mPath);

    if (UPLOAD) {
      await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});
      for (const fp of localPaths) {
        const rel = `${slug}/${loc}/${fp.split(/[\\/]/).pop()}`;
        const ct = fp.endsWith(".mp4") ? "video/mp4" : fp.endsWith(".webp") ? "image/webp" : "application/json";
        await sb.storage.from(BUCKET).upload(rel, readFileSync(fp), { contentType: ct, upsert: true });
      }
    }
    console.log(`  ✓ ${loc}: ${pins.length} Pins + 2 Videos${UPLOAD ? " (hochgeladen)" : ""}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let slugs: string[];
  if (args.includes("--all")) {
    const { data } = await sb.from("books").select("slug").eq("status", "published");
    slugs = (data ?? []).map((b) => b.slug);
  } else {
    // Wert direkt nach --locale ist kein Slug
    slugs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--locale");
  }
  if (!slugs.length) { console.error("Kein Slug. Nutzung: generate-social.ts <slug> | --all"); process.exit(1); }
  console.log(`Social-Assets für ${slugs.length} Buch/Bücher${FLAT ? " [flach]" : ""}${UPLOAD ? " [upload]" : ""}${FORCE ? " [force]" : ""}:`);
  let ok = 0; const failed: string[] = [];
  for (const s of slugs) {
    try { await processBook(s); ok++; }
    catch (e) { failed.push(s); console.error(`✖ ${s}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`FERTIG · ${ok}/${slugs.length} ok${failed.length ? ` · Fehler: ${failed.join(", ")}` : ""}`);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
