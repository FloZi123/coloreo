import sharp from "sharp";
import type { Frame } from "./frames";
import { BRAND, wordmarkSvg } from "../brand";
import { vintageTreat } from "../generator/thematic";
import type { Locale } from "../../i18n/config";

export interface PinMeta {
  title: string;
  category: string;
  locale?: Locale;
}

/**
 * Erzeugt einen 2:3-Pinterest-Pin (1000×1500): das VOLL kolorierte Motiv formatfüllend, gedämpft-vintage,
 * mit dezentem Inset-Rahmen + kleiner Wortmarke. KEIN Split, KEIN Titel/Benefit, KEIN KI-Hinweis
 * auf der Kunst (die KI-Kennzeichnung lebt auf der Produktseite / im Pinterest-Text). Der Benefit gehört in die Pin-Beschreibung.
 */
export async function makePin(_frame: Frame, colored: Buffer, _meta: PinMeta): Promise<Buffer> {
  const W = 1000, H = 1500;
  // Voll koloriertes Motiv, formatfüllend (2:3), gedämpft-vintage (wie das Cover).
  const art = await sharp(colored).resize(W, H, { fit: "cover" }).toColourspace("srgb").png().toBuffer();
  const vintage = await vintageTreat(art, W, H);

  // Dezenter Inset-Rahmen (Palette aus brand.ts) + kleine Fraunces-Wortmarke auf subtiler Pille.
  const inset = Math.round(W * 0.03);
  const pillW = Math.round(W * 0.3), pillH = Math.round(H * 0.045);
  const pillX = (W - pillW) / 2, pillY = Math.round(H * 0.03);
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect x="${inset}" y="${inset}" width="${W - 2 * inset}" height="${H - 2 * inset}" rx="${Math.round(W * 0.02)}" fill="none" stroke="${BRAND.ivory}" stroke-opacity="0.9" stroke-width="${Math.round(W * 0.006)}"/>
      <rect x="${inset}" y="${inset}" width="${W - 2 * inset}" height="${H - 2 * inset}" rx="${Math.round(W * 0.02)}" fill="none" stroke="${BRAND.ink}" stroke-opacity="0.18" stroke-width="${Math.round(W * 0.002)}"/>
      <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${BRAND.paper}" fill-opacity="0.82"/>
      ${wordmarkSvg(W / 2, pillY + Math.round(pillH * 0.68), Math.round(H * 0.03), BRAND.ink)}
    </svg>`,
  );

  return sharp(vintage).composite([{ input: overlay, left: 0, top: 0 }]).webp({ quality: 82 }).toBuffer();
}
