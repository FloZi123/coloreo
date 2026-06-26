import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function colorFromSlug(slug: string) {
  const hue = hashSeed(slug) % 360;
  return {
    bgA: `hsl(${hue} 70% 95%)`,
    bgB: `hsl(${(hue + 40) % 360} 70% 92%)`,
    stroke: `hsl(${hue} 55% 38%)`,
  };
}

const TAU = Math.PI * 2;
const f = (n: number) => Number(n.toFixed(2));

function circlePath(cx: number, cy: number, r: number): string {
  const k = 0.5522847498 * r;
  return (
    `M ${f(cx)} ${f(cy - r)} ` +
    `C ${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} ` +
    `C ${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} ` +
    `C ${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} ` +
    `C ${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} Z`
  );
}

export function mandalaPaths(seed: number, cx: number, cy: number, maxR: number): string[] {
  const rnd = mulberry32(seed);
  const paths: string[] = [];
  const rings = 3 + Math.floor(rnd() * 3);
  const symmetry = [6, 8, 10, 12, 16][Math.floor(rnd() * 5)];
  const r0 = maxR * 0.12;
  for (let i = 0; i < symmetry; i++) {
    const a = (i / symmetry) * TAU;
    const x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0;
    const x2 = cx + Math.cos(a) * r0 * 2.1, y2 = cy + Math.sin(a) * r0 * 2.1;
    const cxx = cx + Math.cos(a + 0.35) * r0 * 1.6, cyy = cy + Math.sin(a + 0.35) * r0 * 1.6;
    const dxx = cx + Math.cos(a - 0.35) * r0 * 1.6, dyy = cy + Math.sin(a - 0.35) * r0 * 1.6;
    paths.push(`M ${f(x1)} ${f(y1)} Q ${f(cxx)} ${f(cyy)} ${f(x2)} ${f(y2)} Q ${f(dxx)} ${f(dyy)} ${f(x1)} ${f(y1)} Z`);
  }
  paths.push(circlePath(cx, cy, r0 * 0.6));
  for (let ring = 1; ring <= rings; ring++) {
    const rr = (maxR * (ring + 1)) / (rings + 1);
    paths.push(circlePath(cx, cy, rr));
    const motif = Math.floor(rnd() * 3);
    const count = symmetry * (ring % 2 === 0 ? 2 : 1);
    const petalLen = (maxR / (rings + 1)) * 0.8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + (ring % 2) * (TAU / count / 2);
      const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr;
      if (motif === 0) {
        const tx = cx + Math.cos(a) * (rr + petalLen), ty = cy + Math.sin(a) * (rr + petalLen);
        const px = cx + Math.cos(a + 0.18) * (rr + petalLen * 0.5), py = cy + Math.sin(a + 0.18) * (rr + petalLen * 0.5);
        const qx = cx + Math.cos(a - 0.18) * (rr + petalLen * 0.5), qy = cy + Math.sin(a - 0.18) * (rr + petalLen * 0.5);
        paths.push(`M ${f(bx)} ${f(by)} Q ${f(px)} ${f(py)} ${f(tx)} ${f(ty)} Q ${f(qx)} ${f(qy)} ${f(bx)} ${f(by)} Z`);
      } else if (motif === 1) {
        paths.push(circlePath(bx, by, petalLen * 0.28));
      } else {
        const tx = cx + Math.cos(a) * (rr + petalLen * 0.7), ty = cy + Math.sin(a) * (rr + petalLen * 0.7);
        paths.push(`M ${f(bx)} ${f(by)} L ${f(tx)} ${f(ty)}`);
      }
    }
  }
  paths.push(circlePath(cx, cy, maxR));
  return paths;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function coverSvg(slug: string, titleDe: string, categoryName: string, emoji: string, pageCount: number): string {
  const c = colorFromSlug(slug);
  const paths = mandalaPaths(hashSeed(slug), 300, 360, 195)
    .map((d) => `<path d="${d}" fill="none" stroke="${c.stroke}" stroke-width="1.6" stroke-linejoin="round"/>`)
    .join("");
  const words = titleDe.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 18) { if (cur) lines.push(cur.trim()); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  const fontSize = lines.length > 2 ? 34 : 40;
  const titleSvg = lines.slice(0, 3).map((l, i) => `<tspan x="300" dy="${i === 0 ? 0 : fontSize + 4}">${esc(l)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bgA}"/><stop offset="1" stop-color="${c.bgB}"/></linearGradient></defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect x="22" y="22" width="556" height="756" rx="28" fill="none" stroke="${c.stroke}" stroke-width="2" opacity="0.5"/>
  <text x="300" y="74" text-anchor="middle" font-family="Quicksand,Arial,sans-serif" font-size="26" font-weight="700" fill="${c.stroke}">&#10022; Coloreo</text>
  <g transform="translate(0,40)">${paths}</g>
  <g transform="translate(300,640)"><rect x="-110" y="-26" width="220" height="34" rx="17" fill="#fff" opacity="0.8"/><text x="0" y="-3" text-anchor="middle" font-family="Quicksand,Arial,sans-serif" font-size="16" font-weight="600" fill="${c.stroke}">${esc(emoji)} ${esc(categoryName)}</text></g>
  <text x="300" y="700" text-anchor="middle" font-family="Quicksand,Arial,sans-serif" font-size="${fontSize}" font-weight="700" fill="#2b2540">${titleSvg}</text>
  <text x="300" y="772" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#5b5470">Malbuch · ${pageCount} Seiten</text>
</svg>`;
}

export async function masterPdfBytes(slug: string, titleDe: string, pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]);
    const d = mandalaPaths(hashSeed(slug + "#" + p), 260, 260, 245).join(" ");
    page.drawSvgPath(d, { x: 37, y: 800, borderColor: rgb(0.1, 0.1, 0.12), borderWidth: 1.4 });
    page.drawText(`Coloreo - ${titleDe}`.replace(/[^\x20-\xFF]/g, ""), { x: 37, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
    page.drawText(`${p + 1} / ${pages}`, { x: 520, y: 26, size: 9, font, color: rgb(0.6, 0.6, 0.65) });
  }
  return doc.save();
}
