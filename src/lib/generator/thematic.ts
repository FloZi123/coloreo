import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import { trace } from "potrace";
import type { ImageProvider } from "./imageProvider";
import { hashSeed } from "./art";
import { BRAND, wordmarkSvg } from "../brand";

type Audience = "adult" | "kids" | "all";

const LINEART =
  "coloring book page, black and white line art, clean bold black outlines only, uniform consistent line weight, even stroke thickness throughout, line art only, no shading, no grayscale, no gray, no stippling, no dots, no hatching, no texture or fill inside the shapes, every enclosed area is solid clean white to color in, the main subject is large and takes up most of the page, with background scenery behind and around it that fills the rest evenly, no empty center, the artwork bleeds off all four edges of the page, NO border, NO frame line, NO rectangular picture-frame around the page edges, ";

function difficulty(audience: Audience): string {
  if (audience === "kids") return "simple and cute, thick bold clean outlines, large friendly shapes with big open areas to color, for young children, set in a playful scene with a few simple background elements (sun, clouds, plants, ground) so the page feels full but stays easy, ";
  if (audience === "adult") return "detailed with elegant decorative line patterns and clear bold outlines that form many distinct open areas to color, ornamental but not dense, plenty of clean white space inside every shape, ";
  return "clean clear outlines, balanced detail with open areas to color, friendly, ";
}

// ≥6 Kompositions-Varianten; rotierend über (hashSeed(motif)+page) → aufeinanderfolgende
// Seiten werden unterschiedlich komponiert (kein Seriencharakter).
const VARIATIONS = [
  "the subject large and prominent with a full background scene behind it",
  "a large close-up of the subject in its detailed natural habitat",
  "the subject big in the foreground with background scenery filling the rest",
  "the subject large and central with smaller related elements behind it across the page",
  "a complete full-page scene with the large subject and its surroundings",
  "the subject filling most of the page within its natural environment",
  "a wide scene with the subject off to one side and scenery sweeping across the page",
  "the subject seen from a gentle low angle with the setting rising behind it",
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
  // Threshold 160: whitet Grau-Schattierungen/Stippling aus (saubere Ausmal-Flächen), aber nicht
  // so hoch, dass dunkle Schattierungen zu großen schwarzen Flächen zusammenlaufen.
  return new Uint8Array(await sharp(png).grayscale().threshold(160).png().toBuffer());
}

/** Vektorisiert die S/W-Linienkunst (potrace) und rastert sie in Druckauflösung neu →
 *  glatte, scharfe Linien beim A4-Druck statt hochskalierter ~1-MP-Treppchen. */
