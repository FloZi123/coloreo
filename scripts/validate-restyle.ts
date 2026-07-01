/**
 * Validiert das Storefront-Restyle (ruhig/erdig/elegant, ehrliche KI-Kennzeichnung).
 *   npx tsx scripts/validate-restyle.ts   → letzte Zeile "RESTYLE PASS".
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SOCIAL_I18N } from "../src/lib/social/strings";
import { locales } from "../src/i18n/config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

// Storefront-Dateien rekursiv sammeln (Komponenten + [locale]-App) – ohne Generierungs-/Email-/Admin-Libs.
function walk(dir: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(rel));
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(rel);
  }
  return out;
}
const storefront = [...walk("src/components"), ...walk("src/app/[locale]"), "src/app/globals.css"];

// ── 1) PALETTE ───────────────────────────────────────────────────────────────
const css = read("src/app/globals.css") ?? "";
const primary = css.match(/--color-primary:\s*(#[0-9a-fA-F]{3,8})/)?.[1]?.toLowerCase();
if (!primary) errs.push("globals.css: --color-primary nicht gefunden");
else if (primary === "#ff5a4d") errs.push("globals.css: --color-primary ist weiterhin Coral #ff5a4d");
else ok(`Primärfarbe = erdig ${primary} (kein Coral)`);
if (!/Held-Akzent-Map|Cottagecore/i.test(css)) errs.push("globals.css: keine dokumentierte Held-Akzent-Map");
for (const f of storefront) {
  const t = read(f) ?? "";
  if (/#ff5a4d|#ffc23c/i.test(t)) errs.push(`Hartkodierte Alt-Farbe (#ff5a4d/#ffc23c) in ${f}`);
}
if (!errs.length) ok("Keine hartkodierten Coral/Gold-Werte im Storefront (Tokens genutzt)");

// ── 2) TYPO ──────────────────────────────────────────────────────────────────
const layout = read("src/app/[locale]/layout.tsx") ?? "";
const SERIF = /(Fraunces|Cormorant|DM_Serif|Playfair|Lora)/;
if (!SERIF.test(layout)) errs.push("layout: keine warme Serifenschrift (Fraunces/Cormorant/…) als Display-Font");
if (/Fredoka/.test(layout)) errs.push("layout: Fredoka wird noch als Display-Font geladen");
if (!/serif/.test(css) || /"Fredoka"|'Fredoka'/.test(css)) errs.push("globals.css: Überschriften-Fallback ist nicht Serif / noch Fredoka");
for (const f of storefront) if (/Fredoka/.test(read(f) ?? "")) errs.push(`Fredoka noch referenziert in ${f}`);
if (!errs.length) ok("Display-Font = warme Serif (Fraunces), Fredoka aus Storefront entfernt");

// ── 3) KI-KENNZEICHNUNG (ehrlich, nicht entfernt) ────────────────────────────
const OLD = /^(KI-generiert|AI-generated|Généré par IA|Generado por IA|Generato con IA|AI-gegenereerd)$/;
const CURATED = /(kuratiert|hand-curated|curated|à la main|a mano|samengesteld)/i;
const AIWORD = /(KI|AI|IA)/;
for (const l of locales) {
  const d = SOCIAL_I18N[l]?.disclosure ?? "";
  if (OLD.test(d.trim())) errs.push(`SOCIAL_I18N.${l}.disclosure noch alte harte Formulierung ("${d}")`);
  if (!CURATED.test(d)) errs.push(`SOCIAL_I18N.${l}.disclosure ohne "kuratiert/curated"-Wärme ("${d}")`);
  if (!AIWORD.test(d)) errs.push(`SOCIAL_I18N.${l}.disclosure entfernt die KI-Kennzeichnung ("${d}") – muss bleiben`);
}
const badge = read("src/components/AiDisclosureBadge.tsx") ?? "";
if (!badge) errs.push("AiDisclosureBadge-Komponente fehlt");
else for (const l of locales) if (!new RegExp(`\\b${l}:`).test(badge) || !CURATED.test(badge)) errs.push(`AiDisclosureBadge: ${l} / ehrliche Formulierung fehlt`);
// Nicht prominent im Hero: Home-Hero enthält keine KI-Kennzeichnung; Disclosure lebt im Footer.
const footer = read("src/components/Footer.tsx") ?? "";
if (!/AiDisclosureBadge/.test(footer)) errs.push("Footer bindet die dezente KI-Kennzeichnung nicht ein");
if (!errs.length) ok("KI-Kennzeichnung ehrlich umformuliert (6 Sprachen), bleibt erhalten, dezent im Footer");

// ── 4) HERO / BILDSPRACHE ────────────────────────────────────────────────────
const home = read("src/app/[locale]/page.tsx") ?? "";
const heroMatch = home.match(/\{\/\* HERO \*\/\}([\s\S]*?)\{\/\* TRUST/);
const hero = heroMatch?.[1] ?? "";
if (!hero) errs.push("Home: Hero-Sektion nicht gefunden");
// Haupt-CTA = btn-primary, verlinkt auf die Gratis-Probeseite (/gratis).
if (!/<Link href=\{p\("\/gratis"\)\} className="btn-primary/.test(hero)) errs.push("Hero: Haupt-CTA (btn-primary) führt nicht auf die Gratis-Probeseite (/gratis)");
if (/<Emoji|🎁|🎨/.test(hero)) errs.push("Hero: nutzt noch Cartoon-Emoji/Maskottchen statt ruhiger Bildsprache");
// Gratis-Pfad = E-Mail-Capture (FreebieForm) vorhanden.
if (!/FreebieForm/.test(home)) errs.push("Home: kein E-Mail-Capture (FreebieForm) für den Gratis-Pfad");
const gratis = read("src/app/[locale]/gratis/[slug]/page.tsx") ?? read("src/app/[locale]/gratis/page.tsx") ?? "";
if (gratis && !/(FreebieForm|\/api\/freebie)/.test(gratis)) errs.push("Gratis-Probeseite ohne E-Mail-Capture");
if (!errs.length) ok("Hero: ruhige Bildsprache, Haupt-CTA = Gratis-Probeseite → E-Mail");

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nRESTYLE FAIL (${errs.length})`); process.exit(1); }
console.log("\nRESTYLE PASS");
