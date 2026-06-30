/**
 * Statische SEO-Validierung: Free-Printable-Landingpages + flächendeckendes hreflang + Sitemap.
 *   npx tsx scripts/validate-seo.ts   → letzte Zeile "SEO PASS" wenn alles erfüllt.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "src/app/[locale]");
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const errs: string[] = [];
const hreflang = (t: string) => /alternates/.test(t) && /languages/.test(t) && /x-default/.test(t);

// 1) Free-Page (gratis/[slug]) — eigenständig, eindeutige Meta, hreflang, Capture, interner Buch-Link.
const fp = read(join(app, "gratis/[slug]/page.tsx"));
if (!fp) errs.push("gratis/[slug]/page.tsx fehlt");
else {
  if (!/generateMetadata/.test(fp)) errs.push("Free-Page: keine generateMetadata");
  if (!/(tTitle\(book|FREE\[locale\]\.h1|book\.page_count)/.test(fp)) errs.push("Free-Page: Meta nicht buchspezifisch (generisch/dupliziert?)");
  if (!hreflang(fp)) errs.push("Free-Page: alternates/languages/x-default unvollständig");
  if (!/locales\.map/.test(fp)) errs.push("Free-Page: languages nicht über alle Locales (locales.map)");
  if (!/(FreebieForm|\/api\/freebie)/.test(fp)) errs.push("Free-Page: keine E-Mail-/Freebie-Capture");
  if (!/\/buch\//.test(fp)) errs.push("Free-Page: kein interner Link zum kostenpflichtigen Buch");
  if (!/(BookPreviewViewer|preview_urls)/.test(fp)) errs.push("Free-Page: keine echte Vorschau (Thin-Content-Risiko)");
}

// 2) hreflang/alternates auf allen relevanten Seiten.
const pages = [
  "page.tsx", "kategorien/page.tsx", "welten/page.tsx", "welten/[slug]/page.tsx",
  "bundles/page.tsx", "bundles/[slug]/page.tsx", "gratis/page.tsx", "gratis/[slug]/page.tsx",
];
for (const p of pages) {
  const t = read(join(app, p));
  if (!t) { errs.push(`Seite fehlt: ${p}`); continue; }
  if (!hreflang(t)) errs.push(`hreflang unvollständig: ${p}`);
}

// 3) Sitemap listet Free-Pages inkl. alternates.
const sm = read(join(root, "src/app/sitemap.ts"));
if (!sm) errs.push("sitemap.ts fehlt");
else {
  if (!/\/gratis\//.test(sm)) errs.push("sitemap: keine Free-Pages (/gratis/<slug>)");
  if (!/alternates/.test(sm) || !/languages/.test(sm)) errs.push("sitemap: keine alternates/languages");
}

if (errs.length) {
  for (const e of errs) console.log("✗ " + e);
  console.log(`\nSEO FAIL (${errs.length})`);
  process.exit(1);
} else {
  console.log("Alle Free-Page-/hreflang-/Sitemap-Prüfungen bestanden.");
  console.log("SEO PASS");
}
