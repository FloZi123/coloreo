/**
 * Validiert realistische Social-Asset-Qualität für EIN Buch.
 *   npx tsx scripts/validate-social-assets.ts <slug>   → letzte Zeile "PASS".
 * Misst auf public/social/<slug>/<locale>/:
 *  1) PIN-FARBE      – jede „ausgemalt"-Hälfte ≥20% gesättigte Pixel (HSV).
 *  2) REALISMUS      – mehrere distinkte Hue-Cluster (keine flache Einheitsfarbe); Manifest colorization="realistic".
 *  3) REVEAL         – Reveal-Video, dessen mittlere Sättigung Start→Ende deutlich steigt.
 *  4) LEAD-PIN       – Manifest-Lead-Pin nutzt den heroMotif des Buchs (lt. MALBUCH-KONZEPT.md).
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errs: string[] = [];
const SAT_PIXEL = 0.20;     // S-Schwelle, ab der ein Pixel als „farbig" zählt (s/w ≈ 0)
const PIN_MIN_FRAC = 0.20;  // ≥20% farbige Pixel in der „ausgemalt"-Hälfte
const MIN_CLUSTERS = 3;     // mind. 3 distinkte Hue-Cluster (gegen flache Einheitsfarbe)
const REVEAL_DELTA = 0.05;  // mittlere Sättigung muss Start→Ende um ≥0.05 steigen

const slug = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"))
  ?? (existsSync(join(root, "public/social")) ? readdirSync(join(root, "public/social"))[0] : "");
if (!slug) { console.log("✗ Kein Slug / kein Asset gefunden"); console.log("\nFAIL (1)"); process.exit(1); }

const baseDir = join(root, "public/social", slug);
if (!existsSync(baseDir)) { console.log(`✗ public/social/${slug} fehlt – erst generieren`); console.log("\nFAIL (1)"); process.exit(1); }
const loc = existsSync(join(baseDir, "de")) ? "de" : readdirSync(baseDir).find((d) => existsSync(join(baseDir, d, "social.json"))) ?? "de";
const dir = join(baseDir, loc);
console.log(`▶ Prüfe ${slug} (${loc})`);

// heroMotif aus dem Konzept (für Lead-Pin-Abgleich).
const CONCEPT = existsSync(join(root, "MALBUCH-KONZEPT.md")) ? readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8") : "";
function conceptHero(s: string): string {
  const idx = CONCEPT.indexOf(`**Slug:** \`${s}\``);
  if (idx < 0) return "";
  return CONCEPT.slice(idx, idx + 4000).match(/\*\*heroMotif \(Cover\):\*\*\s*`([^`]+)`/)?.[1] ?? "";
}

/** HSV-Statistik einer Region: Anteil farbiger Pixel + Zahl distinkter Hue-Cluster. */
async function colorStats(buf: Buffer, region?: { left: number; top: number; width: number; height: number }) {
  let img = sharp(buf);
  if (region) img = img.extract(region);
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let sat = 0, satTotal = 0;
  const hist = new Array(12).fill(0);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const s = max === 0 ? 0 : d / max;
    if (s >= SAT_PIXEL && max > 50 && min < 235) {
      sat++; satTotal++;
      let h = 0;
      if (d > 0) { h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
      hist[Math.floor(h / 30) % 12]++;
    }
  }
  const clusters = hist.filter((c) => c > satTotal * 0.02).length;
  return { fracSat: sat / n, clusters };
}
/** Mittlere Sättigung über eine Region. */
async function meanSat(buf: Buffer, region: { left: number; top: number; width: number; height: number }) {
  const { data } = await sharp(buf).extract(region).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, cnt = 0;
  for (let i = 0; i < data.length; i += 3) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]), min = Math.min(data[i], data[i + 1], data[i + 2]);
    sum += max === 0 ? 0 : (max - min) / max; cnt++;
  }
  return sum / cnt;
}
function extractFrame(video: string, t: number, out: string) {
  const r = spawnSync(ffmpegPath as string, ["-ss", String(t), "-i", video, "-frames:v", "1", "-y", out], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(out)) throw new Error("ffmpeg Frame-Extraktion fehlgeschlagen");
}

