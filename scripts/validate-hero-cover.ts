/**
 * Validiert die Hero-Cover-Produktion (GENAU EIN Buch), 72 Bücher bleiben aktiv.
 *   npx tsx scripts/validate-hero-cover.ts <hero-slug>   → letzte Zeile "HERO COVER PASS".
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : "");
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);
const SLUG = process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) ?? "cottagecore-tag-im-landhaus";
const dirRel = `.cover-examples/${SLUG}`;

// ── Regeln aus den Cover-Goals (statisch) ────────────────────────────────────
const thematic = read("src/lib/generator/thematic.ts");
const coverFns = (thematic.match(/export async function generateCoverImage[\s\S]*?\n}/)?.[0] ?? "") +
  (thematic.match(/async function renderOneCover[\s\S]*?\n}/)?.[0] ?? "");
if (/fill="#1a1a1a"/.test(thematic) || /\.extract\(\{\s*left:\s*MID/.test(coverFns)) errs.push("Cover ist nicht voll koloriert / noch Split");
if (!/fit:\s*"cover"/.test(coverFns)) errs.push("Cover nicht als eine volle Fläche komponiert");
if (!/no text, no letters, no words, no title, no banner, no signage/.test(thematic)) errs.push("Bild-Prompt verbietet Buchstaben nicht (NOTEXT)");
if (/disclosure/i.test(coverFns)) errs.push("KI-Disclosure auf der Cover-Kunst (gehört auf die Produktseite)");
if (!read("src/components/AiDisclosureBadge.tsx") || !/AiDisclosureBadge/.test(read("src/components/Footer.tsx"))) errs.push("KI-Disclosure off-art fehlt (AiDisclosureBadge auf der Produktseite)");
if (!errs.length) ok("Cover-Regeln: voll koloriert, kein Split, keine Buchstaben, Disclosure off-art");

// ── 1) HERO-COVER FINAL (Best-of-N + menschliche Auswahl) ────────────────────
const candJson = read(`${dirRel}/candidates.json`);
const selJson = read(`${dirRel}/selection.json`);
let chosenSeed: number | null = null;
if (!candJson) errs.push(`candidates.json fehlt in ${dirRel}/ (Best-of-N)`);
if (!selJson) errs.push(`selection.json fehlt in ${dirRel}/ (menschliche Auswahl)`);
if (candJson && selJson) {
  const cand = JSON.parse(candJson) as { n: number; presorted?: string; candidates: { seed: number; score: number }[] };
  const sel = JSON.parse(selJson) as { chosenSeed: number };
  chosenSeed = sel.chosenSeed;
  if (cand.n < 4) errs.push("Best-of-N: < 4 Kandidaten");
  if (!cand.presorted) errs.push("Best-of-N: keine Vorsortierung dokumentiert");
  const seeds = cand.candidates.map((c) => c.seed);
  if (new Set(seeds).size !== seeds.length) errs.push("Best-of-N: Seeds nicht eindeutig");
  if (!seeds.includes(sel.chosenSeed)) errs.push(`Auswahl ${sel.chosenSeed} ist kein Kandidat`);
  if (!existsSync(join(root, dirRel, `FINAL-seed${sel.chosenSeed}.png`))) errs.push("Kein finalisiertes Cover (FINAL-seed<seed>.png)");
  if (!errs.length) ok(`Best-of-N (${cand.n}) + menschliche Auswahl seed=${sel.chosenSeed} (reproduzierbar) + FINAL vorhanden`);
}

// ── 2) NUR DAS HERO-BUCH (kein anderes Cover produziert) ─────────────────────
const exRoot = join(root, ".cover-examples");
if (existsSync(exRoot)) {
  const withSel = readdirSync(exRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(exRoot, e.name, "selection.json")))
    .map((e) => e.name);
  if (withSel.length !== 1 || withSel[0] !== SLUG) errs.push(`Nur das Hero-Buch darf finalisiert sein – gefunden: ${withSel.join(", ") || "keins"}`);
  else ok("Nur das Hero-Buch finalisiert (kein katalogweiter Re-Cover)");
}

// ── Text-Heuristik auf dem finalen Cover ─────────────────────────────────────
async function detectText(png: Buffer): Promise<boolean> {
  const W = 420;
  const { data, info } = await sharp(png).resize(W, null, { fit: "inside" }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, H = info.height, x0 = Math.round(w * 0.14), x1 = Math.round(w * 0.86), seg = x1 - x0;
  for (let y = Math.round(H * 0.82); y < H; y++) {
    let lg = 0, t = 0, prev = false;
    for (let x = x0; x < x1; x++) { const v = data[y * w + x]; if (v > 195) lg++; const d = v < 110; if (d !== prev) t++; prev = d; }
    if (lg / seg >= 0.6 && lg / seg <= 0.985 && (t / seg) * 100 >= 16) return true;
  }
  return false;
}

async function main() {
  if (chosenSeed != null) {
    const fp = join(root, dirRel, `FINAL-seed${chosenSeed}.png`);
    if (existsSync(fp) && (await detectText(readFileSync(fp)))) errs.push("Finales Cover: Text/Wortband in der Kunst erkannt");
    else if (existsSync(fp)) ok("Finales Cover: keine Buchstaben-Bänder erkannt");
  }

  // ── 3) 72 BÜCHER BLEIBEN + Hero-Cover in DB gesetzt ────────────────────────
  for (const l of read(".env.local").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { errs.push("Supabase-Env fehlt (DB-Prüfung nicht möglich)"); return; }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { count } = await sb.from("books").select("*", { count: "exact", head: true }).eq("status", "published");
  if ((count ?? 0) < 72) errs.push(`Nur ${count} veröffentlichte Bücher (erwartet ≥ 72) – Katalog verändert?`);
  else ok(`${count} Bücher weiterhin veröffentlicht (Katalog unverändert)`);
  const { data: hero } = await sb.from("books").select("status, cover_url").eq("slug", SLUG).maybeSingle();
  if (!hero) errs.push(`Hero-Buch ${SLUG} nicht gefunden`);
  else {
    if (hero.status !== "published") errs.push(`Hero-Buch ${SLUG} nicht veröffentlicht`);
    if (!/\?v=\d+/.test(hero.cover_url ?? "")) errs.push("Hero cover_url ohne Cache-Bust (?v) – Cover nicht gesetzt");
    else ok(`Hero-Cover in DB gesetzt (${SLUG}, cover_url mit ?v)`);
  }
}

main().then(() => {
  if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nHERO COVER FAIL (${errs.length})`); process.exit(1); }
  console.log("\nHERO COVER PASS");
}).catch((e) => { console.log("✗ " + (e instanceof Error ? e.stack : e)); console.log("\nHERO COVER FAIL (1)"); process.exit(1); });