function traceSvg(png: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    trace(Buffer.from(png), { turdSize: 2, optTolerance: 0.4, threshold: 128, color: "black", background: "white" }, (err, svg) => {
      if (err) reject(err); else resolve(svg);
    });
  });
}
async function vectorizeHiRes(binPng: Uint8Array, targetW = 1748): Promise<Uint8Array> {
  try {
    const svg = await traceSvg(binPng);
    // Graustufen + 16-Farben-Palette + max. Kompression → ~3× kleiner (≈5 MB/Buch), Schärfe
    // bleibt erhalten (Anti-Aliasing intakt); pdf-lib-kompatibel.
    const png = await sharp(Buffer.from(svg)).resize({ width: targetW }).flatten({ background: "#ffffff" })
      .grayscale().png({ palette: true, colors: 16, compressionLevel: 9, effort: 10 }).toBuffer();
    return new Uint8Array(png);
  } catch {
    return binPng; // Fallback: Original-Raster
  }
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
  opts: { concurrency?: number; characterAnchor?: string; seed?: number } = {}
): Promise<Uint8Array> {
  const pool = motifs.length ? motifs : ["a decorative pattern"];
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 8));
  // Charakter-Konsistenz: fester Anker (gleiches Figuren-Design) + fester Seed je Buch in jeden
  // Seiten-Prompt → der Darsteller wird über alle Seiten klar wiedererkennbar.
  const anchor = opts.characterAnchor?.trim();
  const images: Uint8Array[] = new Array(pageCount);
  const pages = Array.from({ length: pageCount }, (_, i) => i);
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (p) => {
        const motif = anchor ? `${pool[p % pool.length]}, ${anchor}` : pool[p % pool.length];
        const raw = await provider.generate(buildMotifPrompt(book.audience, motif, p), { seed: opts.seed });
        return { p, bytes: await vectorizeHiRes(await binarize(raw)) };
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

/**
 * Dezentes Cover-Branding: leichter Inset-Rahmen (Palette aus brand.ts) + kleine Fraunces-Wortmarke
 * auf einer subtilen Pille (auf beliebiger Kunst lesbar). KEIN Titel/Benefit/Seitenzahl, KEIN KI-Text.
 */
function brandingOverlay(w: number, h: number): string {
  const inset = Math.round(w * 0.025);
  const pillW = Math.round(w * 0.34), pillH = Math.round(h * 0.05);
  const pillX = (w - pillW) / 2, pillY = Math.round(h * 0.028);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="${inset}" y="${inset}" width="${w - 2 * inset}" height="${h - 2 * inset}" rx="${Math.round(w * 0.02)}" fill="none" stroke="${BRAND.ivory}" stroke-opacity="0.9" stroke-width="${Math.round(w * 0.007)}"/>
    <rect x="${inset}" y="${inset}" width="${w - 2 * inset}" height="${h - 2 * inset}" rx="${Math.round(w * 0.02)}" fill="none" stroke="${BRAND.ink}" stroke-opacity="0.18" stroke-width="${Math.round(w * 0.002)}"/>
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${BRAND.paper}" fill-opacity="0.82"/>
    ${wordmarkSvg(w / 2, pillY + Math.round(pillH * 0.68), Math.round(h * 0.036), BRAND.ink)}
  </svg>`;
}

const clamp8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Farbe kräftiger/sättigungsstärker ziehen (Filzstift-Look), dunkle Flächen anheben. */
function vivify(r: number, g: number, b: number, floor = 70, k = 1.5): [number, number, number] {
  const avg = (r + g + b) / 3;
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
  sat = 1.5,
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
      const [vr, vg, vb] = vivify(mr, mg, mb, floor, sat);
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
/** Qualitäts-Metriken eines Cover-Versuchs: genug Linien-Tinte? linke Hälfte wirklich koloriert? */
async function coverMetrics(lineBin: Uint8Array, coloredRaw: Buffer, W: number, H: number, MID: number) {
  const lg = await sharp(lineBin).resize(160).grayscale().raw().toBuffer();
  let dark = 0;
  for (let i = 0; i < lg.length; i++) if (lg[i] < 128) dark++;
  const lineInk = dark / lg.length; // Anteil schwarzer Linien (zu wenig = blass/gebrochen)
  let filled = 0, tot = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < MID; x++) {
    const j = (y * W + x) * 3; tot++;
    if (coloredRaw[j] < 245 || coloredRaw[j + 1] < 245 || coloredRaw[j + 2] < 245) filled++;
  }
  const colorFill = filled / tot; // Anteil kolorierter Pixel in der linken Hälfte

  // Rahmen-Erkennung: durchgehende dunkle Linie nahe einer Kante (horizontal UND vertikal) = Rahmen.
  const fw = 240, fh = 320;
  const fg = await sharp(lineBin).resize(fw, fh, { fit: "fill" }).grayscale().raw().toBuffer();
  const insets = [0.03, 0.045, 0.06, 0.075];
  let hLine = 0, vLine = 0;
  for (const r of insets) {
    for (const yy of [Math.round(fh * r), Math.round(fh * (1 - r))]) {
      let d = 0; for (let x = 0; x < fw; x++) if (fg[yy * fw + x] < 110) d++;
      hLine = Math.max(hLine, d / fw);
    }
    for (const xx of [Math.round(fw * r), Math.round(fw * (1 - r))]) {
      let d = 0; for (let y = 0; y < fh; y++) if (fg[y * fw + xx] < 110) d++;
      vLine = Math.max(vLine, d / fh);
    }
  }
  const frame = hLine >= 0.85 && vLine >= 0.85; // konservativ: nur klare Rahmenlinien

  const ok = lineInk >= 0.012 && lineInk <= 0.32 && colorFill >= 0.12 && !frame;
  const score = (ok ? 10 : 0) + Math.min(colorFill, 0.5) + (lineInk >= 0.012 && lineInk <= 0.32 ? 0.5 : 0) - (frame ? 1 : 0);
  return { ok, score, lineInk, colorFill, frame };
}

// Zentrale Kompositions-/Lesbarkeits-Steuerung für JEDES Cover (Linien- UND Farb-Prompt).
// Hebt Thema-Lesbarkeit + Komposition über alle Bücher an; der reine-Linienkunst-Charakter
// der rechten Hälfte bleibt durch das LINEART-Präfix in buildMotifPrompt erhalten.
const COVER_STEER = "single clear focal subject, centered, large in frame, recognizable setting, simple uncluttered background, no empty corners";
// Hart: KEINE Buchstaben/Bänder im Bild (Text war verhunzt) und KEIN mitgenerierter Rahmen
// (der Marken-Rahmen wird als sauberer Vektor separat komponiert → keine doppelten Rahmenlinien).
const NOTEXT = "no text, no letters, no words, no title, no banner, no signage, no frame, no border, no decorative border";

/**
 * Gedämpfte Vintage-Behandlung: leichte Entsättigung + feines Korn/Papier-Textur (feTurbulence),
 * damit die Farbe handgemacht/vintage statt glänzend-KI wirkt. Thumbnail bleibt motiv-stark.
 */
export async function vintageTreat(img: Buffer, W: number, H: number): Promise<Buffer> {
  const grain = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="t"/>` +
      `<feColorMatrix in="t" type="saturate" values="0"/></filter>` +
      `<rect width="${W}" height="${H}" filter="url(#n)" opacity="0.05"/></svg>`,
  );
  try {
    return await sharp(img).resize(W, H, { fit: "cover" }).modulate({ saturation: 0.9, brightness: 1.0 })
      .composite([{ input: grain, blend: "multiply" }]).png().toBuffer();
  } catch {
    // Falls das Korn-SVG nicht rendert: nur Entsättigung (kein harter Fehler).
    return sharp(img).resize(W, H, { fit: "cover" }).modulate({ saturation: 0.9 }).png().toBuffer();
  }
}

