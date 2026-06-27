import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { colorizeWithinLines } from "../generator/thematic";
import type { Frame } from "./frames";

const TW = 1080, TH = 1920, FPS = 30;
const ZOOM = 0.10; // Ken-Burns-Zoomtiefe
const SCALE = 1.16; // Render-Headroom für den Zoom
const SW = Math.round((TW * SCALE) / 2) * 2, SH = Math.round((TH * SCALE) / 2) * 2;
const DOMAIN = "coloreo.de";
const MOOD = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "public", "mood");

function wordmark(cx: number, y: number, size: number, base: string): string {
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="'Fredoka','Baloo 2','Segoe UI',Arial,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-1">` +
    `<tspan fill="${base}">c</tspan><tspan fill="#FF5A4D">o</tspan><tspan fill="${base}">l</tspan>` +
    `<tspan fill="#3B8EEA">o</tspan><tspan fill="${base}">re</tspan><tspan fill="#3FBF87">o</tspan></text>`;
}
const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

/** Verwischter Schreibtisch-Hintergrund (Mood-Bild) in Szenengröße. */
let _bg: Buffer | null = null;
async function deskBg(): Promise<Buffer> {
  if (_bg) return _bg;
  const file = ["flatlay", "cozy-evening", "hero"].map((n) => join(MOOD, `${n}.webp`)).find((p) => existsSync(p));
  if (file) {
    _bg = await sharp(file).resize(SW, SH, { fit: "cover" }).blur(14).modulate({ brightness: 0.86 }).toColourspace("srgb").png().toBuffer();
  } else {
    _bg = await sharp({ create: { width: SW, height: SH, channels: 3, background: { r: 244, g: 238, b: 228 } } }).png().toBuffer();
  }
  return _bg;
}

function roundedMask(w: number, h: number, r: number): Buffer {
  return Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
}

/** Eine Seite als ausgedrucktes Blatt (weiß, runde Ecken, Schlagschatten) auf dem Schreibtisch. */
async function pageScene(pageImg: Buffer): Promise<Buffer> {
  const bg = await deskBg();
  const meta = await sharp(pageImg).metadata();
  const ar = (meta.width ?? 1) / (meta.height ?? 1);
  const sheetW = Math.round(SW * 0.74);
  const sheetH = Math.round(sheetW / ar);
  const pad = Math.round(sheetW * 0.045);
  const inner = await sharp(pageImg).resize(sheetW - pad * 2, sheetH - pad * 2, { fit: "fill" }).flatten({ background: "#ffffff" }).toBuffer();
  let sheet = await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: inner, left: pad, top: pad }]).png().toBuffer();
  sheet = await sharp(sheet).composite([{ input: roundedMask(sheetW, sheetH, 26), blend: "dest-in" }]).png().toBuffer();

  const left = Math.round((SW - sheetW) / 2);
  const top = Math.round(SH * 0.45 - sheetH / 2);
  // Schatten
  const shadow = await sharp(Buffer.from(`<svg width="${sheetW + 80}" height="${sheetH + 80}"><rect x="40" y="46" width="${sheetW}" height="${sheetH}" rx="26" fill="#000" fill-opacity="0.34"/></svg>`)).blur(22).png().toBuffer();
  return sharp(bg)
    .composite([{ input: shadow, left: left - 40, top: top - 46 }, { input: sheet, left, top }])
    .png().toBuffer();
}

/** Fotorealistische Vollbild-Szene (z. B. Hero-Hände), Cover-gefüllt. */
async function photoScene(file: string): Promise<Buffer> {
  return sharp(file).resize(SW, SH, { fit: "cover" }).toColourspace("srgb").png().toBuffer();
}

async function endcardScene(): Promise<Buffer> {
  const bg = await deskBg();
  return sharp(bg).modulate({ brightness: 1.04 }).blur(6).png().toBuffer();
}

/** Fixes UI-Overlay (1080×1920, transparent): Kopf-Wortmarke, optional Fortschritt + Titel-Band. */
function overlay(opts: { title?: string; subtitle?: string; progress?: number; scrim?: boolean }): Buffer {
  const HEADER = 104, FOOTER = opts.title ? 200 : 0;
  const scrim = opts.scrim ? `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.42"/><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient><rect width="${TW}" height="${TH}" fill="url(#g)"/>` : "";
  const prog = opts.progress != null
    ? `<rect x="60" y="${TH - FOOTER - 30}" width="${TW - 120}" height="12" rx="6" fill="#ffffff66"/><rect x="60" y="${TH - FOOTER - 30}" width="${Math.max(12, Math.round((TW - 120) * opts.progress))}" height="12" rx="6" fill="#FF5A4D"/>`
    : "";
  const title = opts.title
    ? `<rect x="0" y="${TH - FOOTER}" width="${TW}" height="${FOOTER}" fill="#FF5A4D"/>` +
      `<text x="${TW / 2}" y="${TH - FOOTER + 84}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="58" font-weight="700" fill="#fff">${esc(opts.title)}</text>` +
      (opts.subtitle ? `<text x="${TW / 2}" y="${TH - FOOTER + 144}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="33" fill="#ffffffd9">${esc(opts.subtitle)}</text>` : "")
    : "";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">${scrim}` +
    `<rect x="0" y="0" width="${TW}" height="${HEADER}" fill="rgba(28,24,21,0.5)"/>${wordmark(TW / 2, 70, 50, "#FAF7F0")}${prog}${title}</svg>`);
}

