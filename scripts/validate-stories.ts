/**
 * Validiert die "Story- & Varianz-Regel" für ALLE Bücher in MALBUCH-KONZEPT.md.
 *   npx tsx scripts/validate-stories.ts
 * Letzte Zeile: "PASS 72/72" wenn alle Bücher konform sind, sonst "FAIL <ok>/<total>".
 *
 * Parser-Logik identisch zu scripts/generate-from-concept.ts (Heading/Motiv-Liste).
 * Geprüft je Buch:
 *  1) 15–20 Motive
 *  2) keine doppelten Motive (case-insensitive, getrimmt)
 *  3) Erzählbogen — letztes Motiv ≠ erstes UND matcht Abschluss-Muster
 *  4) Szenen-Vielfalt — distinct Anfangs-Subjekte ≥ 70 % der Motivzahl UND ≥ 3 Schauplatz-Begriffe
 *  5) kein "flacher" Titel (bloßes "X und Y" / "X and Y" ohne Reise-/Story-Wort)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface Book { catCode: string; slug: string; titleDe: string; titleEn: string; motifs: string[] }

function parse(md: string): Book[] {
  const lines = md.split("\n");
  const books: Book[] = [];
  let catCode = "";
  let cur: Book | null = null;
  let collecting = false;
  const push = () => { if (cur) books.push(cur); cur = null; };

  for (const line of lines) {
    const catM = line.match(/^##\s+([A-Z]\d{1,2})\s+·/);
    if (catM) { push(); catCode = catM[1]; collecting = false; continue; }
    const bookM = line.match(/^###\s+Buch\s+(\d+)\s+—\s+"([^"]+)"\s*\/\s*"([^"]+)"/);
    if (bookM) {
      push();
      collecting = false;
      cur = { catCode, slug: "", titleDe: bookM[2], titleEn: bookM[3], motifs: [] };
      continue;
    }
    if (!cur) continue;
    const slugM = line.match(/\*\*Slug:\*\*\s*`([^`]+)`/);
    if (slugM) { cur.slug = slugM[1]; continue; }
    if (/\*\*Motiv-Liste/.test(line)) { collecting = true; continue; }
    if (collecting) {
      const m = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
      if (m) { cur.motifs.push(m[1]); continue; }
      if (/^\s*-\s+\*\*/.test(line)) collecting = false;
    }
  }
  push();
  return books;
}

// Abschluss-Muster (Erzählbogen-Ende) — wie in der Goal-Bedingung vorgegeben.
const CLOSING = /sunset|back|home|nest|together|all the|end of the day|zurück|abend|sicher/i;

// Schauplatz-/Szenerie-Begriffe (Ort, an dem die Szene spielt).
const PLACES = [
  "cave", "river", "jungle", "lake", "hill", "hilltop", "forest", "wood", "woods", "meadow",
  "castle", "garden", "mountain", "valley", "beach", "ocean", "sea", "seabed", "reef", "cottage",
  "library", "sky", "field", "pond", "waterfall", "volcano", "desert", "swamp", "cliff", "shore",
  "lagoon", "island", "den", "nest", "burrow", "stream", "clearing", "grove", "market", "street",
  "town", "village", "harbor", "harbour", "bridge", "tower", "temple", "shrine", "path", "trail",
  "savanna", "savannah", "tundra", "glacier", "canyon", "oasis", "dune", "coral", "space", "planet",
  "galaxy", "moon", "star", "sun", "cloud", "snow", "rainbow", "pasture", "barn", "farm", "orchard",
  "greenhouse", "vineyard", "rooftop", "window", "attic", "kitchen", "room", "park", "fairground",
  "coop", "stable", "hedge", "pumpkin patch", "campfire", "tent", "lighthouse", "waterhole", "marsh",
  "skyline", "alley", "courtyard", "balcony", "terrace", "fountain", "garden bed", "riverbank",
];

// Reise-/Story-Wörter — ein Titel mit einem davon gilt NICHT als "flach".
const JOURNEY = /reise|journey|abenteuer|adventure|quest|expedition|geheimnis|secret|zauber|magi|traum|dream|entdeck|discover|tag|day|durch|through|große|great|kleine|little|welt|world|nacht|night|im |am |auf |to the|of the|\b(das|der|die|den|dem|des|the)\b/i;

function subjectKey(m: string): string {
  let s = m.toLowerCase().trim().replace(/^(a |an |the )/, "");
  const w = s.match(/[a-zäöüß][a-zäöüß-]*/);
  return w ? w[0] : s;
}

function isFlatTitle(t: string): boolean {
  // Ganzer Titel = "X und Y" / "X and Y" mit je 1–2 Wörtern, ohne Reise-/Story-Wort.
  const flat = /^\s*[a-zäöüß][\wäöüß-]*(\s[\wäöüß-]+)?\s+(und|and)\s+[a-zäöüß][\wäöüß-]*(\s[\wäöüß-]+)?\s*$/i.test(t);
  return flat && !JOURNEY.test(t);
}

function checkBook(b: Book): string[] {
  const errs: string[] = [];
  const n = b.motifs.length;
  // 1) Anzahl
  if (n < 15 || n > 20) errs.push(`Motivzahl ${n} (erwartet 15–20)`);
  // 2) Duplikate
  const norm = b.motifs.map((m) => m.toLowerCase().trim());
  const dup = norm.find((m, i) => norm.indexOf(m) !== i);
  if (dup) errs.push(`Doppeltes Motiv: "${dup}"`);
  // 3) Erzählbogen
  if (n > 0) {
    const first = norm[0], last = norm[n - 1];
    if (last === first) errs.push("Letztes Motiv = erstes Motiv");
    else if (!CLOSING.test(last)) errs.push(`Letztes Motiv ohne Abschluss-Wort: "${b.motifs[n - 1]}"`);
  }
  // 4) Vielfalt
  if (n > 0) {
    const subj = new Set(norm.map(subjectKey));
    const ratio = subj.size / n;
    if (ratio < 0.7) errs.push(`Subjekt-Vielfalt ${(ratio * 100) | 0}% (<70%, ${subj.size}/${n})`);
    const places = new Set<string>();
    for (const m of norm) for (const p of PLACES) if (m.includes(p)) places.add(p);
    if (places.size < 3) errs.push(`Nur ${places.size} Schauplatz-Begriffe (≥3 nötig)${places.size ? ` [${[...places].join(",")}]` : ""}`);
  }
  // 5) Flacher Titel
  if (isFlatTitle(b.titleDe)) errs.push(`Flacher Titel DE: "${b.titleDe}"`);
  if (isFlatTitle(b.titleEn)) errs.push(`Flacher Titel EN: "${b.titleEn}"`);
  return errs;
}

const md = readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8");
const books = parse(md);
let ok = 0;
const fails: { b: Book; errs: string[] }[] = [];
for (const b of books) {
  const errs = checkBook(b);
  if (errs.length === 0) ok++;
  else fails.push({ b, errs });
}

for (const f of fails) {
  console.log(`✗ ${f.b.catCode} ${f.b.slug} — "${f.b.titleDe}"`);
  for (const e of f.errs) console.log(`    - ${e}`);
}
console.log(`\nGeparst: ${books.length} Bücher · OK: ${ok} · Fehler: ${fails.length}`);
console.log(books.length === 72 && ok === 72 ? "PASS 72/72" : `FAIL ${ok}/${books.length}`);
