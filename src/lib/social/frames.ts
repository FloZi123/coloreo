import { pdf } from "pdf-to-img";
import sharp from "sharp";

export interface Frame {
  /** PNG-Bytes der Seite (Linienkunst, Fußzeile abgeschnitten, weiß getrimmt). */
  png: Buffer;
  width: number;
  height: number;
}

/**
 * Master-PDF → saubere Linienkunst-PNG-Seiten. Schneidet die Fußzeile ab und trimmt
 * den weißen Rand, sodass nur das Motiv bleibt (gut für Pins/Video-Frames).
 */
export async function pdfToFrames(pdfBytes: Uint8Array, opts: { scale?: number; max?: number } = {}): Promise<Frame[]> {
  const doc = await pdf(Buffer.from(pdfBytes), { scale: opts.scale ?? 2 });
  const frames: Frame[] = [];
  for await (const page of doc) {
    const meta = await sharp(page).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) continue;
    // Fußzeile (unten ~7 %) abschneiden, dann weißen Rand trimmen
    const cropped = await sharp(page).extract({ left: 0, top: 0, width: w, height: Math.round(h * 0.93) }).png().toBuffer();
    let out: Buffer;
    try {
      out = await sharp(cropped).trim({ threshold: 12 }).png().toBuffer();
    } catch {
      out = cropped;
    }
    const m2 = await sharp(out).metadata();
    frames.push({ png: out, width: m2.width ?? w, height: m2.height ?? h });
    if (opts.max && frames.length >= opts.max) break;
  }
  return frames;
}

/** Wählt bis zu n gleichmäßig über das Buch verteilte Elemente. */
export function pickSpread<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.round((i * (arr.length - 1)) / (n - 1))]);
  return out;
}
