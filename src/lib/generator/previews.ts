import { pdf } from "pdf-to-img";
import sharp from "sharp";

function watermarkSvg(w: number, h: number): Buffer {
  const tiles: string[] = [];
  for (let y = -20; y < h + 150; y += 150) {
    for (let x = -40; x < w + 230; x += 230) {
      tiles.push(`<text x="${x}" y="${y}" font-family="Arial" font-size="22" fill="#7c4dff" fill-opacity="0.22" font-weight="700" transform="rotate(-30 ${x} ${y})">COLOREO · VORSCHAU</text>`);
    }
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${tiles.join("")}</svg>`);
}

/** Erzeugt wasserzeichen-gebrannte Vorschaubilder (webp) aus den ersten Seiten eines PDF. */
export async function makeWatermarkedPreviews(
  pdfBytes: Uint8Array,
  count = 5,
  width = 700
): Promise<Buffer[]> {
  const doc = await pdf(Buffer.from(pdfBytes), { scale: 1.4 });
  const out: Buffer[] = [];
  let p = 0;
  for await (const page of doc) {
    if (p >= count) break;
    p++;
    const resized = await sharp(page).resize({ width }).png().toBuffer();
    const meta = await sharp(resized).metadata();
    const wm = await sharp(resized)
      .composite([{ input: watermarkSvg(meta.width ?? width, meta.height ?? width), top: 0, left: 0 }])
      .webp({ quality: 78 })
      .toBuffer();
    out.push(wm);
  }
  return out;
}
