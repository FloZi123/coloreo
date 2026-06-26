// Prozeduraler Linienkunst-Generator (deterministisch pro Seed).
// Erzeugt SVG-Pfade für Mandalas/Muster – für Cover (SVG) und Mal-PDFs.

export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pastellfarbe aus Kategorie-Slug
export function colorFromSlug(slug) {
  const hue = hashSeed(slug) % 360;
  return {
    hue,
    bgA: `hsl(${hue} 70% 95%)`,
    bgB: `hsl(${(hue + 40) % 360} 70% 92%)`,
    stroke: `hsl(${hue} 55% 38%)`,
    accent: `hsl(${(hue + 20) % 360} 65% 50%)`,
  };
}

const TAU = Math.PI * 2;
const f = (n) => Number(n.toFixed(2));

// Ein Mandala als Array von SVG-Pfad-Strings (Linien, keine Füllung), zentriert um (cx,cy).
export function mandalaPaths(seed, cx, cy, maxR) {
  const rnd = mulberry32(seed);
  const paths = [];
  const rings = 3 + Math.floor(rnd() * 3); // 3..5 Ringe
  const symmetry = [6, 8, 10, 12, 16][Math.floor(rnd() * 5)];

  // zentrale Blüte
  const r0 = maxR * 0.12;
  for (let i = 0; i < symmetry; i++) {
    const a = (i / symmetry) * TAU;
    const x1 = cx + Math.cos(a) * r0;
    const y1 = cy + Math.sin(a) * r0;
    const x2 = cx + Math.cos(a) * r0 * 2.1;
    const y2 = cy + Math.sin(a) * r0 * 2.1;
    const ctrlA = a + 0.35, ctrlB = a - 0.35;
    const cxx = cx + Math.cos(ctrlA) * r0 * 1.6;
    const cyy = cy + Math.sin(ctrlA) * r0 * 1.6;
    const dxx = cx + Math.cos(ctrlB) * r0 * 1.6;
    const dyy = cy + Math.sin(ctrlB) * r0 * 1.6;
    paths.push(`M ${f(x1)} ${f(y1)} Q ${f(cxx)} ${f(cyy)} ${f(x2)} ${f(y2)} Q ${f(dxx)} ${f(dyy)} ${f(x1)} ${f(y1)} Z`);
  }
  paths.push(circlePath(cx, cy, r0 * 0.6));

  // Ringe mit wiederholten Motiven
  for (let ring = 1; ring <= rings; ring++) {
    const rr = (maxR * (ring + 1)) / (rings + 1);
    paths.push(circlePath(cx, cy, rr));
    const motif = Math.floor(rnd() * 3);
    const count = symmetry * (ring % 2 === 0 ? 2 : 1);
    const petalLen = (maxR / (rings + 1)) * 0.8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + (ring % 2) * (TAU / count / 2);
      const bx = cx + Math.cos(a) * rr;
      const by = cy + Math.sin(a) * rr;
      if (motif === 0) {
        // Petal nach außen
        const tx = cx + Math.cos(a) * (rr + petalLen);
        const ty = cy + Math.sin(a) * (rr + petalLen);
        const w = petalLen * 0.5;
        const px = cx + Math.cos(a + 0.18) * (rr + petalLen * 0.5);
        const py = cy + Math.sin(a + 0.18) * (rr + petalLen * 0.5);
        const qx = cx + Math.cos(a - 0.18) * (rr + petalLen * 0.5);
        const qy = cy + Math.sin(a - 0.18) * (rr + petalLen * 0.5);
        void w;
        paths.push(`M ${f(bx)} ${f(by)} Q ${f(px)} ${f(py)} ${f(tx)} ${f(ty)} Q ${f(qx)} ${f(qy)} ${f(bx)} ${f(by)} Z`);
      } else if (motif === 1) {
        paths.push(circlePath(bx, by, petalLen * 0.28));
      } else {
        const tx = cx + Math.cos(a) * (rr + petalLen * 0.7);
        const ty = cy + Math.sin(a) * (rr + petalLen * 0.7);
        paths.push(`M ${f(bx)} ${f(by)} L ${f(tx)} ${f(ty)}`);
      }
    }
  }
  paths.push(circlePath(cx, cy, maxR));
  return paths;
}

// Kreis als 4 Bézier-Segmente – rendert identisch in SVG UND pdf-lib (kein Arc).
// Geometrisches Raster: NxN Zellen mit je einem einfachen Motiv (Linienkunst).
export function geometricGridPaths(seed, cx, cy, half) {
  const rnd = mulberry32(seed);
  const paths = [];
  const n = 4 + Math.floor(rnd() * 2); // 4..5
  const cell = (half * 2) / n;
  const x0 = cx - half, y0 = cy - half;
  paths.push(`M ${f(x0)} ${f(y0)} h ${f(half * 2)} v ${f(half * 2)} h ${f(-half * 2)} Z`);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const mx = x0 + c * cell, my = y0 + r * cell;
      const ccx = mx + cell / 2, ccy = my + cell / 2;
      // Zellrahmen
      paths.push(`M ${f(mx)} ${f(my)} h ${f(cell)} v ${f(cell)} h ${f(-cell)} Z`);
      const m = Math.floor(rnd() * 4);
      const pad = cell * 0.16;
      if (m === 0) {
        paths.push(circlePath(ccx, ccy, cell / 2 - pad));
      } else if (m === 1) {
        // Raute
        const d = cell / 2 - pad;
        paths.push(`M ${f(ccx)} ${f(ccy - d)} L ${f(ccx + d)} ${f(ccy)} L ${f(ccx)} ${f(ccy + d)} L ${f(ccx - d)} ${f(ccy)} Z`);
      } else if (m === 2) {
        // verschachtelte Quadrate
        for (const s of [0.5, 0.3]) {
          const d = cell * s;
          paths.push(`M ${f(ccx - d)} ${f(ccy - d)} h ${f(d * 2)} v ${f(d * 2)} h ${f(-d * 2)} Z`);
        }
      } else {
        // 4-Blatt-Blüte
        const rr = cell * 0.22;
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          paths.push(circlePath(ccx + dx * rr, ccy + dy * rr, rr));
        }
      }
    }
  }
  return paths;
}

// Stil-Dispatcher: liefert die Pfade einer Seite je nach Stil.
export function pagePaths(style, seed, cx, cy, r) {
  return style === "grid" ? geometricGridPaths(seed, cx, cy, r) : mandalaPaths(seed, cx, cy, r);
}

// Stil je Kategorie (deterministisch, sorgt für Abwechslung zwischen Kategorien).
export function styleForCategory(slug) {
  const PATTERN = ["mandalas", "achtsamkeit", "japan-zen", "paisley-henna", "schmetterlinge", "blumen-botanik", "mandala"];
  if (PATTERN.includes(slug)) return "mandala";
  const GRID = ["geometrisch", "vintage-steampunk", "staedte", "kawaii-food", "abc-zahlen", "fahrzeuge"];
  if (GRID.includes(slug)) return "grid";
  return hashSeed(slug) % 2 === 0 ? "mandala" : "grid";
}

export function circlePath(cx, cy, r) {
  const k = 0.5522847498 * r;
  return (
    `M ${f(cx)} ${f(cy - r)} ` +
    `C ${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} ` +
    `C ${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} ` +
    `C ${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} ` +
    `C ${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} Z`
  );
}
