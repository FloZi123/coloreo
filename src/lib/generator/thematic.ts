import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import type { ImageProvider } from "./imageProvider";
import { hashSeed } from "./art";

type Audience = "adult" | "kids" | "all";

const LINEART =
  "coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, ";

function difficulty(audience: Audience): string {
  if (audience === "kids") return "very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, ";
  if (audience === "adult") return "intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, ";
  return "clean detailed outlines, balanced level of detail, friendly, ";
}

const VARIATIONS = [
  "centered composition",
  "full body view",
  "with a decorative patterned background",
  "close-up portrait",
  "in a small scene with surroundings",
  "surrounded by ornamental flourishes",
];

export function buildMotifPrompt(audience: Audience, motif: string, page: number): string {
  const v = VARIATIONS[(hashSeed(motif) + page) % VARIATIONS.length];
  return LINEART + difficulty(audience) + motif + ", " + v;
}

/** Motiv-Pools je (repräsentativer) Kategorie. */
const SUBJECTS: Record<string, string[]> = {
  tiere: ["a friendly lion", "an elephant", "a cute fox", "an owl on a branch", "a deer in a meadow", "a rabbit", "a bear", "a tiger", "a giraffe", "a panda eating bamboo", "a wolf", "a hedgehog", "a squirrel with a nut", "a peacock with open feathers"],
  katzen: ["a cute cat sitting", "two kittens playing", "a cat with a ball of yarn", "a sleeping cat curled up", "a cat on a windowsill", "a kitten in a basket", "a fluffy cat with a bow"],
  hunde: ["a happy puppy", "a dog with a bone", "two dogs playing", "a golden retriever sitting", "a dachshund", "a dog with a ball", "a puppy in a basket"],
  dinosaurier: ["a friendly t-rex", "a triceratops", "a long-neck brontosaurus", "a stegosaurus", "a flying pterodactyl", "a baby dinosaur hatching from an egg", "a dinosaur in a jungle"],
  fahrzeuge: ["an excavator", "a fire truck", "a race car", "an airplane", "a sailboat", "a tractor", "a steam train", "a rocket ship", "a monster truck"],
  einhoerner: ["a unicorn with a flowing mane", "a unicorn and a rainbow", "a fairy with wings", "a magical castle", "a unicorn with stars", "a cute baby unicorn", "a princess crown with gems"],
  "fantasy-drachen": ["a friendly dragon", "a wizard with a staff", "a fantasy castle", "a phoenix", "a mermaid", "a dragon flying over mountains", "a knight and a dragon"],
  zauberwald: ["a magical tree with a face", "a forest with mushrooms", "a gnome house in a tree", "a woodland fairy scene", "an enchanted forest path", "a toadstool village"],
  meereswelt: ["a dolphin jumping", "a sea turtle", "an octopus", "a coral reef with fish", "a whale", "a seahorse", "a school of tropical fish", "a starfish and shells"],
  weltraum: ["a rocket ship", "a planet with rings", "an astronaut floating", "stars and a crescent moon", "a friendly alien and UFO", "a galaxy with planets", "a space shuttle"],
  schmetterlinge: ["a butterfly with patterned wings", "butterflies among flowers", "a swarm of butterflies", "a large ornate butterfly", "a butterfly on a flower"],
  gothic: ["an ornate sugar skull with flowers", "a day of the dead skull", "a decorated skull with roses", "a gothic rose pattern", "an ornate skull with candles"],
  "vintage-steampunk": ["steampunk gears and cogs", "a vintage pocket watch", "a mechanical owl", "a steampunk airship", "vintage keys and clockwork", "a steampunk robot"],
  staedte: ["a city skyline", "an old town street with houses", "a cathedral", "a stone bridge", "a row of european houses", "a famous landmark tower"],
  "kawaii-food": ["a cute cupcake with a happy face", "kawaii ice cream cone", "a smiling donut", "a bubble tea with a face", "a cute slice of cake", "a happy strawberry"],
  fashion: ["an elegant dress on a hanger", "a woman portrait with floral hair", "a high heel shoe", "a stylish handbag", "a fashion model figure", "a hat and sunglasses"],
  jahreszeiten: ["a decorated christmas tree", "autumn leaves and acorns", "a snowman with a scarf", "spring flowers in a basket", "a halloween pumpkin", "an easter egg with patterns"],
  "abc-zahlen": ["the letter A next to an apple", "the number 1 with one star", "the letter B with a ball", "the number 2 with two ducks", "the letter C with a cat", "the number 3 with three flowers"],
};

