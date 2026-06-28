import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import type { ImageProvider } from "./imageProvider";
import { hashSeed } from "./art";

type Audience = "adult" | "kids" | "all";

const LINEART =
  "coloring book page, black and white line art, clean bold black outlines only, line art only, no shading, no grayscale, no gray, no stippling, no dots, no hatching, no texture or fill inside the shapes, every enclosed area is solid clean white to color in, the composition fills the whole page from edge to edge with distinct elements, no large empty areas, ";

function difficulty(audience: Audience): string {
  if (audience === "kids") return "simple and cute, thick bold clean outlines, large friendly shapes with big open areas to color, for young children, set in a playful scene with a few simple background elements (sun, clouds, plants, ground) so the page feels full but stays easy, ";
  if (audience === "adult") return "detailed with elegant decorative line patterns and clear bold outlines that form many distinct open areas to color, ornamental but not dense, plenty of clean white space inside every shape, ";
  return "clean clear outlines, balanced detail with open areas to color, friendly, ";
}

const VARIATIONS = [
  "in a full scene with several background elements",
  "surrounded by related elements, plants and simple decorative shapes",
  "with a clean decorative background that fills the page",
  "in its natural habitat with several distinct supporting elements",
  "framed by a bold decorative border with background scenery",
  "as a lively full-page composition with several separate elements around it",
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
  // Threshold 175 (statt 140): whitet Grau-Schattierungen/leichtes Stippling in den Ausmal-Flächen
  // aus, behält aber die kräftigen schwarzen Konturen → reines S/W, saubere Flächen zum Ausmalen.
  return new Uint8Array(await sharp(png).grayscale().threshold(175).png().toBuffer());
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

function brandingOverlay(w: number, h: number): string {
  const brand = "'Fredoka', 'Baloo 2', 'Segoe UI', Arial, sans-serif";
  // Sprachneutral: NUR die Coloreo-Wortmarke (kein eingebrannter Titel/Kategorie → i18n-sicher).
  // Titel, Kategorie und Seitenzahl stehen lokalisiert als HTML auf der Storefront.
  const wordmark = `<text x="${w / 2}" y="50" text-anchor="middle" font-family="${brand}" font-size="36" font-weight="700" letter-spacing="-1">` +
    `<tspan fill="#FBF7F0">c</tspan><tspan fill="#FF5A4D">o</tspan><tspan fill="#FBF7F0">l</tspan>` +
    `<tspan fill="#3B8EEA">o</tspan><tspan fill="#FBF7F0">re</tspan><tspan fill="#3FBF87">o</tspan></text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="0" y="0" width="${w}" height="76" fill="rgba(28,24,21,0.78)"/>
    ${wordmark}
  </svg>`;
}

const clamp8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Farbe kräftiger/sättigungsstärker ziehen (Filzstift-Look), dunkle Flächen anheben. */
function vivify(r: number, g: number, b: number, floor = 70): [number, number, number] {
  const avg = (r + g + b) / 3;
  const k = 1.5; // Sättigung
  const lift = avg < floor ? floor - avg : 0; // dunkle Flächen anheben (keine Schwarzflächen)
  return [clamp8(avg + (r - avg) * k + lift), clamp8(avg + (g - avg) * k + lift), clamp8(avg + (b - avg) * k + lift)];
}

/** Fallback-Palette, falls keine Farbquelle vorliegt oder eine Fläche keine Farbe abbekommt. */
const COLOR_PALETTE: [number, number, number][] = [
  [233, 86, 75], [255, 138, 76], [255, 191, 71], [120, 190, 90],
  [70, 175, 130], [76, 175, 205], [60, 130, 200], [150, 110, 220],
];

/**
 * Füllt die weißen Flächen einer Linienzeichnung (schwarze Konturen auf Weiß) FLÄCHENWEISE
 * mit Farben – wie echtes Ausmalen INNERHALB der Linien. Liegt eine Farbquelle (farbig
 * gerendertes Motiv) vor, bekommt jede Fläche ihren REALISTISCHEN Mittelwert daraus; sonst
 * eine Palettenfarbe. Hintergrund (randberührende Fläche) bleibt weiß. Liefert RGB-Bytes.
 */
export async function colorizeWithinLines(
  lineBin: Uint8Array,
  W: number,
  H: number,
  colorSrc?: { data: Buffer; ch: number },
  floor = 70,
  grayFallback = false,
): Promise<Buffer> {
  const { data } = await sharp(lineBin).resize(W, H, { fit: "cover" }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const N = W * H;
  const isLine = (i: number) => data[i] < 110; // dunkle Kontur = Barriere
  const out = Buffer.alloc(N * 3, 255); // alles weiß
  const label = new Int32Array(N); // 0 = unbesucht
  const stack: number[] = [];
  let region = 0;

  for (let s = 0; s < N; s++) {
    if (label[s] !== 0 || isLine(s)) continue;
    region++;
    const px: number[] = [];
    let touchesBorder = false;
    let sr = 0, sg = 0, sb = 0;
    stack.length = 0;
    stack.push(s);
    label[s] = region;
    while (stack.length) {
      const q = stack.pop()!;
      px.push(q);
      if (colorSrc) { const j = q * colorSrc.ch; sr += colorSrc.data[j]; sg += colorSrc.data[j + 1]; sb += colorSrc.data[j + 2]; }
      const x = q % W, y = (q / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesBorder = true;
      if (x > 0) { const n = q - 1; if (label[n] === 0 && !isLine(n)) { label[n] = region; stack.push(n); } }
      if (x < W - 1) { const n = q + 1; if (label[n] === 0 && !isLine(n)) { label[n] = region; stack.push(n); } }
      if (y > 0) { const n = q - W; if (label[n] === 0 && !isLine(n)) { label[n] = region; stack.push(n); } }
      if (y < H - 1) { const n = q + W; if (label[n] === 0 && !isLine(n)) { label[n] = region; stack.push(n); } }
    }
    if (touchesBorder) continue; // Hintergrund weiß lassen

    let c: [number, number, number];
    if (colorSrc) {
      const m = px.length;
      const mr = sr / m, mg = sg / m, mb = sb / m;
      const chroma = Math.max(mr, mg, mb) - Math.min(mr, mg, mb);
      const [vr, vg, vb] = vivify(mr, mg, mb, floor);
      // Graue/fast-weiße Flächen (KI-Render hatte dort kaum echte Farbe) → kräftige Palette,
      // sonst der realistische Mittelwert. Verhindert blass/ungemalt wirkende Flächen.
      const washedOut = (grayFallback && chroma < 24) || (vr > 236 && vg > 236 && vb > 236);
      c = washedOut ? COLOR_PALETTE[(region * 3) % COLOR_PALETTE.length] : [vr, vg, vb];
    } else {
      c = COLOR_PALETTE[(region * 3) % COLOR_PALETTE.length];
    }
    for (const q of px) { out[q * 3] = c[0]; out[q * 3 + 1] = c[1]; out[q * 3 + 2] = c[2]; }
  }
  // Konturen schwarz nachzeichnen
  for (let p = 0; p < N; p++) if (isLine(p)) { out[p * 3] = 26; out[p * 3 + 1] = 26; out[p * 3 + 2] = 26; }
  return out;
}

/** Cover (Stil B – linke Hälfte ausgemalt, rechte Linienkunst) + Branding-Overlay (600×800). */
export async function generateCoverImage(
  provider: ImageProvider,
  opts: { title: string; categoryName: string; heroMotif: string; pages: number }
): Promise<Uint8Array> {
  const W = 600, H = 800, MID = Math.round(W / 2);

  // Linienkunst des Hauptmotivs (weißer Grund per Konstruktion → für JEDES Motiv saubere
  // Konturen). Beide Hälften stammen daraus → Konturen am Split deckungsgleich.
  const lineRaw = await provider.generate(buildMotifPrompt("all", opts.heroMotif, 0));
  const lineBin = await binarize(lineRaw);
  const lineFull = await sharp(lineBin).resize(W, H, { fit: "cover" }).toColourspace("srgb").png().toBuffer();

  // Farbquelle: dasselbe Motiv FARBIG & REALISTISCH gerendert. Daraus bekommt jede Fläche
  // ihren echten Farbton (Mittelwert), platziert aber sauber innerhalb der Linien.
  let colorSrc: { data: Buffer; ch: number } | undefined;
  try {
    const colorRaw = await provider.generate(
      `a colored illustration of ${opts.heroMotif}, natural realistic colors, flat bright colors, simple, centered, white background, no text`,
    );
    const { data, info } = await sharp(colorRaw).resize(W, H, { fit: "cover" }).flatten({ background: "#ffffff" }).toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    colorSrc = { data, ch: info.channels };
  } catch {
    /* ohne Farbquelle → Palette-Fallback */
  }

  // Linke Hälfte: dieselbe Zeichnung, Flächen INNERHALB der Linien ausgemalt (Flood-Fill).
  const coloredRaw = await colorizeWithinLines(lineBin, W, H, colorSrc);
  const coloredFull = await sharp(coloredRaw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();

  const leftColored = await sharp(coloredFull).extract({ left: 0, top: 0, width: MID, height: H }).toBuffer();
  const rightLines = await sharp(lineFull).extract({ left: MID, top: 0, width: W - MID, height: H }).toBuffer();
  const divider = Buffer.from(`<svg width="${W}" height="${H}"><rect x="${MID - 1}" y="0" width="2" height="${H}" fill="#1a1a1a"/></svg>`);
  const overlay = Buffer.from(brandingOverlay(W, H));

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
