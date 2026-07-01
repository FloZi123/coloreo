/**
 * Validiert das neue Cover-Design (voll koloriert, kein Split, vintage, reproduzierbar).
 *   npx tsx scripts/validate-cover-design.ts   → letzte Zeile "COVER DESIGN PASS".
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashSeed } from "../src/lib/generator/art";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : "");
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

const thematic = read("src/lib/generator/thematic.ts");
const pins = read("src/lib/social/pins.ts");
// Render-Logik liegt in generateCoverImage UND renderOneCover (Best-of-N-Refactor) → beide prüfen.
const cover = (thematic.match(/export async function generateCoverImage[\s\S]*?\n}/)?.[0] ?? "") +
  (thematic.match(/async function renderOneCover[\s\S]*?\n}/)?.[0] ?? "");

// ── 1) KEIN SPLIT ────────────────────────────────────────────────────────────
if (/fill="#1a1a1a"/.test(thematic)) errs.push("thematic.ts: Trennstrich (#1a1a1a divider) noch vorhanden");
if (/\.extract\(\{\s*left:\s*MID/.test(cover)) errs.push("generateCoverImage: splittet noch in Hälften (extract left: MID)");
if (/dividerP|leftLine|rightCol|splitPage/.test(pins)) errs.push("pins.ts: Split-Komposition (divider/leftLine/rightCol) noch vorhanden");
if (!/fit:\s*"cover"/.test(cover)) errs.push("generateCoverImage: Cover nicht als eine volle Fläche komponiert");
if (!errs.length) ok("Kein Split/Trennstrich – Cover & Pin sind voll koloriert (eine Fläche)");

// ── 2) VINTAGE-GRADE ─────────────────────────────────────────────────────────
if (!/export async function vintageTreat/.test(thematic)) errs.push("thematic.ts: vintageTreat fehlt");
if (!/saturation:\s*0?\.\d/.test(thematic)) errs.push("vintageTreat: keine Entsättigung (saturation < 1)");
if (!/feTurbulence/.test(thematic)) errs.push("vintageTreat: kein Korn/Papier (feTurbulence)");
if (!/vintageTreat\(/.test(cover)) errs.push("generateCoverImage: nutzt vintageTreat nicht");
if (!/vintageTreat\(/.test(pins)) errs.push("pins.ts: nutzt vintageTreat nicht");
if (!errs.length) ok("Vintage: Entsättigung + Korn/Papier (handgemacht statt glänzend-KI)");

// ── 3) LEICHTER RAHMEN + WORTMARKE ───────────────────────────────────────────
const brandFn = thematic.match(/function brandingOverlay[\s\S]*?\n}/)?.[0] ?? "";
if (!/stroke=/.test(brandFn) || !/wordmarkSvg\(/.test(brandFn)) errs.push("brandingOverlay: kein Inset-Rahmen (stroke) + Wortmarke");
if (!/BRAND\./.test(brandFn)) errs.push("brandingOverlay: nutzt nicht die brand.ts-Palette");
if (!/stroke=/.test(pins) || !/wordmarkSvg\(/.test(pins)) errs.push("pins.ts: kein Inset-Rahmen + Wortmarke");
if (!errs.length) ok("Dezenter Inset-Rahmen (brand.ts) + kleine Fraunces-Wortmarke");

// ── 4) KEIN EINGEBRANNTER TEXT (Titel/Benefit/Seitenzahl) ────────────────────
if (/meta\.title|\$\{title\}|pinSub|meta\.category|\$\{cat\}/.test(pins)) errs.push("pins.ts: brennt noch Titel/Kategorie/Benefit ein");
if (/pages}|Seiten|page_count/.test(brandFn)) errs.push("brandingOverlay: Seitenzahl/Text auf dem Cover");
if (!errs.length) ok("Kein eingebrannter Titel/Benefit/Seitenzahl auf Cover/Pin");

// ── 5) KI-DISCLOSURE OFF-ART (bleibt auf Produktseite) ───────────────────────
if (/disclosure/i.test(pins)) errs.push("pins.ts: KI-Disclosure noch auf der Pin-Kunst (gehört auf die Produktseite)");
if (/disclosure/i.test(brandFn)) errs.push("brandingOverlay: KI-Text auf der Cover-Kunst");
const badge = read("src/components/AiDisclosureBadge.tsx");
const footer = read("src/components/Footer.tsx");
if (!badge) errs.push("AiDisclosureBadge (Produktseiten-Kennzeichnung) fehlt – Disclosure darf NICHT entfernt werden");
if (!/AiDisclosureBadge/.test(footer)) errs.push("Footer bindet die KI-Kennzeichnung nicht ein");
if (!errs.length) ok("Kein KI-Text auf der Kunst; Disclosure bleibt auf der Produktseite (AiDisclosureBadge)");

// ── 6) LINIENKUNST-EHRLICHKEIT (Produktseite zeigt Vorlagen) ─────────────────
const buch = read("src/app/[locale]/buch/[slug]/page.tsx");
if (!/BookPreviewViewer|preview_urls/.test(buch)) errs.push("buch/[slug]: keine Linienkunst-Vorschau (Preview-Viewer)");
if (!errs.length) ok("Produktseite zeigt Linienkunst-Vorschauseiten (Ehrlichkeit)");

// ── 7) REPRODUZIERBARKEIT (fester Seed + Logging) ────────────────────────────
if (!/hashSeed\(/.test(cover)) errs.push("generateCoverImage: kein aus slug/variant abgeleiteter Seed (hashSeed)");
if (!/provider\.generate\([^)]*\{\s*seed/.test(cover) && !/\{ seed \}/.test(cover)) errs.push("generateCoverImage: Linienkunst ohne festen Seed");
if (!/colorize\([\s\S]*?,\s*seed\)/.test(cover)) errs.push("generateCoverImage: Kolorierung ohne festen Seed");
if (!/console\.log\([\s\S]*?seed=/.test(cover)) errs.push("generateCoverImage: Seed/Modell/Parameter werden nicht geloggt");
// Unit-Check: hashSeed deterministisch + variant-sensitiv.
const a1 = hashSeed("cottagecore-tag-im-landhaus#0");
const a2 = hashSeed("cottagecore-tag-im-landhaus#0");
const b0 = hashSeed("cottagecore-tag-im-landhaus#1");
if (a1 !== a2) errs.push("hashSeed nicht deterministisch");
if (a1 === b0) errs.push("hashSeed reagiert nicht auf Varianten-Offset");
if (!errs.some((e) => /Seed|hashSeed|Reprodu/.test(e))) ok(`Reproduzierbar: fester Seed (slug#variant) + Logging (seed=${a1})`);

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nCOVER DESIGN FAIL (${errs.length})`); process.exit(1); }
console.log("\nCOVER DESIGN PASS");
