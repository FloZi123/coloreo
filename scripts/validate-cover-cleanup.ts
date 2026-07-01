/**
 * Validiert das Cover-Cleanup: keine Buchstaben in der Kunst, Marken-Rahmen als Vektor, Artefakt-Gate.
 *   npx tsx scripts/validate-cover-cleanup.ts   → letzte Zeile "COVER CLEANUP PASS".
 * Erwartet Beispiel-Cover in .cover-examples/ (via scripts/gen-example-covers.ts).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : "");
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

const thematic = read("src/lib/generator/thematic.ts");
const pins = read("src/lib/social/pins.ts");
const cover = thematic.match(/export async function generateCoverImage[\s\S]*?\n}/)?.[0] ?? "";

// ── 1) KEINE BUCHSTABEN IM BILD-PROMPT ───────────────────────────────────────
const NOTEXT_RE = /no text, no letters, no words, no title, no banner, no signage/;
if (!NOTEXT_RE.test(thematic)) errs.push("thematic.ts: Bild-Prompt verbietet Text nicht hart (no text, no letters, no words, no title, no banner, no signage)");
if (!/\$\{NOTEXT\}/.test(cover) && !NOTEXT_RE.test(cover)) errs.push("generateCoverImage: NOTEXT nicht in Linien- UND Farb-Prompt");
if (!errs.length) ok("Bild-Prompt verbietet Buchstaben/Bänder hart (Linien- + Farb-Prompt)");

// ── 2) VEKTOR-RAHMEN (nicht mitgeneriert) ────────────────────────────────────
const brandFn = thematic.match(/function brandingOverlay[\s\S]*?\n}/)?.[0] ?? "";
const vectorRect = (s: string) => /<rect[^>]*fill="none"[^>]*stroke=|stroke=[^>]*fill="none"/.test(s) || /fill="none"/.test(s);
if (!vectorRect(brandFn)) errs.push("brandingOverlay: Marken-Rahmen nicht als Vektor-Rect (fill=none stroke=…)");
if (!vectorRect(pins)) errs.push("pins.ts: Marken-Rahmen nicht als Vektor-Rect");
if (!/no frame, no border/.test(thematic)) errs.push("thematic.ts: 'no frame, no border' fehlt im Bild-Prompt (Modell-Rahmen nicht unterbunden)");
if (!errs.length) ok("Marken-Rahmen = sauberer Vektor im Compositing; kein Modell-Rahmen im Prompt");

// ── Reproduzierbarkeit (fester Seed + Logging) ───────────────────────────────
if (!/hashSeed\(/.test(cover) || !/console\.log\([\s\S]*?seed=/.test(cover)) errs.push("generateCoverImage: kein fester Seed (hashSeed) / kein Seed-Logging");

// ── 3) ARTEFAKT-GATE: Text-Heuristik auf Beispielen + Kontaktbogen ───────────
/**
 * Erkennt ein Text-/Titel-BANNER: ein dünnes, überwiegend HELLES Horizontalband mit dunklen
 * Buchstaben-Clustern (das typische Fehlerbild: „THE MOON"-Band auf hellem Streifen), unter der
 * Wortmarke. Pro Zeile: Hell-Anteil + Hell/Dunkel-Wechsel; ein Banner = mehrere aufeinanderfolgende
 * Zeilen mit hohem Hell-Anteil UND Buchstaben-Wechseln, die sich vom (dunkleren/detaillierten) Umfeld abheben.
 */