/**
 * VOLL koloriertes, gedämpft-vintage Hero-Cover (600×800) – KEIN Split, kein Trennstrich, kein
 * eingebrannter Titel/Benefit/Seitenzahl, kein KI-Text (Disclosure lebt auf der Produktseite).
 * Reproduzierbar: fester, aus slug (+ Variante) abgeleiteter Seed; Modell/Parameter/Seed werden geloggt.
 * Auto-Qualitäts-Guard: bis zu 3 Versuche (Seed + Versuchs-Offset, deterministisch).
 */
export async function generateCoverImage(
  provider: ImageProvider,
  opts: { heroMotif: string; slug?: string; variant?: number; title?: string; categoryName?: string; pages?: number },
): Promise<Uint8Array> {
  const W = 600, H = 800, MID = Math.round(W / 2);
  const overlay = Buffer.from(brandingOverlay(W, H));
  const seedBase = hashSeed(`${opts.slug ?? opts.heroMotif}#${opts.variant ?? 0}`);
  const COLOR_PROMPT = `fully colored version of this illustration of ${opts.heroMotif}, soft natural realistic colors, cozy harmonious earthy palette, warm believable real-world tones, gentle colored-pencil and light watercolor shading, every area clearly colored (no white gaps), NOT neon, NOT rainbow, NOT oversaturated, NOT garish, soft daytime light, plain white background, ${NOTEXT}`;
  let best: { bytes: Uint8Array; score: number; seed: number } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const seed = seedBase + attempt; // deterministisch, aber über Versuche variiert
    // Linienkunst des Motivs (fester Seed → reproduzierbar).
    const lineRaw = await provider.generate(buildMotifPrompt("all", `${opts.heroMotif}, ${COVER_STEER}, ${NOTEXT}`, attempt), { seed });
    const lineBin = await binarize(lineRaw);
    const lineFull = await sharp(lineBin).resize(W, H, { fit: "cover" }).toColourspace("srgb").png().toBuffer();

    // Deckungsgleiche img2img-Kolorierung + Original-Konturen per multiply (satt/geschichtet).
    const lineForAi = await sharp(lineBin).resize(896, null, { fit: "inside" }).flatten({ background: "#ffffff" }).png().toBuffer();
    let colored = lineFull;
    try {
      const ai = await provider.colorize(new Uint8Array(lineForAi), COLOR_PROMPT, 0.85, seed);
      const aiPng = await sharp(ai).resize(W, H, { fit: "cover" }).flatten({ background: "#ffffff" }).toColourspace("srgb").png().toBuffer();
      const linesGray = await sharp(lineBin).resize(W, H, { fit: "cover" }).flatten({ background: "#ffffff" }).grayscale().toColourspace("srgb").png().toBuffer();
      colored = await sharp(aiPng).composite([{ input: linesGray, blend: "multiply" }]).png().toBuffer();
    } catch {
      /* ohne Kolorierung → Linienkunst als Notbehelf */
    }
    const coloredVintage = await vintageTreat(colored, W, H);

    // Metriken auf der Kunst OHNE Marken-Overlay (sonst würde der Inset-Rahmen als Frame erkannt).
    const coloredRaw = await sharp(coloredVintage).removeAlpha().raw().toBuffer();
    const { ok, score, lineInk, colorFill, frame } = await coverMetrics(lineBin, coloredRaw, W, H, MID);
    const cover = new Uint8Array(await sharp(coloredVintage).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer());

    if (!best || score > best.score) best = { bytes: cover, score, seed };
    if (ok) break;
    console.warn(`  ⚠ Cover-Versuch ${attempt + 1} schwach (lineInk=${lineInk.toFixed(3)}, colorFill=${colorFill.toFixed(3)}, frame=${frame}, seed=${seed}) – wiederhole`);
  }
  // Reproduzierbarkeits-Protokoll: Modell + Parameter + gewählter Seed.
  console.log(`  ▸ cover ${opts.slug ?? opts.heroMotif}: model=black-forest-labs/flux-dev(img2img) prompt_strength=0.85 vintage(sat0.9+grain) seed=${best!.seed}`);
  return best!.bytes;
}
