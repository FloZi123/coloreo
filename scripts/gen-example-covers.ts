/**
 * Best-of-N-Kandidaten-Cover fürs Hero-Buch (NICHT im Shop) → .cover-examples/<slug>/.
 * Freigabe-Gate: nur Beispiele. Feste, geloggte Seeds (slug#variant + Kandidaten-Index).
 *   npx tsx scripts/gen-example-covers.ts                 # N Kandidaten + Kontaktbogen + candidates.json
 *   npx tsx scripts/gen-example-covers.ts select=<seed>   # menschliche Endauswahl → selection.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverCandidates } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

// Hero-Buch (Cottagecore) – einfaches, überlagerungsarmes Motiv.
const HERO = { slug: "cottagecore-tag-im-landhaus", hero: "a cozy thatched cottage with a small flower garden and a smoking chimney, a few trees, calm sky" };
const N = 4;
const dir = join(root, ".cover-examples", HERO.slug);
mkdirSync(dir, { recursive: true });

async function selectSeed(seed: number) {
  const candFile = join(dir, "candidates.json");
  if (!existsSync(candFile)) { console.error("Erst Kandidaten erzeugen (ohne select=)."); process.exit(1); }
  const cands = JSON.parse(readFileSync(candFile, "utf8")).candidates as { seed: number }[];
  if (!cands.some((c) => c.seed === seed)) { console.error(`Seed ${seed} ist kein Kandidat. Verfügbar: ${cands.map((c) => c.seed).join(", ")}`); process.exit(1); }
  writeFileSync(join(dir, "selection.json"), JSON.stringify({ slug: HERO.slug, chosenSeed: seed, at: "manual" }, null, 2));
  console.log(`✓ Menschliche Auswahl protokolliert: slug=${HERO.slug} chosenSeed=${seed}`);
}

async function main() {
  const selArg = process.argv.slice(2).find((a) => a.startsWith("select="));
  if (selArg) return selectSeed(Number(selArg.split("=")[1]));

  const provider = getImageProvider();
  const cands = await generateCoverCandidates(provider, { heroMotif: HERO.hero, slug: HERO.slug, variant: 0 }, N);
  const thumbs: { input: Buffer; left: number; top: number }[] = [];
  const TW = 240, gap = 14, labelH = 34;
  const meta: { rank: number; seed: number; score: number; file: string }[] = [];
  for (let i = 0; i < cands.length; i++) {
    const file = `cand-${i + 1}-seed${cands[i].seed}.png`;
    writeFileSync(join(dir, file), Buffer.from(cands[i].bytes));
    const th = await sharp(cands[i].bytes).resize(TW).png().toBuffer();
    thumbs.push({ input: th, left: gap + i * (TW + gap), top: gap + labelH });
    const label = Buffer.from(`<svg width="${TW}" height="${labelH}"><text x="${TW / 2}" y="24" text-anchor="middle" font-family="Arial" font-size="20" fill="#3a352e">#${i + 1} · seed ${cands[i].seed} · ${cands[i].score.toFixed(2)}</text></svg>`);
    thumbs.push({ input: label, left: gap + i * (TW + gap), top: gap });
    meta.push({ rank: i + 1, seed: cands[i].seed, score: Number(cands[i].score.toFixed(3)), file });
  }
  const m0 = await sharp(cands[0].bytes).resize(TW).metadata();
  const sheetW = gap + cands.length * (TW + gap), sheetH = gap * 2 + labelH + (m0.height ?? TW);
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: { r: 245, g: 240, b: 230 } } })
    .composite(thumbs).png().toFile(join(dir, "_contact-sheet.png"));
  writeFileSync(join(dir, "candidates.json"), JSON.stringify({ slug: HERO.slug, n: N, presorted: "cleanliness_desc", candidates: meta }, null, 2));
  console.log(`FERTIG · ${N} Kandidaten + Kontaktbogen + candidates.json (vorsortiert). Auswahl: select=<seed>`);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