function endcardOverlay(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">` +
    `<rect width="${TW}" height="${TH}" fill="#FAF7F0" fill-opacity="0.82"/>` +
    wordmark(TW / 2, TH / 2 - 50, 150, "#221E1B") +
    `<text x="${TW / 2}" y="${TH / 2 + 36}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="46" font-weight="600" fill="#6f675c">${DOMAIN}</text>` +
    `<rect x="${TW / 2 - 300}" y="${TH / 2 + 120}" width="600" height="98" rx="49" fill="#FF5A4D"/>` +
    `<text x="${TW / 2}" y="${TH / 2 + 184}" text-anchor="middle" font-family="'Fredoka','Segoe UI',Arial,sans-serif" font-size="40" font-weight="700" fill="#fff">Sofort-Download · druckfertig</text></svg>`);
}

/** Ken-Burns-Frame: zoomt langsam in die Szene und legt das Overlay darüber. */
async function kbFrame(scene: Buffer, f: number, ov: Buffer): Promise<Buffer> {
  const zoom = 1 + ZOOM * f;
  const winW = Math.round(TW / zoom), winH = Math.round(TH / zoom);
  const left = Math.round((SW - winW) / 2), top = Math.round((SH - winH) / 2);
  const cropped = await sharp(scene).extract({ left, top, width: winW, height: winH }).resize(TW, TH).png().toBuffer();
  return sharp(cropped).composite([{ input: ov, left: 0, top: 0 }]).png().toBuffer();
}

async function blend(a: Buffer, b: Buffer, t: number): Promise<Buffer> {
  return sharp(a).composite([{ input: await sharp(b).ensureAlpha(t).png().toBuffer(), left: 0, top: 0 }]).png().toBuffer();
}

