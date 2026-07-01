/**
 * Validiert Cover-Komposition: einfache Kompositions-Direktiven, Best-of-N-Kandidaten + menschliche Auswahl.
 *   npx tsx scripts/validate-cover-composition.ts   → letzte Zeile "COVER COMPOSITION PASS".
 * Erwartet Kandidaten in .cover-examples/<hero>/ (via scripts/gen-example-covers.ts).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : "");
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);
const HERO = "cottagecore-tag-im-landhaus";

const thematic = read("src/lib/generator/thematic.ts");

// ── 1) EINFACHE KOMPOSITION IM PROMPT ────────────────────────────────────────
const DIRECTIVE = "single clear focal subject, calm supporting elements only, generous negative space, no overlapping subjects, clear separation between elements, well-composed, uncluttered";
if (!thematic.includes(DIRECTIVE)) errs.push("thematic.ts: harte Kompositions-Direktiven fehlen (single clear focal subject … uncluttered)");
if (!/\$\{COVER_STEER\}/.test(thematic)) errs.push("generateCoverImage: COVER_STEER nicht im Bild-Prompt genutzt");
if (!errs.length) ok("Bild-Prompt fordert einfache, überlagerungsarme Komposition");

// ── 2) BEST-OF-N (feste Seeds + Vorsortierung) ───────────────────────────────
if (!/export async function generateCoverCandidates/.test(thematic)) errs.push("thematic.ts: generateCoverCandidates (Best-of-N) fehlt");
if (!/hashSeed\(`\$\{opts\.slug/.test(thematic)) errs.push("Best-of-N: Seeds nicht aus slug#variant abgeleitet (hashSeed)");
if (!/seedBase \+ i/.test(thematic)) errs.push("Best-of-N: Kandidaten-Seeds nicht als seedBase + Index");
if (!/Kandidat|Vorsortierung/.test(thematic)) errs.push("Best-of-N: keine Kandidaten-/Seed-Protokollierung");
const dirRel = `.cover-examples/${HERO}`;
const candJson = read(`${dirRel}/candidates.json`);
if (!candJson) errs.push(`Keine candidates.json in ${dirRel}/ – erst gen-example-covers.ts laufen lassen`);
let cand: { n: number; candidates: { seed: number; score: number; file: string }[]; presorted?: string } | null = null;
if (candJson) {
  cand = JSON.parse(candJson);
  if (!cand || cand.n < 4) errs.push("Best-of-N: N < 4 Kandidaten");
  if (!cand?.candidates?.length || cand.candidates.length < (cand.n ?? 4)) errs.push("Best-of-N: candidates.json unvollständig");
  if (!cand?.presorted) errs.push("Best-of-N: keine dokumentierte Vorsortierung");
  // Vorsortierung absteigend nach score prüfen.
  const sc = (cand?.candidates ?? []).map((c) => c.score);
  if (sc.some((v, i) => i > 0 && v > sc[i - 1] + 1e-9)) errs.push("Best-of-N: Kandidaten nicht nach Sauberkeit vorsortiert");
  // Kandidaten-PNGs vorhanden?
  const files = existsSync(join(root, dirRel)) ? readdirSync(join(root, dirRel)).filter((f) => /^cand-.*\.png$/.test(f)) : [];
  if (files.length < (cand?.n ?? 4)) errs.push(`Best-of-N: nur ${files.length} Kandidaten-PNGs (erwartet ${cand?.n ?? 4})`);
  if (!existsSync(join(root, dirRel, "_contact-sheet.png"))) errs.push("Best-of-N: kein Kontaktbogen (_contact-sheet.png)");
}
if (!errs.some((e) => /Best-of-N|candidates|Kandidat/.test(e))) ok(`Best-of-N: ${cand?.n ?? "?"} Kandidaten + Kontaktbogen + Vorsortierung`);

// ── 3) MENSCHLICHE ENDAUSWAHL ────────────────────────────────────────────────
const selJson = read(`${dirRel}/selection.json`);
if (!selJson) errs.push(`Keine selection.json – menschliche Endauswahl fehlt (gen-example-covers.ts select=<seed>)`);
else {
  const sel = JSON.parse(selJson) as { chosenSeed?: number };
  const seeds = (cand?.candidates ?? []).map((c) => c.seed);
  if (typeof sel.chosenSeed !== "number") errs.push("selection.json: chosenSeed fehlt");
  else if (seeds.length && !seeds.includes(sel.chosenSeed)) errs.push(`selection.json: chosenSeed ${sel.chosenSeed} ist kein Kandidat`);
  else ok(`Menschliche Endauswahl protokolliert: chosenSeed=${sel.chosenSeed} (reproduzierbar per Seed)`);
}

// ── Invarianten aus GOAL-COVER-CLEANUP (nicht rückgängig) ────────────────────
if (!/no text, no letters, no words, no title, no banner, no signage/.test(thematic)) errs.push("Cleanup-Invariante verletzt: NOTEXT nicht mehr im Prompt");
const brandFn = thematic.match(/function brandingOverlay[\s\S]*?\n}/)?.[0] ?? "";
if (!/fill="none"/.test(brandFn)) errs.push("Cleanup-Invariante verletzt: Marken-Rahmen nicht mehr Vektor");
if (!errs.length) ok("Cleanup-Invarianten erhalten (text-frei, Vektor-Rahmen)");

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nCOVER COMPOSITION FAIL (${errs.length})`); process.exit(1); }
console.log("\nCOVER COMPOSITION PASS");
