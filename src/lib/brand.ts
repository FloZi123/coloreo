/**
 * Zentrale Marken-Werte (erdiges Branding) — Single Source of Truth für Assets AUSSERHALB des
 * Storefronts (Social-Pins/Videos, Cover-Branding, E-Mails, Favicon). Konsistent zu Logo.tsx:
 * Wortmarke „coloreo" mit o=Terracotta · o=Blaugrau · o=Sage, warme Serif.
 * Damit kein Brand-Drift entsteht, importieren pins/video/thematic/email diese Konstanten.
 */
export const BRAND = {
  sage: "#7A8B6E",       // Primär
  terracotta: "#C0714E", // Akzent
  blueGray: "#6D86A3",   // Logo-„o" Mitte
  ink: "#3A352E",        // Tinte/Text
  ivory: "#FBF8F2",      // helle Schrift/BG auf dunkel
  gold: "#C9A24B",       // gedämpftes Alt-Gold
  paper: "#F5F0E6",      // warmes Papier/BG
} as const;

/** Warme Serif-Wortmarken-Schrift mit robustem Fallback (Render-Umgebung hat Fraunces evtl. nicht). */
export const BRAND_FONT = "'Fraunces','Georgia','Times New Roman',serif";

/**
 * coloreo-Wortmarke als SVG-<text> (o=Terracotta/Blaugrau/Sage), Serif.
 * `base` = Farbe der Grundbuchstaben (dunkel auf hell bzw. Ivory auf dunkel).
 */
export function wordmarkSvg(cx: number, y: number, size: number, base: string): string {
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${BRAND_FONT}" font-size="${size}" font-weight="600" letter-spacing="-0.5">` +
    `<tspan fill="${base}">c</tspan><tspan fill="${BRAND.terracotta}">o</tspan><tspan fill="${base}">l</tspan>` +
    `<tspan fill="${BRAND.blueGray}">o</tspan><tspan fill="${base}">re</tspan><tspan fill="${BRAND.sage}">o</tspan></text>`;
}

/** coloreo-Wortmarke als HTML (für E-Mails). `base` = Farbe der Grundbuchstaben. */
export function wordmarkHtml(base: string): string {
  return `<span style="font-family:${BRAND_FONT};font-weight:600">` +
    `<span style="color:${base}">c</span><span style="color:${BRAND.terracotta}">o</span><span style="color:${base}">l</span>` +
    `<span style="color:${BRAND.blueGray}">o</span><span style="color:${base}">re</span><span style="color:${BRAND.sage}">o</span></span>`;
}