const PROCEDURAL = new Set(["mandalas", "geometrisch", "paisley-henna", "japan-zen", "achtsamkeit", "blumen-botanik"]);

export function isThematicCategory(slug: string | null | undefined): boolean {
  return !!slug && !PROCEDURAL.has(slug) && slug in SUBJECTS;
}

export function motifsForCategory(slug: string): string[] {
  return SUBJECTS[slug] ?? SUBJECTS.tiere;
}

/** PNG-Linienkunst auf reines Schwarz-Weiß bereinigen (druckreine Konturen). */
async function binarize(png: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await sharp(png).grayscale().threshold(140).png().toBuffer());
}

/**
 * Master-PDF aus expliziter Motivliste: pro Seite ein KI-Bild (Linienkunst),
 * nach Zielgruppe in Schwierigkeit, S/W-bereinigt, eingebettet auf A4.
 */
export async function generateMasterFromMotifs(
  provider: ImageProvider,
  book: { slug: string; titleDe: string; audience: Audience },
  motifs: string[],
  pageCount: number,
  opts: { concurrency?: number } = {}
): Promise<Uint8Array> {
  const pool = motifs.length ? motifs : ["a decorative pattern"];
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 8));
  const images: Uint8Array[] = new Array(pageCount);
  const pages = Array.from({ length: pageCount }, (_, i) => i);
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (p) => {
        const motif = pool[p % pool.length];
        const raw = await provider.generate(buildMotifPrompt(book.audience, motif, p));
        return { p, bytes: await binarize(raw) };
      })
    );
    for (const r of results) images[r.p] = r.bytes;
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < pageCount; p++) {
    const page = doc.addPage([595, 842]);
    const img = await doc.embedPng(images[p]);
    const maxW = 595 - 80, maxH = 842 - 110;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale, h = img.height * scale;
    page.drawImage(img, { x: (595 - w) / 2, y: (842 - h) / 2 + 20, width: w, height: h });
    page.drawText(pdfText(`Coloreo - ${book.titleDe}`), { x: 40, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
    page.drawText(`${p + 1} / ${pageCount}`, { x: 520, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
  }
  return doc.save();
}

/** Rückwärtskompatibel: thematisches Master-PDF anhand der Kategorie-Motive. */
export async function generateThematicMasterPdf(
  provider: ImageProvider,
  book: { slug: string; titleDe: string; categorySlug: string; audience?: Audience },
  pageCount: number,
  opts: { concurrency?: number } = {}
): Promise<Uint8Array> {
  return generateMasterFromMotifs(
    provider,
    { slug: book.slug, titleDe: book.titleDe, audience: book.audience ?? "adult" },
    motifsForCategory(book.categorySlug),
    pageCount,
    opts
  );
}

/** Macht Text WinAnsi/Latin-1-sicher für pdf-lib (Standardfont). */
function pdfText(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function brandingOverlay(w: number, h: number, title: string, category: string, pages: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="0" y="0" width="${w}" height="74" fill="rgba(0,0,0,0.30)"/>
    <text x="${w / 2}" y="48" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#ffffff">&#10022; Coloreo</text>
    <rect x="0" y="${h - 150}" width="${w}" height="150" fill="rgba(255,255,255,0.84)"/>
    <text x="${w / 2}" y="${h - 96}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#2b2540">${esc(title)}</text>
    <text x="${w / 2}" y="${h - 58}" text-anchor="middle" font-family="Arial" font-size="17" fill="#5b5470">${esc(category)}</text>
    <text x="${w / 2}" y="${h - 30}" text-anchor="middle" font-family="Arial" font-size="15" fill="#8b8499">Malbuch · ${pages} Seiten</text>
  </svg>`;
}

/**
 * Misst die "Buntheit" eines Bildes (mittlere Kanal-Spreizung max-min über RGB, 0–255).
 * Reine Linienkunst (graustufig) → ~0; teilkoloriertes Cover → deutlich höher.
 */
async function colorfulness(img: Uint8Array): Promise<number> {
  const { data, info } = await sharp(img).resize(72, 72, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let sum = 0, n = 0;
  for (let i = 0; i + 2 < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sum += Math.max(r, g, b) - Math.min(r, g, b);
    n++;
  }
  return n ? sum / n : 0;
}

/** Mindest-Buntheit, ab der ein Cover den Vorher/Nachher-Effekt klar zeigt. */
const COVER_COLOR_MIN = 16;

/** Cover (Stil B – teilkoloriert) + Coloreo-Branding-Overlay, als PNG-Bytes (600×800). */
export async function generateCoverImage(
  provider: ImageProvider,
  opts: { title: string; categoryName: string; heroMotif: string; pages: number }
): Promise<Uint8Array> {
  const W = 600, H = 800, MID = Math.round(W / 2);

  // (A) Echte Linienkunst des Hauptmotivs (weißer Grund per Konstruktion → für JEDES Motiv,
  //     auch dunkle, saubere Konturen). Liefert die rechte Hälfte UND die Konturen der linken.
  const lineRaw = await provider.generate(buildMotifPrompt("all", opts.heroMotif, 0));
  const lineBin = await binarize(lineRaw);
  const lineFull = await sharp(lineBin).resize(W, H, { fit: "cover" }).toColourspace("srgb").png().toBuffer();

  // (B) Farbquelle (vollfarbig, flach). Wird nur als weiche, posterisierte Farbfläche genutzt,
  //     die UNTER die Linien gelegt wird – wirkt wie grob von Hand ausgemalt.
  const colorPrompts = [
    `a brightly colored illustration of ${opts.heroMotif}, flat vibrant saturated colors, cheerful, simple shapes, white background, no text`,
    `${opts.heroMotif}, colorful flat illustration, bright saturated colors, white background, no text`,
  ];
  let best: Uint8Array | null = null;
  let bestScore = -1;
  for (let i = 0; i < colorPrompts.length; i++) {
    const img = await provider.generate(colorPrompts[i]);
    const score = await colorfulness(img);
    if (score > bestScore) { bestScore = score; best = img; }
    if (score >= COVER_COLOR_MIN) break;
  }
  if (!best) best = await provider.generate(colorPrompts[0]);

  const colorField = await sharp(best)
    .resize(W, H, { fit: "cover" })
    .modulate({ saturation: 1.3 })
    .blur(10)
    .png({ palette: true, colours: 14, dither: 0 }) // flache Farbzonen statt glattem Verlauf
    .toBuffer();

  // Linke Hälfte: Farbe UNTER die Linien (multiply) – Linien bleiben schwarz, Flächen werden bunt.
  const leftColoredFull = await sharp(lineFull).composite([{ input: colorField, blend: "multiply" }]).png().toBuffer();

  const leftColored = await sharp(leftColoredFull).extract({ left: 0, top: 0, width: MID, height: H }).toBuffer();
  const rightLines = await sharp(lineFull).extract({ left: MID, top: 0, width: W - MID, height: H }).toBuffer();
  const divider = Buffer.from(`<svg width="${W}" height="${H}"><rect x="${MID - 1}" y="0" width="2" height="${H}" fill="#1a1a1a"/></svg>`);
  const overlay = Buffer.from(brandingOverlay(W, H, opts.title, opts.categoryName, opts.pages));

  return new Uint8Array(await sharp({ create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([
      { input: leftColored, left: 0, top: 0 },
      { input: rightLines, left: MID, top: 0 },
      { input: divider, left: 0, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ])
    .png()
    .toBuffer());
}
