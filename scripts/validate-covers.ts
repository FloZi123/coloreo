/**
 * Validiert die "Cover-QA-Regel" für ALLE Bücher in MALBUCH-KONZEPT.md (heroMotif).
 *   npx tsx scripts/validate-covers.ts
 * Letzte Zeile: "PASS 72/72" wenn alle heroMotifs konform sind, sonst "FAIL <ok>/<total>".
 *
 * Geprüft je Buch (heroMotif = Cover-Hauptmotiv):
 *  1) nennt eine konkrete Szene/Kulisse (Orts-/Hintergrundwort) — nicht nur die Figur;
 *  2) genau ein klares Fokus-Subjekt (keine überladene Aufzählung);
 *  3) handhabbare Länge (~4–14 Wörter) und keine widersprüchlichen Requisiten;
 *  4) erkennbare Thema-Konsistenz zur Kategorie/zum Titel.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface Book { catSlug: string; slug: string; title: string; hero: string }

function parse(md: string): Book[] {
  const lines = md.split("\n");
  const books: Book[] = [];
  let catSlug = "", slug = "", title = "";
  for (const l of lines) {
    let m = l.match(/^##\s+[A-Z]\d{1,2}\s+·\s+.+?\s+\(`([^`]+)`/);
    if (m) { catSlug = m[1]; continue; }
    m = l.match(/^###\s+Buch\s+\d+\s+—\s+"([^"]+)"/);
    if (m) { title = m[1]; slug = ""; continue; }
    m = l.match(/\*\*Slug:\*\*\s*`([^`]+)`/);
    if (m) { slug = m[1]; continue; }
    m = l.match(/\*\*heroMotif \(Cover\):\*\*\s*`([^`]+)`/);
    if (m) books.push({ catSlug, slug, title, hero: m[1] });
  }
  return books;
}

// Szene-/Kulisse-/Hintergrund-Wörter (Rule 1). Bewusst breit, inkl. Himmel/Hintergrund für
// abstrakte Themen (Mandala/Tarot), damit jede Kategorie eine passende Kulisse benennen kann.
const SETTINGS = [
  "meadow", "forest", "wood", "woods", "garden", "greenhouse", "cottage", "field", "hill", "hilltop",
  "pond", "lake", "river", "stream", "waterfall", "valley", "cave", "volcano", "jungle", "savanna",
  "safari", "desert", "beach", "shore", "sea", "ocean", "reef", "seabed", "lagoon", "underwater",
  "library", "cathedral", "castle", "tower", "bridge", "street", "town", "city", "market", "harbor",
  "barn", "farm", "orchard", "pasture", "workshop", "kitchen", "bakery", "cafe", "shop", "room",
  "window", "windowsill", "fireplace", "attic", "rooftop", "park", "fairground", "construction site",
  "sky", "clouds", "cloud", "stars", "star", "starry", "starlit", "sunrise", "sunset", "night",
  "moonlit", "rainbow", "snow", "snowy", "space", "orbit", "galaxy", "planet", "cosmic", "nebula",
  "background", "backdrop", "scene", "landscape", "horizon", "waves", "tree house", "pumpkin patch",
  "lily pond", "coral reef", "deep sea", "apothecary", "torii", "pagoda", "courtyard", "shelf", "desk",
  "racetrack", "track", "stadium", "altar", "study", "savannah",
];

// Thema-Schlüsselwörter je Kategorie (Rule 4).
const THEME: Record<string, string[]> = {
  "mandala-meditation": ["mandala"],
  "botanischer-garten": ["flower", "floral", "plant", "botanical", "greenhouse", "leaf", "bouquet", "wildflower", "garden", "bloom"],
  "cottagecore": ["cottage", "mushroom", "cozy", "garden", "hygge", "basket", "thatched"],
  "dark-academia": ["library", "book", "gothic", "alchemy", "cathedral", "candle", "quill", "architecture", "arch", "flask"],
  "mond-mystik": ["moon", "witch", "potion", "crystal", "tarot", "mystic", "herb", "apothecary", "spell", "star"],
  "sternzeichen-kosmos": ["zodiac", "astrology", "cosmic", "moon", "star", "planet", "constellation", "celestial", "sun"],
  "japan-zen": ["japanese", "koi", "zen", "bonsai", "torii", "pagoda", "cherry", "lotus", "lantern"],
  "gothic-skulls": ["skull", "gothic", "rose", "raven", "candle", "marigold"],
  "achtsamkeit-affirmationen": ["lotus", "calm", "serene", "sun", "heart", "wreath", "zen", "breath", "peaceful", "cloud"],
  "vintage-steampunk": ["steampunk", "gear", "cog", "airship", "clockwork", "gramophone", "watch", "brass", "vintage"],
  "unterwasserwelt": ["coral", "reef", "sea", "fish", "turtle", "jellyfish", "whale", "ocean", "underwater", "starfish", "seahorse"],
  "schmetterlinge-libellen": ["butterfly", "dragonfly", "wing", "moth", "damselfly"],
  "niedliche-tiere": ["fox", "rabbit", "kitten", "puppy", "owl", "deer", "bear", "animal", "squirrel", "hedgehog"],
  "gemuetliche-freunde": ["bear", "bunny", "cat", "cozy", "teddy", "mouse", "kitten"],
  "dino-welt": ["dino", "dinosaur", "t-rex", "triceratops", "stegosaurus", "volcano", "brontosaurus", "pterodactyl"],
  "fahrzeuge-maschinen": ["truck", "car", "excavator", "fire truck", "ambulance", "tractor", "train", "vehicle", "crane", "race", "digger"],
  "weltraum-planeten": ["astronaut", "rocket", "planet", "space", "alien", "robot", "star", "spaceship", "galaxy", "moon"],
  "einhoerner-regenbogen": ["unicorn", "rainbow", "pegasus", "mane", "horn"],
  "zauberwald-feen": ["fairy", "mushroom", "forest", "enchanted", "gnome", "toadstool", "sprite"],
  "meerjungfrauen": ["mermaid", "seashell", "dolphin", "sea", "seahorse", "pearl", "fish", "coral", "ocean"],
  "bauernhof": ["cow", "pig", "chicken", "barn", "farm", "vegetable", "sheep", "lamb", "duck", "tractor", "rabbit", "hen", "chick"],
  "kawaii-food": ["cupcake", "donut", "ice cream", "kawaii", "sushi", "cake", "milkshake", "cookie", "food", "pastry"],
  "dschungel-safari": ["lion", "elephant", "giraffe", "safari", "jungle", "monkey", "parrot", "zebra", "tiger"],
  "jahreszeiten-feste": ["snowman", "christmas", "halloween", "easter", "pumpkin", "gift", "egg", "bunny", "tree", "festive", "ghost"],
};

// Widersprüchliche Requisiten je Themengruppe (Rule 3).
const SEA = new Set(["unterwasserwelt", "meerjungfrauen"]);
function contradictions(b: Book): string | null {
  const h = b.hero.toLowerCase();
  const isBeachSea = SEA.has(b.catSlug) || /am-meer|beach|sea/.test(b.slug);
  if (isBeachSea && /(snow|forest|desert|party hat)/.test(h)) return "Strand/Meer-Buch mit widersprüchlicher Requisite (snow/forest/desert/party hat)";
  if (b.catSlug === "weltraum-planeten" && /(garden|meadow|forest|ocean|beach|underwater)/.test(h)) return "Weltraum-Buch mit irdischer Kulisse";
  if (!/(party|birthday|fest|feste)/.test(b.catSlug + " " + b.slug) && /party hat/.test(h)) return "'party hat' ohne Party-Bezug";
  return null;
}

function checkBook(b: Book): string[] {
  const errs: string[] = [];
  const h = b.hero.toLowerCase();
  const words = b.hero.trim().split(/\s+/);
  // 1) Szene/Kulisse
  if (!SETTINGS.some((s) => h.includes(s))) errs.push("Keine Szene/Kulisse (nur Figur)");
  // 2) genau ein Fokus-Subjekt (keine überladene Aufzählung)
  const ands = (h.match(/ and /g) || []).length;
  if (ands >= 2) errs.push(`Überladen: ${ands}× "and" (ein Fokus-Subjekt nötig)`);
  // 3) Länge + Widersprüche
  if (words.length < 4 || words.length > 14) errs.push(`Länge ${words.length} Wörter (4–14)`);
  const c = contradictions(b);
  if (c) errs.push(c);
  // 4) Thema-Konsistenz
  const theme = THEME[b.catSlug];
  if (theme && !theme.some((t) => h.includes(t))) errs.push(`Kein Thema-Wort der Kategorie ${b.catSlug}`);
  return errs;
}

const books = parse(readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8"));
let ok = 0;
const fails: { b: Book; errs: string[] }[] = [];
for (const b of books) {
  const errs = checkBook(b);
  if (errs.length === 0) ok++;
  else fails.push({ b, errs });
}
for (const f of fails) {
  console.log(`✗ ${f.b.catSlug} ${f.b.slug} — "${f.b.hero}"`);
  for (const e of f.errs) console.log(`    - ${e}`);
}
console.log(`\nGeparst: ${books.length} Bücher · OK: ${ok} · Fehler: ${fails.length}`);
console.log(books.length === 72 && ok === 72 ? "PASS 72/72" : `FAIL ${ok}/${books.length}`);
