import sharp from "sharp";
import type { Frame } from "./frames";
import { SOCIAL_I18N } from "./strings";
import { BRAND, BRAND_FONT, wordmarkSvg } from "../brand";
import type { Locale } from "../../i18n/config";

// Erdiges Coloreo-Branding (Papier-BG)
const PAPER = { r: 245, g: 240, b: 230 };

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
}

export interface PinMeta {
  title: string;
  category: string;
  locale?: Locale;
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
  const sub = esc(SOCIAL_I18N[meta.locale ?? "de"].pinSub);
  const disc = esc(SOCIAL_I18N[meta.locale ?? "de"].disclosure); // sichtbare KI-Kennzeichnung
  // Auto-breite Kennzeichnungs-Pille unten (statt engem Header-Chip → keine Abschneidung, jede Sprache passt).
  const dF = 22;
  const dW = Math.min(W - 40, Math.round(disc.length * dF * 0.55) + 28);
  const dY = H - FOOTER - 58;
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect x="0" y="0" width="${W}" height="${HEADER}" fill="rgba(28,24,21,0.92)"/>
      ${wordmarkSvg(W / 2, 62, 44, BRAND.ivory)}
      <rect x="20" y="${dY}" width="${dW}" height="40" rx="20" fill="#00000080"/>
      <text x="${20 + dW / 2}" y="${dY + 27}" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="${dF}" fill="${BRAND.ivory}">${disc}</text>
      <rect x="0" y="${H - FOOTER}" width="${W}" height="${FOOTER}" fill="${BRAND.terracotta}"/>
      <text x="${W / 2}" y="${H - FOOTER + 58}" text-anchor="middle" font-family="${BRAND_FONT}" font-size="44" font-weight="600" fill="${BRAND.ivory}">${title}</text>
      <text x="${W / 2}" y="${H - FOOTER + 100}" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="24" fill="#ffffffcc">${cat} · ${sub}</text>
    </svg>`,
  );

  return sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([{ input: splitPage, left: px, top: py }, { input: overlay, left: 0, top: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
