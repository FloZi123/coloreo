import sharp from "sharp";
import type { Frame } from "./frames";

// Aktuelle Coloreo-CI
const PAPER = { r: 250, g: 247, b: 240 };

/** coloreo-Wortmarke als SVG-<text> (farbige o's). base = Grundbuchstaben-Farbe. */
function wordmarkSvg(cx: number, y: number, size: number, base: string): string {
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="'Fredoka','Baloo 2','Segoe UI',Arial,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-1">` +
    `<tspan fill="${base}">c</tspan><tspan fill="#FF5A4D">o</tspan><tspan fill="${base}">l</tspan>` +
    `<tspan fill="#3B8EEA">o</tspan><tspan fill="${base}">re</tspan><tspan fill="#3FBF87">o</tspan></text>`;
}

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
}

export interface PinMeta {
  title: string;
  category: string;
  locale?: "de" | "en";
}

/**
 * Erzeugt einen 2:3-Pinterest-Pin (1000×1500): eine Seite, linke Hälfte Linienkunst,
 * rechte Hälfte ausgemalt (vorgefertigte kolorierte Version), oben coloreo-Wortmarke, unten Titel-Band.
 */
export async function makePin(frame: Frame, colored: Buffer, meta: PinMeta): Promise<Buffer> {
  const W = 1000, H = 1500;
  const HEADER = 96, FOOTER = 150;
  const boxW = W - 80, boxH = H - HEADER - FOOTER - 40;

  // Beide Seiten auf gleiche Breite, dann links Linie / rechts Farbe zusammensetzen
  const pw = 900;
  const ph = Math.max(1, Math.round((pw * frame.height) / frame.width));
  const mid = Math.round(pw / 2);
  const lineFull = await sharp(frame.png).resize(pw, ph, { fit: "fill" }).flatten({ background: "#ffffff" }).toColourspace("srgb").png().toBuffer();
  const colFull = await sharp(colored).resize(pw, ph, { fit: "fill" }).toColourspace("srgb").png().toBuffer();
  const leftLine = await sharp(lineFull).extract({ left: 0, top: 0, width: mid, height: ph }).toBuffer();
  const rightCol = await sharp(colFull).extract({ left: mid, top: 0, width: pw - mid, height: ph }).toBuffer();
  const dividerP = Buffer.from(`<svg width="${pw}" height="${ph}"><rect x="${mid - 1}" y="0" width="2" height="${ph}" fill="#1a1a1a"/></svg>`);
  let splitPage = await sharp({ create: { width: pw, height: ph, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: leftLine, left: 0, top: 0 }, { input: rightCol, left: mid, top: 0 }, { input: dividerP, left: 0, top: 0 }])
    .png().toBuffer();

  // In die Box einpassen (contain)
  const scale = Math.min(boxW / pw, boxH / ph);
  const fw = Math.round(pw * scale), fh = Math.round(ph * scale);
  splitPage = await sharp(splitPage).resize(fw, fh).png().toBuffer();
  const px = Math.round((W - fw) / 2);
  const py = HEADER + 20 + Math.round((boxH - fh) / 2);

  // Overlays (Kopf + Fuß) als ein SVG
  const cat = esc(meta.category.toUpperCase());
  const title = esc(meta.title);
  const sub = meta.locale === "en" ? "Before &amp; after" : "Vorlage &amp; ausgemalt";
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect x="0" y="0" width="${W}" height="${HEADER}" fill="rgba(28,24,21,0.92)"/>
      ${wordmarkSvg(W / 2, 62, 44, "#FAF7F0")}
      <rect x="0" y="${H - FOOTER}" width="${W}" height="${FOOTER}" fill="#FF5A4D"/>
      <text x="${W / 2}" y="${H - FOOTER + 58}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="44" font-weight="700" fill="#ffffff">${title}</text>
      <text x="${W / 2}" y="${H - FOOTER + 100}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="24" fill="#ffffffcc">${cat} · ${sub}</text>
    </svg>`,
  );

  return sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([{ input: splitPage, left: px, top: py }, { input: overlay, left: 0, top: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
