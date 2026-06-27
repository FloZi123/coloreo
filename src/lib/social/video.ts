import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { colorizeWithinLines } from "../generator/thematic";
import type { Frame } from "./frames";

const W = 1080, H = 1920, FPS = 30;
const PAPER = { r: 250, g: 247, b: 240 };
const DOMAIN = "coloreo.de";

function wordmarkSvg(cx: number, y: number, size: number, base: string): string {
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="'Fredoka','Baloo 2','Segoe UI',Arial,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-1">` +
    `<tspan fill="${base}">c</tspan><tspan fill="#FF5A4D">o</tspan><tspan fill="${base}">l</tspan>` +
    `<tspan fill="#3B8EEA">o</tspan><tspan fill="${base}">re</tspan><tspan fill="#3FBF87">o</tspan></text>`;
}
const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

/** Eine Folie 1080×1920: zentriertes Bild auf Papier, Kopf-Wortmarke, optional Titel-Band + Fortschritt. */
async function slide(image: Buffer, opts: { title?: string; subtitle?: string; progress?: number } = {}): Promise<Buffer> {
  const HEADER = 110;
  const FOOTER = opts.title ? 210 : 70;
  const boxW = W - 120, boxH = H - HEADER - FOOTER - 80;
  const meta = await sharp(image).metadata();
  const iw = meta.width ?? 1, ih = meta.height ?? 1;
  const scale = Math.min(boxW / iw, boxH / ih);
  const rw = Math.round(iw * scale), rh = Math.round(ih * scale);
  const img = await sharp(image).resize(rw, rh).png().toBuffer();
  const ix = Math.round((W - rw) / 2), iy = HEADER + 40 + Math.round((boxH - rh) / 2);

  const progress = opts.progress != null
    ? `<rect x="60" y="${H - FOOTER - 26}" width="${W - 120}" height="12" rx="6" fill="#e3dacb"/>` +
      `<rect x="60" y="${H - FOOTER - 26}" width="${Math.max(12, Math.round((W - 120) * opts.progress))}" height="12" rx="6" fill="#FF5A4D"/>`
    : "";
  const titleBand = opts.title
    ? `<rect x="0" y="${H - FOOTER}" width="${W}" height="${FOOTER}" fill="#FF5A4D"/>` +
      `<text x="${W / 2}" y="${H - FOOTER + 86}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="60" font-weight="700" fill="#ffffff">${esc(opts.title)}</text>` +
      (opts.subtitle ? `<text x="${W / 2}" y="${H - FOOTER + 148}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="34" fill="#ffffffd9">${esc(opts.subtitle)}</text>` : "")
    : "";
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect x="0" y="0" width="${W}" height="${HEADER}" fill="rgba(28,24,21,0.92)"/>${wordmarkSvg(W / 2, 72, 52, "#FAF7F0")}${progress}${titleBand}</svg>`,
  );
  return sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([{ input: img, left: ix, top: iy }, { input: overlay, left: 0, top: 0 }]).png().toBuffer();
}

async function endcard(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="#FAF7F0"/>` +
    wordmarkSvg(W / 2, H / 2 - 60, 150, "#221E1B") +
    `<text x="${W / 2}" y="${H / 2 + 30}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="46" font-weight="600" fill="#6f675c">${DOMAIN}</text>` +
    `<rect x="${W / 2 - 290}" y="${H / 2 + 110}" width="580" height="96" rx="48" fill="#FF5A4D"/>` +
    `<text x="${W / 2}" y="${H / 2 + 172}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="40" font-weight="700" fill="#ffffff">Sofort-Download · druckfertig</text>` +
    `</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Mischt b mit Deckkraft t über a (Crossfade-Zwischenbild). */
async function blend(a: Buffer, b: Buffer, t: number): Promise<Buffer> {
  const overlay = await sharp(b).ensureAlpha(t).png().toBuffer();
  return sharp(a).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer();
}

interface Entry { file: string; dur: number }

function encode(entries: Entry[], out: string) {
  const lines: string[] = [];
  for (const e of entries) { lines.push(`file '${e.file.replace(/\\/g, "/")}'`); lines.push(`duration ${e.dur.toFixed(4)}`); }
  lines.push(`file '${entries[entries.length - 1].file.replace(/\\/g, "/")}'`); // letztes Bild flushen
  const listPath = out + ".list.txt";
  writeFileSync(listPath, lines.join("\n"));
  const r = spawnSync(ffmpegPath as string, [
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    "-vf", `fps=${FPS},format=yuv420p`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-an", "-movflags", "+faststart", out,
  ], { encoding: "utf8" });
  rmSync(listPath, { force: true });
  if (r.status !== 0) throw new Error("ffmpeg: " + (r.stderr || "").split("\n").slice(-6).join("\n"));
}

/** Koloriert eine Linienkunst-Seite (flache Markenfüllung) und liefert PNG. */
async function coloredOf(frame: Frame): Promise<Buffer> {
  const cw = 700, ch = Math.max(1, Math.round((cw * frame.height) / frame.width));
  const raw = await colorizeWithinLines(frame.png, cw, ch);
  return sharp(raw, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer();
}

/** Flip-Through: Hook (Cover) → ausgemalte Seiten mit Fortschritt → Endcard. */
export async function renderFlipThrough(book: { title: string; subtitle?: string }, cover: Buffer, frames: Frame[], out: string) {
  const tmp = mkdtempSync(join(tmpdir(), "flip-"));
  try {
    let n = 0;
    const file = (buf: Buffer) => { const f = join(tmp, `f${String(n++).padStart(4, "0")}.png`); writeFileSync(f, buf); return f; };
    const entries: Entry[] = [];
    const XF = 7; // Crossfade-Frames

    const hook = await slide(cover, { title: book.title, subtitle: book.subtitle ?? "Sofort ausdrucken & losmalen" });
    let prev = hook;
    entries.push({ file: file(hook), dur: 1.4 });

    const colored = await Promise.all(frames.map(coloredOf));
    for (let i = 0; i < colored.length; i++) {
      const s = await slide(colored[i], { progress: (i + 1) / colored.length });
      for (let k = 1; k <= XF; k++) entries.push({ file: file(await blend(prev, s, k / (XF + 1))), dur: 1 / FPS });
      entries.push({ file: file(s), dur: 0.95 });
      prev = s;
    }
    const end = await endcard();
    for (let k = 1; k <= XF; k++) entries.push({ file: file(await blend(prev, end, k / (XF + 1))), dur: 1 / FPS });
    entries.push({ file: file(end), dur: 2.0 });

    encode(entries, out);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Reveal: eine Seite, kolorierte Version wischt von oben nach unten ein. */
export async function renderReveal(book: { title: string }, frames: Frame[], out: string) {
  const tmp = mkdtempSync(join(tmpdir(), "reveal-"));
  try {
    let n = 0;
    const file = (buf: Buffer) => { const f = join(tmp, `r${String(n++).padStart(4, "0")}.png`); writeFileSync(f, buf); return f; };
    const entries: Entry[] = [];
    const frame = frames[0];
    const lineSlide = await slide(frame.png, { title: book.title, subtitle: "Aus Linie wird Farbe" });
    const colSlide = await slide(await coloredOf(frame), { title: book.title, subtitle: "Aus Linie wird Farbe" });

    entries.push({ file: file(lineSlide), dur: 0.7 });
    const STEPS = 60;
    for (let s = 1; s <= STEPS; s++) {
      const revealH = Math.max(1, Math.round((H * s) / STEPS));
      const topCrop = await sharp(colSlide).extract({ left: 0, top: 0, width: W, height: revealH }).png().toBuffer();
      const fr = await sharp(lineSlide).composite([{ input: topCrop, left: 0, top: 0 }]).png().toBuffer();
      entries.push({ file: file(fr), dur: 1 / FPS });
    }
    entries.push({ file: file(colSlide), dur: 1.0 });
    const end = await endcard();
    const XF = 7;
    for (let k = 1; k <= XF; k++) entries.push({ file: file(await blend(colSlide, end, k / (XF + 1))), dur: 1 / FPS });
    entries.push({ file: file(end), dur: 2.0 });

    encode(entries, out);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