async function main() {
  const manifestPath = join(dir, "social.json");
  if (!existsSync(manifestPath)) { errs.push(`Manifest fehlt: ${manifestPath}`); return; }
  const man = JSON.parse(readFileSync(manifestPath, "utf8"));

  // ── 1) + 2) PIN-FARBE & REALISMUS ────────────────────────────────────────
  const pinFiles = readdirSync(dir).filter((f) => /^pin-\d+\.webp$/.test(f)).sort();
  if (pinFiles.length === 0) errs.push("Keine Pins gefunden");
  let worstFrac = 1, totalClusters = 0;
  for (const pf of pinFiles) {
    const buf = readFileSync(join(dir, pf));
    const meta = await sharp(buf).metadata();
    const W = meta.width ?? 1000, H = meta.height ?? 1500;
    // „ausgemalt"-Hälfte = ganze rechte Bildhälfte des Seitenbereichs (frei von Kopf/Fuß/Trennlinie).
    const region = { left: Math.round(W * 0.52), top: Math.round(H * 0.12), width: Math.round(W * 0.43), height: Math.round(H * 0.70) };
    const { fracSat, clusters } = await colorStats(buf, region);
    worstFrac = Math.min(worstFrac, fracSat);
    totalClusters = Math.max(totalClusters, clusters);
    if (fracSat < PIN_MIN_FRAC) errs.push(`${pf}: ausgemalt-Hälfte nur ${(fracSat * 100).toFixed(0)}% farbig (<${PIN_MIN_FRAC * 100}%) – s/w?`);
    if (clusters < MIN_CLUSTERS) errs.push(`${pf}: nur ${clusters} Hue-Cluster (<${MIN_CLUSTERS}) – flache Einheitsfarbe?`);
  }
  if (pinFiles.length) console.log(`  ✓ Pins: schlechteste Farbabdeckung ${(worstFrac * 100).toFixed(0)}%, max. Hue-Cluster ${totalClusters}`);
  if (man.colorization !== "realistic") errs.push(`Manifest colorization="${man.colorization}" (erwartet "realistic", nicht flat)`);

  // ── 3) REVEAL ─────────────────────────────────────────────────────────────
  const reveal = join(dir, "video-reveal.mp4");
  if (!existsSync(reveal)) errs.push("Reveal-Video fehlt (video-reveal.mp4)");
  else {
    const tmp = mkdtempSync(join(tmpdir(), "rev-"));
    try {
      const a = join(tmp, "a.png"), b = join(tmp, "b.png");
      extractFrame(reveal, 0.2, a);   // Start: Linienkunst
      extractFrame(reveal, 3.8, b);   // Ende: koloriert
      const m0 = await sharp(a).metadata(), W = m0.width ?? 1080, H = m0.height ?? 1920;
      const reg = { left: Math.round(W * 0.28), top: Math.round(H * 0.22), width: Math.round(W * 0.44), height: Math.round(H * 0.42) };
      const sStart = await meanSat(readFileSync(a), reg);
      const sEnd = await meanSat(readFileSync(b), reg);
      console.log(`  ✓ Reveal Sättigung Start ${sStart.toFixed(3)} → Ende ${sEnd.toFixed(3)} (Δ ${(sEnd - sStart).toFixed(3)})`);
      if (sEnd - sStart < REVEAL_DELTA) errs.push(`Reveal: Sättigungs-Anstieg nur ${(sEnd - sStart).toFixed(3)} (<${REVEAL_DELTA}) – kein echter Linie→Farbe-Effekt`);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // ── 4) LEAD-PIN ───────────────────────────────────────────────────────────
  const hero = conceptHero(slug);
  const leadHero = man.leadPin?.heroMotif;
  if (!leadHero) errs.push("Manifest: leadPin.heroMotif fehlt");
  else if (hero && leadHero !== hero) errs.push(`Lead-Pin heroMotif weicht ab\n   Manifest: ${leadHero}\n   Konzept:  ${hero}`);
  else console.log(`  ✓ Lead-Pin nutzt heroMotif: "${leadHero}"`);
}

main().then(() => {
  if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nFAIL (${errs.length})`); process.exit(1); }
  console.log("\nPASS");
}).catch((e) => { console.log("✗ " + (e instanceof Error ? e.stack : e)); console.log("\nFAIL (1)"); process.exit(1); });