async function coloredOf(frame: Frame): Promise<Buffer> {
  const cw = 760, ch = Math.max(1, Math.round((cw * frame.height) / frame.width));
  const raw = await colorizeWithinLines(frame.png, cw, ch);
  return sharp(raw, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer();
}

function encode(dir: string, out: string) {
  const r = spawnSync(ffmpegPath as string, [
    "-y", "-framerate", String(FPS), "-i", join(dir, "f%05d.png"),
    "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-an", "-movflags", "+faststart", out,
  ], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg: " + (r.stderr || "").split("\n").slice(-6).join("\n"));
}

/** Flip-Through: fotorealistischer Hook → ausgemalte Blätter auf dem Schreibtisch (Ken Burns) → Endcard. */
export async function renderFlipThrough(book: { title: string; subtitle?: string }, _cover: Buffer, frames: Frame[], out: string) {
  const tmp = mkdtempSync(join(tmpdir(), "flip-"));
  let n = 0;
  const put = (b: Buffer) => writeFileSync(join(tmp, `f${String(n++).padStart(5, "0")}.png`), b);
  try {
    const XF = 9;
    const heroFile = join(MOOD, "hero.webp");
    const segs: { scene: Buffer; ov: Buffer; frames: number }[] = [];

    // Hook (fotorealistisch)
    if (existsSync(heroFile)) {
      segs.push({ scene: await photoScene(heroFile), ov: overlay({ title: book.title, subtitle: book.subtitle ?? "Sofort ausdrucken & losmalen", scrim: true }), frames: Math.round(FPS * 1.8) });
    }
    // Seiten
    const colored = await Promise.all(frames.map(coloredOf));
    for (let i = 0; i < colored.length; i++) {
      segs.push({ scene: await pageScene(colored[i]), ov: overlay({ progress: (i + 1) / colored.length, scrim: true }), frames: Math.round(FPS * 1.15) });
    }
    // Endcard
    segs.push({ scene: await endcardScene(), ov: endcardOverlay(), frames: Math.round(FPS * 2.2) });

    let prevLast: Buffer | null = null;
    for (const seg of segs) {
      const first = await kbFrame(seg.scene, 0, seg.ov);
      if (prevLast) for (let k = 1; k <= XF; k++) put(await blend(prevLast, first, k / (XF + 1)));
      for (let i = 0; i < seg.frames; i++) put(await kbFrame(seg.scene, i / (seg.frames - 1), seg.ov));
      prevLast = await kbFrame(seg.scene, 1, seg.ov);
    }
    encode(tmp, out);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Reveal: ein Blatt auf dem Schreibtisch, kolorierte Version wischt von oben ein. */
export async function renderReveal(book: { title: string }, frames: Frame[], out: string) {
  const tmp = mkdtempSync(join(tmpdir(), "reveal-"));
  let n = 0;
  const put = (b: Buffer) => writeFileSync(join(tmp, `f${String(n++).padStart(5, "0")}.png`), b);
  try {
    const frame = frames[0];
    const ov = overlay({ title: book.title, subtitle: "Aus Linie wird Farbe", scrim: true });
    const lineScene = await pageScene(await sharp(frame.png).flatten({ background: "#ffffff" }).png().toBuffer());
    const colScene = await pageScene(await coloredOf(frame));

    const hold = Math.round(FPS * 0.7);
    for (let i = 0; i < hold; i++) put(await kbFrame(lineScene, i / (hold * 4), ov)); // leichter Zoom

    const STEPS = Math.round(FPS * 2.4);
    for (let s = 1; s <= STEPS; s++) {
      const f = (hold + s) / (hold * 4);
      const lineF = await kbFrame(lineScene, f, ov);
      const colF = await kbFrame(colScene, f, ov);
      const revealH = Math.max(1, Math.round((TH * s) / STEPS));
      const top = await sharp(colF).extract({ left: 0, top: 0, width: TW, height: revealH }).png().toBuffer();
      put(await sharp(lineF).composite([{ input: top, left: 0, top: 0 }]).png().toBuffer());
    }
    const hold2 = Math.round(FPS * 1.1);
    for (let i = 0; i < hold2; i++) put(await kbFrame(colScene, 0.6 + (0.4 * i) / hold2, ov));

    // Endcard
    const endScene = await endcardScene();
    const endOv = endcardOverlay();
    const prevLast = await kbFrame(colScene, 1, ov);
    const endFirst = await kbFrame(endScene, 0, endOv);
    const XF = 9;
    for (let k = 1; k <= XF; k++) put(await blend(prevLast, endFirst, k / (XF + 1)));
    const eEnd = Math.round(FPS * 2.0);
    for (let i = 0; i < eEnd; i++) put(await kbFrame(endScene, i / (eEnd - 1), endOv));

    encode(tmp, out);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
