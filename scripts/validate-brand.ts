/**
 * Validiert die Marken-Konsistenz der Assets AUSSERHALB des Storefronts (erdiges Branding).
 *   npx tsx scripts/validate-brand.ts   → letzte Zeile "BRAND PASS".
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SOCIAL_I18N } from "../src/lib/social/strings";
import { locales } from "../src/i18n/config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

const TARGETS = [
  "src/lib/social/pins.ts",
  "src/lib/social/video.ts",
  "src/lib/generator/thematic.ts",
  "src/lib/email.ts",
  "src/app/api/newsletter/unsubscribe/route.ts",
  "src/app/icon.svg",
];
// TS-Libs, die die zentralen Konstanten importieren sollen (icon.svg kann nicht importieren).
const IMPORTERS = ["src/lib/social/pins.ts", "src/lib/social/video.ts", "src/lib/generator/thematic.ts", "src/lib/email.ts", "src/app/api/newsletter/unsubscribe/route.ts"];
const PALETTE = ["#7a8b6e", "#c0714e", "#6d86a3", "#3a352e", "#fbf8f2", "#c9a24b"];

// ── zentrales Marken-Modul ───────────────────────────────────────────────────
const brand = read("src/lib/brand.ts");
if (!brand) errs.push("src/lib/brand.ts fehlt (zentrales Marken-Modul)");
else {
  const low = brand.toLowerCase();
  for (const hex of PALETTE) if (!low.includes(hex)) errs.push(`brand.ts: Palette-Farbe ${hex} fehlt`);
  if (!/serif/i.test(brand) || /Fredoka/.test(brand)) errs.push("brand.ts: Wortmarken-Font ist nicht Serif / noch Fredoka");
  else ok("brand.ts: erdige Palette + warme Serif-Wortmarke (zentral)");
}

// ── 1)+2)+3) je Zieldatei ────────────────────────────────────────────────────
for (const f of TARGETS) {
  const t = read(f);
  if (t == null) { errs.push(`Zieldatei fehlt: ${f}`); continue; }
  const low = t.toLowerCase();
  if (low.includes("#ff5a4d")) errs.push(`${f}: Coral #ff5a4d noch vorhanden`);
  if (/Fredoka/.test(t)) errs.push(`${f}: Fredoka noch vorhanden`);
  const importsBrand = /from ["'](\.\.\/)+brand["']|from ["']@\/lib\/brand["']|from ["']\.\.\/brand["']/.test(t);
  const hasPaletteHex = PALETTE.some((h) => low.includes(h));
  if (IMPORTERS.includes(f)) {
    if (!importsBrand) errs.push(`${f}: nutzt nicht die zentralen brand.ts-Konstanten (kein Import)`);
  } else if (!hasPaletteHex) {
    errs.push(`${f}: keine erdige Palette-Farbe`);
  }
}
if (!errs.length) ok("Kein Coral/Fredoka mehr in Pins/Video/Cover/E-Mail/Favicon; erdige Palette genutzt");

// ── Serif-Wortmarke in SVG mit robustem Fallback ─────────────────────────────
if (!/Fraunces|Georgia|serif/i.test(brand ?? "")) errs.push("brand.ts: kein robuster Serif-Fallback (Fraunces/Georgia/serif)");

// ── 4) KI-Disclosure bleibt erhalten ─────────────────────────────────────────
for (const l of locales) {
  const d = SOCIAL_I18N[l]?.disclosure;
  if (!d || !d.trim()) errs.push(`SOCIAL_I18N.${l}.disclosure entfernt/leer – Disclosure muss bleiben`);
}
if (!/disclosure/i.test(read("src/lib/social/pins.ts") ?? "")) errs.push("pins.ts: KI-Disclosure nicht mehr eingebettet");
if (!/disclosure/i.test(read("src/lib/social/video.ts") ?? "")) errs.push("video.ts: KI-Disclosure nicht mehr eingebettet");
if (!errs.some((e) => /disclosure/i.test(e))) ok("KI-Disclosure unverändert vorhanden (6 Sprachen, Pins+Video)");

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nBRAND FAIL (${errs.length})`); process.exit(1); }
console.log("\nBRAND PASS");