async function detectText(png: Buffer): Promise<{ text: boolean; y?: number }> {
  const W = 420;
  const { data, info } = await sharp(png).resize(W, null, { fit: "inside" }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, H = info.height;
  const x0 = Math.round(w * 0.14), x1 = Math.round(w * 0.86), seg = x1 - x0;
  const yStart = Math.round(H * 0.11); // Wortmarke oben ausschließen
  const light: number[] = new Array(H).fill(0); // Anteil heller Pixel je Zeile
  const trans: number[] = new Array(H).fill(0); // Buchstaben-Wechsel je 100px
  for (let y = 0; y < H; y++) {
    let lg = 0, t = 0, prev = false;
    for (let x = x0; x < x1; x++) {
      const v = data[y * w + x];
      if (v > 195) lg++;
      const d = v < 110; if (d !== prev) t++; prev = d;
    }
    light[y] = lg / seg;
    trans[y] = (t / seg) * 100;
  }
  // Titel-Banner sitzen real am UNTEREN Rand; obere Bildhälfte (Himmel/Sterne/Mond) ausklammern (Fehlalarme).
  const inBannerZone = (y: number) => y >= Math.round(H * 0.82);
  // Konservativ: nur ein deutlich helles Banner-Band mit DICHTEN Buchstaben (kein Fehlalarm auf Laub/Hügeln).
  const isBannerRow = (y: number) => inBannerZone(y) && light[y] >= 0.6 && light[y] <= 0.985 && trans[y] >= 16;
  let y = yStart;
  while (y < H) {
    if (isBannerRow(y)) {
      let j = y; while (j < H && isBannerRow(j)) j++;
      const bandH = j - y;
      if (bandH >= Math.round(H * 0.012) && bandH <= Math.round(H * 0.13)) {
        // Kontrast zum Umfeld: direkt darüber/darunter deutlich weniger hell (Kunst) → isolierter Banner-Streifen.
        const above = y - Math.round(H * 0.02);
        const below = j + Math.round(H * 0.02);
        const aOk = above < yStart || light[above] < light[y] - 0.12;
        const bOk = below >= H || light[below] < light[Math.min(j - 1, H - 1)] - 0.12;
        if (aOk || bOk) return { text: true, y: Math.round((y / H) * 100) };
      }
      y = j + 1;
    } else y++;
  }
  return { text: false };
}

async function gate() {
  const dir = join(root, ".cover-examples");
  if (!existsSync(dir)) { errs.push("Keine Beispiel-Cover (.cover-examples/) – erst scripts/gen-example-covers.ts laufen lassen"); return; }
  const files = readdirSync(dir).filter((f) => /\.png$/.test(f) && !f.startsWith("_"));
  if (!files.length) { errs.push("Keine Beispiel-Cover in .cover-examples/"); return; }
  const thumbs: { input: Buffer; left: number; top: number }[] = [];
  const TW = 260, gap = 12; let flagged = 0;
  for (let i = 0; i < files.length; i++) {
    const buf = readFileSync(join(dir, files[i]));
    const res = await detectText(buf);
    if (res.text) { flagged++; errs.push(`Beispiel ${files[i]}: Text/Wortband erkannt (y≈${res.y}%) → mit neuem Seed (variant+1) neu erzeugen`); }
    const th = await sharp(buf).resize(TW).png().toBuffer();
    const m = await sharp(th).metadata();
    thumbs.push({ input: th, left: gap + i * (TW + gap), top: gap });
    console.log(`  · ${files[i]}: ${res.text ? "TEXT erkannt ✗" : "sauber ✓"} (${m.width}×${m.height})`);
  }
  // Kontaktbogen zur Sichtprüfung.
  const th0 = await sharp(thumbs[0].input).metadata();
  const sheetW = gap + files.length * (TW + gap), sheetH = gap * 2 + (th0.height ?? TW);
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: { r: 245, g: 240, b: 230 } } })
    .composite(thumbs).png().toFile(join(dir, "_contact-sheet.png"));
  console.log(`  ▸ Kontaktbogen: .cover-examples/_contact-sheet.png`);
  if (!flagged) ok(`Artefakt-Gate: ${files.length} Beispiel-Cover ohne erkannten Text`);
}

gate().then(() => {
  if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nCOVER CLEANUP FAIL (${errs.length})`); process.exit(1); }
  console.log("\nCOVER CLEANUP PASS");
}).catch((e) => { console.log("✗ " + (e instanceof Error ? e.stack : e)); console.log("\nCOVER CLEANUP FAIL (1)"); process.exit(1); });
